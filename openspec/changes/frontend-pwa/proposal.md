## Why

O cliente Next.js está vazio — apenas scaffold com layout e página inicial. O FinAI precisa de uma interface mobile-first completa como PWA, seguindo o Apple Design System (`DESIGN.md`), com páginas de login, chat inteligente com streaming SSE, dashboard de lançamentos com filtros e exportação CSV, e configurações da IA. O frontend consome os contratos definidos no `setup-foundation` e os endpoints implementados no `backend-core`, com os quais pode ser desenvolvido em paralelo.

## What Changes

- **Apple Design System**: Implementação completa dos tokens do DESIGN.md como custom properties CSS + utilities Tailwind v4 (`@theme`), incluindo cores (Action Blue, Ink, Parchment), tipografia (SF Pro Display/Text), e componentes (buttons, cards, nav)
- **PWA completo**: `manifest.ts` com metadados FinAI, service worker para cache offline, meta tags mobile
- **Login Page**: Tela de autenticação com email/senha, integração com `POST /auth/login`, armazenamento do JWT em cookie/httpOnly
- **Chat Page**: Interface de chat com input multimodal (texto, gravação `.wav`, upload de imagem), indicador de status (pending/processing/completed), streaming SSE via `EventSource`
- **Dashboard Page**: Tabela de lançamentos com filtros (data, categoria), ordenação, e botão de exportação CSV
- **Config Page**: Tela de configurações da IA (base URL, API key)
- **Layout compartilhado**: Shell mobile-first com bottom navigation (Chat, Dashboard, Config), header com user info
- **Testes**: Testes unitários com Vitest + React Testing Library para componentes críticos

## Capabilities

### New Capabilities

- `apple-design-system`: Tokens de design (cores, tipografia, espaçamento, bordas, componentes) do DESIGN.md implementados como custom properties CSS + Tailwind v4 `@theme`
- `auth-ui`: Página de login, proteção de rotas, contexto de autenticação, armazenamento de JWT
- `chat-ui`: Interface de chat com SSE streaming, input multimodal (texto/áudio/imagem), indicadores de status
- `dashboard-ui`: Tabela de lançamentos com filtros, ordenação, exportação CSV
- `config-ui`: Página de configurações da IA por usuário
- `pwa-shell`: Service worker, manifest, meta tags, layout mobile-first com navegação

### Modified Capabilities

<!-- Nenhuma — primeiro change de frontend -->

## Impact

- **client/src/app/**: Novas páginas e layouts: `login/`, `chat/`, `dashboard/`, `config/`, `layout.tsx` (root shell)
- **client/src/components/**: Componentes compartilhados (Button, Card, Input, Nav, ChatBubble, etc.)
- **client/src/hooks/**: `useAuth`, `useSSE`, `useChat`, `useLancamentos`
- **client/src/lib/**: `api.ts` (fetch wrapper com JWT), `audio.ts` (gravação WAV), `csv.ts` (download)
- **client/src/styles/**: `tokens.css` (Apple design tokens), atualização do `globals.css`
- **client/package.json**: Novas deps: `lucide-react` (ícones)
- **client/public/**: Ícones PWA, `sw.js` atualizado