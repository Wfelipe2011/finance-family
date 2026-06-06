Aqui está o documento de especificação técnica e arquitetura detalhada estruturado especificamente para alimentar o seu **Codex** (ou base de conhecimento de contexto para desenvolvimento de IA).

Este arquivo compila de forma cirúrgica os conceitos, APIs e padrões das ferramentas mapeadas, mantendo o escopo estritamente enxuto do seu MVP: **NestJS assíncrono com `pg-boss` (Postgres) + Next.js PWA + Fluxo de Multi-Agentes Otimizados (LangChain) com limite de 4k tokens**.

---

# 📑 Codex: Especificação Técnica e Guia de Engenharia (FinAI MVP)

## 1. Infraestrutura, Banco de Dados e Fila Assíncrona

### 1.1 `pg-boss` & NestJS Database Configuration (`@nestjs/config`, `TypeORM`, `Postgres`)

Para evitar a complexidade do Redis no celular, o `pg-boss` usa o próprio PostgreSQL como mecanismo de filas garantindo persistência transacional (`ACID`).

* **Configuração Dinâmica (`@nestjs/config`):** Utilização do `ConfigModule` com validação de variáveis de ambiente via Joi/Zod para injetar dinamicamente `DATABASE_URL`, `OPENAI_BASE_URL` e `OPENAI_API_KEY`.
* **TypeORM (`@nestjs/typeorm`):** Conectado ao driver `pg`. O NestJS gerencia o pool de conexões tradicionais e o ciclo de vida das entidades (`Usuario` e `Lancamento`).
* **Inicialização do `pg-boss`:** Deve ser instanciado logo após a conexão do banco de dados estar pronta. Ele cria automaticamente suas próprias tabelas internas de controle de jobs (`pgboss.job`, `pgboss.schedule`, etc.) em um esquema isolado.

```typescript
// Exemplo estrutural de inicialização do PgBoss no NestJS via Service
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import PgBoss from 'pg-boss';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private boss: PgBoss;

  constructor() {
    this.boss = new PgBoss(process.env.DATABASE_URL!);
  }

  async onModuleInit() {
    this.boss.on('error', error => console.error(error));
    await this.boss.start();
  }

  async sendJob(queueName: string, data: object) {
    return await this.boss.send(queueName, data, { retryLimit: 5, retryDelay: 10 });
  }

  async registerWorker(queueName: string, handler: Function) {
    await this.boss.work(queueName, async (job) => {
      await handler(job.data);
    });
  }

  async onModuleDestroy() {
    await this.boss.stop();
  }
}

```

---

## 2. Camada de Back-end (NestJS Arquitetura & Otimizações)

### 2.1 Compilação Ultra-Rápida com SWC (`@nestjs/cli` com SWC)

Considerando que a infraestrutura local em celulares possui gargalos de escrita/leitura em disco, a compilação do NestJS deve abandonar o `tsc` clássico em favor do **SWC (Speedy Web Compiler)**.

* **Configuração:** Ativação via flag no CLI: `nest start --b swc` ou definindo `"compilerOptions": { "builder": "swc" }` no `nest-cli.json`. Reduz o tempo de boot e reload do servidor local em até 10x.

### 2.2 Autenticação Multi-User com Passport (`@nestjs/passport`)

Para isolar os gastos do casal, o sistema implementa uma estratégia padrão de autenticação baseada em **JWT (JSON Web Tokens)** ou Cookies de sessão.

* **Guarda de Rotas (`AuthGuard`):** Injeta o `usuario_id` extraído do payload decodificado do token diretamente no objeto `Request`. As *tools* da IA usam esse ID injetado no contexto da requisição para blindar a concorrência de banco, impedindo que requisições de um usuário acessem dados de outro.

### 2.3 File Upload (`@nestjs/platform-express` / Multer)

O endpoint de chat precisa receber buffers binários via requisições `multipart/form-data`.

* **Áudio:** Interceptador `FileInterceptor('file')` configurado para aceitar apenas arquivos com MIME-type `audio/wav`. O buffer do arquivo é salvo temporariamente ou lido diretamente em memória para conversão em base64 e encaminhamento posterior ao worker.

### 2.4 Server-Sent Events (SSE) para Notificações do Chat (`@nestjs/common`)

Como o processamento do LLM local é lento e assíncrono via `pg-boss`, o ciclo tradicional de HTTP Request-Response deve ser quebrado. O NestJS implementará um endpoint `/chat/stream` usando a especificação nativa de SSE do HTML5.

```typescript
// Endpoint conceitual de streaming baseado em RXJS Observables no NestJS
import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('chat')
export class ChatController {
  private eventSubject = new Subject<any>();

  // O Worker do pg-boss chama este método ao finalizar a tarefa do LLM
  emitChatUpdate(userId: string, payload: object) {
    this.eventSubject.next({ userId, payload });
  }

  @Sse('stream/:userId')
  streamEvents(): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      map((data) => ({ data: data.payload } as MessageEvent))
    );
  }
}

```

---

## 3. Camada de Front-end (Next.js PWA & Interface)

### 3.1 Next.js App Router Structure & Deployment

O front-end adota o **Next.js App Router**, utilizando Server Components por padrão para performance e Client Components (`"use client"`) exclusivamente nas áreas reativas do Chat, Modals e Tabelas Dinâmicas.

* **PWA (Progressive Web App):** Configurado através do arquivo `next.config.js` estendendo plugins como `@ducanh2912/next-pwa`. Requer a criação do `manifest.json` com os ícones adequados e suporte a Service Workers para cache de assets estáticos, garantindo que a casca visual do app abra instantaneamente no celular mesmo se o back-end Docker estiver reiniciando.
* **Estilização:** Tailwind CSS v3 integrado nativamente via PostCSS no Next.js para interface mobile responsiva (Mobile-First).
* **Build de Produção via Docker (Standalone):** O Next.js deve ser configurado com `output: 'standalone'` no `next.config.js`. Isso cria um build enxuto auto-contido, reduzindo o tamanho da imagem do container Docker de ~1GB para ~150MB, crucial para o armazenamento limitado do smartphone.

---

## 4. Engenharia de IA e Orquestração de Contexto (LangChain)

### 4.1 Gestão estrita de Janela de Contexto (4k Token Limit)

Para manter o modelo funcional sob a restrição de 4k tokens, o LangChain não utilizará `BufferMemory` bruto. A arquitetura adota uma abordagem híbrida:

1. **Short-Term Window Memory:** O histórico do chat armazenado no banco é truncado via código. Apenas os últimos 4 *turns* (8 mensagens no total) são anexados ao prompt do **Agente Orquestrador**.
2. **Zero-Memory Workers:** Os subagentes de escrita (Operadores) operam em modo *stateless*. Eles não recebem o histórico da conversa, limpando toda a janela de 4k para que possa ser preenchida inteiramente com a transcrição ou o array Base64 de visão computacional.

### 4.2 Arquitetura de Multi-Agentes Hierárquica (Router Design Pattern)

O sistema descarta topologias complexas de grafos de agentes e adota um padrão de árvore enxuta e unidirecional:

* **Models (`@langchain/openai`):** Iniciação usando a classe abstrata apontando para o servidor local através da propriedade `configuration: { baseURL }`.
* **Structured Output:** Utilização obrigatória de `.withStructuredOutput(ZodSchema)` nos subagentes. Garante que os modelos locais menores retornem obrigatoriamente um objeto JSON estrito em vez de texto conversacional poluidor, economizando tokens de saída e eliminando a necessidade de componentes pesados de Generative UI.

#### Componentes da Árvore de Agentes:

1. **Agente Orquestrador (The Router):**
* **Prompt:** Mínimo e direto. *"Você é um roteador de mensagens financeiras. Classifique a entrada e invoque a ferramenta correspondente para chamar o subagente especialista."*
* **Tools Disponíveis:** `chamar_subagente_consultor` e `chamar_subagente_operador`.


2. **Subagente Consultor (Especialista em Leitura):**
* **Tools Disponíveis:** `consultar_gastos_db(filtros: JSON)`. Ele recebe a query do usuário, executa a busca no PostgreSQL e resume o dado formatado.


3. **Subagente Operador (Especialista em Escrita):**
* **Tools Disponíveis:** `adicionar_gasto_db()` e `editar_gasto_db()`. É o encarregado de parsear os dados extraídos de áudio/imagem e fazer a mutação no estado do banco de dados.



---

## 5. Qualidade e Estratégia de Testes Automatizados

Para garantir que a lógica de negócio (como cálculo de gastos, parsing de CSV e roteamento de ferramentas) não quebre durante modificações no celular, a suíte de testes deve ser extremamente leve e performática.

### 5.1 Vitest (Substituindo o Jest no Front-end)

O Next.js será testado usando **Vitest** com suporte nativo a ESModules e SWC. O Vitest elimina a lentidão de inicialização de suítes tradicionais, permitindo rodar asserções de componentes UI reativos de forma instantânea.

### 5.2 `supertest` no NestJS (Testes de Integração de API)

Para garantir a sanidade dos fluxos de criação de gastos e autenticação sem precisar interagir com a interface reativa:

* Utilização do `supertest` integrado com o ambiente `TestingModule` do NestJS.
* **Fluxo de Teste Crítico:** Simular o disparo de um arquivo multipart `audio/wav` para o endpoint do NestJS, verificar se o retorno é status `202 Accepted` e certificar que um job foi inserido com sucesso na fila do banco de dados, fechando o escopo de segurança do MVP.