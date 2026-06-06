## 1. Shared Event Contracts

- [ ] 1.1 Replace loose chat status strings with explicit `ChatMessageStatus` lifecycle values
- [ ] 1.2 Update `SSEEvent` shared type with typed status, optional `jobId`, message, and data
- [ ] 1.3 Update endpoint documentation types for `/chat/message` and `/chat/stream/:userId`

## 2. Server Lifecycle Emission

- [ ] 2.1 Emit `job_created` after a chat job is accepted into pg-boss
- [ ] 2.2 Emit `transcribing` when a worker begins audio or image extraction
- [ ] 2.3 Emit `processing_ia` immediately before Orchestrator inference begins
- [ ] 2.4 Preserve `completed` after assistant response persistence
- [ ] 2.5 Preserve `failed` only for terminal job failure with user-safe message
- [ ] 2.6 Include the submitted job/message identifier in lifecycle events where available

## 3. Client State Machine

- [ ] 3.1 Update `useSSE` parsing to accept the typed lifecycle event contract
- [ ] 3.2 Update `useChat` to map lifecycle events onto the matching local user message
- [ ] 3.3 Keep upload-in-progress as a client-local state before HTTP `202`
- [ ] 3.4 Append assistant response only once on `completed`
- [ ] 3.5 Handle `failed` without appending duplicate progress bubbles

## 4. Status UI

- [ ] 4.1 Update `StatusIndicator` icons/copy for upload, queued, transcribing, AI processing, completed, and failed
- [ ] 4.2 Use Action Blue only for active `processing_ia` state
- [ ] 4.3 Use muted ink styling for passive states
- [ ] 4.4 Ensure status text fits inside chat bubbles on mobile

## 5. Tests and Validation

- [ ] 5.1 Add shared type tests or compile coverage for lifecycle status values
- [ ] 5.2 Add server tests for text job event order
- [ ] 5.3 Add server tests for media job event order
- [ ] 5.4 Add client tests for lifecycle event mapping and assistant append behavior
- [ ] 5.5 Run server unit/e2e tests with `nvm use`
- [ ] 5.6 Run client tests with `nvm use`
- [ ] 5.7 Run OpenSpec status for `chat-job-status-events`
