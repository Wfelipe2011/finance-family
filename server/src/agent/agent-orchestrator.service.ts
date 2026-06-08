import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { summarizationMiddleware } from 'langchain';
import { z } from 'zod';
import type { AgentDraftResult, AgentResult } from '@fin-ai/shared/lancamento';
import { IAConfigService } from '../config/ia-config.service';
import type { ChatJobPayload } from '../chat/chat.service';
import { AgentFactoryService } from './agent-factory.service';
import { AgentMemoryService } from './agent-memory.service';
import { AudioExtractorAgentService } from './audio-extractor-agent.service';
import { ImageExtractorAgentService } from './image-extractor-agent.service';

export interface AgentProcessLifecycle {
  onTranscribing?: () => Promise<void>;
  onProcessingIa?: () => Promise<void>;
  onToken?: (delta: string) => Promise<void> | void;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly latestDraftByUser = new Map<number, AgentDraftResult>();

  constructor(
    private readonly iaConfigService: IAConfigService,
    private readonly memoryService: AgentMemoryService,
    private readonly audioExtractor: AudioExtractorAgentService,
    private readonly imageExtractor: ImageExtractorAgentService,
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) { }

  async process(
    payload: ChatJobPayload,
    lifecycle?: AgentProcessLifecycle,
  ) {
    const model = await this.modelFor(payload.usuarioId);
    if (payload.attachments?.length) {
      await lifecycle?.onTranscribing?.();
    }
    const input = await this.toMemorySafeInput(payload, model);

    const agent = this.agentFactory.createMemoryfulAgent({
      model,
      tools: [],
      checkpointer: this.memoryService.checkpointer,
      middleware: [this.createSummarizationMiddleware(model)],
      systemPrompt:
        `Você é Jarvis, assistente pessoal familiar.
        Responda de forma útil, curta e prática.`,
    });

    await lifecycle?.onProcessingIa?.();

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: input }] } as never,
    );

    const message = this.extractText(result);
    return message;
  }

  createSummarizationMiddleware(model: ChatOpenAI) {
    return summarizationMiddleware({
      model,
      trigger: { tokens: 4000 }
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
}
