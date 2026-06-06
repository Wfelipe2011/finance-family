import { describe, expect, it, vi } from 'vitest';
import { ChatWorkerService } from './chat-worker.service';
import type { ChatJobPayload } from './chat.service';

type LifecycleEvent = {
  status: 'transcribing' | 'processing_ia' | 'completed' | 'failed';
  message: string;
  jobId: string;
  data: { messageId: string };
};

function makeService() {
  const chatService = {
    updateStatus: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
  };
  const streamService = {
    emit: vi.fn<(usuarioId: number, event: LifecycleEvent) => void>(),
  };
  const orchestrator = {
    process: vi.fn(
      async (
        _payload: ChatJobPayload,
        lifecycle?: {
          onTranscribing?: () => Promise<void>;
          onProcessingIa?: () => Promise<void>;
        },
      ) => {
        if (_payload.attachments?.length) {
          await lifecycle?.onTranscribing?.();
        }
        await lifecycle?.onProcessingIa?.();
        return 'Resposta final';
      },
    ),
  };
  const service = new ChatWorkerService(
    { registerWorker: vi.fn() } as never,
    chatService as never,
    orchestrator as never,
    streamService as never,
  );

  return { service, chatService, streamService, orchestrator };
}

describe('ChatWorkerService lifecycle events', () => {
  it('emits processing_ia and completed for text jobs', async () => {
    const { service, streamService } = makeService();

    await service['handle'](
      { messageId: 'message-1', usuarioId: 7, content: 'Oi' },
      { id: 'job-1' } as never,
    );

    expect(streamService.emit).toHaveBeenCalledTimes(2);
    expect(
      streamService.emit.mock.calls.map(([, event]) => event.status),
    ).toEqual(['processing_ia', 'completed']);
    expect(streamService.emit.mock.calls[0]?.[1]).toMatchObject({
      jobId: 'job-1',
      data: { messageId: 'message-1' },
    });
  });

  it('emits transcribing, processing_ia, and completed for media jobs', async () => {
    const { service, streamService } = makeService();

    await service['handle'](
      {
        messageId: 'message-2',
        usuarioId: 8,
        content: '',
        attachments: [
          { type: 'audio', mime_type: 'audio/wav', data: 'base64' },
        ],
      },
      { id: 'job-2' } as never,
    );

    expect(
      streamService.emit.mock.calls.map(([, event]) => event.status),
    ).toEqual(['transcribing', 'processing_ia', 'completed']);
  });

  it('emits failed only when the job reaches terminal retry failure', async () => {
    const { service, streamService, orchestrator } = makeService();
    orchestrator.process.mockRejectedValueOnce(new Error('boom'));

    await expect(
      service['handle'](
        { messageId: 'message-3', usuarioId: 9, content: 'Oi' },
        { id: 'job-3', retryCount: 4, retryLimit: 5 } as never,
      ),
    ).rejects.toThrow('boom');

    expect(streamService.emit).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        status: 'failed',
        message: 'Nao foi possivel processar sua mensagem agora.',
        jobId: 'job-3',
      }),
    );
  });
});
