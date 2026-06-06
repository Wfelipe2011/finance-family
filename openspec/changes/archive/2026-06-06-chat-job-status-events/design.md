## Context

The chat path is already asynchronous and backed by pg-boss. The server currently persists chat messages and emits SSE terminal events, but the client cannot distinguish queueing, media extraction, and AI processing. This creates weak feedback for longer audio/image jobs.

The client already has local optimistic messages, `useSSE`, `StatusIndicator`, and shared `SSEEvent` typing. This change tightens that contract without adding infrastructure.

## Goals / Non-Goals

**Goals:**
- Expose the pg-boss lifecycle through typed SSE events.
- Keep `POST /chat/message` returning `202 Accepted`.
- Let the client render distinct upload, queued, transcribing, AI processing, completed, and failed states.
- Keep status copy concise and consistent with DESIGN.md.

**Non-Goals:**
- No token-by-token model streaming.
- No WebSocket transport.
- No Redis or separate pub/sub service.
- No persistence of every transient SSE status as a separate assistant message.

## Decisions

### D1: Use typed status strings in the existing SSE channel

**Choice**: Extend the existing `/chat/stream/:userId` SSE payload with explicit statuses: `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed`.

**Rationale**: This fits the current NestJS SSE/RxJS path and avoids transport churn.

**Alternative considered**: Add separate SSE event names. Rejected for MVP because the client already parses a single JSON payload and typed `status` is enough.

### D2: Emit progress from worker boundaries

**Choice**: The worker emits:
- `job_created` immediately after queue creation or as the first worker-observed event.
- `transcribing` when media extraction begins.
- `processing_ia` before invoking the Orchestrator.
- `completed` after assistant response persistence.
- `failed` only when the job reaches terminal failure.

**Rationale**: These boundaries map to real code stages and do not require model internals.

### D3: Keep local upload state client-only

**Choice**: "Enviando para o servidor..." remains local UI state before the HTTP `202`. Server events begin at `job_created`.

**Rationale**: The server cannot emit SSE before it receives and accepts the upload.

### D4: Update shared contracts first

**Choice**: The shared `SSEEvent` type becomes a discriminated contract used by server and client tests.

**Rationale**: Loose strings let UI and server drift.

## Risks / Trade-offs

- **[Risk] SSE clients may miss early events during reconnect** -> Mitigation: local optimistic state remains valid; terminal events still drive final UI.
- **[Risk] More statuses complicate message mapping** -> Mitigation: keep one local user message per submitted job and update its status instead of appending progress bubbles.
- **[Risk] Media-free text jobs have no transcribing stage** -> Mitigation: skip `transcribing` when no attachment exists and move directly to `processing_ia`.

## Migration Plan

1. Update shared chat/SSE types.
2. Add server event emissions at queue/worker boundaries.
3. Update client `useChat` state mapping and status indicator copy/icons.
4. Add server/client tests for text and media job status flows.
5. Rollback by treating unknown statuses as `processing` and preserving `completed`/`failed`.

## Open Questions

- Should `job_created` be emitted synchronously from `ChatService.submit` after queueing, or only from the worker when it starts observing the job?
