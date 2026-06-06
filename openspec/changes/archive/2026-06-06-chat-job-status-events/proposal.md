## Why

The chat UI currently receives coarse completion/failure updates, which hides the asynchronous pg-boss lifecycle from the user and makes audio/image jobs feel stalled. FinAI needs explicit job status events so the PWA can show upload, queueing, media extraction, AI processing, completion, and failure states without blocking the HTTP request.

## What Changes

- Extend the SSE contract with typed chat job status events: `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed`.
- Keep the HTTP request asynchronous: `POST /chat/message` still returns `202 Accepted` after saving the message and creating the pg-boss job.
- Emit `job_created` after the job is queued, `transcribing` when media extraction starts, `processing_ia` when Orchestrator/subagent inference starts, and `completed`/`failed` at terminal state.
- Update the client chat state machine so local messages progress from upload/pending to queued, transcribing, AI processing, completed, or failed.
- Add user-facing status copy and Lucide indicators consistent with the Apple-like design system and Action Blue interaction color.
- Add shared type coverage and server/client tests for the status lifecycle.

## Capabilities

### New Capabilities
- `chat-job-status-events`: Typed SSE lifecycle events for asynchronous chat jobs and the client state machine that renders them.

### Modified Capabilities
- `shared-contracts`: `SSEEvent` and chat message status contracts change from loose strings to explicit lifecycle values.

## Impact

- **Server chat pipeline**: `ChatService`, `ChatWorkerService`, `StreamService`, shared SSE event emission points, and tests.
- **Shared types**: add discriminated event/status types for chat job lifecycle.
- **Client chat UI**: `useChat`, `useSSE`, `ChatBubble`, `StatusIndicator`, and tests.
- **No infrastructure change**: continue using pg-boss/PostgreSQL only; no Redis or token streaming.
