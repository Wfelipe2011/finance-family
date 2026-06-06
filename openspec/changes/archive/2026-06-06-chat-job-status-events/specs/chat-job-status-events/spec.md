## ADDED Requirements

### Requirement: Chat job lifecycle events emitted
The system SHALL emit typed SSE lifecycle events for chat jobs using statuses `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed`.

#### Scenario: Text job lifecycle
- **WHEN** a text-only chat job is accepted and processed successfully
- **THEN** the user stream receives `job_created`, `processing_ia`, and `completed` events in order

#### Scenario: Media job lifecycle
- **WHEN** a chat job with audio or image media is accepted and processed successfully
- **THEN** the user stream receives `job_created`, `transcribing`, `processing_ia`, and `completed` events in order

#### Scenario: Failed job lifecycle
- **WHEN** a chat job reaches terminal failure after retries
- **THEN** the user stream receives a `failed` event with a user-safe message

### Requirement: Upload state remains client-local
The system SHALL represent the upload-in-progress state on the client before `POST /chat/message` receives `202 Accepted`.

#### Scenario: Uploading before server acceptance
- **WHEN** the user submits a message or file and the HTTP request is still in flight
- **THEN** the client displays an upload/pending status without requiring an SSE event

### Requirement: Client updates one local message per job
The system SHALL update the submitted local user message as lifecycle events arrive instead of appending a separate progress message for each status.

#### Scenario: Progress events update pending bubble
- **WHEN** the client receives `job_created`, `transcribing`, or `processing_ia` for a submitted job
- **THEN** the matching local user message displays the corresponding status indicator and copy
- **AND** no assistant bubble is appended until `completed` or `failed`

#### Scenario: Completion appends assistant response
- **WHEN** the client receives `completed`
- **THEN** the matching user message is marked completed
- **AND** the assistant response is appended once

### Requirement: Status indicators follow design constraints
The system SHALL render chat status indicators with Lucide icons, 17px-compatible text rhythm, muted ink for passive states, and Action Blue only for active AI processing.

#### Scenario: Processing IA uses Action Blue
- **WHEN** a message is in `processing_ia`
- **THEN** the status indicator uses Action Blue and active processing motion

#### Scenario: Passive states use muted ink
- **WHEN** a message is uploading, queued, transcribing, completed, or failed
- **THEN** the status indicator avoids introducing a second accent color
