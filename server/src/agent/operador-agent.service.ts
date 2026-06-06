import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import type {
  AgentCommitResult,
  AgentDraftResult,
  AgentRejectedResult,
  AgentResult,
} from '@fin-ai/shared/lancamento';
import type { FamilyContext } from '@fin-ai/shared/chat';
import { CATEGORIA_VALUES } from '../lancamentos/categoria.values';
import type { CreateLancamentoDto } from '../lancamentos/dto/create-lancamento.dto';
import { LancamentosService } from '../lancamentos/lancamentos.service';
import { AgentFactoryService } from './agent-factory.service';
import { AgentToolsService } from './agent-tools.service';
import { parseCreateExpense } from './expense-parser';

type OperadorCommand =
  | string
  | {
      action?: 'draft' | 'commit';
      operation?: 'create' | 'edit' | 'delete';
      payload?: unknown;
      familyContext?: FamilyContext;
    };

@Injectable()
export class OperadorAgentService {
  constructor(
    private readonly toolsService: AgentToolsService,
    private readonly lancamentosService: LancamentosService,
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async invoke(
    input: OperadorCommand,
    model: ChatOpenAI,
    usuarioId: number,
    familyContext?: FamilyContext,
  ): Promise<AgentResult> {
    const command = this.parseCommand(input);
    if (command.action === 'commit') {
      return this.commit(command.operation, command.payload, usuarioId);
    }

    const draft = this.tryCreateDraft(
      input,
      familyContext ?? command.familyContext,
    );
    if (draft) {
      return draft;
    }

    const rejection = this.tryCreateRejection(input);
    if (rejection) {
      return rejection;
    }

    const agent = this.agentFactory.createStatelessAgent({
      model,
      tools: [],
      responseFormat: z.object({
        status: z.enum(['draft', 'rejected']),
        operation: z.enum(['create', 'edit', 'delete']).optional(),
        payload: z.unknown().optional(),
        missing_fields: z.array(z.string()).optional(),
        reason: z.string().optional(),
        message: z.string().optional(),
      }),
      systemPrompt:
        'Compile comandos de criar, editar ou apagar gastos em JSON tecnico. Nunca persista dados. Se faltar descricao, valor ou categoria para criar, retorne rejected com missing_fields. Se estiver completo, retorne draft.',
    });

    const result = await agent.invoke(
      {
        messages: [{ role: 'user', content: this.commandToText(input) }],
      } as never,
      { context: { usuario_id: usuarioId } } as never,
    );
    const structured = this.extractStructured(result);
    if (structured) {
      return structured;
    }
    return {
      status: 'rejected',
      missing_fields: ['descricao', 'valor', 'categoria'],
      reason: 'Nao consegui montar um lancamento seguro.',
    };
  }

  private async commit(
    operation: string | undefined,
    payload: unknown,
    usuarioId: number,
  ): Promise<AgentCommitResult | AgentRejectedResult> {
    if (operation === 'create') {
      const parsed = this.createPayloadSchema().safeParse(payload);
      if (!parsed.success) {
        return this.rejectCommit(
          payload,
          'Dados insuficientes para confirmar o lancamento.',
        );
      }
      const row = await this.lancamentosService.create(usuarioId, parsed.data);
      return {
        status: 'commit',
        operation: 'create',
        payload: row,
        message: `Gasto ${row.descricao} cadastrado.`,
      };
    }
    if (operation === 'edit') {
      const parsed = this.editPayloadSchema().safeParse(payload);
      if (!parsed.success) {
        return {
          status: 'rejected',
          missing_fields: ['id'],
          reason: 'Dados insuficientes para editar o lancamento.',
        };
      }
      const { id, ...dto } = parsed.data;
      const row = await this.lancamentosService.update(usuarioId, id, dto);
      return {
        status: 'commit',
        operation: 'edit',
        payload: row,
        message: `Lancamento ${id} atualizado.`,
      };
    }
    if (operation === 'delete') {
      const parsed = z
        .object({ id: z.number().int().positive() })
        .safeParse(payload);
      if (!parsed.success) {
        return {
          status: 'rejected',
          missing_fields: ['id'],
          reason: 'Dados insuficientes para apagar o lancamento.',
        };
      }
      await this.lancamentosService.delete(usuarioId, parsed.data.id);
      return {
        status: 'commit',
        operation: 'delete',
        payload: { id: parsed.data.id },
        message: `Lancamento ${parsed.data.id} apagado.`,
      };
    }
    return {
      status: 'rejected',
      missing_fields: ['operation'],
      reason: 'Operacao de commit desconhecida.',
    };
  }

  private tryCreateDraft(
    input: unknown,
    familyContext?: FamilyContext,
  ): AgentDraftResult<CreateLancamentoDto> | null {
    const fallbackDate = familyContext?.currentDate;
    const parsed = parseCreateExpense(input, fallbackDate);
    if (!parsed) {
      return null;
    }
    return {
      status: 'draft',
      operation: 'create',
      payload: parsed,
      message: `Vou cadastrar ${parsed.descricao} por R$ ${parsed.valor.toFixed(2)} em ${parsed.categoria}. Confirma?`,
    };
  }

  private tryCreateRejection(input: unknown): AgentRejectedResult | null {
    if (typeof input !== 'string' || !this.looksLikeMutation(input)) {
      return null;
    }
    return {
      status: 'rejected',
      missing_fields: this.missingCreateFields(parseCreateExpense(input)),
      reason: 'Faltam dados obrigatorios para criar o lancamento.',
    };
  }

  private parseCommand(input: OperadorCommand) {
    if (typeof input !== 'string') {
      return input;
    }
    try {
      const parsed = JSON.parse(input) as OperadorCommand;
      return typeof parsed === 'string' ? { action: 'draft' as const } : parsed;
    } catch {
      return { action: 'draft' as const };
    }
  }

  private commandToText(input: OperadorCommand) {
    return typeof input === 'string' ? input : JSON.stringify(input);
  }

  private extractStructured(result: unknown): AgentResult | null {
    const structured = (result as { structuredResponse?: unknown })
      .structuredResponse;
    const parsed = z
      .object({
        status: z.enum(['draft', 'rejected']),
        operation: z.enum(['create', 'edit', 'delete']).optional(),
        payload: z.unknown().optional(),
        missing_fields: z.array(z.string()).optional(),
        reason: z.string().optional(),
        message: z.string().optional(),
      })
      .safeParse(structured);
    if (!parsed.success) {
      return null;
    }
    if (parsed.data.status === 'draft') {
      return {
        status: 'draft',
        operation: parsed.data.operation ?? 'create',
        payload: parsed.data.payload,
        message: parsed.data.message,
      };
    }
    return {
      status: 'rejected',
      missing_fields: parsed.data.missing_fields ?? [],
      reason: parsed.data.reason ?? 'Pedido inseguro ou ambiguo.',
    };
  }

  private missingCreateFields(payload: unknown) {
    const value = payload as Partial<CreateLancamentoDto> | null | undefined;
    const missing: string[] = [];
    if (!value?.descricao) {
      missing.push('descricao');
    }
    if (typeof value?.valor !== 'number') {
      missing.push('valor');
    }
    if (!value?.categoria) {
      missing.push('categoria');
    }
    return missing;
  }

  private looksLikeMutation(input: string) {
    return /(gastei|adicione|adicionar|registre|registrar|crie|lance)/i.test(
      input,
    );
  }

  private createPayloadSchema() {
    return z.object({
      descricao: z.string(),
      valor: z.number(),
      categoria: z.enum(CATEGORIA_VALUES),
      data: z.string().optional(),
    });
  }

  private editPayloadSchema() {
    return z.object({
      id: z.number().int().positive(),
      descricao: z.string().optional(),
      valor: z.number().optional(),
      categoria: z.enum(CATEGORIA_VALUES).optional(),
      data: z.string().optional(),
    });
  }

  private rejectCommit(payload: unknown, reason: string): AgentRejectedResult {
    return {
      status: 'rejected',
      missing_fields: this.missingCreateFields(payload),
      reason,
    };
  }
}
