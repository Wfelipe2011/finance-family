## 1. Shared Contracts and Data Model

- [x] 1.1 Update shared chat contracts with group id, author metadata, mentions, attachment URLs, and group-scoped SSE event variants
- [x] 1.2 Update shared lancamento contracts to use `group_id`, `created_by_usuario_id`, and optional `requested_by_usuario_id`
- [x] 1.3 Add shared contracts for family groups, group members, group settings, Jarvis skills, avatar metadata, and avatar upload responses
- [x] 1.4 Update shared endpoint contracts for group chat history, group message submit, group stream, skills listing, group settings, and avatar upload
- [x] 1.5 Add server entities for family groups, group memberships, group settings, avatar assets, and Jarvis finance drafts
- [x] 1.6 Update `ChatMessageEntity` to support `group_id`, `author_type`, `author_usuario_id`, `agent_id`, mentions, attachment metadata, and persisted Jarvis content
- [x] 1.7 Update `Lancamento` entity and DTO mapping to require group ownership and preserve human author attribution
- [x] 1.8 Add a migration/backfill path that creates a default family group for existing users and attaches existing chat/lancamento rows to it

## 2. Group Access and Settings

- [x] 2.1 Implement a family group service that resolves the authenticated user's active/default group
- [x] 2.2 Enforce group membership checks for group chat, stream, settings, avatar, and finance operations
- [x] 2.3 Implement group settings read/update APIs including `jarvisAlwaysOn`
- [x] 2.4 Seed or create initial family group membership for the existing household users
- [ ] 2.5 Add tests proving non-members cannot read group history, subscribe to streams, update settings, or access group financial data

## 3. Group Chat Persistence and Routing

- [x] 3.1 Replace user-scoped chat submission with group-scoped message submission while preserving text/audio/image inputs
- [x] 3.2 Persist every human message before any Jarvis routing decision
- [x] 3.3 Add normalized, case-insensitive `@Jarvis` mention detection
- [x] 3.4 Create Jarvis jobs only when `@Jarvis` is present or `jarvisAlwaysOn` is enabled
- [x] 3.5 Ensure human-only messages do not invoke media extractors or the LLM
- [x] 3.6 Add group chat history retrieval that returns complete persisted history after reload
- [x] 3.7 Replace user-scoped stream subscriptions with group-scoped streams guarded by membership
- [x] 3.8 Broadcast human new-message events to every connected member in the group
- [x] 3.9 Preserve lifecycle statuses `pending`, `job_created`, `transcribing`, `processing_ia`, `completed`, and `failed` for Jarvis jobs

## 4. Progressive Jarvis Streaming

- [ ] 4.1 Extend stream events with assistant message start, content delta, completion, and failure variants correlated by `groupId`, `messageId`, and `jobId`
- [x] 4.2 Update the chat worker to create and persist the Jarvis assistant message before or during generation
- [ ] 4.3 Use LangChain streaming to emit progressive Jarvis response deltas to the group stream
- [x] 4.4 Persist the final complete Jarvis response so reloading the chat shows the complete answer
- [x] 4.5 Add idempotent handling for repeated completion events so duplicate Jarvis bubbles are not created
- [ ] 4.6 Add tests for text job lifecycle, media job lifecycle, failed lifecycle, token deltas, and reload after streaming

## 5. Jarvis Skill Agent

- [x] 5.1 Create a Jarvis skill registry with `finance_crud`, `finance_query`, and `finance_report`
- [x] 5.2 Implement `GET /api/skills` from the registry with id, display name, description, and enabled state
- [ ] 5.3 Replace Consultor/Operador subagent tools in the Jarvis path with skill-selected finance tools
- [ ] 5.4 Implement skill routing that selects finance CRUD, query, or report skill context based on the Jarvis request
- [ ] 5.5 Assemble each Jarvis invocation from base prompt, group context, selected skill prompts, and selected tool list
- [ ] 5.6 Implement configurable skill TTL/unload behavior by rebuilding the next invocation context without expired skills
- [ ] 5.7 Replace user-scoped memory thread ids with group-scoped thread ids such as `finai:group:<groupId>`
- [ ] 5.8 Replace user durable memory namespaces with group durable memory namespaces
- [x] 5.9 Ensure Jarvis can use prior human group messages when invoked after a human-only conversation
- [x] 5.10 Keep raw image/audio bytes out of Jarvis short-term memory and durable memory
- [ ] 5.11 Add unit tests for skill listing, skill selection, skill TTL, group memory helpers, and group context construction

## 6. Finance Group Ownership and Drafts

- [x] 6.1 Update finance tools and repositories to filter reads by `group_id`
- [x] 6.2 Update finance create/edit/delete tools to enforce group membership and write group-owned records
- [x] 6.3 Preserve the requesting user and confirming user metadata for Jarvis-created finance records
- [x] 6.4 Persist pending Jarvis finance drafts by group, source message, requester, operation, payload, and status
- [x] 6.5 Allow any current group member to confirm or reject a pending finance draft
- [x] 6.6 Reject draft confirmation by non-members or for drafts outside the member's group
- [ ] 6.7 Keep draft-before-commit behavior for creates, edits, and deletes after removing the Operador subagent
- [ ] 6.8 Add tests for group-only finance queries, group-owned creates, cross-member confirmation, non-member rejection, and missing-field follow-up

## 7. Media Extraction in Group Context

- [x] 7.1 Update audio and image extraction job payloads to include group id and actor user id
- [x] 7.2 Run media extraction only for Jarvis-invoked messages or always-on Jarvis messages
- [ ] 7.3 Pass compact media extraction summaries into Jarvis as context for the selected skills
- [ ] 7.4 Make Jarvis ask what to do with extracted media data when the action is ambiguous
- [ ] 7.5 Add tests proving human-only media messages are stored but not extracted or sent to the LLM

## 8. Avatar Uploads and Docker Persistence

- [x] 8.1 Add server upload configuration for avatar directory, public URL/base path, file size limit, and allowed image MIME types
- [x] 8.2 Implement user avatar upload endpoint with validation, generated filenames, metadata persistence, and public URL response
- [x] 8.3 Implement Jarvis avatar upload/config endpoint scoped to a family group
- [ ] 8.4 Serve uploaded avatar assets from the configured static uploads path without executable behavior
- [ ] 8.5 Add Docker Compose uploads volume mounted into the server container
- [ ] 8.6 Document uploads environment variables in `.env.example`
- [ ] 8.7 Add tests for valid avatar upload, invalid file rejection, Jarvis avatar assignment, and persisted avatar metadata

## 9. Client Group Chat and Config UI

- [x] 9.1 Update client API helpers to use group chat history, group message submit, group stream, skills listing, settings, and avatar endpoints
- [x] 9.2 Update chat state to load persisted group history on page mount instead of starting from an empty local-only list
- [x] 9.3 Render chat bubbles by author metadata with distinct avatars for Jarvis, the authenticated user, spouse, and future family members
- [x] 9.4 Add `@Jarvis` mention support in the chat input without blocking normal human conversation
- [x] 9.5 Render human-only messages immediately and update them from group stream events
- [x] 9.6 Render progressive Jarvis streaming deltas into one assistant bubble
- [x] 9.7 Add UI for the `jarvisAlwaysOn` group setting in Config
- [x] 9.8 Add UI to display available Jarvis skills from `GET /api/skills`
- [x] 9.9 Add avatar upload controls for the authenticated user and Jarvis in Config
- [x] 9.10 Preserve Apple design constraints: Action Blue as the only interactive color, 17px body text, no decorative gradients, no chrome shadows, and stable mobile layouts
- [x] 9.11 Add client tests for history reload, avatar rendering, mention routing affordance, always-on setting, skills display, avatar upload, and progressive Jarvis deltas

## 10. Cleanup and Validation

- [ ] 10.1 Remove subagent invocation from the Jarvis user-facing path after skill parity tests pass
- [ ] 10.2 Remove or deprecate user-scoped chat stream routes and user-scoped chat memory helpers that conflict with group semantics
- [x] 10.3 Update server tests that assumed private user-scoped chat to use group-scoped fixtures
- [x] 10.4 Update client tests that assumed `role: user|assistant` rendering to use author metadata
- [x] 10.5 Run server unit tests with `nvm use`
- [ ] 10.6 Run server e2e tests with `nvm use`
- [x] 10.7 Run client tests with `nvm use`
- [x] 10.8 Run server and client builds with `nvm use`
- [x] 10.9 Run `openspec validate --all` with `nvm use`
- [ ] 10.10 Run a Docker smoke test with rebuilt server/client containers and verify avatar persistence after server restart
- [ ] 10.11 Manually smoke test two family users chatting, calling `@Jarvis` after prior human context, confirming a finance draft from the other user, streaming a Jarvis response, and reloading history
