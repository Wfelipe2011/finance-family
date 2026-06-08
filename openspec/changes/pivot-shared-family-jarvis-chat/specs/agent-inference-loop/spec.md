## MODIFIED Requirements

### Requirement: Chat jobs carry cheap execution context
The system SHALL enrich queued Jarvis jobs with deterministic group metadata before dispatching to pg-boss, without running media extraction or LLM inference in the HTTP request path.

#### Scenario: Mentioned text message queues with group context
- **WHEN** an authenticated group member submits a text message containing `@Jarvis`
- **THEN** the queued job contains the message id, family group id, actor user id, raw text input, current date/time, day of week, timezone, configured location, and the group's Jarvis settings
- **AND** the HTTP response remains `202 Accepted`

#### Scenario: Human-only text message does not queue
- **WHEN** an authenticated group member submits a text message without `@Jarvis`
- **AND** the group does not have Jarvis always-on enabled
- **THEN** the system persists and streams the message without creating a Jarvis job

#### Scenario: Media upload does not transcribe before queueing
- **WHEN** an authenticated group member submits an audio or image attachment while invoking Jarvis
- **THEN** the HTTP request stores the attachment payload and creates a pg-boss job without invoking a media extractor or LLM

### Requirement: Worker performs stateless media enrichment before orchestration
The system SHALL run audio and image extraction inside the pg-boss worker for Jarvis-invoked media messages and pass only compact extracted text plus metadata to Jarvis.

#### Scenario: Audio job is enriched in worker
- **WHEN** a queued Jarvis job contains an audio/wav attachment
- **THEN** the worker invokes the stateless audio extractor before invoking Jarvis
- **AND** Jarvis receives a compact transcript or extraction summary, not raw audio bytes

#### Scenario: Image job is enriched in worker
- **WHEN** a queued Jarvis job contains an image attachment
- **THEN** the worker invokes the stateless image extractor before invoking Jarvis
- **AND** Jarvis receives a compact visual/receipt description, not raw image bytes

### Requirement: Orchestrator uses recent memory before asking again
The system SHALL require Jarvis to use group-scoped checkpointed conversation context before asking for information already provided in the same family group thread.

#### Scenario: Group fact is recalled from recent context
- **WHEN** user A says "A viagem da família será em julho"
- **AND** user B later asks "@Jarvis quando é nossa viagem?"
- **THEN** Jarvis answers that the family trip is in July
- **AND** it does not say that no context is available

#### Scenario: Missing detail found in group context
- **WHEN** a finance draft is missing a field in the current turn
- **AND** the missing field is available in recent group conversation context
- **THEN** Jarvis uses that value instead of asking the group again

## REMOVED Requirements

### Requirement: Orchestrator owns the user-facing loop
**Reason**: The pivot removes Consultor and Operador subagents from the Jarvis inference path. Jarvis is now a single generic agent that loads skills and tools on demand.
**Migration**: Move user-facing response generation, finance result humanization, and missing-field questions into the Jarvis skill flow.

### Requirement: Operador drafts mutations before commit
**Reason**: The Operador subagent no longer owns drafts. Draft-before-commit remains required, but the draft is produced by Jarvis through the `finance_crud` skill.
**Migration**: Store pending finance drafts by group and allow any group member to confirm them.

### Requirement: Operador rejects unsafe mutation payloads
**Reason**: Unsafe mutation rejection is no longer returned by an Operador subagent.
**Migration**: Jarvis finance skills must ask concise follow-up questions when required fields are missing or ambiguous.

### Requirement: Consultor returns read-only results
**Reason**: The Consultor subagent is removed.
**Migration**: Use `finance_query` and `finance_report` skills with read-only tools for totals, lists, and reports.

### Requirement: Direct mutation fallback is disabled
**Reason**: The old fallback parser/subagent protocol is removed.
**Migration**: Keep direct writes disabled by requiring every finance mutation to pass through a group-visible Jarvis draft and confirmation.
