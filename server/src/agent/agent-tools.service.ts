import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CATEGORIA_VALUES } from '../lancamentos/categoria.values';
import { LancamentosService } from '../lancamentos/lancamentos.service';
import { AgentToolFactoryService } from './agent-tool-factory.service';

const categoriaSchema = z.enum(CATEGORIA_VALUES);

@Injectable()
export class AgentToolsService {
  constructor(
    private readonly lancamentosService: LancamentosService,
    private readonly toolFactory: AgentToolFactoryService = new AgentToolFactoryService(),
  ) {}

  consultarGastosTool() {
    return this.toolFactory.createContextTool({
      name: 'consultar_gastos_db',
      description:
        'Consulta gastos do usuario autenticado com filtros opcionais.',
      schema: z.object({
        dataInicio: z.string().optional(),
        dataFim: z.string().optional(),
        categoria: categoriaSchema.optional(),
      }),
      execute: async (input, context) => {
        const rows = context.groupId
          ? await this.lancamentosService.findAllForGroup(
              context.usuarioId,
              context.groupId,
              input,
            )
          : await this.lancamentosService.findAll(context.usuarioId, input);
        return JSON.stringify(rows);
      },
    });
  }

  adicionarGastoTool() {
    return this.toolFactory.createContextTool({
      name: 'adicionar_gasto_db',
      description: 'Adiciona uma despesa para o usuario autenticado.',
      schema: z.object({
        descricao: z.string(),
        valor: z.number(),
        categoria: categoriaSchema,
        data: z.string().optional(),
      }),
      execute: async (input, context) => {
        if (context.groupId) {
          return JSON.stringify(
            await this.lancamentosService.createDraft(
              context.groupId,
              context.usuarioId,
              context.messageId ?? null,
              {
                status: 'draft',
                operation: 'create',
                payload: input,
                message: `Vou cadastrar ${input.descricao} por R$ ${input.valor.toFixed(2)} em ${input.categoria}. Confirma?`,
              },
            ),
          );
        }
        const row = await this.lancamentosService.create(context.usuarioId, input);
        return JSON.stringify({ status: 'created', lancamento: row });
      },
    });
  }

  editarGastoTool() {
    return this.toolFactory.createContextTool({
      name: 'editar_gasto_db',
      description: 'Edita uma despesa do usuario autenticado.',
      schema: z.object({
        id: z.number(),
        descricao: z.string().optional(),
        valor: z.number().optional(),
        categoria: categoriaSchema.optional(),
        data: z.string().optional(),
      }),
      execute: async (input, context) => {
        const { id, ...dto } = input;
        if (context.groupId) {
          return JSON.stringify(
            await this.lancamentosService.createDraft(
              context.groupId,
              context.usuarioId,
              context.messageId ?? null,
              {
                status: 'draft',
                operation: 'edit',
                payload: { id, ...dto },
                message: `Vou editar o lancamento ${id}. Confirma?`,
              },
            ),
          );
        }
        const row = await this.lancamentosService.update(context.usuarioId, id, dto);
        return JSON.stringify({ status: 'updated', lancamento: row });
      },
    });
  }

  apagarGastoTool() {
    return this.toolFactory.createContextTool({
      name: 'apagar_gasto_db',
      description:
        'Apaga uma despesa do usuario autenticado quando foi engano ou duplicou.',
      schema: z.object({
        id: z.number().int().positive(),
      }),
      execute: async (input, context) => {
        if (context.groupId) {
          return JSON.stringify(
            await this.lancamentosService.createDraft(
              context.groupId,
              context.usuarioId,
              context.messageId ?? null,
              {
                status: 'draft',
                operation: 'delete',
                payload: { id: input.id },
                message: `Vou apagar o lancamento ${input.id}. Confirma?`,
              },
            ),
          );
        }
        await this.lancamentosService.delete(context.usuarioId, input.id);
        return JSON.stringify({ status: 'deleted', id: input.id });
      },
    });
  }
}
