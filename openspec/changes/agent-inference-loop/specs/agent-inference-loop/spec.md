## ADDED Requirements

### Requirement: Chat jobs carry cheap execution context
The system SHALL enrich queued chat jobs with deterministic metadata before dispatching to pg-boss, without running media extraction or LLM inference in the HTTP request path.

#### Scenario: Text message queues with context
- **WHEN** an authenticated user submits a text chat message
- **THEN** the queued job contains the message id, authenticated user id, raw text input, current date/time, day of week, timezone, configured location, and optional spouse id when safely derivable from existing users
- **AND** the HTTP response remains `202 Accepted`

#### Scenario: Media upload does not transcribe before queueing
- **WHEN** an authenticated user submits an audio or image attachment
- **THEN** the HTTP request stores the attachment payload and creates a pg-boss job without invoking a media extractor or LLM

### Requirement: Worker performs stateless media enrichment before orchestration
The system SHALL run audio and image extraction inside the pg-boss worker and pass only compact extracted text plus metadata to the Orchestrator.

#### Scenario: Audio job is enriched in worker
- **WHEN** a queued chat job contains an audio/wav attachment
- **THEN** the worker invokes the stateless audio extractor before invoking the Orchestrator
- **AND** the Orchestrator receives a compact transcript or extraction summary, not raw audio bytes

#### Scenario: Image job is enriched in worker
- **WHEN** a queued chat job contains an image attachment
- **THEN** the worker invokes the stateless image extractor before invoking the Orchestrator
- **AND** the Orchestrator receives a compact visual/receipt description, not raw image bytes

### Requirement: Orchestrator owns the user-facing loop
The system SHALL make the Orchestrator the only agent that produces user-facing chat responses, while Consultor, Operador, and media extractors return structured technical results only.

#### Scenario: Subagent rejection becomes user question
- **WHEN** a subagent returns `status: "rejected"` with missing fields
- **THEN** the Orchestrator asks the user a concise PT-BR question for the missing information
- **AND** the subagent rejection JSON is not shown raw to the user

#### Scenario: Successful subagent result is humanized
- **WHEN** a subagent returns `status: "read"` or `status: "commit"`
- **THEN** the Orchestrator converts the technical JSON into a concise PT-BR assistant message

### Requirement: Orchestrator uses recent memory before asking again
The system SHALL require the Orchestrator to use recent checkpointed conversation context before asking the user for information already provided in the same thread.

#### Scenario: User name is recalled from recent context
- **WHEN** a user says "Me chamo Wilson"
- **AND** later in the same user-scoped thread asks "Qual meu nome?"
- **THEN** the Orchestrator answers that the user's name is Wilson
- **AND** it does not answer that no personal information is available

#### Scenario: Missing detail found in recent context
- **WHEN** a mutation draft is missing a field in the current turn
- **AND** the missing field is available in recent Orchestrator memory
- **THEN** the Orchestrator uses that value instead of asking the user again

### Requirement: Operador drafts mutations before commit
The system SHALL require the Operador subagent to return `status: "draft"` with the exact JSON payload it would commit before any create, edit, or delete mutation is persisted.

#### Scenario: Create expense returns draft first
- **WHEN** the user asks to create a gasto with enough required data
- **THEN** the Operador returns `status: "draft"` with `operation: "create"` and the candidate lancamento payload
- **AND** no lancamento is inserted before user confirmation

#### Scenario: Confirmed draft commits
- **WHEN** the Orchestrator has a current mutation draft
- **AND** the user explicitly confirms it
- **THEN** the Orchestrator routes a commit command to the Operador
- **AND** the Operador persists the mutation and returns `status: "commit"`

#### Scenario: Unconfirmed draft does not commit
- **WHEN** the Orchestrator presents a draft to the user
- **AND** the user does not explicitly confirm it
- **THEN** no create, edit, or delete tool is executed

### Requirement: Operador rejects unsafe mutation payloads
The system SHALL require the Operador to return `status: "rejected"` when required mutation data is missing or ambiguous.

#### Scenario: Required create fields missing
- **WHEN** a create gasto request cannot safely resolve `descricao`, `valor`, or `categoria`
- **THEN** the Operador returns `status: "rejected"` with `missing_fields` listing the unresolved fields
- **AND** no lancamento is inserted

#### Scenario: Date defaults from family context
- **WHEN** a create gasto request has `descricao`, `valor`, and `categoria` but no date
- **THEN** the Operador draft uses the `currentDate` from `familyContext` as the lancamento date

### Requirement: Consultor returns read-only results
The system SHALL require the Consultor subagent to return `status: "read"` for consultation/report requests and SHALL NOT expose mutation tools to the Consultor.

#### Scenario: Read query returns read status
- **WHEN** the user asks for totals, lists, or spending summaries
- **THEN** the Consultor returns `status: "read"` with the requested result data
- **AND** no mutation tool is available to that subagent

### Requirement: Direct mutation fallback is disabled
The system SHALL NOT create, edit, or delete lancamentos from Orchestrator fallback parsing outside the draft/commit subagent protocol.

#### Scenario: Parser identifies possible expense
- **WHEN** fallback parsing recognizes an expense-like message
- **THEN** the system produces or routes a draft for confirmation instead of writing directly to the database
