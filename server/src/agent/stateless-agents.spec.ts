import { beforeEach, describe, expect, it, vi } from 'vitest';

const createAgentMock = vi.hoisted(() => vi.fn());

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
    createAgentMock.mockReturnValue({
      invoke: vi.fn().mockResolvedValue({
        messages: [{ content: 'ok' }],
        structuredResponse: { message: 'ok' },
      }),
    });
  });

  it('invokes Consultor without checkpointer, store, or history', async () => {
    const service = new ConsultorAgentService({
      consultarGastosTool: vi.fn(() => ({ name: 'consultar_gastos_db' })),
    } as never);

    await service.invoke('quanto gastei?', {} as never, 1);

    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('checkpointer');
    expect(createAgentMock.mock.calls[0][0]).not.toHaveProperty('store');
    const invoke = createAgentMock.mock.results[0].value.invoke;
    expect(invoke).toHaveBeenCalledWith(
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
    const invoke = createAgentMock.mock.results[0].value.invoke;
    expect(invoke).toHaveBeenCalledWith(
      { messages: [{ role: 'user', content: 'cadastre cafe 12' }] },
      { context: { usuario_id: 2 } },
    );
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
