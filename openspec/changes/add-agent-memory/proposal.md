## Why

The current agent pipeline keeps short-term context by manually loading recent chat rows into the Orchestrator prompt. This loses useful older context, does not distinguish durable user facts from conversation turns, and becomes unsafe once multimodal payloads can be persisted in memory because audio/image base64 can quickly exceed the local LLM's 4k token budget.

This change introduces explicit agent memory: short-term memory persisted per user with summarization, long-term memory for stable user preferences/facts, and stateless media extraction before routing so files are interpreted without polluting the Orchestrator memory.

## What Changes

- Add LangGraph-backed short-term memory for the Orchestrator only, persisted in PostgreSQL with a deterministic user-scoped thread ID.
- Replace manual recent-turn prompt assembly with checkpointer-backed memory and summarization middleware to keep context compact.
- Add long-term memory for durable user facts and finance preferences using PostgreSQL-backed LangGraph storage.
- Add stateless audio and image extraction before the Orchestrator so media payloads are converted into compact structured summaries.
- Keep Consultor, Operador, and media extractor agents stateless: no checkpointer, no memory store, no historical message replay.
- Prevent raw base64/audio/image payloads from being written to short-term or long-term memory.
- Add integration coverage proving user isolation, memory persistence, summarization behavior, and stateless subagent/media-agent execution.

## Capabilities

### New Capabilities
- `agent-memory`: Orchestrator short-term memory, long-term user memory, and multimodal-safe memory handling for the agent pipeline.

### Modified Capabilities
- None.

## Impact

- **Server dependencies**: add explicit LangGraph PostgreSQL checkpoint/store dependency for `PostgresSaver` and `PostgresStore`.
- **Server agent pipeline**: update `AgentOrchestratorService`, add memory/checkpoint initialization, add media extractor services, and remove manual recent-turn prompt composition from Orchestrator invocation.
- **Database**: LangGraph checkpoint/store tables are created by the LangGraph setup APIs in the existing PostgreSQL database.
- **Tests**: add focused unit/integration tests for memory isolation, summarization thresholds, media extraction sanitization, and stateless subagent invocation.
- **No client API change**: chat submission remains `POST /chat/message` with text and optional file.
