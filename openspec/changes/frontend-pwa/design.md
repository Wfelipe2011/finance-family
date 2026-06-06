## Context

O DESIGN.md fornece um sistema de design completo no estilo Apple — cores (Action Blue `#0066cc`, Ink `#1d1d1f`, Parchment `#f5f5f7`), tipografia (SF Pro Display/Text com negative letter-spacing), espaçamento (base 8px), bordas (pill, lg, sm), e componentes (button-primary, product-tile, utility-card). O PRD2.md especifica uma interface mobile-first para casal com: chat multimodal, dashboard com exportação CSV, e tela de configuração da IA.

O Next.js 16 App Router com Tailwind v4 é a base. A comunicação com o backend usa fetch com JWT no header `Authorization: Bearer`, e SSE via `EventSource` nativo.

**Dependência**: `setup-foundation` deve estar completo (contratos, tooling, PWA scaffold). Pode ser desenvolvido em paralelo com `backend-core` seguindo os contratos de API.

## Goals / Non-Goals

**Goals:**
- Implementar Apple Design System completo como custom properties + Tailwind v4 `@theme`
- PWA funcional: instalação na home screen, cache offline, meta tags mobile
- Login page com validação, feedback de erro, redirecionamento pós-auth
- Chat page com SSE streaming, upload de áudio `.wav` (gravação nativa), upload de imagem
- Dashboard com tabela, filtros, e exportação CSV
- Config page para salvar URL/API key da IA
- Layout mobile-first com bottom navigation (3 tabs)
- Testes unitários com Vitest + React Testing Library

**Non-Goals:**
- Animações complexas ou transições de página — MVP
- Push notifications — futuro (service worker só para cache offline)
- Modo escuro (dark mode) — DESIGN.md documenta apenas variante clara
- Offline-first com sincronização — MVP é online
- Responsivo desktop — foco total em mobile (420-834px)

## Decisions

### D1: Tailwind v4 `@theme` para design tokens (em vez de `tailwind.config.js` v3)

**Escolha**: Usar a diretiva `@theme` do Tailwind v4 no `globals.css` para definir cores, fontes, espaçamentos e bordas.

**Alternativa considerada**: Downgrade para Tailwind v3 com `tailwind.config.js`. Rejeitado — v4 é CSS-first (sem config JS), mais rápido, e já está instalado.

**Rationale**: O DESIGN.md será traduzido para custom properties CSS no `:root` e registrado no `@theme` do Tailwind v4. Ex: `@theme { --color-primary: #0066cc; --font-display: 'SF Pro Display', system-ui; }`

### D2: JWT armazenado em `localStorage` (não cookie httpOnly)

**Escolha**: Armazenar JWT em `localStorage` e enviar via header `Authorization: Bearer` manualmente.

**Alternativa considerada**: Cookie httpOnly (mais seguro). Rejeitado porque o backend é stateless JWT, sem refresh token. localStorage é mais simples e o app é local (uso pessoal em dispositivo próprio).

**Rationale**: Simplicidade para MVP. O risco de XSS é mitigado pelo fato de ser um app local sem conteúdo de terceiros.

### D3: Gravação de áudio `.wav` nativa via MediaRecorder

**Escolha**: Usar `MediaRecorder` com codec `audio/wav` (onde suportado) ou converter para WAV no client antes do upload.

**Alternativa considerada**: Enviar WebM e converter no backend. Rejeitado — o PRD2 diz que o frontend grava `.wav` nativo. O TECH.md confirma: "O front-end Next.js deve garantir a conversão correta de PCM/WebM para `.wav` através da API do navegador".

**Rationale**: O agente-gallery validou que o LLM local aceita `.wav` base64. Manter o processamento no frontend simplifica o backend.

### D4: SSE via `EventSource` nativo (sem biblioteca)

**Escolha**: Usar `EventSource` nativo do navegador para consumir `/chat/stream/:userId`.

**Alternativa considerada**: `@microsoft/fetch-event-source` para melhor controle de erros. Rejeitado — `EventSource` nativo é suficiente; a reconexão automática é built-in.

**Rationale**: Zero dependências. O `EventSource` reconecta automaticamente se a conexão cair.

### D5: Tabela simples com `overflow-x: auto` (sem biblioteca de data grid)

**Escolha**: Tabela HTML nativa com Tailwind styling, scroll horizontal em mobile.

**Alternativa considerada**: TanStack Table ou AG Grid. Rejeitado — overkill para MVP com 2 usuários e poucas colunas.

**Rationale**: Simplicidade. A tabela tem 5 colunas (descrição, valor, data, categoria, ações), que cabem razoavelmente em mobile com scroll horizontal.

### D6: `lucide-react` para ícones

**Escolha**: Biblioteca `lucide-react` para ícones consistentes e leves.

**Rationale**: Tree-shakeable (só importa o que usa), estilo clean compatível com Apple design, sem dependências pesadas.

## Risks / Trade-offs

- **[Risk] `localStorage` JWT vulnerável a XSS** → Mitigação: App local sem conteúdo third-party. Se necessário, migrar para cookie httpOnly no futuro.
- **[Risk] Gravação `.wav` não suportada em todos os browsers mobile** → Mitigação: Fallback para WebM + conversão PCM no frontend (seguindo TECH.md).
- **[Risk] SSE `EventSource` não suporta custom headers** → Mitigação: O userId é passado na URL; autenticação adicional pode ser feita via query param token ou cookie.
- **[Trade-off] Tailwind v4 ainda é relativamente novo (~2025)** → Aceitável: o projeto é greenfield, sem migração. A sintaxe CSS-first é estável.

## Open Questions

- ~~Tailwind v3 ou v4?~~ → v4 (decidido)
- ~~Onde armazenar JWT?~~ → localStorage (decidido)
- ~~Biblioteca de ícones?~~ → lucide-react (decidido)
- ~~Como gravar `.wav`?~~ → MediaRecorder + conversão PCM no frontend