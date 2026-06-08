import { describe, expect, it, vi } from 'vitest';
import { ChatWorkerService } from './chat-worker.service';
import type { ChatJobPayload } from './chat.service';

type LifecycleEvent = {
  type: string;
  status?: 'transcribing' | 'processing_ia' | 'completed' | 'failed';
  message: string;
  jobId: string;
  messageId: string;
};

function makeService() {
  const chatService = {
    updateStatus: vi.fn().mockResolvedValue(undefined),
    startAssistantMessage: vi.fn().mockResolvedValue({ id: 'assistant-1' }),
    appendAssistantDelta: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
  };
  const streamService = {
    emitGroup: vi.fn<(groupId: number, event: LifecycleEvent) => void>(),
  };
  const orchestrator = {
    process: vi.fn(
      async (
        _payload: ChatJobPayload,
        lifecycle?: {
          onTranscribing?: () => Promise<void>;
          onProcessingIa?: () => Promise<void>;
          onToken?: (delta: string) => Promise<void>;
        },
      ) => {
        if (_payload.attachments?.length) {
          await lifecycle?.onTranscribing?.();
        }
        await lifecycle?.onProcessingIa?.();
        await lifecycle?.onToken?.('Resposta ');
        await lifecycle?.onToken?.('final');
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
    const { service, chatService, streamService } = makeService();

    await service['handle'](
      { messageId: 'message-1', usuarioId: 7, groupId: 42, content: 'Oi' },
      { id: 'job-1' } as never,
    );

    expect(chatService.startAssistantMessage).toHaveBeenCalledWith(
      'message-1',
      7,
      42,
    );
    expect(chatService.updateStatus).toHaveBeenCalledWith(
      'message-1',
      42,
      'processing_ia',
    );
    expect(chatService.appendAssistantDelta).toHaveBeenNthCalledWith(
      1,
      'assistant-1',
      42,
      'Resposta ',
      'job-1',
    );
    expect(chatService.appendAssistantDelta).toHaveBeenNthCalledWith(
      2,
      'assistant-1',
      42,
      'final',
      'job-1',
    );
    expect(chatService.complete).toHaveBeenCalledWith(
      'message-1',
      7,
      42,
      'Resposta final',
      'assistant-1',
    );
    expect(streamService.emitGroup).toHaveBeenCalledTimes(2);
    expect(
      streamService.emitGroup.mock.calls.map(([, event]) => event.status),
    ).toEqual(['processing_ia', 'completed']);
    expect(streamService.emitGroup.mock.calls[0]).toEqual([
      42,
      expect.objectContaining({
        type: 'message.status',
        status: 'processing_ia',
        messageId: 'message-1',
        jobId: 'job-1',
      }),
    ]);
    expect(streamService.emitGroup.mock.calls[1]?.[1]).toMatchObject({
      type: 'message.status',
      jobId: 'job-1',
      messageId: 'message-1',
    });
  });

  it('emits transcribing, processing_ia, and completed for media jobs', async () => {
    const { service, chatService, streamService } = makeService();

    await service['handle'](
      {
        messageId: 'message-2',
        usuarioId: 8,
        groupId: 43,
        content: '',
        attachments: [
          { type: 'audio', mime_type: 'audio/wav', data: 'base64' },
        ],
      },
      { id: 'job-2' } as never,
    );

    expect(chatService.updateStatus).toHaveBeenNthCalledWith(
      1,
      'message-2',
      43,
      'transcribing',
    );
    expect(chatService.updateStatus).toHaveBeenNthCalledWith(
      2,
      'message-2',
      43,
      'processing_ia',
    );
    expect(
      streamService.emitGroup.mock.calls.map(([, event]) => event.status),
    ).toEqual(['transcribing', 'processing_ia', 'completed']);
    expect(
      streamService.emitGroup.mock.calls.map(([groupId]) => groupId),
    ).toEqual([43, 43, 43]);
  });

  it('emits failed only when the job reaches terminal retry failure', async () => {
    const { service, chatService, streamService, orchestrator } = makeService();
    orchestrator.process.mockRejectedValueOnce(new Error('boom'));

    await expect(
      service['handle'](
        { messageId: 'message-3', usuarioId: 9, groupId: 44, content: 'Oi' },
        { id: 'job-3', retryCount: 4, retryLimit: 5 } as never,
      ),
    ).rejects.toThrow('boom');

    expect(chatService.fail).toHaveBeenCalledWith('message-3', 44);
    expect(streamService.emitGroup).toHaveBeenCalledWith(
      44,
      expect.objectContaining({
        type: 'assistant.failed',
        status: 'failed',
        message: 'Nao foi possivel processar sua mensagem agora.',
        jobId: 'job-3',
        messageId: 'message-3',
      }),
    );
  });
});
