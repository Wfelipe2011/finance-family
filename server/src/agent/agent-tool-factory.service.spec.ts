import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const toolMock = vi.hoisted(() =>
  vi.fn((runner, options) => ({ runner, options })),
);

vi.mock('@langchain/core/tools', () => ({
  tool: toolMock,
}));

import { AgentToolFactoryService } from './agent-tool-factory.service';
import { AgentToolsService } from './agent-tools.service';

describe('AgentToolFactoryService', () => {
  beforeEach(() => {
    toolMock.mockClear();
  });

  it('binds usuario_id only from tool context', async () => {
    const execute = vi.fn().mockResolvedValue('ok');
    const factory = new AgentToolFactoryService();
    const built = factory.createContextTool({
      name: 'teste_contexto',
      description: 'teste',
      schema: z.object({ value: z.string() }),
      execute,
    }) as unknown as {
      runner: (input: unknown, config: unknown) => Promise<unknown>;
    };

    await built.runner(
      { value: 'x', usuario_id: 999 },
      { context: { usuario_id: 42 } },
    );

    expect(execute).toHaveBeenCalledWith(
      { value: 'x', usuario_id: 999 },
      { usuarioId: 42 },
      { context: { usuario_id: 42 } },
    );
  });

  it('rejects tools without authenticated usuario_id context', async () => {
    const factory = new AgentToolFactoryService();
    const built = factory.createContextTool({
      name: 'teste_contexto',
      description: 'teste',
      schema: z.object({ value: z.string() }),
      execute: vi.fn(),
    }) as unknown as {
      runner: (input: unknown, config: unknown) => Promise<unknown>;
    };

    await expect(built.runner({ value: 'x' }, {})).rejects.toThrow(
      /usuario_id/,
    );
  });
});

describe('AgentToolsService delete tool', () => {
  beforeEach(() => {
    toolMock.mockClear();
  });

  it('deletes owned expenses through LancamentosService.delete', async () => {
    const lancamentos = { delete: vi.fn().mockResolvedValue(undefined) };
    const service = new AgentToolsService(lancamentos as never);

    const built = service.apagarGastoTool() as unknown as {
      runner: (input: unknown, config: unknown) => Promise<string>;
    };

    await expect(
      built.runner({ id: 15 }, { context: { usuario_id: 3 } }),
    ).resolves.toBe(JSON.stringify({ status: 'deleted', id: 15 }));
    expect(lancamentos.delete).toHaveBeenCalledWith(3, 15);
  });

  it('does not bypass service ownership checks for another user', async () => {
    const lancamentos = {
      delete: vi.fn().mockRejectedValue(new Error('Lancamento not found')),
    };
    const service = new AgentToolsService(lancamentos as never);

    const built = service.apagarGastoTool() as unknown as {
      runner: (input: unknown, config: unknown) => Promise<string>;
    };

    await expect(
      built.runner({ id: 22 }, { context: { usuario_id: 4 } }),
    ).rejects.toThrow(/not found/);
    expect(lancamentos.delete).toHaveBeenCalledWith(4, 22);
  });
});
