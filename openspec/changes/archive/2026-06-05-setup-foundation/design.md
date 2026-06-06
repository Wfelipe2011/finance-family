## Context

O projeto FinAI parte de dois scaffolds gerados por CLI (`nest new server` e `create-next-app client`) sem qualquer integração entre si ou com infraestrutura. O TECH.md define a stack alvo: NestJS + SWC, Next.js standalone + PWA, PostgreSQL + TypeORM + pg-boss, e LangChain. O PRD2.md especifica o modelo de dados multiusuário e o fluxo assíncrono via fila. O DESIGN.md fornece o sistema de design Apple (cores, tipografia, componentes) a ser implementado no frontend.

**Restrições**: Node 24+, PostgreSQL 17, modelos de IA locais (OpenAI-compatible), contêineres Docker enxutos para execução em dispositivo móvel.

## Goals / Non-Goals

**Goals:**
- Banco PostgreSQL rodando em Docker com schema inicial (Usuario, Lancamento)
- Contratos TypeScript compartilhados (`shared/types/`) que ambos os projetos importam
- Tooling de build rápido (SWC no NestJS) e testes (Vitest em ambos)
- Dockerfiles otimizados com `output: 'standalone'` para imagens pequenas
- Baseline de testes de integração com `docker-compose.test.yml`
- `.env.example` unificado documentando todas as variáveis de ambiente

**Non-Goals:**
- Implementar lógica de negócio (auth, chat, CRUD) — isso é dos changes 2 e 3
- Configurar LangChain ou agentes — change 2
- Implementar páginas ou componentes de UI — change 3
- CI/CD pipeline — futuro
- Migrations automáticas (TypeORM `synchronize: true` apenas para dev; migrations reais no change 2)

## Decisions

### D1: TypeORM com `@nestjs/typeorm` em vez de raw TypeORM

**Escolha**: Usar o package oficial `@nestjs/typeorm` + `TypeOrmModule.forRootAsync()` com `ConfigModule`.

**Alternativa considerada**: Raw `DataSource` como no recipe manual do NestJS. Rejeitado porque o `@nestjs/typeorm` integra com injeção de dependência, `forFeature()` para repositórios, e é o padrão recomendado na doc oficial (`techniques/database`).

**Rationale**: Menos boilerplate, melhor integração com o ecossistema NestJS, suporte a testes com `TypeOrmModule.forRoot()` isolado.

### D2: `shared/types/` como diretório raiz, não como package npm

**Escolha**: Diretório `shared/types/` na raiz do monorepo com TypeScript puro. Ambos `server` e `client` referenciam via `tsconfig.json` paths.

**Alternativa considerada**: Package npm privado (`@fin-ai/shared`). Rejeitado por complexidade desnecessária — precisaria de build step, versionamento, e `npm link` local. Para um monorepo com 2 projetos, paths do TypeScript são suficientes.

**Rationale**: Simplicidade máxima. Os tipos são apenas interfaces/DTOs sem dependências. O TypeScript resolve paths em tempo de compilação.

### D3: Vitest em vez de Jest em ambos os projetos

**Escolha**: Vitest com `unplugin-swc` no server e `@vitejs/plugin-react` no client.

**Alternativa considerada**: Manter Jest (já configurado no NestJS scaffold). Rejeitado porque o TECH.md e a doc do NestJS recomendam Vitest + SWC para velocidade. Jest com ts-jest é significativamente mais lento.

**Rationale**: Consistência entre projetos, velocidade superior (SWC-native), mesma API do Jest (compatível), melhor ESM support.

### D4: Tailwind CSS v4 (não v3)

**Escolha**: Manter Tailwind v4 que veio no scaffold do Next.js 16.

**Alternativa considerada**: Downgrade para v3 seguindo o guia `tailwind-v3-css` do Next.js. Rejeitado porque v4 é CSS-first (sem `tailwind.config.js`), mais rápido, e o projeto está começando do zero.

**Rationale**: O DESIGN.md será implementado como custom properties CSS e utilities Tailwind v4. Isso é trabalho do change 3.

### D5: PostgreSQL 17 (Alpine) no Docker

**Escolha**: `postgres:17-alpine` no docker-compose.

**Rationale**: Imagem leve (importante para execução mobile), versão estável mais recente, compatível com `pg-boss` v12 e TypeORM.

### D6: Next.js `output: 'standalone'` para Docker

**Escolha**: Configurar `output: 'standalone'` no `next.config.ts` e usar Dockerfile multi-stage otimizado.

**Rationale**: Conforme TECH.md e doc oficial de deploying do Next.js. Reduz imagem de ~1GB para ~150MB. Essencial para execução em dispositivo móvel com armazenamento limitado.

## Risks / Trade-offs

- **[Risk] `shared/types/` via tsconfig paths pode causar problemas com build do Next.js standalone** → Mitigação: Testar no Docker; se falhar, copiar `shared/` para dentro do contexto de build ou usar `transpilePackages`
- **[Risk] TypeORM `synchronize: true` pode causar perda de dados se usado em produção** → Mitigação: Apenas para dev; migrations manuais serão introduzidas no change 2
- **[Risk] SWC com TypeORM pode ter problemas de dependência circular** → Mitigação: Usar `Relation<T>` wrapper do TypeORM conforme documentado no NestJS SWC recipe
- **[Trade-off] Vitest não suporta `async` Server Components** → Aceitável: testes de componentes assíncronos serão E2E (Cypress no futuro)

## Open Questions

- ~~Tailwind v3 ou v4?~~ → v4 (decidido)
- ~~`shared/` package ou diretório?~~ → diretório com tsconfig paths (decidido)
- ~~Onde colocar `docker-compose.test.yml`?~~ → change 1 (decidido)