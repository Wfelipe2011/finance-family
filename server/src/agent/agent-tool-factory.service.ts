import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import type { z } from 'zod';

export type ToolContext = {
  usuarioId: number;
  groupId?: number;
  messageId?: string;
};

@Injectable()
export class AgentToolFactoryService {
  createContextTool<TSchema extends z.ZodType>(options: {
    name: string;
    description: string;
    schema: TSchema;
    execute: (
      input: z.infer<TSchema>,
      context: ToolContext,
      config: unknown,
    ) => Promise<unknown>;
  }) {
    return tool(
      async (input, config) =>
        await options.execute(
          input as z.infer<TSchema>,
          this.getContext(config),
          config,
        ),
      {
        name: options.name,
        description: options.description,
        schema: options.schema,
      },
    );
  }

  getUsuarioId(config: unknown) {
    const context = (config as { context?: { usuario_id?: number } })?.context;
    if (!context?.usuario_id) {
      throw new Error('usuario_id missing from tool context');
    }
    return context.usuario_id;
  }

  getContext(config: unknown): ToolContext {
    const context = (config as {
      context?: {
        usuario_id?: number;
        group_id?: number;
        message_id?: string;
      };
    })?.context;
    if (!context?.usuario_id) {
      throw new Error('usuario_id missing from tool context');
    }
    return {
      usuarioId: context.usuario_id,
      groupId: context.group_id,
      messageId: context.message_id,
    };
  }
}
