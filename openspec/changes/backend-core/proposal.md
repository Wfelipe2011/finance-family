## Why

O servidor NestJS está vazio — apenas boilerplate de scaffold. Precisamos implementar toda a lógica de negócio do FinAI: autenticação JWT multiusuário, CRUD de lançamentos com filtros e exportação CSV, e o diferencial do produto — o pipeline de chat assíncrono com agentes de IA (LangChain) orquestrados via fila PostgreSQL (`pg-boss`). Este change depende dos contratos e infraestrutura definidos no `setup-foundation`.

## What Changes

- **Auth Module**: Login com email/senha via Passport local, emissão de JWT, guarda JWT global com `@Public()` decorator
- **Users Module**: CRUD de usuários vinculado à entidade `Usuario`, senhas com bcrypt
- **Lancamentos Module**: CRUD completo com filtros por data/categoria, vinculação ao `usuario_id` da sessão, endpoint de exportação CSV
- **Chat Module**: Controller recebendo `multipart/form-data` (texto, `.wav`, imagem), retornando `202 Accepted` imediato, endpoint SSE para streaming de resultados
- **Queue Worker**: Worker do `pg-boss` que consome jobs do chat, processa via LangChain e emite resultados via SSE
- **LangChain Agent Pipeline**: Agente Orquestrador (Router) + Subagente Consultor (leitura) + Subagente Operador (escrita), seguindo o padrão do `agent-gallery`
- **LangChain Tools**: `consultar_gastos`, `adicionar_gasto`, `editar_gasto` com schemas Zod, acessando banco via TypeORM
- **IA Config**: Endpoints para salvar/recuperar `OPENAI_BASE_URL` e `OPENAI_API_KEY` por usuário
- **Testes**: Testes de integração com `supertest` + `docker-compose.test.yml` para todos os fluxos críticos

## Capabilities

### New Capabilities

- `auth`: Autenticação JWT (login, guard global, `@Public()` decorator, bcrypt password hashing)
- `users`: CRUD de usuários vinculado à entidade Usuario
- `lancamentos-crud`: CRUD de lançamentos com filtros, vínculo multiusuário, exportação CSV
- `chat-pipeline`: Controller de chat com upload multimodal, fila pg-boss, worker de processamento, streaming SSE
- `agent-orchestrator`: Agente Roteador + Subagentes Especialistas (LangChain) com tools tipadas (Zod)
- `ia-config`: Configuração por usuário da URL base e API key do modelo local

### Modified Capabilities

<!-- Nenhuma — primeiro change de backend -->

## Impact

- **server/src/**: Novos módulos: `auth/`, `users/`, `lancamentos/`, `chat/`, `queue/`, `agent/`, `config/`
- **server/package.json**: Novas deps: `@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`, `@nestjs/jwt`, `bcrypt`, `langchain`, `@langchain/openai`, `@langchain/core`, `zod`, `multer`, `csv-stringify`, `pg-boss`
- **shared/types/**: Já definidos no setup-foundation; backend implementa os contratos
- **docker-compose.test.yml**: Testes de integração usam banco real para validar fluxos completos