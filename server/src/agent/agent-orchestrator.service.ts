import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { summarizationMiddleware } from 'langchain';
import { z } from 'zod';
import { IAConfigService } from '../config/ia-config.service';
import type { ChatJobPayload } from '../chat/chat.service';
import type { CreateLancamentoDto } from '../lancamentos/dto/create-lancamento.dto';
import { LancamentosService } from '../lancamentos/lancamentos.service';
import { AgentFactoryService } from './agent-factory.service';
import {
  durableMemorySchema,
  memorySearchSchema,
} from './agent-memory.schemas';
import { AgentMemoryService } from './agent-memory.service';
import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ConsultorAgentService } from './consultor-agent.service';
import { parseCreateExpense } from './expense-parser';
import { ImageExtractorAgentService } from './image-extractor-agent.service';
import { OperadorAgentService } from './operador-agent.service';

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private readonly iaConfigService: IAConfigService,
    private readonly memoryService: AgentMemoryService,
    private readonly lancamentosService: LancamentosService,
    private readonly audioExtractor: AudioExtractorAgentService,
    private readonly consultor: ConsultorAgentService,
    private readonly imageExtractor: ImageExtractorAgentService,
    private readonly operador: OperadorAgentService,
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async process(payload: ChatJobPayload) {
    const model = await this.modelFor(payload.usuarioId);
    const input = await this.toMemorySafeInput(payload, model);

    const consultorTool = tool(
      (args) => this.consultor.invoke(args.pergunta, model, payload.usuarioId),
      {
        name: 'chamar_subagente_consultor',
        description:
          'Use para perguntas, totais, listas e consultas de gastos.',
        schema: z.object({ pergunta: z.string() }),
      },
    );

    const operadorTool = tool(
      (args) => this.operador.invoke(args.comando, model, payload.usuarioId),
      {
        name: 'chamar_subagente_operador',
        description:
          'Use para criar ou editar gastos, inclusive audio e imagens.',
        schema: z.object({ comando: z.string() }),
      },
    );

    const consultarMemoriaTool = tool(
      async (args) =>
        JSON.stringify(
          await this.memoryService.searchUserMemories(payload.usuarioId, args),
        ),
      {
        name: 'consultar_memoria_usuario',
        description:
          'Consulta memorias duraveis do usuario autenticado, como preferencias e fatos financeiros estaveis.',
        schema: memorySearchSchema,
      },
    );

    const salvarMemoriaTool = tool(
      async (args) => {
        const memory = durableMemorySchema.parse(args);
        return JSON.stringify(
          await this.memoryService.saveUserMemory(payload.usuarioId, memory),
        );
      },
      {
        name: 'salvar_memoria_usuario',
        description:
          'Salva apenas fatos duraveis explicitamente declarados pelo usuario ou confirmados por ferramenta. Nunca salve inferencias especulativas.',
        schema: durableMemorySchema,
      },
    );

    const agent = this.agentFactory.createMemoryfulAgent({
      model,
      tools: [
        consultorTool,
        operadorTool,
        consultarMemoriaTool,
        salvarMemoriaTool,
      ],
      checkpointer: this.memoryService.checkpointer,
      store: this.memoryService.store,
      middleware: [this.createSummarizationMiddleware(model)],
      systemPrompt:
        'Voce e um roteador financeiro. Use memoria duravel quando ajudar. Consulta, medias, datas e listas: chamar_subagente_consultor. Criar, editar ou apagar gastos: chamar_subagente_operador. Para mutacoes incompletas ou ambiguas, faca 1 pergunta curta e amigavel em vez de chamar subagente. Antes de editar/apagar, identifique um gasto unico; se houver duvida, pergunte. Salve memoria so se o usuario declarou fato estavel ou ferramenta confirmou. Responda curto.',
    });

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: input }] } as never,
      {
        context: { usuario_id: payload.usuarioId },
        configurable: {
          thread_id: this.memoryService.threadIdFor(payload.usuarioId),
        },
      } as never,
    );

    const message = this.extractText(result);
    const fallback = parseCreateExpense(payload.content);
    if (fallback && !(await this.expenseExists(payload.usuarioId, fallback))) {
      const row = await this.lancamentosService.create(
        payload.usuarioId,
        fallback,
      );
      return `Gasto ${row.descricao} cadastrado.`;
    }

    return message;
  }

  createSummarizationMiddleware(model: ChatOpenAI) {
    return summarizationMiddleware({
      model,
      trigger: { tokens: 2600, messages: 12 },
      keep: { messages: 6 },
      trimTokensToSummarize: 1800,
      summaryPrefix: 'Resumo financeiro anterior:',
    });
  }

  private async modelFor(usuarioId: number) {
    const config = await this.iaConfigService.getRaw(usuarioId);
    return new ChatOpenAI({
      model: config.model,
      apiKey: config.apiKey,
      configuration: { baseURL: config.baseUrl },
    });
  }

  async toMemorySafeInput(
    payload: ChatJobPayload,
    model: ChatOpenAI,
  ): Promise<string> {
    const sections: string[] = [];
    if (payload.content) {
      sections.push(payload.content);
    }

    for (const attachment of payload.attachments ?? []) {
      if (attachment.type === 'image') {
        const extracted = await this.imageExtractor.invoke(
          attachment,
          model,
          payload.content,
        );
        sections.push(`Imagem extraida: ${JSON.stringify(extracted)}`);
      } else {
        const extracted = await this.audioExtractor.invoke(
          attachment,
          model,
          payload.content,
        );
        sections.push(`Audio extraido: ${JSON.stringify(extracted)}`);
      }
    }

    const input = sections.join('\n\n').trim();
    if (!this.memoryService.isMemorySafeText(input)) {
      throw new Error('memory-safe agent input contains raw media payload');
    }
    return input;
  }

  private extractText(result: unknown) {
    const messages =
      (result as { messages?: Array<{ content?: unknown }> }).messages ?? [];
    const last = messages.at(-1)?.content;
    return typeof last === 'string' ? last : JSON.stringify(last ?? result);
  }

  private async expenseExists(usuarioId: number, dto: CreateLancamentoDto) {
    const rows = await this.lancamentosService.findAll(usuarioId, {
      dataInicio: dto.data,
      dataFim: dto.data,
      categoria: dto.categoria,
    });

    return rows.some(
      (row) =>
        row.descricao.toLowerCase() === dto.descricao.toLowerCase() &&
        row.valor === dto.valor,
    );
  }
}
