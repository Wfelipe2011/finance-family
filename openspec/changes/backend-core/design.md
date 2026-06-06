## Context

O TECH.md e PRD2.md definem uma arquitetura assíncrona com `pg-boss` como message broker sobre PostgreSQL, eliminando a necessidade de Redis. O modelo de agentes segue um padrão Router → Subagentes para respeitar o limite de 4k tokens do LLM local. O `agent-gallery` (Wfelipe2011) já validou o setup: `ChatOpenAI` apontando para modelo local OpenAI-compatible, input multimodal (base64 de imagem/áudio `.wav`), e `createAgent` com `responseFormat` Zod para structured output.

**Dependência**: `setup-foundation` deve estar completo (entidades TypeORM, contratos, docker-compose, SWC, Vitest).

## Goals / Non-Goals

**Goals:**
- Autenticação JWT completa com Passport (local strategy → JWT emission → JWT guard global)
- CRUD de lançamentos com filtros, vinculado ao usuário autenticado
- Pipeline de chat assíncrono: upload → fila pg-boss → worker LangChain → SSE
- Arquitetura de agentes hierárquica: Router (1 prompt mínimo) + Subagente Consultor + Subagente Operador
- Tools tipadas com Zod (`consultar_gastos`, `adicionar_gasto`, `editar_gasto`)
- Processamento multimodal: áudio `.wav` (transcrição via LLM) e imagem (extração de comprovante via LLM)
- Exportação CSV dos lançamentos filtrados
- Testes de integração com `supertest` + banco real (`docker-compose.test.yml`)

**Non-Goals:**
- Refresh token ou sessões — JWT simples com expiração longa (7 dias)
- Rate limiting ou throttling — MVP
- Streaming parcial do LLM (token por token) — SSE envia apenas resultado final
- Generative UI — modelo responde JSON/texto puro; frontend renderiza

## Decisions

### D1: Passport JWT com guard global + `@Public()` decorator

**Escolha**: `JwtAuthGuard` registrado como `APP_GUARD` global, com `@Public()` decorator para rotas de login.

**Alternativa considerada**: Guards por rota individual. Rejeitado porque a maioria das rotas será protegida; guard global com opt-out é mais seguro (fail-closed).

**Rationale**: Seguindo exatamente o recipe oficial do NestJS Passport com `Reflector` e `IS_PUBLIC_KEY`.

### D2: pg-boss como fila única `chat-jobs`

**Escolha**: Uma fila `chat-jobs` com retry (5 tentativas, exponential backoff). Worker registrado no `onModuleInit`.

**Alternativa considerada**: Filas separadas por tipo (audio, imagem, texto). Rejeitado — overengineering para MVP. O worker pode inspecionar o job e decidir o pipeline.

**Rationale**: Simplicidade. O pg-boss garante exactly-once delivery e retry automático (importante porque o LLM local pode estar offline).

### D3: LangChain `createAgent` (API nova) — mesmo padrão do agent-gallery

**Escolha**: Usar `createAgent` do pacote `langchain` (não `@langchain/langgraph`), com `ChatOpenAI` apontando para `baseURL` customizada.

**Alternativa considerada**: LangGraph com `StateGraph`. Rejeitado porque o agent-gallery validou `createAgent` com sucesso no modelo local, e é mais simples para o padrão Router.

**Rationale**: Consistência com o que já funciona. O `createAgent` suporta tools, structured output e `context` (para injetar `usuario_id`).

### D4: Arquitetura de agentes — Router com subagentes como tools

**Escolha**: 
- **Agente Orquestrador (Router)**: prompt mínimo, tools: `chamar_subagente_consultor` e `chamar_subagente_operador`
- **Subagente Consultor**: tool `consultar_gastos_db`, recebe filtros JSON, retorna dados formatados
- **Subagente Operador**: tools `adicionar_gasto_db` e `editar_gasto_db`, opera stateless (sem histórico)

**Alternativa considerada**: Single agent com todas as tools. Rejeitado porque o limite de 4k tokens seria estourado com system prompt + tools + histórico.

**Rationale**: Seguindo PRD2.md RF04. O Router tem prompt mínimo (~200 tokens). O Subagente Operador é stateless (zero histórico), liberando toda a janela para o payload multimodal.

### D5: SSE via `Subject` (RxJS) compartilhado

**Escolha**: `ChatController` expõe `@Sse('stream/:userId')` retornando `Observable<MessageEvent>`. O worker do pg-boss emite eventos no `Subject` quando o job completa.

**Alternativa considerada**: Polling do frontend. Rejeitado — ineficiente e vai contra o PRD2.

**Rationale**: Padrão documentado no NestJS SSE recipe. O `Subject` é compartilhado entre controller e worker via injeção de dependência.

### D6: `.wav` processado pelo LLM local (transcrição via modelo)

**Escolha**: O buffer `.wav` é convertido para base64 e enviado diretamente ao LLM multimodal (seguindo padrão do `agent-gallery`). O LLM faz a transcrição e extração de intenção.

**Alternativa considerada**: Whisper ou biblioteca de transcrição separada. Rejeitado — adiciona dependência extra; o modelo local (`gemma-4` ou similar) já suporta input de áudio.

**Rationale**: Consistência com `agent-gallery/src/audioResponse.ts`. Menos dependências.

### D7: Exportação CSV via `csv-stringify`

**Escolha**: Biblioteca `csv-stringify` para gerar CSV a partir dos resultados do TypeORM.

**Rationale**: Leve, madura, streaming-friendly. O endpoint retorna `Content-Type: text/csv` com `Content-Disposition: attachment`.

## Risks / Trade-offs

- **[Risk] LLM local offline durante processamento do job** → Mitigação: pg-boss retry com exponential backoff (5 tentativas, 10s delay inicial). Se falhar todas, job vai para dead letter queue.
- **[Risk] Arquivo `.wav` muito grande para 4k tokens** → Mitigação: Validar tamanho máximo no `ParseFilePipe` (ex: 5MB). Se necessário, truncar ou comprimir.
- **[Risk] Subagente Operador não ter contexto suficiente sem histórico** → Mitigação: O Router injeta no prompt do Operador apenas o necessário (dados extraídos do input multimodal). Se falhar, o Operador pode pedir clarificação.
- **[Trade-off] SSE mantém conexão aberta por usuário** → Aceitável para 2 usuários (casal). Se escalar, considerar WebSocket ou polling.
- **[Risk] JWT sem refresh token** → Mitigação: Expiração de 7 dias. Logout simples no client (descarta token).

## Open Questions

- ~~Qual versão do LangChain usar?~~ → `langchain` (createAgent), mesma do agent-gallery
- ~~Como lidar com `.wav`?~~ → Base64 direto para LLM multimodal (padrão agent-gallery)
- ~~Estrutura dos agentes?~~ → Router + 2 Subagentes (Consultor/Operador)