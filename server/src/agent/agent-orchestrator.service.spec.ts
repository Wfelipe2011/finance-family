import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAgentMock = vi.hoisted(() => vi.fn());
const summarizationMiddlewareMock = vi.hoisted(() =>
  vi.fn(() => 'summary-middleware'),
);

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
  summarizationMiddleware: summarizationMiddlewareMock,
}));

import { AgentOrchestratorService } from './agent-orchestrator.service';

function serviceFactory() {
  const invokeMock = vi.fn().mockResolvedValue({
    messages: [{ content: 'resposta final' }],
  });
  createAgentMock.mockReturnValue({ invoke: invokeMock });

  const memoryService = {
    checkpointer: { kind: 'checkpointer' },
    store: { kind: 'store' },
    threadIdFor: vi.fn((usuarioId: number) => `finai:user:${usuarioId}`),
    searchUserMemories: vi.fn().mockResolvedValue([]),
    saveUserMemory: vi.fn(),
    isMemorySafeText: vi.fn(() => true),
  };

  const service = new AgentOrchestratorService(
    {
      getRaw: vi.fn().mockResolvedValue({
        model: 'gemma-4',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: 'test-key',
      }),
    } as never,
    memoryService as never,
    {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    } as never,
    {
      invoke: vi.fn().mockResolvedValue({
        transcript: 'gastei vinte reais',
        intent: 'criar gasto',
        expense: { descricao: 'Mercado', valor: 20 },
        confidence: 0.9,
      }),
    } as never,
    { invoke: vi.fn().mockResolvedValue('consulta') } as never,
    {
      invoke: vi.fn().mockResolvedValue({
        description: 'cupom fiscal',
        merchant: 'Mercado',
        total: 20,
        confidence: 0.9,
      }),
    } as never,
    { invoke: vi.fn().mockResolvedValue('operacao') } as never,
  );

  return { service, invokeMock, memoryService };
}

describe('AgentOrchestratorService memory', () => {
  beforeEach(() => {
    createAgentMock.mockReset();
    summarizationMiddlewareMock.mockClear();
  });

  it('does not keep a ChatService dependency for recentTurns memory assembly', () => {
    const { service } = serviceFactory();

    expect(service).not.toHaveProperty('chatService');
  });

  it('configures checkpointer, store, summarization middleware, and user thread_id', async () => {
    const { service, invokeMock, memoryService } = serviceFactory();

    await service.process({
      messageId: 'message-1',
      usuarioId: 7,
      content: 'Quanto gastei hoje?',
    });

    expect(createAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointer: memoryService.checkpointer,
        store: memoryService.store,
        middleware: ['summary-middleware'],
      }),
    );
    expect(summarizationMiddlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        trigger: { tokens: 2600, messages: 12 },
        keep: { messages: 6 },
      }),
    );
    expect(invokeMock).toHaveBeenCalledWith(
      { messages: [{ role: 'user', content: 'Quanto gastei hoje?' }] },
      expect.objectContaining({
        context: { usuario_id: 7 },
        configurable: { thread_id: 'finai:user:7' },
      }),
    );
  });

  it('normalizes media into compact summaries before Orchestrator memory input', async () => {
    const { service, invokeMock } = serviceFactory();
    const rawData =
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

    await service.process({
      messageId: 'message-2',
      usuarioId: 8,
      content: 'Cadastre este gasto',
      attachments: [
        { type: 'image', mime_type: 'image/png', data: rawData },
        { type: 'audio', mime_type: 'audio/wav', data: rawData },
      ],
    });

    const input = invokeMock.mock.calls[0][0].messages[0].content as string;
    expect(input).toContain('Cadastre este gasto');
    expect(input).toContain('Imagem extraida');
    expect(input).toContain('Audio extraido');
    expect(input).not.toContain(rawData);
    expect(input).not.toContain('data:image/png;base64');
  });

  it('fails if normalized memory input still contains raw media', async () => {
    const { service, memoryService } = serviceFactory();
    memoryService.isMemorySafeText.mockReturnValue(false);

    await expect(
      service.process({
        messageId: 'message-3',
        usuarioId: 9,
        content: 'ok',
      }),
    ).rejects.toThrow(/memory-safe/);
  });
});
