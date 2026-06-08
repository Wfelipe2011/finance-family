## MODIFIED Requirements

### Requirement: Chat job lifecycle events emitted
The system SHALL emit typed group SSE lifecycle events for Jarvis jobs using statuses `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed`.

#### Scenario: Text Jarvis job lifecycle
- **WHEN** a Jarvis-invoked text message is accepted and processed successfully
- **THEN** the group stream receives `job_created`, `processing_ia`, and `completed` events in order

#### Scenario: Media Jarvis job lifecycle
- **WHEN** a Jarvis-invoked chat job with audio or image media is accepted and processed successfully
- **THEN** the group stream receives `job_created`, `transcribing`, `processing_ia`, and `completed` events in order

#### Scenario: Failed Jarvis job lifecycle
- **WHEN** a Jarvis job reaches terminal failure after retries
- **THEN** the group stream receives a `failed` event with a user-safe message

### Requirement: Client updates one local message per job
The system SHALL update the submitted group message as lifecycle events arrive instead of appending a separate progress message for each status.

#### Scenario: Progress events update triggering message
- **WHEN** the client receives `job_created`, `transcribing`, or `processing_ia` for a Jarvis job
- **THEN** the matching triggering group message displays the corresponding status indicator and copy
- **AND** no duplicate progress message is appended

#### Scenario: Completion finalizes Jarvis response
- **WHEN** the client receives `completed`
- **THEN** the triggering human message is marked completed
- **AND** the streamed Jarvis message is finalized once

## ADDED Requirements

### Requirement: Human group messages stream without job status
The system SHALL emit new-message events for human messages that do not create Jarvis jobs.

#### Scenario: Human-only message broadcast
- **WHEN** a member sends a message without invoking Jarvis
- **THEN** every connected group member receives a new-message event
- **AND** no `job_created`, `processing_ia`, or `completed` job lifecycle is emitted for that message

### Requirement: Jarvis responses stream progressively
The system SHALL stream Jarvis response content progressively to the group while the model is generating.

#### Scenario: Jarvis token delta event
- **WHEN** Jarvis starts generating a response
- **THEN** the group stream receives an assistant message start event
- **AND** subsequent delta events append generated content to that Jarvis message

#### Scenario: Reload after streaming shows complete message
- **WHEN** a user reloads the chat after a streamed Jarvis response completed
- **THEN** the persisted chat history includes the complete Jarvis message
