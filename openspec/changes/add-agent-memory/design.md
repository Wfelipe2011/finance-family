## Context

The backend agent pipeline currently routes every chat job through `AgentOrchestratorService`, which manually loads recent `chat_messages` rows and passes them into `createAgent` as prompt history. This satisfies the original short-window requirement, but it has three problems now that FinAI needs richer memory:

- Older useful context is discarded instead of summarized.
- Durable user facts and preferences are mixed with transient chat history.
- Multimodal payloads can accidentally enter memory as base64, causing large checkpoints and token overflow.

LangChain/LangGraph provides two separate persistence mechanisms that map well to this problem:

- `PostgresSaver` as a checkpointer for short-term thread state.
- `PostgresStore` as a long-term JSON store for user-scoped durable memories.

The existing Router -> Subagents structure remains the right shape for the local 4k-token LLM. The change is to make only the Router memoryful and keep all specialist/media agents stateless.

## Goals / Non-Goals

**Goals:**
- Persist Orchestrator short-term memory per authenticated user in PostgreSQL.
- Use summarization middleware so Orchestrator context remains compact under the local model's 4k token budget.
- Store durable user preferences/facts separately from conversation checkpoints.
- Pre-process audio and image attachments into compact structured data before Orchestrator routing.
- Ensure Consultor, Operador, AudioExtractor, and ImageExtractor receive no memory, no checkpoint, and no historical turns.
- Prevent raw base64, audio bytes, and image bytes from being persisted in any memory layer.
- Keep the existing chat API and pg-boss worker shape.

**Non-Goals:**
- No client API change or new frontend screen for memory management.
- No vector embedding/search requirement for MVP long-term memory.
- No Redis or additional database service.
- No token-by-token LLM streaming.
- No memory for subagents or media extractor agents.

## Decisions

### D1: Use `PostgresSaver` for Orchestrator short-term memory

**Choice**: Create a server-managed LangGraph checkpointer using `PostgresSaver` from `@langchain/langgraph-checkpoint-postgres`, call `setup()` during module initialization, and pass it as `checkpointer` only to the Orchestrator agent.

**Rationale**: Short-term memory is conversation thread state. It should be keyed by `thread_id`, restored automatically across worker executions, and persisted in the same PostgreSQL database already used by FinAI.

**Alternative considered**: Continue loading recent turns from `chat_messages`. Rejected because it cannot summarize older turns or preserve compact continuity beyond a fixed window.

### D2: Use deterministic user-scoped thread IDs

**Choice**: Invoke the Orchestrator with `configurable.thread_id = "finai:user:<usuarioId>"`.

**Rationale**: FinAI has a shared couple use case with per-user authentication. A stable user-scoped thread keeps each user's memory isolated and survives app restarts.

**Alternative considered**: Thread per chat message or pg-boss job. Rejected because it would prevent continuity across turns.

### D3: Use summarization middleware instead of raw trimming

**Choice**: Configure LangChain `summarizationMiddleware` on the Orchestrator with conservative token trigger/keep settings appropriate for a 4k-token local model.

**Rationale**: Raw trimming removes useful information. Summarization preserves older context as compact state while keeping recent turns available.

**Alternative considered**: Manual summarize-and-store in custom tables. Rejected for MVP because LangChain already provides middleware that integrates with agent state and checkpointers.

### D4: Use `PostgresStore` for long-term memory

**Choice**: Add a PostgreSQL-backed long-term store with namespaces like `["finai", "users", String(usuarioId), "profile"]` and keys for durable facts/preferences such as default categories, recurring merchants, preferred language/tone, and known household context.

**Rationale**: Long-term memory is not the same as chat history. It should be explicit JSON documents that can be read/written by memory tools and scoped to the authenticated user.

**Alternative considered**: Put durable facts into the short-term checkpoint summary. Rejected because checkpoint summaries are conversation state and are not stable, addressable records.

### D5: Add stateless media extractors before the Orchestrator

**Choice**: Add `AudioExtractorAgentService` and `ImageExtractorAgentService` as utility agents. They receive raw media, return compact structured extraction, and are never given a checkpointer, store, or previous messages.

```
ChatWorker
  |-- text ------------------------------+
  |                                      v
  |-- audio -> AudioExtractor (stateless) -> Orchestrator (memoryful)
  |                                      |
  |-- image -> ImageExtractor (stateless)-+
                                         v
                              Consultor / Operador (stateless)
```

**Rationale**: The Orchestrator should reason over compact facts, not large media payloads. This keeps memory useful and prevents binary/base64 data from entering persisted checkpoints.

**Alternative considered**: Send media directly to the Orchestrator. Rejected because Orchestrator memory would risk persisting base64 and exceeding the model context.

### D6: Keep subagents stateless

**Choice**: Consultor and Operador continue to be invoked with only the routed current request and authenticated `usuario_id` context. They do not receive checkpointers, long-term stores, or prior chat messages.

**Rationale**: This preserves the original 4k-token architecture. The Router carries conversational continuity; subagents perform narrow work.

### D7: Sanitize what enters memory

**Choice**: Before invoking the memoryful Orchestrator, convert the user's payload into a memory-safe text/JSON summary:

- Text: original user text.
- Audio: transcript plus extracted intent/expense fields.
- Image: receipt/merchant/amount/date/category extraction.
- Mixed text + file: user text plus extracted media summary.

Raw `attachment.data`, data URLs, base64, and file bytes MUST never be included in Orchestrator messages or long-term memory writes.

## Risks / Trade-offs

- **[Risk] LangGraph checkpoint tables conflict with TypeORM migrations** -> Mitigation: let LangGraph setup create/manage its own tables and keep TypeORM entities out of those tables.
- **[Risk] Summarization uses extra LLM calls and increases job latency** -> Mitigation: configure token trigger so summarization runs only when needed.
- **[Risk] Media extractor failure blocks a valid chat job** -> Mitigation: fail the job through existing pg-boss retry flow and surface a failed SSE event after retries.
- **[Risk] Long-term memory may store incorrect facts inferred by the model** -> Mitigation: only write high-confidence, user-stated or tool-confirmed facts; do not store speculative data.
- **[Risk] User-scoped thread merges all conversations for the same user** -> Mitigation: acceptable for MVP personal finance chat; future work can add explicit conversation/session IDs.
- **[Risk] Postgres checkpoints grow over time** -> Mitigation: use summarization and add a maintenance task for future checkpoint pruning if storage becomes an issue.

## Migration Plan

1. Add the LangGraph PostgreSQL checkpoint/store dependency to the server.
2. Initialize `PostgresSaver` and `PostgresStore` from the existing database connection string during agent module startup.
3. Deploy without changing the chat API; old `chat_messages` rows remain available for UI history but are no longer the Orchestrator memory source.
4. Existing users start with empty LangGraph memory. No data backfill is required for MVP.
5. Rollback by disabling the checkpointer/store path and restoring manual recent-turn loading.

## Open Questions

- Should future memory be scoped per user only, or per household/couple with shared long-term memory? MVP uses per-user memory because authentication and data access are currently user-scoped.
- Should users get a UI to inspect/delete long-term memories? Out of scope for this change, but relevant for privacy once memory grows.
