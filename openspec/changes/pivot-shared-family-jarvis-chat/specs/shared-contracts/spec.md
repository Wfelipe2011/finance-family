## MODIFIED Requirements

### Requirement: Lancamento DTOs defined
The system SHALL define shared TypeScript types for financial entries with family group ownership: `LancamentoDTO { id: number; descricao: string; valor: number; data: string; categoria: CategoriaEnum; group_id: number; created_by_usuario_id: number; requested_by_usuario_id?: number | null; created_at: string }`, `CreateLancamentoDTO { descricao: string; valor: number; categoria: CategoriaEnum; data?: string }`, `UpdateLancamentoDTO partial of CreateLancamentoDTO`, `LancamentoFilterDTO { dataInicio?: string; dataFim?: string; categoria?: CategoriaEnum }`. `CategoriaEnum` SHALL contain exactly: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.

#### Scenario: Create lancamento payload
- **WHEN** creating a new lancamento
- **THEN** the request body matches `CreateLancamentoDTO` with required `descricao`, `valor`, `categoria` and optional `data`
- **AND** the server derives `group_id` and author fields from authenticated group context, not from the request body

#### Scenario: Categoria contract uses canonical set
- **WHEN** client, server, or agent code references `CategoriaEnum`
- **THEN** only `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, and `Receita` are valid values

### Requirement: Chat message types defined
The system SHALL define types for group chat messages: `ChatMessage { id: string; groupId: number; content: string; author: ChatAuthor; status: ChatMessageStatus; created_at: string; mentions?: string[]; attachments?: ChatAttachment[] }`, `ChatAuthor { type: 'user' | 'agent'; id: string | number; displayName: string; avatarUrl?: string | null }`, `ChatMessageStatus = 'pending' | 'job_created' | 'transcribing' | 'processing_ia' | 'completed' | 'failed'`, `ChatAttachment { type: 'audio' | 'image'; mime_type: string; url?: string }`, `SSEEvent { type: string; status?: ChatMessageStatus; message?: string; messageId?: string; jobId?: string; groupId?: number; data?: unknown }`.

#### Scenario: SSE event structure
- **WHEN** the server pushes a chat result, lifecycle update, new message, or Jarvis content delta
- **THEN** the event matches `SSEEvent` with typed event kind, optional status, optional message id, optional job id, optional group id, and optional data

#### Scenario: Chat message status values are explicit
- **WHEN** client code renders chat message state
- **THEN** it uses only `pending`, `job_created`, `transcribing`, `processing_ia`, `completed`, or `failed`

### Requirement: Agent result contracts defined
The system SHALL define shared TypeScript types for Jarvis skill results using statuses `draft`, `commit`, `read`, and `rejected`.

#### Scenario: Draft result structure
- **WHEN** Jarvis parses a finance mutation before confirmation
- **THEN** the result matches a draft contract with `status: "draft"`, an operation identifier, the payload that would be committed, the group id, and a draft id

#### Scenario: Rejected result structure
- **WHEN** Jarvis cannot safely execute a request
- **THEN** the result matches a rejected contract with `status: "rejected"`, `missing_fields`, and a reason

### Requirement: API endpoint contracts documented
The system SHALL have an `endpoints.ts` file listing all API routes with HTTP method, path, request/response types as JSDoc comments, including family group chat, group stream, skills listing, and avatar upload endpoints.

#### Scenario: Endpoint contract reference
- **WHEN** a developer looks up an API endpoint
- **THEN** the file documents method, path, request type, response type, and status codes

## ADDED Requirements

### Requirement: Family group DTOs defined
The system SHALL define shared TypeScript types for family groups, group members, and group settings.

#### Scenario: Group settings contract includes Jarvis always-on
- **WHEN** client or server code reads group settings
- **THEN** the contract includes a boolean `jarvisAlwaysOn` field

### Requirement: Skill DTOs defined
The system SHALL define shared TypeScript types for Jarvis skills exposed by `GET /api/skills`.

#### Scenario: Skill response structure
- **WHEN** the client requests available skills
- **THEN** each skill matches a shared contract with id, display name, description, and enabled state

### Requirement: Avatar DTOs defined
The system SHALL define shared TypeScript types for avatar upload responses and avatar metadata.

#### Scenario: Avatar upload response structure
- **WHEN** the server accepts an avatar upload
- **THEN** the response includes the avatar id, public URL, MIME type, size, and owner metadata
