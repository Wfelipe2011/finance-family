# FinAI — Project Instructions

## Project Summary

FinAI is a personal, shared (couple, 2 users) financial management PWA with AI-powered expense automation via a local LLM. The system uses asynchronous job processing (pg-boss / PostgreSQL) with a Router + Subagent architecture to stay within the LLM's 4k token limit.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), Tailwind v4, PWA standalone |
| Backend | NestJS 11, SWC, Passport JWT |
| Database | PostgreSQL 17 + TypeORM |
| Queue | pg-boss v12 (no Redis) |
| AI | LangChain (`createAgent`), local LLM (OpenAI-compatible) |
| Testing | Vitest + supertest (server), Vitest + React Testing Library (client) |
| Infra | Docker Compose (3 services: db, server, client) |

## Key Documents

- `PRD2.md` — MVP requirements (async chat, multi-agent, multimodal input)
- `TECH.md` — Technical codex (exact engineering instructions)
- `DESIGN.md` — Apple Design System (colors, typography, components)
- `shared/types/` — API contracts shared between server and client

## Change Order

1. **setup-foundation** — Contracts, database schema, Docker, tooling (MUST be first)
2. **backend-core** + **frontend-pwa** — Can run in parallel after foundation

## File-Specific Instructions

When working on server code, see `.github/instructions/server.instructions.md`.
When working on client code, see `.github/instructions/client.instructions.md`.

## Hard Rules (both projects)

- Node 24+
- Before running any terminal command that uses Node/npm/npx/Nest/Next/Vitest/OpenSpec tooling, run `nvm use` from the repository root so the version from `.nvmrc` is active. If `nvm use` fails, stop and report it instead of continuing with another Node version.
- No Redis — only pg-boss for queues
- No Jest — only Vitest
- All shared types in `shared/types/` via tsconfig paths as `@fin-ai/shared`
- Integration tests use real database via `docker-compose.test.yml`
- LLM model: `gemma-4` or similar, accessed via OpenAI-compatible API at configurable `baseURL`

## Terminal Setup

Always activate the project Node version before terminal work:

```bash
nvm use
node -v
```

The expected version is defined in `.nvmrc`. Do not run package installation, builds, tests, Docker build steps that execute npm scripts, or OpenSpec commands before confirming the active Node version.

## Hard Rules (Design)

- Action Blue (`#0066cc`) is the ONLY interactive color — no second accent
- No decorative gradients, no shadows on UI chrome
- Exactly ONE product shadow: `rgba(0,0,0,0.22) 3px 5px 30px`
- Body text at 17px (not 16px)
- Weight 500 is deliberately absent
