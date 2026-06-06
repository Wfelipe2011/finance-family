export enum CategoriaEnum {
  Alimentacao = "Alimentação",
  Transporte = "Transporte",
  Moradia = "Moradia",
  Diversos = "Diversos",
  Pet = "Pet",
  Saude = "Saude",
  Imposto = "Imposto",
  Receita = "Receita",
}

export const CATEGORIA_VALUES = [
  CategoriaEnum.Alimentacao,
  CategoriaEnum.Transporte,
  CategoriaEnum.Moradia,
  CategoriaEnum.Diversos,
  CategoriaEnum.Pet,
  CategoriaEnum.Saude,
  CategoriaEnum.Imposto,
  CategoriaEnum.Receita,
] as const;

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

export type AgentMutationOperation = "create" | "edit" | "delete";

export type AgentResultStatus = "draft" | "commit" | "read" | "rejected";

export interface AgentDraftResult<TPayload = unknown> {
  status: "draft";
  operation: AgentMutationOperation;
  payload: TPayload;
  message?: string;
}

export interface AgentCommitResult<TPayload = unknown> {
  status: "commit";
  operation: AgentMutationOperation;
  payload: TPayload;
  message?: string;
}

export interface AgentReadResult<TData = unknown> {
  status: "read";
  data: TData;
  message?: string;
}

export interface AgentRejectedResult {
  status: "rejected";
  missing_fields: string[];
  reason: string;
}

export type AgentResult<TPayload = unknown, TData = unknown> =
  | AgentDraftResult<TPayload>
  | AgentCommitResult<TPayload>
  | AgentReadResult<TData>
  | AgentRejectedResult;
