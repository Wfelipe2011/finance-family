import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import type { ChatAttachment } from '../chat/chat.service';
import { AgentFactoryService } from './agent-factory.service';
import {
  AudioExtraction,
  audioExtractionSchema,
} from './media-extraction.types';

@Injectable()
export class AudioExtractorAgentService {
  constructor(
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async invoke(
    attachment: ChatAttachment,
    model: ChatOpenAI,
    userText = '',
  ): Promise<AudioExtraction> {
    try {
      return this.extractStructured(
        await this.invokeAgent(attachment, model, userText, true),
      );
    } catch (error) {
      if (!this.isStructuredMultimodalUnsupported(error)) {
        throw error;
      }
      return this.extractStructured(
        await this.invokeAgent(attachment, model, userText, false),
      );
    }
  }

  private async invokeAgent(
    attachment: ChatAttachment,
    model: ChatOpenAI,
    userText: string,
    structured: boolean,
  ) {
    const agent = this.agentFactory.createStatelessAgent({
      model,
      tools: [],
      responseFormat: structured ? audioExtractionSchema : undefined,
      systemPrompt:
        'Transcreva audio wav e extraia intencao financeira. Retorne dados compactos em portugues.',
    });

    return agent.invoke({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userText || 'Transcreva e extraia os dados financeiros.',
            },
            {
              type: 'input_audio',
              input_audio: { data: attachment.data, format: 'wav' },
            },
          ],
        },
      ],
    } as never);
  }

  private extractStructured(result: unknown): AudioExtraction {
    const structured = (result as { structuredResponse?: unknown })
      .structuredResponse;
    const parsed = audioExtractionSchema.safeParse(structured);
    if (parsed.success) {
      return parsed.data;
    }

    return {
      transcript: this.extractText(result),
      intent: '',
      confidence: 0,
    };
  }

  private extractText(result: unknown) {
    const messages =
      (result as { messages?: Array<{ content?: unknown }> }).messages ?? [];
    const last = messages.at(-1)?.content;
    return typeof last === 'string' ? last : JSON.stringify(last ?? result);
  }

  private isStructuredMultimodalUnsupported(error: unknown) {
    return /multimodal tool-calling|tool-calling requests are not supported/i.test(
      String((error as { message?: unknown })?.message ?? error),
    );
  }
}
