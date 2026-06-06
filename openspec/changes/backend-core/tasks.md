## 1. Auth Module (Passport JWT)

- [x] 1.1 Install deps: `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `@nestjs/jwt`, `bcrypt`, `@types/passport-jwt`, `@types/passport-local`, `@types/bcrypt`
- [x] 1.2 Create `AuthModule` with Passport, JWT, and UsersModule imports
- [x] 1.3 Create `AuthService` with `validateUser()` (bcrypt verify) and `login()` (JWT sign)
- [x] 1.4 Create `LocalStrategy` extending `PassportStrategy(Strategy)` with email field
- [x] 1.5 Create `LocalAuthGuard` extending `AuthGuard('local')`
- [x] 1.6 Create `JwtStrategy` with `ExtractJwt.fromAuthHeaderAsBearerToken()`
- [x] 1.7 Create `JwtAuthGuard` with `Reflector` for `@Public()` support
- [x] 1.8 Create `@Public()` decorator using `SetMetadata`
- [x] 1.9 Register `JwtAuthGuard` as `APP_GUARD` globally
- [x] 1.10 Create `AuthController` with `POST /auth/login` and `GET /auth/profile`
- [x] 1.11 Create `jwtConstants` with `JWT_SECRET` from `ConfigService` (not hardcoded)
- [x] 1.12 Set JWT expiration to 7 days

## 2. Users Module

- [x] 2.1 Generate `UsersModule` and `UsersService` via NestJS CLI
- [x] 2.2 Implement `UsersService.create()` with bcrypt hashing (10+ salt rounds)
- [x] 2.3 Implement `UsersService.findByEmail()` querying TypeORM repository
- [x] 2.4 Create `UsersController` with `POST /users` (register, `@Public()`)
- [x] 2.5 Add validation: `nome` 1-100 chars, `email` format, `password` min 6 chars
- [x] 2.6 Handle duplicate email with `409 Conflict`

## 3. Lancamentos CRUD Module

- [x] 3.1 Generate `LancamentosModule`, `LancamentosService`, `LancamentosController`
- [x] 3.2 Import `TypeOrmModule.forFeature([Lancamento])` in LancamentosModule
- [x] 3.3 Implement `LancamentosService.create()` binding `usuario_id` from JWT context
- [x] 3.4 Implement `LancamentosService.findAll()` with filters (dataInicio, dataFim, categoria) scoped to `usuario_id`
- [x] 3.5 Implement `LancamentosService.update()` with ownership check (404 if not owner)
- [x] 3.6 Implement `LancamentosService.delete()` with ownership check
- [x] 3.7 Implement `GET /lancamentos/export` generating CSV via `csv-stringify`
- [x] 3.8 Install and configure `class-validator` + `class-transformer` for DTO validation
- [x] 3.9 Add `ValidationPipe` globally in `main.ts`

## 4. Chat Module (Controller + Queue)

- [x] 4.1 Generate `ChatModule`, `ChatController`, `ChatService`
- [x] 4.2 Create `ChatMessage` entity (id, usuario_id, content, role, status, created_at)
- [x] 4.3 Implement `POST /chat/message` accepting `multipart/form-data` (content text + optional file)
- [x] 4.4 Configure `FileInterceptor` for single file upload with `.wav` and image MIME validation
- [x] 4.5 Implement `202 Accepted` response with `{ jobId, status: 'pending' }`
- [x] 4.6 Persist chat message with `status: 'pending'` and `role: 'user'`
- [x] 4.7 Send job to pg-boss `chat-jobs` queue via `QueueService`
- [x] 4.8 Create `ChatGateway` service with RxJS `Subject` for SSE events
- [x] 4.9 Implement `@Sse('chat/stream/:userId')` endpoint returning `Observable<MessageEvent>`
- [x] 4.10 Create `StreamService` to manage per-user SSE subscriptions

## 5. Queue Worker (pg-boss + LangChain)

- [x] 5.1 Install deps: `langchain`, `@langchain/openai`, `@langchain/core`, `zod`
- [x] 5.2 Register pg-boss worker for `chat-jobs` queue in `QueueService.onModuleInit()`
- [x] 5.3 Create `AgentOrchestratorService` — main orchestrator agent with router prompt
- [x] 5.4 Create `ConsultorAgentService` — subagent with `consultar_gastos_db` tool
- [x] 5.5 Create `OperadorAgentService` — subagent with `adicionar_gasto_db` and `editar_gasto_db` tools
- [x] 5.6 Implement worker handler: update message to `processing` → invoke orchestrator → route to subagent → emit result via SSE
- [x] 5.7 Handle LLM offline: pg-boss retry (5 attempts, exponential backoff)
- [x] 5.8 On final failure: update message status to `failed`, emit SSE error

## 6. LangChain Tools

- [x] 6.1 Create `consultarGastosTool` with Zod schema `{ dataInicio?, dataFim?, categoria? }`
- [x] 6.2 Create `adicionarGastoTool` with Zod schema `{ descricao, valor, categoria, data? }` per PRD2.md
- [x] 6.3 Create `editarGastoTool` with Zod schema `{ id, descricao?, valor?, categoria?, data? }`
- [x] 6.4 Inject `usuario_id` into tool context using `config.context` from LangChain
- [x] 6.5 Scope all database queries in tools to the authenticated user's `usuario_id`
- [x] 6.6 Configure `ChatOpenAI` model with `baseURL` and `apiKey` from IA config (per-user)

## 7. Agent Pipeline (Router + Subagents)

- [x] 7.1 Create Orchestrator prompt: minimal (~200 tokens), tools: `chamar_subagente_consultor`, `chamar_subagente_operador`
- [x] 7.2 Create Consultor prompt: specialist in reading, tool: `consultar_gastos_db`, receives filtered DB data
- [x] 7.3 Create Operador prompt: specialist in writing, tools: `adicionar_gasto_db`, `editar_gasto_db`, STATELESS (no history)
- [x] 7.4 Implement short-term memory: load last 5 turns (10 messages) from DB for Orchestrator only
- [x] 7.5 Implement multimodal handling: `.wav` audio → base64 → pass to LLM (following agent-gallery pattern)
- [x] 7.6 Implement multimodal handling: image → base64 → pass to LLM for receipt extraction
- [x] 7.7 Configure `createAgent` with tools, following agent-gallery patterns
- [x] 7.8 Use `responseFormat` with Zod for structured output from subagents where applicable

## 8. IA Config Module

- [x] 8.1 Generate `ConfigModule` (or extend existing) with `GET /config/ia` and `PUT /config/ia`
- [x] 8.2 Create `IAConfig` entity (id, usuario_id, base_url, api_key) or store as user preferences
- [x] 8.3 Implement scoped retrieval: each user sees only their own config
- [x] 8.4 Mask `apiKey` in GET response (show last 4 chars only)

## 9. Integration Tests

- [x] 9.1 Create test helper: `setupTestApp()` using `TestingModule` with real database (docker-compose.test.yml)
- [x] 9.2 Test `POST /users` → register new user, verify bcrypt hash, verify 201
- [x] 9.3 Test `POST /auth/login` → successful login returns JWT, invalid credentials returns 401
- [x] 9.4 Test `GET /auth/profile` → without token returns 401, with valid token returns user info
- [x] 9.5 Test `POST /lancamentos` → create, verify `usuario_id` is bound from JWT
- [x] 9.6 Test `GET /lancamentos` → list, filter by date, filter by categoria, verify user isolation
- [x] 9.7 Test `PUT /lancamentos/:id` → update own, 404 for other user's
- [x] 9.8 Test `DELETE /lancamentos/:id` → delete own, 204; other user's, 404
- [x] 9.9 Test `GET /lancamentos/export` → verify CSV output with correct headers
- [x] 9.10 Test `POST /chat/message` → text returns 202, job is created in pg-boss
- [x] 9.11 Test `POST /chat/message` → .wav upload returns 202, invalid file type returns 400
- [x] 9.12 Test `GET /chat/stream/:userId` → SSE connection established, receives events
- [x] 9.13 Test `PUT /config/ia` → update and verify per-user isolation

## 10. Validation & Cleanup

- [x] 10.1 Verify all modules compile with SWC (`npm run build`)
- [x] 10.2 Verify all integration tests pass with `npm run test:e2e`
- [x] 10.3 Verify all unit tests pass with `npm test`
- [x] 10.4 Verify pg-boss schema and tables created on startup
- [x] 10.5 Verify SSE streaming works end-to-end (manual test with curl or browser)
- [x] 10.6 Review and ensure no plain text passwords in logs or responses
