export enum CategoriaEnum {
  Alimentacao = "Alimentação",
  Transporte = "Transporte",
  Lazer = "Lazer",
  Saude = "Saúde",
  Outros = "Outros",
}

export interface LancamentoDTO {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: CategoriaEnum;
  usuario_id: number;
  created_at: string;
}

export interface CreateLancamentoDTO {
  descricao: string;
  valor: number;
  categoria: CategoriaEnum;
  data?: string;
}

export type UpdateLancamentoDTO = Partial<CreateLancamentoDTO>;

export interface LancamentoFilterDTO {
  dataInicio?: string;
  dataFim?: string;
  categoria?: CategoriaEnum;
}
