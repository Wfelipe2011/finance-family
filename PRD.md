Documento de Requisitos de Produto (PRD) – Jarvis Finance Assistant
Objetivo
Este documento descreve os requisitos para evoluir o Jarvis, assistente de finanças da família, de um protótipo multi‑agente com subagentes para um agente único baseado em skills. A mudança visa simplificar a arquitetura, reduzir o consumo de tokens e melhorar a experiência de uso (persistência do chat, transmissão em tempo real e suporte a múltiplos usuários). O PRD servirá de guia para a equipe de desenvolvimento e para o modelo de geração de código (Codex) implementar as alterações.
Contexto e justificativa
Limitações do modelo atual
	Subagentes e contexto: A arquitetura atual utiliza um agente supervisor que coordena subagentes. Segundo a documentação da LangChain, subagentes são estateless: cada invocação começa do zero, o supervisor mantém a memória da conversa e os subagentes repetem todo o fluxo a cada chamada[1]. Esse isolamento de contexto é bom para tarefas muito distintas, porém aumenta a latência e consome tokens extras em chamadas repetidas[2].
	Perda de contexto no front‑end: o histórico completo da conversa não é salvo; quando a página é recarregada, o usuário e sua esposa não conseguem ver as mensagens antigas. A IA faz um resumo para respeitar a janela de contexto, mas esse resumo não substitui as mensagens originais para o usuário.
	Streaming ausente: as respostas do Jarvis são entregues apenas quando completas, o que torna a experiência menos fluida.
Vantagens do padrão skill
	Carregamento sob demanda: Skills são especializações definidas por prompts e carregadas apenas quando necessárias. O padrão de skills usa progressive disclosure, permitindo que o agente carregue conhecimento de domínio sem estourar a janela de contexto e sem repetir o fluxo inteiro[3].
	Composição leve: cada skill consiste em um prompt especializado e pode registrar ferramentas específicas. É mais leve que subagentes e facilita a manutenção[4].
	Reutilização de contexto: quando uma skill é carregada uma vez, ela pode ser reutilizada em chamadas subsequentes sem necessidade de recarregamento completo[5].
Meta de melhoria
	Simplificar a arquitetura substituindo subagentes por um único agente Jarvis que faz o roteamento determinístico e carrega skills conforme necessário.
	Aumentar o limite de tokens seguros de 4 k para 8 k, mantendo um limite de corte em 4 k para acionar summarização.
	Melhorar a experiência de chat (persistência das mensagens, transmissão em tempo real, suporte a múltiplos usuários).
Escopo
Funcionalidades em escopo
1.	Prompt base: adotar um prompt enxuto para o Jarvis:
Você é Jarvis, assistente pessoal familiar.
Responda de forma útil, curta e prática.
<Aqui vamos deixar que as skills adicionem mais contexto>
1.	Skills e endpoint:
2.	Criar um módulo de skills com pelo menos três skills iniciais: finance_crud, finance_query e finance_report. Cada skill conterá um prompt especializado e registrará apenas as ferramentas necessárias (por exemplo, createTransaction, listTransactions, etc.).
3.	Implementar um endpoint (ex.: GET /api/skills) que retorne a lista de skills disponíveis, permitindo que o front mostre ao usuário quais competências o Jarvis possui.
4.	As skills devem ser carregadas sob demanda e devem indicar quais tools utilizar. Após algumas interações (parâmetro configurável), a skill deve ser descarregada da memória para liberar tokens antes da summarização.
5.	Gestão de tokens e summarização:
6.	Configurar a janela de contexto máxima em 8 k tokens e definir um gatilho de summarização em 4 k tokens. A summarização deve utilizar o SummarizationMiddleware (ou equivalente) para condensar mensagens antigas sem descartar completamente o histórico[6]. Exemplo de uso:
 	```python from langchain.agents import create_agent from langchain.agents.middleware import SummarizationMiddleware from langgraph.checkpoint.memory import InMemorySaver
 	checkpointer = InMemorySaver() agent = create_agent( model="gpt-5.5", tools=[...], middleware=[ SummarizationMiddleware( model="gpt-5.4-mini", trigger=("tokens", 4000), keep=("messages", 20) ) ], checkpointer=checkpointer, ) ```[7]
7.	Persistência e unificação do chat:
8.	Persistir todas as mensagens (incluindo mensagens que foram resumidas para a IA) em um banco de dados. No front‑end, exibir a história completa da conversa, independentemente de summarização, para que os usuários possam ver o contexto.
9.	Associar cada conversa a uma thread ou grupo (ver item 6) e garantir que recarregamentos de página recuperem o histórico e o resumo associado.
10.	Streaming de respostas:
11.	Utilizar a funcionalidade de streaming do LangChain para transmitir as respostas do Jarvis token a token. A documentação destaca que o streaming permite exibir a saída progressivamente, melhorando a experiência de uso[8].
12.	Implementar no back‑end o uso de agent.stream ou API equivalente com o modo messages para transmitir tokens gerados; no front‑end, exibir a mensagem enquanto está sendo gerada (indicação de “Jarvis está digitando”).
13.	Arquitetura de grupo familiar:
14.	Criar a estrutura de grupo, com os membros “eu”, “minha esposa” e “Jarvis”. Cada mensagem será associada a um autor e a um grupo.
15.	Implementar lógica de roteamento determinístico: se a mensagem não contiver @jarvis, ela é apenas uma conversa entre humanos e é armazenada; se contiver @jarvis, o conteúdo após a menção será enviado para a LLM. Menções como @esposa serão usadas para chamar a usuária sem acionar o Jarvis.
16.	Descarregamento de skills:
17.	Definir um mecanismo para descarregar uma skill após um determinado número de interações ou quando a conversa sair do contexto daquela skill, liberando tokens na memória curta. O descarregamento pode consistir em remover o prompt especializado da memória e desregistrar as ferramentas associadas.
Funcionalidades fora de escopo
	Mudanças na lógica de negócios de cada ferramenta (por exemplo, cálculos financeiros). O objetivo é reorganizar a arquitetura e melhorar a usabilidade; as ferramentas existentes podem ser reutilizadas.
	Novos recursos que não estejam relacionados a skills, grupo familiar ou streaming.
Requisitos não funcionais
1.	Desempenho: A latência de respostas deve permanecer aceitável (< 2 s) mesmo com streaming. A utilização de skills e summarização deve reduzir o número de chamadas de modelo em comparação com subagentes.
2.	Escalabilidade: A estrutura de grupos deve permitir múltiplos grupos familiares e deve suportar novos membros no futuro.
3.	Segurança: As mensagens e dados financeiros devem ser armazenados de forma segura e acessível apenas aos membros do grupo. O roteamento de mensagens deve impedir que mensagens entre humanos sejam processadas pela LLM sem menção explícita.
4.	Compatibilidade: O sistema deve continuar funcionando com o modelo customizado (gemma‑4 no S25Plus) e respeitar a política de tokens da API.
Critérios de aceitação
	O Jarvis responde utilizando o prompt base e carrega skills conforme necessário; subagentes antigos são removidos.
	O endpoint GET /api/skills retorna finance_crud, finance_query e finance_report e pode ser ampliado com novas skills.
	O chat mantém e exibe todo o histórico de mensagens (usuários e Jarvis) mesmo após recarregar a página.
	As respostas do Jarvis são exibidas de forma progressiva via streaming, mostrando ao usuário que o assistente está digitando [8].
	Ao atingir 4 k tokens de conversação, o sistema aciona o SummarizationMiddleware (ou mecanismo equivalente) para gerar um resumo e manter a conversa dentro dos 8 k tokens[6].
	O descarregamento de skills ocorre conforme configurado e não prejudica a continuidade do chat.
Considerações finais
A transição de uma arquitetura de subagentes para uma arquitetura de skills deve reduzir custos e complexidade sem perder as funcionalidades que já existem. O padrão de skills favorece a especialização sob demanda e a composição leve[3], enquanto a introdução de streaming e persistência do chat melhora a experiência do usuário. Este PRD fornece as diretrizes para que a equipe implemente as mudanças de forma organizada e com apoio de exemplos da documentação oficial da LangChain.

[1] [2] [5] Multi-agent - Docs by LangChain
https://docs.langchain.com/oss/javascript/langchain/multi-agent
[3] [4] Skills - Docs by LangChain
https://docs.langchain.com/oss/javascript/langchain/multi-agent/skills
[6] [7] Short-term memory - Docs by LangChain
https://docs.langchain.com/oss/python/langchain/short-term-memory
[8] Streaming - Docs by LangChain
https://docs.langchain.com/oss/python/langchain/streaming
