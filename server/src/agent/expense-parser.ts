import { CATEGORIA_VALUES, type CategoriaValue } from '../lancamentos/categoria.values';
import type { CreateLancamentoDto } from '../lancamentos/dto/create-lancamento.dto';

export function parseCreateExpense(input: unknown): CreateLancamentoDto | null {
  if (typeof input !== 'string') {
    return null;
  }

  const normalized = normalize(input);
  if (!/(gastei|gasto|despesa|adicione|adicionar|registre|registrar)/.test(normalized)) {
    return null;
  }

  const valueMatch =
    input.match(/R\$\s*(\d+(?:[.,]\d{1,2})?)/i) ??
    input.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)/i);
  const valor = valueMatch ? Number(valueMatch[1].replace(',', '.')) : NaN;
  if (!Number.isFinite(valor) || valor <= 0) {
    return null;
  }

  const categoria = CATEGORIA_VALUES.find((value) =>
    normalized.includes(normalize(value)),
  );
  if (!categoria) {
    return null;
  }

  const descricao = extractDescription(input);
  if (!descricao) {
    return null;
  }

  return {
    descricao,
    valor,
    categoria: categoria as CategoriaValue,
    data: input.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? today(),
  };
}

function extractDescription(input: string) {
  const explicit = input.match(/descri[cç][aã]o\s+(.+?)(?:,\s*(?:valor|categoria|data)|$)/i)?.[1];
  if (explicit) {
    return cleanDescription(explicit);
  }

  const location = input.match(/(?:no|na|em)\s+(.+?)(?:\s+na categoria|\s+categoria|,\s*categoria|,\s*data|$)/i)?.[1];
  return location ? cleanDescription(location) : null;
}

function cleanDescription(value: string) {
  return value
    .replace(/\s+(?:por\s+)?(?:R\$\s*)?\d+(?:[.,]\d{1,2})?\s*(?:reais|real)?/gi, '')
    .trim()
    .replace(/[.,;:]$/, '')
    .slice(0, 255);
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
