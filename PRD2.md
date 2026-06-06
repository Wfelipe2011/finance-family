Aqui está o **Documento de Requisitos de Software (PRD) consolidado e focado**, contendo estritamente o que definimos para o MVP: a arquitetura assíncrona com `pg-boss`, o suporte multiusuário para o casal, o limite de 4k tokens mitigado por subagentes especialistas, e o suporte multimodal em `.wav` e imagens.

As features que não fazem sentido para a simplicidade do MVP (como Generative UI e Redes de Agentes Complexas) foram completamente removidas.

---

# Documento de Requisitos de Software (PRD) — MVP

## Projeto: Assistente de Lançamentos Financeiros Compartilhado (FinAI)

### 1. Visão Geral do Sistema

O **FinAI** é um sistema pessoal e compartilhado de gestão financeira focado em automação de gastos por IA Local. O sistema permite o controle tradicional (CRUD) e uma interface de chat inteligente operada por um **Agente Roteador** e **Subagentes Especialistas**.

O sistema é projetado para lidar com as restrições físicas de um LLM rodando em um celular (janela de 4k tokens e indisponibilidade offline temporária), utilizando processamento assíncrono em fila e arquitetura enxuta de ferramentas.

---

### 2. Arquitetura e Stack Tecnológica

* **Front-end:** Next.js (configurado como PWA, Mobile-First).
* **Back-end:** NestJS (Node.js) com suporte a **SSE (Server-Sent Events)** para streaming do chat e atualizações de status.
* **Banco de Dados e Fila:** PostgreSQL operando como banco relacional e como motor de mensageria através da biblioteca **`pg-boss`**.
* **Orquestração:** Docker & Docker Compose (Containers isolados para Front-end, Back-end e Banco).
* **Motor de IA:** LangChain (`@langchain/core`) consumindo o modelo local via API OpenAI-compatible.

---

### 3. Requisitos Funcionais (RF)

#### RF01 - Autenticação e Multi-inquilinato (Casal)

* O sistema deve possuir tela de login para suportar dois usuários (você e sua esposa).
* Todo gasto inserido ou editado no banco de dados deve registrar qual usuário realizou a ação (`usuario_id`).

#### RF02 - Tela de Configurações da IA

* Interface simples para o usuário informar e atualizar a `URL Base` e a `API Key` do servidor LLM do celular.

#### RF03 - Interface de Chat e Resposta Assíncrona via Fila (`pg-boss`)

* O usuário envia uma mensagem (texto, áudio `.wav` ou imagem de comprovante).
* **Comportamento Off-line/Resiliente:** O NestJS recebe a requisição, salva a mensagem no banco com o status `pendente`, empilha um job no `pg-boss` e devolve um HTTP `202 Accepted` imediato para o front-end.
* O front-end exibe visualmente que a mensagem está "na fila de processamento".
* O worker do `pg-boss` consome o job, envia para o LLM local (com políticas de *retry* automáticas caso o modelo esteja offline) e, ao obter sucesso, atualiza o banco e envia o resultado para a tela do usuário via **SSE**.

#### RF04 - Arquitetura de Agentes Otimizada para 4k Tokens

Para não estourar o limite de 4k tokens, o sistema dividirá o contexto em três partes:

1. **Agente Orquestrador (Roteador):** Recebe o input do usuário e o histórico curto. Seu único papel é decidir qual ferramenta de subagente chamar (`chamar_subagente_consulta` ou `chamar_subagente_operador`). Seu prompt é mínimo.
2. **Subagente Consultor (Leitura):** Invocado apenas para perguntas sobre relatórios. Recebe como contexto apenas os dados filtrados do banco. Possui a ferramenta `consultar_gastos`.
3. **Subagente Operador (Escrita):** Invocado para criar ou editar gastos. **Não recebe histórico de conversas anteriores**, limpando o contexto de 4k para receber os payloads de imagem/áudio. Possui as ferramentas `adicionar_gasto` e `editar_gasto`.

#### RF05 - Input Multimodal no Chat

* **Áudio (`.wav`):** O front-end grava áudio exclusivamente em formato `.wav` nativo. O back-end recebe o arquivo, realiza a transcrição/extração de intenção através da pipeline do modelo e aciona o Agente Roteador.
* **Imagem (Comprovantes):** O chat permite anexar uma imagem. O back-end converte para `base64` e envia diretamente ao pipeline do Subagente Operador para extração do JSON estruturado e inserção automática.

#### RF06 - Tela de Listagem e Exportação (Visão Tradicional)

* Uma tela contendo a tabela de lançamentos com filtros por data e categoria.
* Um botão para exportar a tabela visível em formato **CSV**.

---

### 4. Requisitos Não-Funcionais (RNF)

#### RNF01 - Gestão Estrita de Memória Curta

* O Agente Orquestrador armazenará e lerá no máximo as **últimas 5 mensagens** do banco de dados para compor o contexto da conversa, garantindo previsibilidade no consumo de tokens.

#### RNF02 - Renderização Nativa (Sem Generative UI)

* Para economizar tokens de saída da IA, o modelo deve sempre responder em texto limpo ou em formatos JSON estritos. O front-end Next.js será o único responsável por interpretar o JSON e renderizar o layout visual da confirmação de sucesso.

---

### 5. Esquema das Ferramentas de Banco (LangChain Tools)

As ferramentas acionadas pelos subagentes especialistas no NestJS serão fortemente tipadas com Zod para garantir consistência:

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Ferramenta exclusiva do Subagente Operador
export const adicionarGastoTool = tool(
  async ({ descricao, valor, categoria, data }, config) => {
    // Lógica do NestJS para persistir no Postgres vinculando ao usuario_id da sessão
    return `Sucesso: O gasto de R$ ${valor} em '${descricao}' foi computado.`;
  },
  {
    name: "adicionar_gasto",
    description: "Grava uma nova despesa no banco de dados.",
    schema: z.object({
      descricao: z.string().describe("Nome do local ou item comprado"),
      valor: z.number().describe("Valor numérico do gasto"),
      categoria: z.string().describe("Alimentação, Transporte, Lazer, Saúde ou Outros"),
      data: z.string().optional().describe("Data em formato AAAA-MM-DD"),
    }),
  }
);

```

---

### 6. Fluxo de Execução do Job (`pg-boss`)

1. **PWA (Celular):** Envia comando de voz: *"Gravação de áudio `.wav` relatando gasto de 50 reais de gasolina"* $\rightarrow$ HTTP POST.
2. **NestJS (Back-end):** Recebe o buffer `.wav`, salva em disco temporário, insere registro com status `processando` no Postgres e cria um Job no `pg-boss`. Retorna `202` para o celular.
3. **`pg-boss` Worker:** Executa em background.
* Transcreve o áudio.
* Envia o texto ao Agente Orquestrador $\rightarrow$ Roteia para o Subagente Operador.
* O Subagente Operador executa a tool `adicionar_gasto` e insere o registro no banco.


4. **SSE Gateway:** O worker finaliza o job com sucesso e dispara um evento via SSE: `{ status: 'completed', message: 'Gasto de R$ 50,00 em Posto de Gasolina adicionado pelo comando de voz!' }`.
5. **PWA (Celular):** Ouve o evento SSE, remove o estado de "carregamento" e insere a mensagem de sucesso no chat do casal.