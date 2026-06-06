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

type AgentInvokeInput = {
  messages: Array<{ content: string }>;
};

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

function familyContext(userId = 7) {
  return {
    userId,
    spouseId: null,
    currentDate: '2026-06-06',
    currentDateTime: '2026-06-06T12:00:00.000Z',
    dayOfWeek: 'sábado',
    timezone: 'America/Sao_Paulo',
    location: null,
  };
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

    const invokeInput = invokeMock.mock.calls[0]?.[0] as AgentInvokeInput;
    const input = invokeInput.messages[0]?.content ?? '';
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

  it('keeps recent checkpoint thread for name recall in the same user thread', async () => {
    const { service } = serviceFactory();
    const invokeMock = vi
      .fn()
      .mockResolvedValueOnce({ messages: [{ content: 'Prazer, Wilson.' }] })
      .mockResolvedValueOnce({ messages: [{ content: 'Seu nome e Wilson.' }] });
    createAgentMock.mockReturnValue({ invoke: invokeMock });

    await service.process({
      messageId: 'message-4',
      usuarioId: 11,
      content: 'Me chamo Wilson',
      rawInput: 'Me chamo Wilson',
      familyContext: familyContext(11),
    });
    const answer = await service.process({
      messageId: 'message-5',
      usuarioId: 11,
      content: 'Qual meu nome?',
      rawInput: 'Qual meu nome?',
      familyContext: familyContext(11),
    });

    expect(answer).toBe('Seu nome e Wilson.');
    expect(invokeMock.mock.calls[0][1]).toMatchObject({
      configurable: { thread_id: 'finai:user:11' },
    });
    expect(invokeMock.mock.calls[1][1]).toMatchObject({
      configurable: { thread_id: 'finai:user:11' },
    });
  });

  it('turns a mutation into draft without direct persistence and commits only after confirmation', async () => {
    const operador = {
      invoke: vi
        .fn()
        .mockResolvedValueOnce({
          status: 'draft',
          operation: 'create',
          payload: {
            descricao: 'mercado',
            valor: 25,
            categoria: 'Alimentação',
            data: '2026-06-06',
          },
        })
        .mockResolvedValueOnce({
          status: 'commit',
          operation: 'create',
          payload: { id: 1, descricao: 'mercado' },
          message: 'Gasto mercado cadastrado.',
        }),
    };
    const lancamentos = {
      findAll: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    };
    const { memoryService } = serviceFactory();
    const service = new AgentOrchestratorService(
      {
        getRaw: vi.fn().mockResolvedValue({
          model: 'gemma-4',
          baseUrl: 'http://localhost:11434/v1',
          apiKey: 'test-key',
        }),
      } as never,
      memoryService as never,
      lancamentos as never,
      { invoke: vi.fn() } as never,
      { invoke: vi.fn() } as never,
      { invoke: vi.fn() } as never,
      operador as never,
    );

    const draftMessage = await service.process({
      messageId: 'message-6',
      usuarioId: 12,
      content: 'gastei R$ 25 no mercado categoria Alimentação',
      rawInput: 'gastei R$ 25 no mercado categoria Alimentação',
      familyContext: familyContext(12),
    });
    const commitMessage = await service.process({
      messageId: 'message-7',
      usuarioId: 12,
      content: 'sim',
      rawInput: 'sim',
      familyContext: familyContext(12),
    });

    expect(draftMessage).toContain('Confirma');
    expect(commitMessage).toBe('Gasto mercado cadastrado.');
    expect(lancamentos.create).not.toHaveBeenCalled();
    expect(operador.invoke).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'commit', operation: 'create' }),
      expect.any(Object),
      12,
      familyContext(12),
    );
  });
});
