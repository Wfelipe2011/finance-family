import { Injectable } from '@nestjs/common';
import { createAgent } from 'langchain';

type AgentFactoryOptions = {
  model: unknown;
  tools?: unknown[];
  systemPrompt: string;
  responseFormat?: unknown;
};

type MemoryfulAgentFactoryOptions = AgentFactoryOptions & {
  checkpointer: unknown;
  middleware?: unknown[];
};

@Injectable()
export class AgentFactoryService {
  createMemoryfulAgent(options: MemoryfulAgentFactoryOptions) {
    return createAgent({
      model: options.model,
      tools: options.tools ?? [],
      systemPrompt: options.systemPrompt,
      responseFormat: options.responseFormat,
      checkpointer: options.checkpointer,
      middleware: options.middleware ?? [],
    } as never);
  }

  createStatelessAgent(options: AgentFactoryOptions) {
    return createAgent({
      model: options.model,
      tools: options.tools ?? [],
      systemPrompt: options.systemPrompt,
      responseFormat: options.responseFormat,
    } as never);
  }
}
