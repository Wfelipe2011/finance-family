import { Injectable } from '@nestjs/common';
import { tool } from '@langchain/core/tools';
import type { z } from 'zod';

export type ToolContext = {
  usuarioId: number;
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
    ) => Promise<unknown> | unknown;
  }) {
    return tool(
      async (input, config) =>
        options.execute(
          input as z.infer<TSchema>,
          { usuarioId: this.getUsuarioId(config) },
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
}
