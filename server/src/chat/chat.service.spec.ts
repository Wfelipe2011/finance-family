import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { ChatJobPayload, ChatService } from './chat.service';

function makeService() {
  const createdAt = new Date('2026-06-08T12:00:00.000Z');
  const repository = {
    create: vi.fn((data: Record<string, unknown>) => data),
    save: vi.fn((data: Record<string, unknown>) =>
      Promise.resolve({ ...data, id: 'message-1', created_at: createdAt }),
    ),
    find: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const usersRepository = {
    find: vi.fn().mockResolvedValue([{ id: 7 }, { id: 8 }]),
  };
  const avatarsRepository = {
    findOne: vi.fn().mockResolvedValue(null),
  };
  const familyGroupsService = {
    resolveDefaultGroup: vi.fn().mockResolvedValue({ id: 42 }),
    getSettings: vi.fn().mockResolvedValue({ jarvisAlwaysOn: false }),
  };
  const queueService = {
    sendJob: vi.fn().mockResolvedValue('job-1'),
  };
  const streamService = {
    emitGroup: vi.fn(),
  };
  const service = new ChatService(
    repository as never,
    usersRepository as never,
    avatarsRepository as never,
    familyGroupsService as never,
    queueService as never,
    streamService as never,
    { get: vi.fn(() => undefined) } as never,
  );

  return {
    service,
    repository,
    usersRepository,
    familyGroupsService,
    queueService,
    streamService,
  };
}

describe('ChatService submit lifecycle', () => {
  it('queues Jarvis mentions and emits group message.created and job_created', async () => {
    const {
      service,
      repository,
      queueService,
      streamService,
      familyGroupsService,
    } = makeService();

    await expect(service.submit(7, '@Jarvis Oi')).resolves.toEqual({
      jobId: 'job-1',
      messageId: 'message-1',
      groupId: 42,
      status: 'job_created',
    });

    expect(familyGroupsService.resolveDefaultGroup).toHaveBeenCalledWith(7);
    expect(familyGroupsService.getSettings).toHaveBeenCalledWith(7, 42);
    expect(queueService.sendJob).toHaveBeenCalledTimes(1);
    expect(queueService.sendJob.mock.calls[0]?.[0]).toBe(CHAT_JOBS_QUEUE);
    const queuedPayload = queueService.sendJob.mock.calls[0]?.[1] as
      | ChatJobPayload
      | undefined;
    expect(queuedPayload).toMatchObject({
      messageId: 'message-1',
      usuarioId: 7,
      groupId: 42,
      content: '@Jarvis Oi',
      rawInput: '@Jarvis Oi',
      attachments: undefined,
    });
    expect(queuedPayload?.familyContext).toMatchObject({
      userId: 7,
      groupId: 42,
      spouseId: 8,
      timezone: 'America/Sao_Paulo',
      jarvisAlwaysOn: false,
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'message-1', group_id: 42 },
      { status: 'job_created' },
    );
    expect(streamService.emitGroup).toHaveBeenNthCalledWith(
      1,
      42,
      expect.objectContaining({
        type: 'message.created',
        messageId: 'message-1',
        data: {
          message: expect.objectContaining({
            id: 'message-1',
            groupId: 42,
            content: '@Jarvis Oi',
            status: 'pending',
            mentions: ['jarvis'],
          }),
        },
      }),
    );
    expect(streamService.emitGroup).toHaveBeenNthCalledWith(2, 42, {
      type: 'message.status',
      status: 'job_created',
      message: 'Mensagem na fila',
      jobId: 'job-1',
      messageId: 'message-1',
    });
  });

  it('rejects empty submissions', async () => {
    const { service } = makeService();

    await expect(service.submit(7)).rejects.toBeInstanceOf(BadRequestException);
  });
});
