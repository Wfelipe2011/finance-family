## Context

FinAI currently treats chat, memory, SSE delivery, IA config, and financial records as user-scoped concerns. The backend persists `chat_messages` with `usuario_id`, emits stream events to `/chat/stream/:userId`, and invokes an Orchestrator that delegates to Consultor and Operador subagents. Recent memory work also made short-term memory and durable memories deterministic per user with thread IDs such as `finai:user:<usuarioId>`.

The new PRD changes the product shape. The app becomes a shared family chat for multiple users, with Jarvis as a participant that is invoked through `@Jarvis` or through an explicit group setting that keeps Jarvis active. Jarvis is a generic assistant; finance becomes a skill loaded on demand. Human messages must still be persisted and streamed even when they do not invoke Jarvis, and Jarvis must be able to read prior group context when called later.

This is a cross-cutting pivot across server entities, shared contracts, chat APIs, SSE, agent memory, finance tools, Docker volumes, and the client chat/config experience.

## Goals / Non-Goals

**Goals:**
- Model a family group as the primary collaboration and data boundary.
- Persist complete group chat history independently from model summarization.
- Route messages to Jarvis only when `@Jarvis` is mentioned or when the group's always-on Jarvis setting is enabled.
- Replace subagent orchestration with one generic Jarvis agent that assembles skills and tools on demand.
- Scope Jarvis short-term and long-term memory to the family group.
- Keep finance records group-owned while preserving the human author.
- Allow any group member to confirm a pending Jarvis finance draft.
- Stream Jarvis output progressively to all connected group members.
- Support real uploaded avatars for Jarvis and each user through a persistent Docker volume.

**Non-Goals:**
- Adding calendar, agenda, or other non-finance skills in this change.
- Rewriting the finance business rules beyond group ownership, author attribution, and skill registration.
- Implementing multi-family invitations, billing, roles beyond group membership, or external file storage.
- Keeping compatibility with the old private per-user chat thread semantics.

## Decisions

### D1: Family group is the primary boundary

**Choice**: Introduce family groups and group membership. Chat messages, Jarvis memory thread IDs, durable Jarvis memories, group settings, and financial records are scoped by `group_id`. Financial records also store `created_by_usuario_id` for audit and UI attribution.

**Rationale**: The product is shared by family members. Group scope lets Jarvis read the same conversation the humans see and lets all users collaborate around the same financial data.

**Alternative considered**: Keep records per user and build a merged family view. Rejected because Jarvis would still need cross-user reads and shared draft confirmation, creating more authorization and memory edge cases.

### D2: Messages have authors, not only roles

**Choice**: Replace `role: user|assistant` as the main UI discriminator with an author model: `authorType: "user" | "agent"`, `authorUserId` for humans, and `agentId` for Jarvis. A model-compatible `role` may still be derived internally when invoking LangChain.

**Rationale**: A group chat needs to render Wilson, spouse, future family members, and Jarvis distinctly. Roles are too coarse for avatars, ownership, and mentions.

**Alternative considered**: Overload `role: "user"` and `role: "assistant"` with display names. Rejected because it keeps leaking the old one-human-one-assistant model into shared contracts.

### D3: Mention routing is deterministic before the queue

**Choice**: On message submission, persist and stream the message for the group first. If content contains a normalized `@Jarvis` mention, or the group's `jarvisAlwaysOn` flag is enabled, create a pg-boss Jarvis job. Otherwise, do not invoke media extractors or the LLM.

**Rationale**: Human-to-human conversation must not be processed by the LLM accidentally. The rule is explainable, testable, and protects privacy and local model budget.

**Alternative considered**: Let Jarvis classify whether to answer every message. Rejected because it sends private human conversation to the LLM without explicit invocation.

### D4: Jarvis receives group context when invoked

**Choice**: A Jarvis job includes the triggering message, actor user, group id, current date/time metadata, and a compact window of recent group messages or checkpointer state. If the user starts a conversation without `@Jarvis` and later invokes Jarvis, Jarvis can use that earlier group context.

**Rationale**: This satisfies the key user flow: humans can discuss something first and then call Jarvis to help using what was already said.

**Alternative considered**: Send only the text after `@Jarvis`. Rejected because it loses the context that makes group chat useful.

### D5: Single Jarvis agent with skill registry

**Choice**: Replace Consultor and Operador subagents with a `JarvisAgentService` and a skill registry. Each skill defines id, display name, description, prompt context, allowed tools, optional intent hints, and a configurable interaction TTL. The initial skills are `finance_crud`, `finance_query`, and `finance_report`.

**Rationale**: Skills are lighter than subagents and match the desired future generalist assistant. The registry also supports `GET /api/skills` and future non-finance capabilities without changing the chat contract.

**Alternative considered**: Keep subagents internally and rename them skills. Rejected because it preserves the stateless repeated subagent flow the pivot is trying to remove.

### D6: Skill unloading means rebuilding the next invocation context

**Choice**: The system does not keep a mutable live agent instance and physically unregister tools. Each Jarvis invocation assembles the model, base prompt, active skill prompt snippets, and tool list from the registry and group skill state. A skill expires after its configured TTL or when the next invocation selects a different skill set.

**Rationale**: This is deterministic, easier to test, and avoids relying on framework-specific live mutation behavior.

**Alternative considered**: Keep a process-local agent object with dynamically registered/unregistered tools. Rejected because it would be fragile across workers, restarts, and multiple server instances.

### D7: Group-scoped memory replaces user-scoped memory

**Choice**: Use LangGraph checkpointer thread IDs such as `finai:group:<groupId>` and durable memory namespaces such as `["finai", "groups", String(groupId), "profile"]`. Jarvis may receive actor user metadata, but durable facts are group facts unless a future capability introduces personal preferences.

**Rationale**: The user explicitly chose group-level memory. It prevents the old split where each user has a separate assistant memory despite sharing the same household context.

**Alternative considered**: Keep both group and user memory now. Rejected for this pivot because it increases policy complexity before the generic-assistant foundation is stable.

### D8: Drafts are group-visible and confirmable by any member

**Choice**: Store pending Jarvis finance drafts by group and draft id, linked to the message/job that created them. Any current group member can confirm or reject the draft. Commit tools write group-owned records with `created_by_usuario_id` set to the confirming user when relevant and retain the original requesting user as draft metadata.

**Rationale**: The family works as a shared operational unit. Allowing any member to confirm prevents the flow from blocking if the original requester is not available.

**Alternative considered**: Require the original requester to confirm. Rejected because the user explicitly allowed any member.

### D9: Progressive streaming extends, not replaces, lifecycle events

**Choice**: Keep lifecycle statuses `pending`, `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed`. Add streaming payload variants for assistant message creation and token/content deltas, correlated by `jobId` and `messageId`, delivered to the group stream.

**Rationale**: Existing UI status behavior remains useful for uploads and media, while progressive deltas make Jarvis feel responsive.

**Alternative considered**: Replace statuses with only token events. Rejected because queued/media work still needs clear lifecycle states.

### D10: Avatar files are local persistent uploads

**Choice**: Store uploaded avatar files on disk under a server uploads directory mounted as a Docker volume. Persist metadata and public URL/path in the database. Validate MIME type and size, generate server-side filenames, and never trust client filenames for storage paths.

**Rationale**: The user asked for real upload with Docker volume persistence. Local volume storage is enough for this personal/family deployment and avoids introducing object storage.

**Alternative considered**: Store base64 images in PostgreSQL. Rejected because it bloats database rows, complicates caching, and is worse for static serving.

## Risks / Trade-offs

- **[Risk] Existing dev data uses per-user chat and lancamentos** -> Migration can create a default family group, attach existing users, move messages and lancamentos into that group, and keep original `usuario_id` as author.
- **[Risk] Group stream can leak data across families** -> Every group API and stream subscription must verify authenticated membership before returning history or events.
- **[Risk] Jarvis may read human messages that were not originally addressed to it** -> Jarvis only receives prior context after an explicit `@Jarvis` or always-on setting, and the UI must make that setting visible.
- **[Risk] Local model may not reliably support 8k context** -> Make max context, summarization trigger, and retained messages configurable with defaults aligned to the configured model.
- **[Risk] Progressive token streaming and pg-boss jobs increase event complexity** -> Use stable event types and correlation IDs, with idempotent client handling for reconnects.
- **[Risk] Uploaded avatars can become unsafe files** -> Restrict to image MIME types, enforce size limits, write outside source directories, serve through static middleware with no execution, and generate filenames.
- **[Risk] Removing subagents can temporarily reduce financial precision** -> Keep existing finance tool schemas and draft-before-commit behavior, but expose them through skills instead of subagent calls.

## Migration Plan

1. Add group, membership, group settings, avatar, and draft persistence tables without removing existing columns.
2. Create a default family group for existing users and backfill current `chat_messages` and `lancamentos` into that group.
3. Add group-scoped shared contracts and API endpoints while keeping old endpoints only as temporary adapters if needed during client migration.
4. Switch the client chat to load group history and subscribe to group streams.
5. Introduce the Jarvis skill registry and group-scoped memory while keeping existing finance tools available behind skills.
6. Remove subagent services from the Jarvis path after parity tests pass.
7. Add avatar upload endpoints and Docker uploads volume.
8. Remove or deprecate old user-scoped chat stream and user-scoped memory helpers after tests and manual smoke coverage pass.

Rollback strategy: keep migrations additive until the client and Jarvis path are validated. If the pivot must roll back during development, the old user-scoped entities and endpoints can remain available until the final cleanup task removes them.

## Open Questions

- Should a group support more than one Jarvis-like agent in the future, or is `Jarvis` a singleton per group for now?
- Should old chat history be migrated into the new visible group chat, or can development data be reset for this pivot?
- Should avatar upload accept only square/cropped images, or should the client crop while the server stores the original?
