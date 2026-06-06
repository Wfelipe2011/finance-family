## Context

FinAI already has an asynchronous chat path (`POST /chat/message` -> `pg-boss` -> worker -> SSE) and a Router/Subagent architecture. The latest memory work added a LangGraph checkpointer and long-term store for the Orchestrator, but runtime behavior showed that checkpointed recent context alone does not guarantee reliable recall or safe financial mutation flow.

The current `OperadorAgentService` can call mutation tools directly, and `AgentOrchestratorService` has a fallback parser that can create expenses outside the intended subagent loop. That is incompatible with a user-confirmed finance ledger.

## Goals / Non-Goals

**Goals:**
- Make the Orchestrator the only user-facing conversational agent.
- Keep media extraction and subagents stateless and technical.
- Preserve the asynchronous pg-boss architecture: HTTP adds cheap metadata and queues work; the worker runs media extraction and LLM inference.
- Require `draft` results before create/edit/delete commits.
- Require explicit user confirmation before any mutation is committed.
- Use recent Orchestrator memory before asking the user for already-provided data.
- Update categories to `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, and `Receita`.

**Non-Goals:**
- No household/couple data model migration. `spouseId` is best-effort only from currently available users when it can be derived safely.
- No Redis or synchronous media transcription in the HTTP request.
- No new frontend page for reviewing drafts.
- No token streaming.

## Decisions

### D1: Keep HTTP cheap and move media enrichment to the worker

**Choice**: `ChatService.submit` enriches `ChatJobPayload` with cheap deterministic metadata only: authenticated `userId`, best-effort `spouseId`, `currentDate`, `dayOfWeek`, `timezone`, and configured `location`. Attachments remain queued for the worker, where stateless media extractors produce `rawInput` text before Orchestrator invocation.

**Rationale**: This preserves the current resilient `202 Accepted` behavior and prevents LLM latency from blocking the request.

**Alternative considered**: Transcribe audio before queueing. Rejected because it makes the request path slow and fragile.

### D2: Use a strict agent result envelope

**Choice**: Subagents return one of four statuses:
- `draft`: parsed mutation payload for Orchestrator/user confirmation.
- `commit`: mutation has been executed after explicit confirmation.
- `read`: consultation result with no mutation.
- `rejected`: structured missing or ambiguous fields.

**Rationale**: The Orchestrator can reason conversationally over a small stable contract instead of interpreting arbitrary prose.

**Alternative considered**: Keep free-text subagent responses. Rejected because the Orchestrator cannot reliably distinguish "needs user confirmation" from "already saved".

### D3: Split mutation into draft and commit tools

**Choice**: The Operador first compiles a candidate mutation draft. Only after the Orchestrator receives explicit user confirmation does it route a commit command that calls write tools.

**Rationale**: This makes financial writes reversible at the conversation layer and prevents accidental persistence from a single ambiguous message.

**Alternative considered**: Let the Operador write immediately and ask for confirmation afterward. Rejected because rollback is harder and users expect confirmation before ledger changes.

### D4: Remove direct create fallback

**Choice**: The current direct create fallback in the Orchestrator is removed or converted into a draft-producing path that still requires confirmation.

**Rationale**: A hidden fallback that writes to the database breaks the invariant that all mutations pass through the Orchestrator confirmation loop.

### D5: Store canonical categories in one shared source

**Choice**: Update shared types, server validation, and any UI category lists to the new set: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.

**Rationale**: Agent drafts, API validation, database constraints, and filter chips must agree. The spelling `Saude` intentionally follows the requested category set.

## Risks / Trade-offs

- **[Risk] More chat turns before a mutation is saved** -> Mitigation: keep confirmation copy concise and allow clear "sim/confirma" follow-up to commit the latest draft from memory.
- **[Risk] Existing rows use old categories** -> Mitigation: map legacy `Lazer`/`Outros` to `Diversos` and `Saúde` to `Saude` during migration or normalization.
- **[Risk] The model may still ignore recent checkpoint context** -> Mitigation: add behavior tests for "Me chamo Wilson" -> "Qual meu nome?" and explicit prompt/tool instructions that recent memory must be consulted before durable memory or user clarification.
- **[Risk] `spouseId` is not modeled yet** -> Mitigation: keep it optional and best-effort; do not expand authorization or shared ledger semantics in this change.

## Migration Plan

1. Add/update shared category and agent result types.
2. Update database validation/migration for the new category set and normalize legacy categories.
3. Refactor Operador/Consultor result envelopes and tools.
4. Refactor Orchestrator prompt and remove direct mutation fallback.
5. Add behavioral unit/e2e coverage for memory recall, draft rejection, draft confirmation, and commit execution.
6. Rollback by restoring the previous direct mutation path and old category set before applying database category normalization in production.

## Open Questions

- Should `spouseId` be omitted until a real household model exists, or included as `null` for future compatibility?
- Should confirmed drafts expire after a fixed number of turns to avoid committing stale data?
