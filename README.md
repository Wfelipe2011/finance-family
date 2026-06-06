# FinAI

FinAI is a shared personal finance PWA for two users. It uses a Next.js client, a NestJS server, PostgreSQL 17, and pg-boss for asynchronous chat jobs against a local OpenAI-compatible LLM.

## Requirements

- Node.js 24 or newer
- npm
- Docker and Docker Compose

## Environment

Copy `.env.example` to `.env` and adjust secrets or ports as needed.

Required variables:

- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `JWT_SECRET`
- `OPENAI_BASE_URL`
- `OPENAI_API_KEY`
- `SERVER_PORT`
- `CLIENT_PORT`
- `NEXT_PUBLIC_API_BASE_URL`

## Development

Start the full stack:

```bash
docker compose up
```

Default services:

- Client: http://localhost:3000
- Server: http://localhost:3001
- PostgreSQL: localhost:5432

Run projects locally:

```bash
cd server && npm run start:dev
cd client && npm run dev
```

## Tests

Server tests use Vitest and the isolated PostgreSQL service from `docker-compose.test.yml`.

```bash
docker compose -f docker-compose.test.yml up -d
cd server && npm test
cd server && npm run test:e2e
cd client && npm test
```

Tear down the test database:

```bash
docker compose -f docker-compose.test.yml down -v
```

## Shared Contracts

Shared API types live in `shared/types/` and are imported as `@fin-ai/shared` from both projects through TypeScript path aliases. Keep DTO shape changes there first, then adapt server and client code.
