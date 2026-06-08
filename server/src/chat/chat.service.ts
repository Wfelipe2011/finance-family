import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  ChatJobResponse,
  ChatMessage,
  FamilyContext,
} from '@fin-ai/shared/chat';
import { Repository } from 'typeorm';
import { AvatarAsset } from '../entities/avatar-asset.entity';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';
import { ChatMessageEntity } from '../entities/chat-message.entity';
import { Usuario } from '../entities/usuario.entity';
import { FamilyGroupsService } from '../family/family-groups.service';
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
  groupId: number;
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
    @InjectRepository(AvatarAsset)
    private readonly avatarsRepository: Repository<AvatarAsset>,
    private readonly familyGroupsService: FamilyGroupsService,
    private readonly queueService: QueueService,
    private readonly streamService: StreamService,
    private readonly configService: ConfigService,
  ) {}

  async submit(
    usuarioId: number,
    content = '',
    file?: Express.Multer.File,
  ): Promise<ChatJobResponse> {
    const group = await this.familyGroupsService.resolveDefaultGroup(usuarioId);
    return this.submitGroup(usuarioId, group.id, content, file);
  }

  async submitGroup(
    usuarioId: number,
    groupId: number,
    content = '',
    file?: Express.Multer.File,
  ): Promise<ChatJobResponse> {
    if (!content && !file) {
      throw new BadRequestException('content or file is required');
    }

    const settings = await this.familyGroupsService.getSettings(
      usuarioId,
      groupId,
    );
    const mentions = this.extractMentions(content);
    const invokesJarvis =
      settings.jarvisAlwaysOn || mentions.some((mention) => mention === 'jarvis');
    const persistedAttachments = file
      ? [this.toAttachmentMetadata(file)]
      : undefined;
    const jobAttachments =
      file && invokesJarvis ? [this.toAttachment(file)] : undefined;

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        usuario_id: usuarioId,
        group_id: groupId,
        author_type: 'user',
        author_usuario_id: usuarioId,
        content,
        role: 'user',
        status: invokesJarvis ? 'pending' : 'completed',
        attachments: persistedAttachments ?? null,
        mentions,
      }),
    );

    this.streamService.emitGroup(groupId, {
      type: 'message.created',
      messageId: message.id,
      data: { message: await this.toDto(message) },
    });

    if (!invokesJarvis) {
      return {
        messageId: message.id,
        groupId,
        status: 'completed',
      };
    }

    const jobId = String(
      await this.queueService.sendJob<ChatJobPayload>(CHAT_JOBS_QUEUE, {
        messageId: message.id,
        usuarioId,
        groupId,
        content,
        rawInput: content,
        familyContext: await this.buildFamilyContext(
          usuarioId,
          groupId,
          settings.jarvisAlwaysOn,
        ),
        attachments: jobAttachments,
      }),
    );

    await this.messagesRepository.update(
      { id: message.id, group_id: groupId },
      { status: 'job_created' },
    );
    this.streamService.emitGroup(groupId, {
      type: 'message.status',
      status: 'job_created',
      message: 'Mensagem na fila',
      jobId,
      messageId: message.id,
    });

    return { jobId, status: 'job_created', messageId: message.id, groupId };
  }

  async updateStatus(
    messageId: string,
    groupId: number,
    status: ChatMessage['status'],
  ) {
    await this.messagesRepository.update(
      { id: messageId, group_id: groupId },
      { status },
    );
  }

  async startAssistantMessage(
    triggerMessageId: string,
    usuarioId: number,
    groupId: number,
  ) {
    const existing = await this.messagesRepository.findOne({
      where: {
        group_id: groupId,
        author_type: 'agent',
        agent_id: `jarvis:${triggerMessageId}`,
      },
    });
    if (existing) {
      return existing;
    }

    const message = await this.messagesRepository.save(
      this.messagesRepository.create({
        usuario_id: usuarioId,
        group_id: groupId,
        author_type: 'agent',
        author_usuario_id: null,
        agent_id: `jarvis:${triggerMessageId}`,
        content: '',
        role: 'assistant',
        status: 'processing_ia',
        attachments: null,
        mentions: [],
      }),
    );
    this.streamService.emitGroup(groupId, {
      type: 'assistant.started',
      messageId: message.id,
      data: { message: await this.toDto(message) },
    });
    return message;
  }

  async appendAssistantDelta(
    assistantMessageId: string,
    groupId: number,
    delta: string,
    jobId: string,
  ) {
    const message = await this.messagesRepository.findOne({
      where: { id: assistantMessageId, group_id: groupId },
    });
    if (!message) {
      return;
    }
    message.content = `${message.content ?? ''}${delta}`;
    await this.messagesRepository.save(message);
    this.streamService.emitGroup(groupId, {
      type: 'assistant.delta',
      messageId: assistantMessageId,
      jobId,
      data: { delta },
    });
  }

  async complete(
    messageId: string,
    usuarioId: number,
    groupId: number,
    content: string,
    assistantMessageId?: string,
  ) {
    await this.messagesRepository.update(
      { id: messageId, group_id: groupId },
      { status: 'completed' },
    );

    let assistant = assistantMessageId
      ? await this.messagesRepository.findOne({
          where: { id: assistantMessageId, group_id: groupId },
        })
      : null;
    assistant ??= await this.startAssistantMessage(
      messageId,
      usuarioId,
      groupId,
    );
    assistant.content = content;
    assistant.status = 'completed';
    await this.messagesRepository.save(assistant);
    this.streamService.emitGroup(groupId, {
      type: 'assistant.completed',
      status: 'completed',
      message: content,
      messageId: assistant.id,
      data: { triggerMessageId: messageId },
    });
  }

  async fail(messageId: string, groupId: number) {
    await this.messagesRepository.update(
      { id: messageId, group_id: groupId },
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

  async history(usuarioId: number, groupId: number) {
    await this.familyGroupsService.assertMember(usuarioId, groupId);
    const messages = await this.messagesRepository.find({
      where: { group_id: groupId },
      relations: { author_usuario: true },
      order: { created_at: 'ASC' },
    });
    return Promise.all(messages.map((message) => this.toDto(message)));
  }

  async toDto(message: ChatMessageEntity): Promise<ChatMessage> {
    const avatarUrl =
      message.author_type === 'user' && message.author_usuario_id
        ? (await this.latestUserAvatarUrl(message.author_usuario_id))
        : message.group_id
          ? await this.familyGroupsService.jarvisAvatarUrl(message.group_id)
          : null;
    return {
      id: message.id,
      groupId: message.group_id ?? undefined,
      content: message.content,
      role: message.role,
      author:
        message.author_type === 'agent'
          ? {
              type: 'agent',
              id: 'jarvis',
              displayName: 'Jarvis',
              avatarUrl,
            }
          : {
              type: 'user',
              id: message.author_usuario_id ?? message.usuario_id,
              displayName:
                message.author_usuario?.nome ??
                `Usuario ${message.author_usuario_id ?? message.usuario_id}`,
              avatarUrl,
            },
      status: message.status,
      created_at: message.created_at.toISOString(),
      mentions: message.mentions,
      attachments:
        message.attachments?.map((attachment) => ({
          type: attachment.type as 'audio' | 'image',
          mime_type: attachment.mime_type,
          url: attachment.url,
          name: attachment.name,
          size: attachment.size,
        })) ?? undefined,
      jarvisContent: message.jarvis_content,
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

  private toAttachmentMetadata(file: Express.Multer.File) {
    const type = file.mimetype === 'audio/wav' ? 'audio' : 'image';
    return {
      type,
      mime_type: file.mimetype,
      name: file.originalname,
      size: file.size,
    } as const;
  }

  private extractMentions(content: string) {
    return Array.from(content.matchAll(/@([a-z0-9_]+)/gi)).map((match) =>
      String(match[1]).toLowerCase(),
    );
  }

  private async buildFamilyContext(
    usuarioId: number,
    groupId: number,
    jarvisAlwaysOn: boolean,
  ): Promise<FamilyContext> {
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
      groupId,
      spouseId,
      currentDate: this.formatDate(now, timezone),
      currentDateTime: now.toISOString(),
      dayOfWeek: new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        timeZone: timezone,
      }).format(now),
      timezone,
      location: this.configService.get<string>('APP_LOCATION') ?? null,
      jarvisAlwaysOn,
      recentMessages: await this.recentGroupContext(groupId),
    };
  }

  private async recentGroupContext(groupId: number) {
    const messages = await this.messagesRepository.find({
      where: { group_id: groupId },
      relations: { author_usuario: true },
      order: { created_at: 'DESC' },
      take: 8,
    });
    return messages.reverse().map((message) => ({
      author:
        message.author_type === 'agent'
          ? 'Jarvis'
          : (message.author_usuario?.nome ?? `Usuario ${message.usuario_id}`),
      content: message.content,
      created_at: message.created_at.toISOString(),
    }));
  }

  private async latestUserAvatarUrl(usuarioId: number) {
    const avatar = await this.avatarsRepository.findOne({
      where: { owner_type: 'user', owner_id: String(usuarioId) },
      order: { created_at: 'DESC', id: 'DESC' },
    });
    return avatar?.public_url ?? null;
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
