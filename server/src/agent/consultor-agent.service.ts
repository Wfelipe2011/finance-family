import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { AgentFactoryService } from './agent-factory.service';
import { AgentToolsService } from './agent-tools.service';

@Injectable()
export class ConsultorAgentService {
  constructor(
    private readonly toolsService: AgentToolsService,
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async invoke(input: string, model: ChatOpenAI, usuarioId: number) {
    const agent = this.agentFactory.createStatelessAgent({
      model,
      tools: [this.toolsService.consultarGastosTool()],
      systemPrompt:
        'Voce le gastos do usuario. Use consultar_gastos_db para buscar dados. Para medias, some os valores retornados e divida pelo periodo ou quantidade pedida. Responda curto em portugues.',
    });

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: input }] },
      { context: { usuario_id: usuarioId } } as never,
    );
    return this.extractText(result);
  }

  private extractText(result: unknown) {
    const messages =
      (result as { messages?: Array<{ content?: unknown }> }).messages ?? [];
    const last = messages.at(-1)?.content;
    return typeof last === 'string' ? last : JSON.stringify(last ?? result);
  }
}
