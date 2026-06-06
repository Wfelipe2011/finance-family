## 1. Dependencies and Memory Infrastructure

- [x] 1.1 Add explicit server dependency for `@langchain/langgraph-checkpoint-postgres`
- [x] 1.2 Add server configuration helper for the PostgreSQL connection string used by LangGraph memory
- [x] 1.3 Create an injectable agent memory service that initializes `PostgresSaver` and calls `setup()` on module startup
- [x] 1.4 Extend the agent memory service to initialize `PostgresStore` and call `setup()` on module startup
- [x] 1.5 Add helper methods for deterministic user-scoped thread IDs such as `finai:user:<usuarioId>`
- [x] 1.6 Add helper methods for user-scoped long-term memory namespaces

## 2. Orchestrator Short-Term Memory

- [x] 2.1 Update `AgentOrchestratorService` to receive the memory service instead of loading history with `chatService.recentTurns`
- [x] 2.2 Configure Orchestrator `createAgent` with `checkpointer: PostgresSaver`
- [x] 2.3 Invoke the Orchestrator with `configurable.thread_id` scoped to `usuarioId`
- [x] 2.4 Add `summarizationMiddleware` to the Orchestrator with conservative token trigger and keep settings for a 4k-token model
- [x] 2.5 Ensure Orchestrator invocation sends only the current memory-safe message, letting the checkpointer restore prior state
- [x] 2.6 Keep assistant completion persistence in `chat_messages` for UI history without using it as Orchestrator memory source

## 3. Long-Term Memory

- [x] 3.1 Define Zod schemas for durable user memories such as merchant category preferences, recurring finance facts, and user communication preferences
- [x] 3.2 Add Orchestrator tools or middleware hooks to read long-term memory from the authenticated user's namespace
- [x] 3.3 Add guarded write support for high-confidence user-stated or tool-confirmed long-term memories
- [x] 3.4 Ensure long-term memory reads and writes always use the authenticated `usuarioId`
- [x] 3.5 Prevent speculative facts from being saved unless the user stated them clearly or a tool result confirmed them

## 4. Stateless Media Extraction

- [x] 4.1 Add `AudioExtractorAgentService` that receives `.wav` payloads and returns transcript plus structured extraction
- [x] 4.2 Add `ImageExtractorAgentService` that receives image payloads and returns compact receipt/image extraction fields
- [x] 4.3 Ensure both media extractors use `responseFormat`/Zod structured output where supported by the existing model path
- [x] 4.4 Add a media normalization step before Orchestrator invocation that merges user text with extraction summaries
- [x] 4.5 Ensure raw `attachment.data`, data URLs, base64 strings, and file bytes are never included in Orchestrator message content
- [x] 4.6 Keep Consultor, Operador, AudioExtractor, and ImageExtractor invocations free of checkpointers, stores, and historical turns

## 5. Tests

- [x] 5.1 Add unit tests for user-scoped thread ID and long-term memory namespace helpers
- [x] 5.2 Add tests proving Orchestrator no longer calls `chatService.recentTurns` to build memory context
- [x] 5.3 Add tests proving Orchestrator invokes LangChain with a user-scoped `thread_id`
- [x] 5.4 Add tests proving summarization middleware is configured on the Orchestrator
- [x] 5.5 Add tests proving media extraction converts audio/image payloads into compact summaries before Orchestrator invocation
- [x] 5.6 Add tests proving raw base64/file bytes are excluded from short-term and long-term memory inputs
- [x] 5.7 Add tests proving Consultor, Operador, AudioExtractor, and ImageExtractor are stateless
- [x] 5.8 Add integration tests proving user 1 and user 2 memory state cannot cross
- [x] 5.9 Add integration tests proving long-term memory facts can be saved and later read for the same user

## 6. Validation

- [x] 6.1 Run server unit tests with `nvm use`
- [x] 6.2 Run server e2e tests with `nvm use`
- [x] 6.3 Run server build with `nvm use`
- [x] 6.4 Run OpenSpec status for `add-agent-memory` and verify all tasks are tracked
