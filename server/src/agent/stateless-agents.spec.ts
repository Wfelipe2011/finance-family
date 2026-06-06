import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAgentMock = vi.hoisted(() => vi.fn());
const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('langchain', () => ({
  createAgent: createAgentMock,
}));

import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ConsultorAgentService } from './consultor-agent.service';
import { ImageExtractorAgentService } from './image-extractor-agent.service';
import { OperadorAgentService } from './operador-agent.service';

describe('stateless specialist and media agents', () => {
  beforeEach(() => {
    createAgentMock.mockReset();
    invokeMock.mockReset();
    invokeMock.mockResolvedValue({
      messages: [{ content: 'ok' }],
      structuredResponse: { message: 'ok' },
    });
    createAgentMock.mockReturnValue({
      invoke: invokeMock,
    });
  });

  it('invokes Consultor without checkpointer, store, or history', async () => {
    const service = new ConsultorAgentService({
      consultarGastosTool: vi.fn(() => ({ name: 'consultar_gastos_db' })),
    } as never);

    await service.invoke('quanto gastei?', {} as never, 1);

    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');
    expect(invokeMock).toHaveBeenCalledWith(
      { messages: [{ role: 'user', content: 'quanto gastei?' }] },
      { context: { usuario_id: 1 } },
    );
  });

  it('invokes Operador without checkpointer, store, or history', async () => {
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(() => ({ name: 'adicionar_gasto_db' })),
        editarGastoTool: vi.fn(() => ({ name: 'editar_gasto_db' })),
        apagarGastoTool: vi.fn(() => ({ name: 'apagar_gasto_db' })),
      } as never,
      { findAll: vi.fn().mockResolvedValue([]), create: vi.fn() } as never,
    );

    await service.invoke('cadastre cafe 12', {} as never, 2);

    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');
    expect(invokeMock).toHaveBeenCalledWith(
      { messages: [{ role: 'user', content: 'cadastre cafe 12' }] },
      { context: { usuario_id: 2 } },
    );
  });

  it('returns a draft for complete create requests without persisting', async () => {
    const lancamentos = { create: vi.fn() };
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(),
        editarGastoTool: vi.fn(),
        apagarGastoTool: vi.fn(),
      } as never,
      lancamentos as never,
    );

    const result = await service.invoke(
      'gastei R$ 25 no mercado categoria Alimentação',
      {} as never,
      2,
      {
        userId: 2,
        spouseId: null,
        currentDate: '2026-06-06',
        currentDateTime: '2026-06-06T12:00:00.000Z',
        dayOfWeek: 'sábado',
        timezone: 'America/Sao_Paulo',
        location: null,
      },
    );

    expect(result).toMatchObject({
      status: 'draft',
      operation: 'create',
      payload: {
        descricao: 'mercado',
        valor: 25,
        categoria: 'Alimentação',
        data: '2026-06-06',
      },
    });
    expect(lancamentos.create).not.toHaveBeenCalled();
  });

  it('returns rejected with missing_fields when create data is unsafe', async () => {
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(),
        editarGastoTool: vi.fn(),
        apagarGastoTool: vi.fn(),
      } as never,
      { create: vi.fn() } as never,
    );

    const result = await service.invoke('registre um gasto', {} as never, 2);

    expect(result).toMatchObject({
      status: 'rejected',
      missing_fields: ['descricao', 'valor', 'categoria'],
    });
  });

  it('commits a confirmed draft exactly once', async () => {
    const lancamentos = {
      create: vi.fn().mockResolvedValue({
        id: 10,
        descricao: 'mercado',
        valor: 25,
        categoria: 'Alimentação',
      }),
    };
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(),
        editarGastoTool: vi.fn(),
        apagarGastoTool: vi.fn(),
      } as never,
      lancamentos as never,
    );

    const result = await service.invoke(
      {
        action: 'commit',
        operation: 'create',
        payload: {
          descricao: 'mercado',
          valor: 25,
          categoria: 'Alimentação',
          data: '2026-06-06',
        },
      },
      {} as never,
      2,
    );

    expect(result).toMatchObject({ status: 'commit', operation: 'create' });
    expect(lancamentos.create).toHaveBeenCalledTimes(1);
    expect(lancamentos.create).toHaveBeenCalledWith(2, {
      descricao: 'mercado',
      valor: 25,
      categoria: 'Alimentação',
      data: '2026-06-06',
    });
  });

  it('returns edit drafts from structured subagent output without persisting', async () => {
    createAgentMock.mockReturnValue({
      invoke: vi.fn().mockResolvedValue({
        structuredResponse: {
          status: 'draft',
          operation: 'edit',
          payload: { id: 3, valor: 30 },
          message: 'Vou editar o lancamento 3. Confirma?',
        },
      }),
    });
    const lancamentos = { update: vi.fn() };
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(),
        editarGastoTool: vi.fn(),
        apagarGastoTool: vi.fn(),
      } as never,
      lancamentos as never,
    );

    const result = await service.invoke(
      'edite o gasto 3 para 30',
      {} as never,
      2,
    );

    expect(result).toMatchObject({
      status: 'draft',
      operation: 'edit',
      payload: { id: 3, valor: 30 },
    });
    expect(lancamentos.update).not.toHaveBeenCalled();
  });

  it('commits confirmed edit and delete drafts', async () => {
    const lancamentos = {
      update: vi.fn().mockResolvedValue({ id: 3, valor: 30 }),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    const service = new OperadorAgentService(
      {
        adicionarGastoTool: vi.fn(),
        editarGastoTool: vi.fn(),
        apagarGastoTool: vi.fn(),
      } as never,
      lancamentos as never,
    );

    await expect(
      service.invoke(
        { action: 'commit', operation: 'edit', payload: { id: 3, valor: 30 } },
        {} as never,
        2,
      ),
    ).resolves.toMatchObject({ status: 'commit', operation: 'edit' });
    await expect(
      service.invoke(
        { action: 'commit', operation: 'delete', payload: { id: 3 } },
        {} as never,
        2,
      ),
    ).resolves.toMatchObject({ status: 'commit', operation: 'delete' });

    expect(lancamentos.update).toHaveBeenCalledWith(2, 3, { valor: 30 });
    expect(lancamentos.delete).toHaveBeenCalledWith(2, 3);
  });

  it('invokes media extractors with structured output and no memory options', async () => {
    createAgentMock.mockReturnValue({
      invoke: vi.fn().mockResolvedValue({
        structuredResponse: {
          transcript: 'mercado vinte reais',
          intent: 'criar gasto',
          confidence: 0.8,
        },
      }),
    });
    const audio = new AudioExtractorAgentService();

    await audio.invoke(
      { type: 'audio', mime_type: 'audio/wav', data: 'base64-audio' },
      {} as never,
      'texto atual',
    );

    expect(createAgentMock.mock.calls[0][0]).toHaveProperty('responseFormat');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');

    createAgentMock.mockClear();
    createAgentMock.mockReturnValue({
      invoke: vi.fn().mockResolvedValue({
        structuredResponse: {
          description: 'cupom',
          merchant: 'Mercado',
          total: 20,
          confidence: 0.8,
        },
      }),
    });
    const image = new ImageExtractorAgentService();

    await image.invoke(
      { type: 'image', mime_type: 'image/png', data: 'base64-image' },
      {} as never,
      'texto atual',
    );

    expect(createAgentMock.mock.calls[0][0]).toHaveProperty('responseFormat');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');
  });
});
