import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import type { ChatAttachment } from '../chat/chat.service';
import { AgentFactoryService } from './agent-factory.service';
import {
  ImageExtraction,
  imageExtractionSchema,
} from './media-extraction.types';

@Injectable()
export class ImageExtractorAgentService {
  constructor(
    private readonly agentFactory: AgentFactoryService = new AgentFactoryService(),
  ) {}

  async invoke(
    attachment: ChatAttachment,
    model: ChatOpenAI,
    userText = '',
  ): Promise<ImageExtraction> {
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
      responseFormat: structured ? imageExtractionSchema : undefined,
      systemPrompt:
        'Leia imagem ou comprovante financeiro. Extraia campos compactos em portugues.',
    });

    return agent.invoke({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userText || 'Extraia os dados financeiros da imagem.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${attachment.mime_type};base64,${attachment.data}`,
              },
            },
          ],
        },
      ],
    } as never);
  }

  private extractStructured(result: unknown): ImageExtraction {
    const structured = (result as { structuredResponse?: unknown })
      .structuredResponse;
    const parsed = imageExtractionSchema.safeParse(structured);
    if (parsed.success) {
      return parsed.data;
    }

    return {
      description: this.extractText(result),
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
