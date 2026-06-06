import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { ChatMessage, FamilyContext } from '@fin-ai/shared/chat';
import { Repository } from 'typeorm';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { Usuario } from '../entities/usuario.entity';
import { StreamService } from './stream.service';

export interface ChatAttachment {
  type: 'audio' | 'image';
  mime_type: string;
  data: string;
}

export interface ChatJobPayload {
  jobId?: string;
  messageId: string;
  usuarioId: number;
  content: string;
  rawInput?: string;
  familyContext?: FamilyContext;
  attachments?: ChatAttachment[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messagesRepository: Repository<ChatMessageEntity>,
    @InjectRepository(Usuario)
    private readonly usersRepository: Repository<Usuario>,
    private readonly queueService: QueueService,
    private readonly streamService: StreamService,
    private readonly configService: ConfigService,
  ) {}

  async submit(
    usuarioId: number,
    content = '',
    file?: Express.Multer.File,
  ): Promise<{ jobId: string; status: 'job_created' }> {
    if (!content && !file) {
      throw new BadRequestException('content or file is required');
    }

    const attachments = file ? [this.toAttachment(file)] : undefined;
    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        usuario_id: usuarioId,
        content,
        role: 'user',
        status: 'pending',
        attachments: attachments ?? null,
      }),
    );

    const jobId = String(
      await this.queueService.sendJob<ChatJobPayload>(CHAT_JOBS_QUEUE, {
        messageId: message.id,
        usuarioId,
        content,
        rawInput: content,
        familyContext: await this.buildFamilyContext(usuarioId),
        attachments,
      }),
    );

    await this.messagesRepository.update(
      { id: message.id, usuario_id: usuarioId },
      { status: 'job_created' },
    );
    this.streamService.emit(usuarioId, {
      status: 'job_created',
      message: 'Mensagem na fila',
      jobId,
      data: { messageId: message.id },
    });

    return { jobId, status: 'job_created' };
  }

  async updateStatus(
    messageId: string,
    usuarioId: number,
    status: ChatMessage['status'],
  ) {
    await this.messagesRepository.update(
      { id: messageId, usuario_id: usuarioId },
      { status },
    );
  }

  async complete(messageId: string, usuarioId: number, content: string) {
    await this.messagesRepository.update(
      { id: messageId, usuario_id: usuarioId },
      { status: 'completed' },
    );

    await this.messagesRepository.save(
      this.messagesRepository.create({
        usuario_id: usuarioId,
        content,
        role: 'assistant',
        status: 'completed',
        attachments: null,
      }),
    );
  }

  async fail(messageId: string, usuarioId: number) {
    await this.messagesRepository.update(
      { id: messageId, usuario_id: usuarioId },
      { status: 'failed' },
    );
  }

  async recentTurns(usuarioId: number) {
    return this.messagesRepository.find({
      where: { usuario_id: usuarioId },
      order: { created_at: 'DESC' },
      take: 10,
    });
  }

  toDto(message: ChatMessageEntity): ChatMessage {
    return {
      id: message.id,
      content: message.content,
      role: message.role,
      status: message.status,
      created_at: message.created_at.toISOString(),
      attachments:
        message.attachments?.map((attachment) => ({
          type: attachment.type as 'audio' | 'image',
          mime_type: attachment.mime_type,
        })) ?? undefined,
    };
  }

  private toAttachment(file: Express.Multer.File) {
    const type = file.mimetype === 'audio/wav' ? 'audio' : 'image';
    return {
      type,
      mime_type: file.mimetype,
      data: file.buffer.toString('base64'),
    } as const;
  }

  private async buildFamilyContext(usuarioId: number): Promise<FamilyContext> {
    const timezone =
      this.configService.get<string>('APP_TIMEZONE') ?? 'America/Sao_Paulo';
    const now = new Date();
    const users = await this.usersRepository.find({
      select: { id: true },
      order: { id: 'ASC' },
      take: 3,
    });
    const otherUsers = users.filter((user) => user.id !== usuarioId);
    const spouseId = otherUsers.length === 1 ? otherUsers[0].id : null;

    return {
      userId: usuarioId,
      spouseId,
      currentDate: this.formatDate(now, timezone),
      currentDateTime: now.toISOString(),
      dayOfWeek: new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        timeZone: timezone,
      }).format(now),
      timezone,
      location: this.configService.get<string>('APP_LOCATION') ?? null,
    };
  }

  private formatDate(date: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    }).formatToParts(date);
    const value = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return `${value.year}-${value.month}-${value.day}`;
  }
}
