## MODIFIED Requirements

### Requirement: Chat message types defined
The system SHALL define types for chat messages: `ChatMessage { id: string; content: string; role: 'user' | 'assistant'; status: ChatMessageStatus; created_at: string; attachments?: ChatAttachment[] }`, `ChatMessageStatus = 'pending' | 'job_created' | 'transcribing' | 'processing_ia' | 'completed' | 'failed'`, `ChatAttachment { type: 'audio' | 'image'; mime_type: string }`, `SSEEvent { status: ChatMessageStatus; message: string; jobId?: string; data?: unknown }`.

#### Scenario: SSE event structure
- **WHEN** the server pushes a chat result or lifecycle update via SSE
- **THEN** the event matches `SSEEvent` interface with typed `status`, `message`, optional `jobId`, and optional `data`

#### Scenario: Chat message status values are explicit
- **WHEN** client code renders chat message state
- **THEN** it uses only `pending`, `job_created`, `transcribing`, `processing_ia`, `completed`, or `failed`
