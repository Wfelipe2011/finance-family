## Purpose
Defines shared TypeScript API contracts consumed by the FinAI server and client.

## Requirements

### Requirement: Auth DTOs defined
The system SHALL define shared TypeScript types for authentication: `LoginRequest { email: string; password: string }`, `LoginResponse { access_token: string }`, `JwtPayload { sub: number; username: string }`, `UserProfile { userId: number; username: string }`.

#### Scenario: Login DTO structure
- **WHEN** a client sends a login request
- **THEN** the request body matches `LoginRequest` interface with `email` and `password` fields

#### Scenario: JWT payload structure
- **WHEN** a JWT token is decoded
- **THEN** the payload matches `JwtPayload` interface with `sub` (userId) and `username` fields

### Requirement: Lancamento DTOs defined
The system SHALL define shared TypeScript types for financial entries: `LancamentoDTO { id: number; descricao: string; valor: number; data: string; categoria: CategoriaEnum; usuario_id: number; created_at: string }`, `CreateLancamentoDTO { descricao: string; valor: number; categoria: CategoriaEnum; data?: string }`, `UpdateLancamentoDTO partial of CreateLancamentoDTO`, `LancamentoFilterDTO { dataInicio?: string; dataFim?: string; categoria?: CategoriaEnum }`. `CategoriaEnum` SHALL contain exactly: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.

#### Scenario: Create lancamento payload
- **WHEN** creating a new lancamento
- **THEN** the request body matches `CreateLancamentoDTO` with required `descricao`, `valor`, `categoria` and optional `data`

#### Scenario: Categoria contract uses canonical set
- **WHEN** client, server, or agent code references `CategoriaEnum`
- **THEN** only `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, and `Receita` are valid values

### Requirement: Chat message types defined
The system SHALL define types for chat messages: `ChatMessage { id: string; content: string; role: 'user' | 'assistant'; status: ChatMessageStatus; created_at: string; attachments?: ChatAttachment[] }`, `ChatMessageStatus = 'pending' | 'job_created' | 'transcribing' | 'processing_ia' | 'completed' | 'failed'`, `ChatAttachment { type: 'audio' | 'image'; mime_type: string }`, `SSEEvent { status: ChatMessageStatus; message: string; jobId?: string; data?: unknown }`.

#### Scenario: SSE event structure
- **WHEN** the server pushes a chat result or lifecycle update via SSE
- **THEN** the event matches `SSEEvent` interface with typed `status`, `message`, optional `jobId`, and optional `data`

#### Scenario: Chat message status values are explicit
- **WHEN** client code renders chat message state
- **THEN** it uses only `pending`, `job_created`, `transcribing`, `processing_ia`, `completed`, or `failed`

### Requirement: Agent result contracts defined
The system SHALL define shared TypeScript types for agent results using statuses `draft`, `commit`, `read`, and `rejected`.

#### Scenario: Draft result structure
- **WHEN** a subagent parses a mutation before confirmation
- **THEN** the result matches `AgentDraftResult` with `status: "draft"`, an operation identifier, and the payload that would be committed

#### Scenario: Rejected result structure
- **WHEN** a subagent cannot safely execute a request
- **THEN** the result matches `AgentRejectedResult` with `status: "rejected"`, `missing_fields`, and a reason

### Requirement: Config DTOs defined
The system SHALL define types for IA configuration: `IAConfig { baseUrl: string; apiKey: string }`, `UpdateIAConfigDTO { baseUrl?: string; apiKey?: string }`.

#### Scenario: IA config structure
- **WHEN** the user saves IA settings
- **THEN** the request body matches `IAConfig` with `baseUrl` and `apiKey` fields

### Requirement: API endpoint contracts documented
The system SHALL have a `endpoints.ts` file listing all API routes with HTTP method, path, request/response types as JSDoc comments.

#### Scenario: Endpoint contract reference
- **WHEN** a developer looks up an API endpoint
- **THEN** the file documents method, path, request type, response type, and status codes
