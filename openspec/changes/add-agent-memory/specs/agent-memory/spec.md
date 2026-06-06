## ADDED Requirements

### Requirement: Orchestrator persists short-term memory per user
The system SHALL persist Orchestrator short-term memory in PostgreSQL using a LangGraph `PostgresSaver` checkpointer. The Orchestrator SHALL use a deterministic `thread_id` scoped to the authenticated `usuario_id`.

#### Scenario: User memory persists across jobs
- **WHEN** user 1 sends a chat message that creates Orchestrator context
- **AND** a later pg-boss job processes another message for user 1
- **THEN** the Orchestrator is invoked with the same user-scoped `thread_id`
- **AND** the previous Orchestrator state is available through the checkpointer

#### Scenario: User memory is isolated
- **WHEN** user 1 and user 2 send chat messages
- **THEN** the Orchestrator uses different `thread_id` values for each user
- **AND** user 1's checkpoint state is not available to user 2

### Requirement: Orchestrator summarizes short-term memory
The system SHALL configure Orchestrator short-term memory with summarization middleware so older conversation context is compacted before the local LLM exceeds its 4k token budget.

#### Scenario: Long conversation is summarized
- **WHEN** a user's Orchestrator message history exceeds the configured summarization token trigger
- **THEN** the Orchestrator compacts older context into a summary
- **AND** keeps only the configured number of recent messages alongside the summary

#### Scenario: Recent context remains available
- **WHEN** summarization runs for a user's Orchestrator memory
- **THEN** the latest user-assistant turns remain available to the Orchestrator without being replaced by the summary

### Requirement: Long-term memory stores durable user facts
The system SHALL provide a PostgreSQL-backed long-term memory store for durable user facts and finance preferences. Long-term memory entries SHALL be scoped to the authenticated `usuario_id`.

#### Scenario: User-stated preference is saved
- **WHEN** a user explicitly states a durable finance preference such as a default category rule for a merchant
- **THEN** the system stores that fact in the user's long-term memory namespace
- **AND** future Orchestrator invocations for that user can read the fact

#### Scenario: Long-term memory does not cross users
- **WHEN** user 1 has a saved long-term memory entry
- **THEN** user 2 cannot read or use that entry during agent execution

### Requirement: Media extraction runs before memoryful orchestration
The system SHALL process audio and image attachments through stateless media extractor agents before invoking the memoryful Orchestrator. The Orchestrator SHALL receive only compact text or structured extraction summaries for media inputs.

#### Scenario: Audio attachment is extracted before routing
- **WHEN** a chat job contains an audio/wav attachment
- **THEN** a stateless audio extractor receives the raw audio payload
- **AND** the Orchestrator receives the transcript and extracted structured summary, not the raw audio payload

#### Scenario: Image attachment is extracted before routing
- **WHEN** a chat job contains an image attachment
- **THEN** a stateless image extractor receives the raw image payload
- **AND** the Orchestrator receives receipt or image extraction fields, not the raw image payload

#### Scenario: Mixed text and media are merged safely
- **WHEN** a chat job contains both user text and a file attachment
- **THEN** the Orchestrator receives the user text plus compact extraction results
- **AND** the media bytes are not included in the Orchestrator message content

### Requirement: Raw media is excluded from memory
The system SHALL NOT persist raw audio bytes, raw image bytes, base64 strings, or data URLs in short-term memory or long-term memory.

#### Scenario: Base64 is not written to short-term memory
- **WHEN** an audio or image chat job is processed
- **THEN** the Orchestrator checkpoint state contains no raw attachment `data`, base64 data URL, or file bytes

#### Scenario: Base64 is not written to long-term memory
- **WHEN** the agent writes durable memory after a media-based chat job
- **THEN** the long-term memory value contains only compact user facts or extracted fields
- **AND** it does not contain raw attachment `data`, base64 data URL, or file bytes

### Requirement: Specialist and media agents remain stateless
The system SHALL ensure Consultor, Operador, AudioExtractor, and ImageExtractor agents are invoked without checkpointers, long-term memory stores, or historical conversation turns.

#### Scenario: Operador has no memory
- **WHEN** the Orchestrator calls the Operador for a create or edit command
- **THEN** the Operador receives only the routed current command and authenticated user context
- **AND** it receives no checkpointer, no long-term memory store, and no prior chat messages

#### Scenario: Consultor has no memory
- **WHEN** the Orchestrator calls the Consultor for a read/query command
- **THEN** the Consultor receives only the routed current question and authenticated user context
- **AND** it receives no checkpointer, no long-term memory store, and no prior chat messages

#### Scenario: Media extractors have no memory
- **WHEN** an audio or image extractor processes a file attachment
- **THEN** the extractor receives only the current media payload and optional current user text
- **AND** it receives no checkpointer, no long-term memory store, and no prior chat messages
