import type { CategoriaEnum as SharedCategoriaEnum } from '@fin-ai/shared/lancamento';

export const CATEGORIA_VALUES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Diversos',
  'Pet',
  'Saude',
  'Imposto',
  'Receita',
] as const satisfies readonly `${SharedCategoriaEnum}`[];

export type CategoriaValue = `${SharedCategoriaEnum}`;

export function normalizeCategoria(value: string): CategoriaValue {
  const legacy: Record<string, CategoriaValue> = {
    Lazer: 'Diversos',
    Outros: 'Diversos',
    Saúde: 'Saude',
  };
  const normalized = legacy[value] ?? value;
  return normalized;
}
