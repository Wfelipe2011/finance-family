## 1. Shared Contracts & Types

- [x] 1.1 Create `shared/types/` directory with package.json (`"name": "@fin-ai/shared"`)
- [x] 1.2 Define `shared/types/auth.ts` — LoginRequest, LoginResponse, JwtPayload, UserProfile
- [x] 1.3 Define `shared/types/lancamento.ts` — LancamentoDTO, CreateLancamentoDTO, UpdateLancamentoDTO, LancamentoFilterDTO, CategoriaEnum
- [x] 1.4 Define `shared/types/chat.ts` — ChatMessage, ChatAttachment, SSEEvent
- [x] 1.5 Define `shared/types/config.ts` — IAConfig, UpdateIAConfigDTO
- [x] 1.6 Define `shared/types/endpoints.ts` — JSDoc documentação de todos os endpoints da API
- [x] 1.7 Create `shared/types/index.ts` barrel export
- [x] 1.8 Add tsconfig paths in `server/tsconfig.json` pointing to `../shared/types`
- [x] 1.9 Add tsconfig paths in `client/tsconfig.json` pointing to `../shared/types`

## 2. Database Schema (TypeORM)

- [x] 2.1 Install TypeORM deps in server: `typeorm`, `@nestjs/typeorm`, `pg`
- [x] 2.2 Create `Usuario` entity at `server/src/entities/usuario.entity.ts` with TypeORM decorators
- [x] 2.3 Create `Lancamento` entity at `server/src/entities/lancamento.entity.ts` with FK to Usuario, `Relation<T>` wrapper for SWC compat
- [x] 2.4 Create `DatabaseModule` at `server/src/database/database.module.ts` with `TypeOrmModule.forRootAsync()` using `ConfigModule`
- [x] 2.5 Configure `@nestjs/config` with `.env` loading in `server/src/app.module.ts`
- [ ] 2.6 Verify database sync creates `usuarios` and `lancamentos` tables on startup

## 3. pg-boss Queue Setup

- [x] 3.1 Install `pg-boss` in server
- [x] 3.2 Create `QueueModule` at `server/src/queue/queue.module.ts` with `PgBoss` provider
- [x] 3.3 Create `QueueService` with `sendJob()`, `registerWorker()` methods following TECH.md pattern
- [ ] 3.4 Verify pg-boss creates `pgboss` schema and internal tables on startup

## 4. SWC & NestJS Tooling

- [x] 4.1 Install `@swc/cli`, `@swc/core` in server devDependencies
- [x] 4.2 Update `server/nest-cli.json`: set `compilerOptions.builder` to `"swc"` and `typeCheck: true`
- [x] 4.3 Create `.swcrc` in server root with decorator support (`legacyDecorator: true`, `decoratorMetadata: true`)
- [x] 4.4 Update `server/package.json` scripts to use `nest start -b swc`
- [x] 4.5 Verify `npm run build` succeeds with SWC

## 5. Vitest Setup (Server)

- [x] 5.1 Install `vitest`, `unplugin-swc`, `@swc/core`, `@vitest/coverage-v8`, `supertest`, `@types/supertest` in server devDependencies
- [x] 5.2 Remove Jest config from `server/package.json`
- [x] 5.3 Create `server/vitest.config.ts` with `unplugin-swc` plugin and `src/` alias
- [x] 5.4 Create `server/vitest.config.e2e.ts` for E2E tests with `include: ['**/*.e2e-spec.ts']`
- [x] 5.5 Update `server/package.json` test scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:cov": "vitest run --coverage"`, `"test:e2e": "vitest run --config ./vitest.config.e2e.ts"`
- [x] 5.6 Convert existing `app.controller.spec.ts` from Jest to Vitest (change imports)
- [x] 5.7 Convert existing `app.e2e-spec.ts` from Jest to Vitest (change imports to `import request from 'supertest'`)

## 6. Vitest Setup (Client)

- [x] 6.1 Install `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `vite-tsconfig-paths` in client devDependencies
- [x] 6.2 Create `client/vitest.config.mts` with React plugin, jsdom environment, tsconfig paths
- [x] 6.3 Add `"test": "vitest"` script to `client/package.json`
- [x] 6.4 Create a basic smoke test verifying `<Page />` renders

## 7. Docker Infrastructure

- [x] 7.1 Create `.env.example` at project root with all variables: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `SERVER_PORT`, `CLIENT_PORT`
- [x] 7.2 Create `docker-compose.yml` with services: `db` (postgres:17-alpine, healthcheck, named volume), `server` (build target, port 3001, depends_on db), `client` (build target, port 3000, depends_on server)
- [x] 7.3 Create `docker-compose.test.yml` with isolated `db-test` service using database `fin_ai_test`
- [x] 7.4 Create `Dockerfile.server` — multi-stage: build (SWC) → production (node:24-alpine, dist/ only)
- [x] 7.5 Create `Dockerfile.client` — multi-stage with `output: 'standalone'` per Next.js Docker example
- [x] 7.6 Update `client/next.config.ts`: set `output: 'standalone'` and add PWA security headers
- [x] 7.7 Create `.dockerignore` files for server and client

## 8. PWA Scaffold (Client)

- [x] 8.1 Create `client/src/app/manifest.ts` with PWA metadata matching DESIGN.md (theme_color: #1d1d1f, name: FinAI)
- [x] 8.2 Create `client/public/sw.js` with minimal service worker for static asset caching
- [x] 8.3 Add PWA meta tags to `client/src/app/layout.tsx` (viewport, theme-color, apple-mobile-web-app-capable)

## 9. Integration Baseline

- [x] 9.1 Create `server/test/setup.ts` with `docker-compose.test.yml` lifecycle (start before tests, stop after)
- [x] 9.2 Create an integration test verifying database connection and table creation via `docker-compose.test.yml`
- [x] 9.3 Create an integration test verifying pg-boss schema creation
- [x] 9.4 Verify `npm test` and `npm run test:e2e` pass in server
- [x] 9.5 Verify `npm test` passes in client
- [ ] 9.6 Verify `docker compose up` starts all 3 services and client can reach server API

## 10. Validation & Documentation

- [x] 10.1 Verify SWC builder: `npm run build` in server outputs to `dist/`
- [x] 10.2 Verify Vitest: all tests pass (`npm test`) in both server and client
- [ ] 10.3 Verify TypeORM sync: tables exist after server starts
- [ ] 10.4 Verify pg-boss: `pgboss` schema exists after server starts
- [x] 10.5 Verify shared types: `client` and `server` both resolve `@fin-ai/shared` imports without errors
- [x] 10.6 Update `README.md` (root) with project setup instructions
