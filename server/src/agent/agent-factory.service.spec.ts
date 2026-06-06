import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAgentMock = vi.hoisted(() => vi.fn());

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
}));

import { AgentFactoryService } from './agent-factory.service';

describe('AgentFactoryService', () => {
  beforeEach(() => {
    createAgentMock.mockReset();
    createAgentMock.mockReturnValue({ invoke: vi.fn() });
  });

  it('creates memoryful agents with checkpointer, store, and middleware', () => {
    const service = new AgentFactoryService();

    service.createMemoryfulAgent({
      model: { model: 'llm' },
      tools: [{ name: 'tool' }],
      systemPrompt: 'prompt',
      checkpointer: { kind: 'checkpointer' },
      store: { kind: 'store' },
      middleware: ['summary'],
    });

    expect(createAgentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointer: { kind: 'checkpointer' },
        store: { kind: 'store' },
        middleware: ['summary'],
      }),
    );
  });

  it('creates stateless agents without memory options', () => {
    const service = new AgentFactoryService();

    service.createStatelessAgent({
      model: { model: 'llm' },
      tools: [{ name: 'tool' }],
      systemPrompt: 'prompt',
    });

    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('middleware');
  });
});
