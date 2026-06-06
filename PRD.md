# Documento de Requisitos de Software (PRD)

## Projeto: Assistente de Lançamentos Financeiros Compartilhado (FinAI)

### 1. Visão Geral do Sistema

O **FinAI** é um ecossistema PWA de gestão financeira pessoal focado em automação e consultas por Inteligência Artificial Local. O diferencial do sistema está na interface de chat inteligente operada por um **Agente Autónomo**. Esse agente possui acesso a ferramentas (*tools*) que o permitem consultar o histórico de gastos, inserir novos registros ou editar lançamentos existentes. O sistema é multiusuário, projetado especificamente para uso compartilhado entre o casal, e suporta interações via texto, imagens de comprovantes e comandos de voz (áudio `.wav`).

---

### 2. Arquitetura e Stack Tecnológica Expandida

* **Front-end:** Next.js (configurado como PWA, Mobile-First).
* **Back-end:** NestJS (Node.js) com suporte a **SSE (Server-Sent Events)** para streaming de respostas do chat e atualizações assíncronas de arquivos.
* **Banco de Dados:** PostgreSQL (armazenando usuários, lançamentos e logs de auditoria).
* **Orquestração:** Docker & Docker Compose.
* **Motor de IA (Agentic Workflow):** LangChain / Deepagents operando um fluxo de *Function Calling* acoplado ao modelo local (`gemma-4`).

---

### 3. Requisitos Funcionais (RF)

#### RF01 - Autenticação e Gestão de Usuários (Casal)

* O sistema deve possuir uma tela de cadastro e login.
* O sistema deve permitir a criação de múltiplos usuários. O escopo inicial é o uso compartilhado por 2 usuários (você e sua esposa).
* Cada lançamento de gasto no banco de dados deve obrigatoriamente registrar o `ID` do usuário que o criou ou modificou.

#### RF02 - Painel de Configurações da IA

* Espaço para configurar a `URL Base` e a `API Key` do servidor local do modelo.

#### RF03 - Interface de Chat Conversacional (Camada de Consulta e Ação)

* O usuário terá uma tela dedicada de chat para conversar com o modelo em linguagem natural.
* O chat deve suportar o streaming de texto do modelo via SSE.
* A IA deve ser configurada como um Agente que decide dinamicamente quando invocar funções (*tools*).

#### RF04 - Ferramentas do Agente (Agent Tools / Function Calling)

O back-end do NestJS exporá ferramentas específicas para o LangChain usar durante o chat:

* **`consultar_gastos`**: Permite à IA buscar registros no banco com base em filtros gerados dinamicamente por ela (ex: *"Quanto gastamos no Carrefour este mês?"*).
* **`adicionar_gasto`**: Permite à IA criar um novo registro diretamente pela conversa (ex: *"Adiciona aí que acabei de gastar 30 reais com Uber"*).
* **`editar_gasto`**: Permite à IA alterar um registro existente pelo chat (ex: *"Mude o valor do último mercado para R$ 150"*).

#### RF05 - Processamento Multimodal no Chat (Imagem e Áudio)

O input do chat aceitará texto, anexos de imagem e mensagens de voz.

* **Upload de Comprovante (Imagem):** Ao enviar uma imagem no chat, a IA lerá os dados (via visão computacional em base64) e usará a tool `adicionar_gasto` automaticamente, confirmando o sucesso na resposta do chat.
* **Mensagem de Voz (Áudio):** O front-end gravará áudio estritamente no formato `.wav`. Ao enviar, o back-end processará o arquivo e enviará para a IA extrair a intenção (seja uma pergunta sobre os gastos, um comando de inserção ou uma edição).

#### RF06 - CRUD Tradicional, Filtros e Exportação

* Além do chat, o sistema manterá uma tela visual tradicional contendo a tabela de lançamentos, filtros por data/categoria e o botão para **Exportar CSV**.

---

### 4. Requisitos Não-Funcionais (RNF)

#### RNF01 - Isolamento e Contexto de Mensagens

* O histórico do chat deve persistir em memória de sessão ou banco de dados para que o modelo mantenha o contexto da conversa atual (*Short-term Memory*).
* As consultas ao banco feitas pelas *tools* da IA devem respeitar o escopo dos usuários cadastrados (garantindo que ela veja e gerencie os gastos corretos do casal).

#### RNF02 - Resiliência no Formato de Áudio

* O front-end Next.js deve garantir a conversão correta de PCM/WebM para `.wav` através da API do navegador antes de realizar o envio para o back-end.

---

### 5. Arquitetura das Tools no NestJS (Exemplo de Estrutura)

Para o agente conseguir alterar e consultar o PostgreSQL, o NestJS definirá funções estruturadas que o modelo consegue interpretar via LangChain. Segue o modelo conceitual do esquema de ferramentas:

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Ferramenta que a IA vai invocar secretamente quando você pedir para ela salvar algo
export const adicionarGastoTool = new DynamicStructuredTool({
  name: "adicionar_gasto",
  description: "Útil para criar um novo registro de gasto ou despesa no banco de dados.",
  schema: z.object({
    descricao: z.string().describe("O nome do local ou o item comprado"),
    valor: z.number().describe("O valor do gasto"),
    categoria: z.string().describe("Alimentação, Transporte, Lazer, Saúde ou Outros"),
    data: z.string().optional().describe("Data no formato AAAA-MM-DD. Se não informada, assumir o dia de hoje"),
  }),
  func: async ({ descricao, valor, categoria, data }) => {
    // Injeção do Service do NestJS para salvar no Postgres
    // const novoGasto = await lancamentosService.create({ descricao, valor, categoria, data });
    return `Gasto de R$ ${valor} em '${descricao}' foi registrado com sucesso no banco de dados.`;
  },
});

```

---

### 6. Atualização do Modelo de Dados (PostgreSQL / Prisma ou TypeORM)

O banco de dados precisa suportar o vínculo com os usuários. Abaixo, a estrutura sugerida para suas tabelas:

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lancamentos (
    id SERIAL PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    categoria VARCHAR(50) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

### Próximo Passo no Desenvolvimento:

Como você já tem o back-end preparado para o processamento base no `agent-gallery`, o seu primeiro passo no NestJS será estruturar o módulo de **Atores (Users)** e o gateway de **Chat**. Quando o usuário enviar o `.wav`, o controller vai ler o buffer do arquivo, passá-lo na pipeline de áudio que você já criou, e injetar o texto resultante diretamente no array de mensagens que o Agente avalia.