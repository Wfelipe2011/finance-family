## Why

The current agent pipeline can persist short-term checkpoints, but the Orchestrator still behaves unreliably when it must use recent context, ask for missing data, or decide whether a financial mutation is safe. FinAI needs a reversible inference loop where the Orchestrator remains the only friendly user-facing brain and subagents act as strict technical compilers.

This change also prevents direct database writes before user confirmation by introducing a draft/commit protocol for financial mutations.

## What Changes

- Rework the Orchestrator prompt and routing contract so it always owns the conversational loop, uses recent checkpoint context before asking the user, and presents all user-facing responses in PT-BR.
- Keep media extraction asynchronous in the worker: HTTP only stores raw text/attachments and cheap metadata, while the pg-boss worker runs stateless media extraction before invoking the Orchestrator.
- Add a memory-safe `familyContext` payload based only on existing data: authenticated `userId`, optional best-effort `spouseId` when derivable from current users, current date/time, day of week, timezone, and configured location.
- Change subagent contracts to return structured statuses:
  - `draft` for parsed mutation payloads that still require Orchestrator/user confirmation.
  - `commit` for confirmed mutation execution.
  - `read` for consultation/report results.
  - `rejected` for missing or ambiguous required data.
- Require the Operador subagent to produce a draft JSON before any create/edit/delete commit and to reject when required fields cannot be safely resolved.
- Replace the current automatic create fallback with the same Orchestrator/subagent confirmation flow.
- Update the canonical financial categories to: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.
- Add behavioral tests proving recent-memory recall, draft-before-commit, missing-field rejection, and no direct mutation without confirmation.

## Capabilities

### New Capabilities
- `agent-inference-loop`: Orchestrator-owned conversational loop, worker-side media enrichment, subagent draft/commit/read contracts, deterministic confirmation behavior, and updated category handling.

### Modified Capabilities
- `shared-contracts`: Lancamento category contracts and chat/agent structured result contracts change.
- `database-schema`: Lancamento category constraint changes to the new category set.

## Impact

- **Server agent pipeline**: `AgentOrchestratorService`, media extractor services, `OperadorAgentService`, `ConsultorAgentService`, agent tool schemas, fallback parser behavior, prompts, and tests.
- **Chat worker payload**: enrich `ChatJobPayload` with cheap metadata before queueing while keeping LLM/media processing inside the worker.
- **Shared types**: update `CategoriaEnum` and add structured agent result types for draft/commit/read/rejected flows.
- **Database**: update category validation/enum handling for existing and new `lancamentos`.
- **Client behavior**: future UI can render confirmation drafts from structured assistant responses; this change does not require a new page.
