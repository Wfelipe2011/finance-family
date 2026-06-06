import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ChatMessage } from '@fin-ai/shared/chat';
import { Repository } from 'typeorm';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';
import { ChatMessageEntity } from '../entities/chat-message.entity';

export interface ChatAttachment {
  type: 'audio' | 'image';
  mime_type: string;
  data: string;
}

export interface ChatJobPayload {
  messageId: string;
  usuarioId: number;
  content: string;
  attachments?: ChatAttachment[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messagesRepository: Repository<ChatMessageEntity>,
    private readonly queueService: QueueService,
  ) {}

  async submit(
    usuarioId: number,
    content = '',
    file?: Express.Multer.File,
  ): Promise<{ jobId: string; status: 'pending' }> {
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

    const jobId = await this.queueService.sendJob<ChatJobPayload>(
      CHAT_JOBS_QUEUE,
      {
        messageId: message.id,
        usuarioId,
        content,
        attachments,
      },
    );

    return { jobId: String(jobId), status: 'pending' };
  }

  async markProcessing(messageId: string, usuarioId: number) {
    await this.messagesRepository.update(
      { id: messageId, usuario_id: usuarioId },
      { status: 'processing' },
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
}
