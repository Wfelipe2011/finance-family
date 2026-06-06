## Why

O projeto FinAI tem dois scaffolds vazios (NestJS 11 e Next.js 16) sem infraestrutura compartilhada, sem banco de dados e sem tooling de desenvolvimento. O time precisa de uma fundação sólida — contratos, banco, fila, compilador rápido e ambiente de testes — antes que backend e frontend possam ser implementados em paralelo.

## What Changes

- **docker-compose.yml** com 3 serviços: PostgreSQL 17, NestJS server, Next.js client
- **docker-compose.test.yml** para baseline de testes de integração com banco real
- **Entidades TypeORM**: `Usuario` e `Lancamento` com vínculo multiusuário
- **Diretório `shared/types/`** com DTOs, interfaces e contratos de API usados por ambos os projetos
- **SWC builder** no NestJS (`nest-cli.json`) — compilação ~20x mais rápida que tsc
- **Vitest** configurado no server (`vitest.config.ts` com `unplugin-swc`) e no client (`vitest.config.mts` com `@vitejs/plugin-react`)
- **Next.js `output: 'standalone'`** para imagem Docker enxuta (~150MB)
- **PWA scaffold** no client: `manifest.ts`, service worker base
- **`.env.example`** unificado com todas as variáveis: `DATABASE_URL`, `JWT_SECRET`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`
- **Script `dev`** unificado para subir tudo com `docker compose up`

## Capabilities

### New Capabilities

- `database-schema`: Entidades TypeORM (Usuario, Lancamento) e migração inicial do PostgreSQL
- `shared-contracts`: Tipos, DTOs e interfaces compartilhadas entre server e client (Auth, Lancamento, Chat, SSE)
- `dev-tooling`: SWC, Vitest, Docker Compose dev/test, scripts de desenvolvimento
- `docker-infra`: Dockerfiles otimizados para server (standalone NestJS) e client (standalone Next.js), docker-compose dev e test

### Modified Capabilities

<!-- Nenhuma — projeto está vazio, não há specs existentes -->

## Impact

- **server/**: `nest-cli.json` (SWC), `package.json` (novas deps: TypeORM, pg, pg-boss, passport, jwt, config, multer, vitest, supertest)
- **client/**: `next.config.ts` (standalone + PWA headers), `package.json` (novas deps: vitest, @vitejs/plugin-react, jsdom, @testing-library/react)
- **shared/**: Novo diretório raiz com `types/` (contratos TypeScript puros)
- **.env.example**: Novo arquivo raiz
- **docker-compose.yml**, **docker-compose.test.yml**: Novos arquivos raiz
- **Dockerfile.server**, **Dockerfile.client**: Novos arquivos