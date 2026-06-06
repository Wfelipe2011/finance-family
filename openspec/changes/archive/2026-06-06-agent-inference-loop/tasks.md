## 1. Shared Contracts and Categories

- [x] 1.1 Update shared category constants/types to `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, and `Receita`
- [x] 1.2 Add shared agent result types for `draft`, `commit`, `read`, and `rejected`
- [x] 1.3 Update server DTO validation and agent schemas to consume the shared category set
- [x] 1.4 Update client category consumers to use the shared category set

## 2. Database Category Migration

- [x] 2.1 Update database/category constraint handling for the new canonical category set
- [x] 2.2 Add normalization for legacy category values such as `Saúde`, `Lazer`, and `Outros`
- [x] 2.3 Add tests proving valid new categories persist and invalid categories are rejected

## 3. Job Context and Media Enrichment

- [x] 3.1 Extend `ChatJobPayload` with raw input and cheap `familyContext` metadata
- [x] 3.2 Ensure `ChatService.submit` enriches jobs without invoking media extractors or LLMs
- [x] 3.3 Move/confirm audio and image extraction execution inside the pg-boss worker path
- [x] 3.4 Ensure Orchestrator input receives compact extracted text plus `familyContext`

## 4. Subagent Result Protocol

- [x] 4.1 Update Consultor to return `status: "read"` with structured read results
- [x] 4.2 Update Operador to return `status: "draft"` for create/edit/delete candidates before persistence
- [x] 4.3 Update Operador to return `status: "rejected"` with `missing_fields` for unsafe or ambiguous mutation payloads
- [x] 4.4 Add commit path that executes write tools only after explicit user confirmation

## 5. Orchestrator Loop

- [x] 5.1 Replace Orchestrator system prompt with the friendly PT-BR user-facing loop rules
- [x] 5.2 Teach Orchestrator to use recent checkpoint memory before asking for repeated details
- [x] 5.3 Convert subagent `rejected` results into concise user questions
- [x] 5.4 Convert subagent `draft`, `read`, and `commit` results into concise PT-BR assistant messages
- [x] 5.5 Remove or convert the direct expense fallback so it cannot write outside draft/commit flow

## 6. Tests and Validation

- [x] 6.1 Add behavior test for "Me chamo Wilson" followed by name recall in the same thread
- [x] 6.2 Add tests proving create/edit/delete requests draft before commit
- [x] 6.3 Add tests proving unconfirmed drafts do not execute write tools
- [x] 6.4 Add tests proving confirmed drafts execute one commit
- [x] 6.5 Add tests proving missing required fields return `rejected`
- [x] 6.6 Run server unit tests with `nvm use`
- [x] 6.7 Run server e2e tests with `nvm use`
- [x] 6.8 Run OpenSpec status for `agent-inference-loop`
