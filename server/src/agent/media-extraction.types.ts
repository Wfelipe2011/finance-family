import { z } from 'zod';
import { CATEGORIA_VALUES } from '../lancamentos/categoria.values';

export const audioExtractionSchema = z.object({
  transcript: z.string().default(''),
  intent: z.string().default(''),
  expense: z
    .object({
      descricao: z.string().optional(),
      valor: z.number().optional(),
      categoria: z.enum(CATEGORIA_VALUES).optional(),
      data: z.string().optional(),
    })
    .optional(),
  confidence: z.number().min(0).max(1).default(0),
});

export const imageExtractionSchema = z.object({
  description: z.string().default(''),
  merchant: z.string().optional(),
  total: z.number().optional(),
  date: z.string().optional(),
  category: z.enum(CATEGORIA_VALUES).optional(),
  confidence: z.number().min(0).max(1).default(0),
});

export type AudioExtraction = z.infer<typeof audioExtractionSchema>;
export type ImageExtraction = z.infer<typeof imageExtractionSchema>;
