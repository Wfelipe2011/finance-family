import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import type { CreateLancamentoDto } from '../lancamentos/dto/create-lancamento.dto';
import { LancamentosService } from '../lancamentos/lancamentos.service';
import { AgentFactoryService } from './agent-factory.service';
import { AgentToolsService } from './agent-tools.service';
import { parseCreateExpense } from './expense-parser';

@Injectable()
export class OperadorAgentService {
  constructor(
    private readonly toolsService: AgentToolsService,
    private readonly lancamentosService: LancamentosService,
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async invoke(input: unknown, model: ChatOpenAI, usuarioId: number) {
    const agent = this.agentFactory.createStatelessAgent({
      model,
      tools: [
        this.toolsService.adicionarGastoTool(),
        this.toolsService.editarGastoTool(),
        this.toolsService.apagarGastoTool(),
      ],
      responseFormat: z.object({ message: z.string() }),
      systemPrompt:
        'Voce cria, edita ou apaga gastos. Nao use historico. Use adicionar_gasto_db, editar_gasto_db ou apagar_gasto_db conforme o comando materializado. Nao adivinhe ids. Responda uma confirmacao curta.',
    });

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: input }] } as never,
      { context: { usuario_id: usuarioId } } as never,
    );
    const message = this.extractText(result);
    const fallback = parseCreateExpense(input);
    if (fallback && !(await this.exists(usuarioId, fallback))) {
      const row = await this.lancamentosService.create(usuarioId, fallback);
      return message || `Gasto ${row.descricao} cadastrado.`;
    }
    return message;
  }

  private extractText(result: unknown) {
    const structured = (result as { structuredResponse?: { message?: string } })
      .structuredResponse;
    if (structured?.message) {
      return structured.message;
    }
    const messages =
      (result as { messages?: Array<{ content?: unknown }> }).messages ?? [];
    const last = messages.at(-1)?.content;
    return typeof last === 'string' ? last : JSON.stringify(last ?? result);
  }

  private async exists(usuarioId: number, dto: CreateLancamentoDto) {
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
