import { z } from 'zod';
import { CATEGORIA_VALUES } from '../lancamentos/categoria.values';

export const durableMemorySchema = z.object({
  tipo: z.enum([
    'preferencia_categoria_comerciante',
    'fato_financeiro_recorrente',
    'preferencia_comunicacao',
    'contexto_usuario',
  ]),
  chave: z.string().min(3).max(80),
  conteudo: z.string().min(3).max(500),
  origem: z.enum(['usuario_declarou', 'resultado_ferramenta']),
  confianca: z.literal('alta'),
  comerciante: z.string().max(80).optional(),
  categoria: z.enum(CATEGORIA_VALUES).optional(),
});

export const memorySearchSchema = z.object({
  consulta: z.string().max(160).optional(),
  tipo: durableMemorySchema.shape.tipo.optional(),
  limite: z.number().int().min(1).max(10).optional(),
});

export type DurableMemoryInput = z.infer<typeof durableMemorySchema>;
