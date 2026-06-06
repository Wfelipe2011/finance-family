import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { summarizationMiddleware } from 'langchain';
import { z } from 'zod';
import type { AgentDraftResult, AgentResult } from '@fin-ai/shared/lancamento';
import { IAConfigService } from '../config/ia-config.service';
import type { ChatJobPayload } from '../chat/chat.service';
import { LancamentosService } from '../lancamentos/lancamentos.service';
import { AgentFactoryService } from './agent-factory.service';
import {
  durableMemorySchema,
  memorySearchSchema,
} from './agent-memory.schemas';
import { AgentMemoryService } from './agent-memory.service';
import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ConsultorAgentService } from './consultor-agent.service';
import { ImageExtractorAgentService } from './image-extractor-agent.service';
import { OperadorAgentService } from './operador-agent.service';

@Injectable()
export class AgentOrchestratorService {
  private readonly latestDraftByUser = new Map<number, AgentDraftResult>();

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

  async process(
    payload: ChatJobPayload,
    lifecycle?: {
      onTranscribing?: () => Promise<void>;
      onProcessingIa?: () => Promise<void>;
    },
  ) {
    const model = await this.modelFor(payload.usuarioId);
    if (payload.attachments?.length) {
      await lifecycle?.onTranscribing?.();
    }
    const input = await this.toMemorySafeInput(payload, model);

    if (this.isExplicitConfirmation(payload.rawInput || payload.content)) {
      const draft = this.latestDraftByUser.get(payload.usuarioId);
      if (draft) {
        const commit = await this.operador.invoke(
          {
            action: 'commit',
            operation: draft.operation,
            payload: draft.payload,
            familyContext: payload.familyContext,
          },
          model,
          payload.usuarioId,
          payload.familyContext,
        );
        if (commit.status === 'commit') {
          this.latestDraftByUser.delete(payload.usuarioId);
        }
        return this.humanizeAgentResult(commit);
      }
    }

    const consultorTool = tool(
      async (args) =>
        JSON.stringify(
          await this.consultor.invoke(args.pergunta, model, payload.usuarioId),
        ),
      {
        name: 'chamar_subagente_consultor',
        description:
          'Use para perguntas, totais, listas e consultas de gastos.',
        schema: z.object({ pergunta: z.string() }),
      },
    );

    const operadorTool = tool(
      async (args) =>
        JSON.stringify(
          await this.operador.invoke(
            args.comando,
            model,
            payload.usuarioId,
            payload.familyContext,
          ),
        ),
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
        'Voce e o assistente financeiro em PT-BR. Use contexto recente antes de perguntar de novo. Consultas: chame consultor. Criar/editar/apagar: chame operador; draft exige confirmacao, commit significa salvo. Rejected vira pergunta objetiva. Read/commit vira resposta curta. Salve memoria so para fatos estaveis declarados.',
    });

    await lifecycle?.onProcessingIa?.();

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
    const structured = this.parseAgentResult(message);
    if (structured) {
      return this.humanizeAgentResult(structured, payload.usuarioId);
    }

    const directDraft = await this.operador.invoke(
      payload.rawInput || payload.content,
      model,
      payload.usuarioId,
      payload.familyContext,
    );
    if (directDraft.status === 'draft' || directDraft.status === 'rejected') {
      return this.humanizeAgentResult(directDraft, payload.usuarioId);
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
    if (payload.rawInput || payload.content) {
      sections.push(payload.rawInput || payload.content);
    }

    if (payload.familyContext) {
      sections.push(
        `Contexto familiar: ${JSON.stringify(payload.familyContext)}`,
      );
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

  private humanizeAgentResult(result: AgentResult, usuarioId?: number) {
    if (result.status === 'draft') {
      if (usuarioId) {
        this.latestDraftByUser.set(usuarioId, result);
      }
      if (result.operation === 'edit') {
        return result.message ?? 'Vou editar esse lancamento. Confirma?';
      }
      if (result.operation === 'delete') {
        return result.message ?? 'Vou apagar esse lancamento. Confirma?';
      }
      const payload = result.payload as {
        descricao?: string;
        valor?: number;
        categoria?: string;
      };
      return (
        result.message ??
        `Vou cadastrar ${payload.descricao ?? 'este lancamento'} por R$ ${Number(payload.valor ?? 0).toFixed(2)} em ${payload.categoria ?? 'categoria informada'}. Confirma?`
      );
    }
    if (result.status === 'commit') {
      return result.message ?? 'Lancamento confirmado.';
    }
    if (result.status === 'read') {
      return result.message ?? JSON.stringify(result.data);
    }
    return `Preciso de ${result.missing_fields.join(', ')} para continuar.`;
  }

  private parseAgentResult(message: string): AgentResult | null {
    try {
      const parsed = JSON.parse(message) as AgentResult;
      if (
        parsed?.status === 'draft' ||
        parsed?.status === 'commit' ||
        parsed?.status === 'read' ||
        parsed?.status === 'rejected'
      ) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }

  private isExplicitConfirmation(input: string) {
    return /^(sim|s|confirmo|confirma|pode cadastrar|pode salvar|ok|isso)$/i.test(
      input.trim(),
    );
  }
}
