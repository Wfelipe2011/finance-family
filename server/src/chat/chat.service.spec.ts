import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CHAT_JOBS_QUEUE } from '../queue/queue.constants';
import { ChatJobPayload, ChatService } from './chat.service';

function makeService() {
  const repository = {
    create: vi.fn((data: Record<string, unknown>) => data),
    save: vi.fn((data: Record<string, unknown>) =>
      Promise.resolve({ ...data, id: 'message-1' }),
    ),
    update: vi.fn().mockResolvedValue(undefined),
  };
  const queueService = {
    sendJob: vi.fn().mockResolvedValue('job-1'),
  };
  const streamService = {
    emit: vi.fn(),
  };
  const service = new ChatService(
    repository as never,
    { find: vi.fn().mockResolvedValue([{ id: 7 }, { id: 8 }]) } as never,
    queueService as never,
    streamService as never,
    { get: vi.fn(() => undefined) } as never,
  );

  return { service, repository, queueService, streamService };
}

describe('ChatService submit lifecycle', () => {
  it('queues the job and emits job_created with identifiers', async () => {
    const { service, repository, queueService, streamService } = makeService();

    await expect(service.submit(7, 'Oi')).resolves.toEqual({
      jobId: 'job-1',
      status: 'job_created',
    });

    expect(queueService.sendJob).toHaveBeenCalledTimes(1);
    expect(queueService.sendJob.mock.calls[0]?.[0]).toBe(CHAT_JOBS_QUEUE);
    const queuedPayload = queueService.sendJob.mock.calls[0]?.[1] as
      | ChatJobPayload
      | undefined;
    expect(queuedPayload).toMatchObject({
      messageId: 'message-1',
      usuarioId: 7,
      content: 'Oi',
      rawInput: 'Oi',
      attachments: undefined,
    });
    expect(queuedPayload?.familyContext).toMatchObject({
      userId: 7,
      spouseId: 8,
      timezone: 'America/Sao_Paulo',
    });
    expect(repository.update).toHaveBeenCalledWith(
      { id: 'message-1', usuario_id: 7 },
      { status: 'job_created' },
    );
    expect(streamService.emit).toHaveBeenCalledWith(7, {
      status: 'job_created',
      message: 'Mensagem na fila',
      jobId: 'job-1',
      data: { messageId: 'message-1' },
    });
  });

  it('rejects empty submissions', async () => {
    const { service } = makeService();

    await expect(service.submit(7)).rejects.toBeInstanceOf(BadRequestException);
  });
});
