import type { CategoriaEnum as SharedCategoriaEnum } from '@fin-ai/shared/lancamento';

export const CATEGORIA_VALUES = [
  'Alimentação',
  'Transporte',
  'Lazer',
  'Saúde',
  'Outros',
] as const;

export type CategoriaValue = `${SharedCategoriaEnum}`;
