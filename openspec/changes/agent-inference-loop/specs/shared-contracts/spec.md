## ADDED Requirements

### Requirement: Agent result contracts defined
The system SHALL define shared TypeScript types for agent results using statuses `draft`, `commit`, `read`, and `rejected`.

#### Scenario: Draft result structure
- **WHEN** a subagent parses a mutation before confirmation
- **THEN** the result matches `AgentDraftResult` with `status: "draft"`, an operation identifier, and the payload that would be committed

#### Scenario: Rejected result structure
- **WHEN** a subagent cannot safely execute a request
- **THEN** the result matches `AgentRejectedResult` with `status: "rejected"`, `missing_fields`, and a reason

## MODIFIED Requirements

### Requirement: Lancamento DTOs defined
The system SHALL define shared TypeScript types for financial entries: `LancamentoDTO { id: number; descricao: string; valor: number; data: string; categoria: CategoriaEnum; usuario_id: number; created_at: string }`, `CreateLancamentoDTO { descricao: string; valor: number; categoria: CategoriaEnum; data?: string }`, `UpdateLancamentoDTO partial of CreateLancamentoDTO`, `LancamentoFilterDTO { dataInicio?: string; dataFim?: string; categoria?: CategoriaEnum }`. `CategoriaEnum` SHALL contain exactly: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.

#### Scenario: Create lancamento payload
- **WHEN** creating a new lancamento
- **THEN** the request body matches `CreateLancamentoDTO` with required `descricao`, `valor`, `categoria` and optional `data`

#### Scenario: Categoria contract uses canonical set
- **WHEN** client, server, or agent code references `CategoriaEnum`
- **THEN** only `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, and `Receita` are valid values
