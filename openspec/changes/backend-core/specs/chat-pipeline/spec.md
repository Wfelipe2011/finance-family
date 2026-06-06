## ADDED Requirements

### Requirement: Chat message submission
The system SHALL accept chat messages via `POST /chat/message` as `multipart/form-data` with optional fields: `content` (text), `file` (audio/wav or image). The endpoint SHALL be async — returning `202 Accepted` immediately.

#### Scenario: Text message submitted
- **WHEN** user sends `POST /chat/message` with `content: "Quanto gastei no Carrefour?"`
- **THEN** the response is `202 Accepted` with `{ jobId: string, status: 'pending' }`

#### Scenario: Audio file submitted
- **WHEN** user sends `POST /chat/message` with a `.wav` file attachment
- **THEN** the response is `202 Accepted` and the job is queued for processing

#### Scenario: Image file submitted
- **WHEN** user sends `POST /chat/message` with an image attachment (comprovante)
- **THEN** the response is `202 Accepted` and the job is queued for processing

#### Scenario: Invalid file type rejected
- **WHEN** user uploads a file that is not `audio/wav` or an image mime type
- **THEN** the response is `400 Bad Request`

### Requirement: Chat message persistence
The system SHALL persist each chat message in the database with fields: `id`, `usuario_id`, `content`, `role` (user/assistant), `status` (pending/processing/completed/failed), `created_at`.

#### Scenario: Message saved with pending status
- **WHEN** a chat message is submitted
- **THEN** a record exists in the database with `status: 'pending'`

#### Scenario: Message status updated to processing
- **WHEN** the pg-boss worker picks up the job
- **THEN** the message status is updated to `'processing'`

#### Scenario: Short-term memory limited to last 5 messages
- **WHEN** composing context for the LLM
- **THEN** only the last 5 user-assistant message pairs are included (max 10 messages)
- **AND** older messages are NOT included in the context

### Requirement: pg-boss job queuing
The system SHALL create a pg-boss job in the `chat-jobs` queue when a chat message is received, with the message ID and file metadata as job payload.

#### Scenario: Job created on message submission
- **WHEN** `POST /chat/message` returns `202`
- **THEN** a job exists in the `chat-jobs` queue with `retryLimit: 5`

### Requirement: pg-boss worker processes jobs
The system SHALL register a worker for `chat-jobs` that: reads the message, invokes the LangChain agent pipeline, updates the message status, and emits the result via SSE.

#### Scenario: Worker processes text message
- **WHEN** the worker processes a text message job
- **THEN** the LangChain agent is invoked with the message content
- **AND** the result is emitted via SSE with `{ status: 'completed', message: '<response>' }`

#### Scenario: Worker retries on failure
- **WHEN** the LLM is unreachable (connection error)
- **THEN** pg-boss retries the job up to 5 times with exponential backoff

### Requirement: SSE streaming endpoint
The system SHALL provide `GET /chat/stream/:userId` as an SSE endpoint returning a persistent event stream. The client SHALL filter events by userId.

#### Scenario: Client receives chat result
- **WHEN** a worker completes a job for userId=1
- **THEN** the SSE connection for `/chat/stream/1` receives `{ status: 'completed', message: '...' }`

#### Scenario: Client receives error notification
- **WHEN** a job fails after all retries for userId=1
- **THEN** the SSE connection for `/chat/stream/1` receives `{ status: 'failed', message: 'Processing failed' }`

#### Scenario: SSE connection cleanup on disconnect
- **WHEN** the client closes the SSE connection
- **THEN** the Observable is unsubscribed and resources are released