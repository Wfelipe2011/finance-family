## Why

FinAI is pivoting from a private per-user finance assistant into a shared family chat where humans can talk to each other and invoke Jarvis only when needed. The current user-scoped chat, user-scoped memory, and subagent pipeline do not fit the new product direction: Jarvis must become a generic family assistant that reads group context and gains finance capability through demand-loaded skills.

## What Changes

- **BREAKING**: Replace the per-user chat model with a shared family group conversation. Messages belong to a family group, have a human or Jarvis author, and can be read by every group member.
- **BREAKING**: Route Jarvis deterministically by mention. Messages without `@Jarvis` are persisted and streamed as human conversation only; messages with `@Jarvis` or a group setting that keeps Jarvis active create an AI job.
- **BREAKING**: Move agent short-term and long-term memory from user scope to family group scope so Jarvis can use prior group conversation and group facts.
- **BREAKING**: Remove Consultor and Operador subagents from the user-facing inference path. Jarvis becomes a single generic agent with a small base prompt and demand-loaded skills.
- Add initial finance skills: `finance_crud`, `finance_query`, and `finance_report`, each contributing specialized prompt context and only the tools required for that capability.
- Add `GET /api/skills` so the client can show available Jarvis capabilities and future skills can be exposed without redesigning the chat.
- Preserve multimodal input, but treat audio/image extraction as context for Jarvis. Extracted text and structured data are passed to Jarvis only when the message invokes Jarvis or Jarvis is active for the group.
- Persist complete chat history for the UI independently from model summarization, including human messages, Jarvis messages, media metadata, lifecycle status, and generated summaries.
- Stream Jarvis responses progressively to group members, while keeping existing lifecycle status semantics for queued/media work.
- Make financial records belong to the family group and keep the author who created or requested the record.
- Allow any group member to confirm a pending Jarvis finance draft.
- Add real avatar uploads for Jarvis and each family user, stored in a Docker-mounted persistent upload volume.

## Capabilities

### New Capabilities
- `family-chat-groups`: Shared family groups, membership, group message authorship, complete chat history, mention routing, and group-level Jarvis activation.
- `jarvis-skills`: Single generic Jarvis agent, group-scoped memory, demand-loaded skills, finance skills, skill listing endpoint, media-to-context flow, and draft confirmation by any group member.
- `profile-avatars`: Upload, persist, serve, and configure avatars for Jarvis and family users.

### Modified Capabilities
- `agent-inference-loop`: Replace user-scoped Orchestrator/subagent requirements with group-scoped Jarvis skill inference.
- `chat-job-status-events`: Change streams from user-targeted final-result events to group-targeted lifecycle plus progressive Jarvis response events.
- `database-schema`: Add family groups, memberships, group message authorship, avatar references, group-scoped memory/thread metadata, and group-owned financial records with author tracking.
- `shared-contracts`: Update chat, skill, group, avatar, SSE, and financial entry contracts to represent family group scope and Jarvis authorship.
- `docker-infra`: Add a persistent uploads volume for user and Jarvis avatar files.

## Impact

- **Server database/entities**: Introduce family group and membership entities, update chat message ownership, update lancamento ownership to group plus author, and store avatar metadata.
- **Server chat API**: Add group history retrieval, group-scoped submit/stream semantics, mention detection, Jarvis-active group setting, and progressive response events.
- **Server agent pipeline**: Replace subagent tools with a Jarvis skill registry, group-scoped memory thread IDs, skill-specific tool assembly, media extraction context, and group-level finance tools.
- **Server config/uploads**: Add avatar upload endpoints, static serving for uploaded assets, file validation, and Docker volume-backed persistence.
- **Shared types**: Update `@fin-ai/shared` contracts for group messages, authors, skills, avatar assets, group settings, and SSE event variants.
- **Client UI**: Load persisted group chat history after refresh, render human and Jarvis avatars, support `@Jarvis` mention flow and always-on setting, show available skills, and add avatar upload controls in Config.
- **Docker Compose**: Mount an uploads volume into the server container so avatar files survive rebuilds and restarts.
- **Tests**: Add server and client coverage for group isolation, mention routing, skill loading, streaming, persisted history, financial ownership/author attribution, cross-member draft confirmation, and avatar upload persistence.
