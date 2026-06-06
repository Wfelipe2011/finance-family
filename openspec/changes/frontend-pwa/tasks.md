## 1. Apple Design System Foundation

- [x] 1.1 Create `client/src/styles/tokens.css` with all DESIGN.md color custom properties on `:root`
- [x] 1.2 Add typography tokens: `--font-display`, `--font-text`, font sizes, weights, line-heights, letter-spacing
- [x] 1.3 Add spacing tokens: `--spacing-*` (4, 8, 12, 17, 24, 32, 48, 80)
- [x] 1.4 Add radius tokens: `--radius-*` (none, sm, md, lg, pill, full)
- [x] 1.5 Add product shadow token: `--shadow-product`
- [x] 1.6 Register all tokens in Tailwind v4 `@theme` directive in `globals.css`
- [x] 1.7 Create utility classes: `btn-primary`, `btn-secondary-pill`, `btn-dark-utility`, `card-utility`, `tile-light`, `tile-dark`, `tile-parchment`
- [x] 1.8 Install and configure `lucide-react`

## 2. Shared Hooks & API Client

- [x] 2.1 Create `client/src/lib/api.ts` — fetch wrapper with `Authorization: Bearer` header, 401 interceptor
- [x] 2.2 Create `client/src/hooks/useAuth.ts` — AuthContext with React Context, login/logout, token persistence in localStorage
- [x] 2.3 Create `client/src/hooks/useSSE.ts` — `EventSource` connection management with auto-reconnect
- [x] 2.4 Create `client/src/hooks/useLancamentos.ts` — fetch, filter, export, CRUD operations
- [x] 2.5 Create `client/src/hooks/useChat.ts` — message list, send, status tracking, SSE integration
- [x] 2.6 Create `client/src/lib/audio.ts` — MediaRecorder wrapper for `.wav` recording (with PCM conversion fallback)

## 3. Layout & Navigation Shell

- [x] 3.1 Update `client/src/app/layout.tsx` — wrap with `AuthProvider`, add PWA meta tags, import tokens.css
- [x] 3.2 Create `client/src/components/BottomNav.tsx` — 3 tabs: Chat (MessageCircle), Dashboard (LayoutDashboard), Config (Settings), icons from lucide-react
- [x] 3.3 Style BottomNav: Action Blue active, ink-muted inactive, Apple-style background (parchment or white)
- [x] 3.4 Create `client/src/app/(authenticated)/layout.tsx` — authenticated shell with BottomNav
- [x] 3.5 Implement route protection middleware: redirect unauthenticated to `/login`, authenticated away from `/login`

## 4. Login Page

- [x] 4.1 Create `client/src/app/login/page.tsx` — "use client" page with email/password form
- [x] 4.2 Create `client/src/components/LoginForm.tsx` — styled with Apple design (parchment background, Action Blue button)
- [x] 4.3 Implement form validation: email format, password min 6 chars
- [x] 4.4 Integrate with `POST /auth/login`, store JWT in context + localStorage
- [x] 4.5 Error display: "Email ou senha inválidos" for 401
- [x] 4.6 Loading state on submit button (spinner + disabled)
- [x] 4.7 Redirect authenticated users to `/chat`

## 5. Chat Page

- [x] 5.1 Create `client/src/app/(authenticated)/chat/page.tsx` — chat container with message list + input area
- [x] 5.2 Create `client/src/components/ChatBubble.tsx` — user (right, blue tint) vs assistant (left, parchment), Apple typography
- [x] 5.3 Create `client/src/components/ChatInput.tsx` — text input, microphone button, attachment button, send button
- [x] 5.4 Create `client/src/components/StatusIndicator.tsx` — pending (clock), processing (spinner), completed (check), failed (error)
- [x] 5.5 Implement text message send: call `POST /chat/message`, show pending status, add to list
- [x] 5.6 Implement audio recording: mic button → MediaRecorder → `.wav` → upload
- [x] 5.7 Implement image upload: attachment button → file picker → upload
- [x] 5.8 Implement SSE stream: `EventSource` on `/chat/stream/:userId`, update messages on events
- [x] 5.9 Handle SSE reconnection and cleanup on unmount
- [x] 5.10 Auto-scroll to bottom on new messages
- [x] 5.11 Empty state: welcome message "FinAI — Seu assistente financeiro"

## 6. Dashboard Page

- [x] 6.1 Create `client/src/app/(authenticated)/dashboard/page.tsx` — dashboard container
- [x] 6.2 Create `client/src/components/LancamentoTable.tsx` — table with columns: Descrição, Valor, Data, Categoria
- [x] 6.3 Format `valor` as currency (R$ with `Intl.NumberFormat`)
- [x] 6.4 Format `data` as `DD/MM/YYYY`
- [x] 6.5 Make table horizontally scrollable on mobile (`overflow-x: auto`)
- [x] 6.6 Create `client/src/components/FilterBar.tsx` — date range pickers + categoria dropdown + clear button
- [x] 6.7 Integrate filters with `GET /lancamentos` query params
- [x] 6.8 Implement "Exportar CSV" button: call `GET /lancamentos/export`, trigger download
- [x] 6.9 Loading state: skeleton rows while fetching
- [x] 6.10 Error state: error message + retry button
- [x] 6.11 Empty state: "Nenhum lançamento encontrado" with illustration

## 7. Config Page

- [x] 7.1 Create `client/src/app/(authenticated)/config/page.tsx` — config container
- [x] 7.2 Create `client/src/components/IAConfigForm.tsx` — baseUrl input, apiKey input (password type with show/hide)
- [x] 7.3 Pre-populate form with `GET /config/ia` on mount
- [x] 7.4 Mask apiKey display (last 4 chars visible, rest dots)
- [x] 7.5 Validate baseUrl format before submit
- [x] 7.6 Implement save: `PUT /config/ia`, loading state, success toast
- [x] 7.7 Error toast on save failure

## 8. PWA Polish

- [x] 8.1 Update `client/src/app/manifest.ts` with FinAI metadata per DESIGN.md (theme_color: #1d1d1f)
- [x] 8.2 Create PWA icons: `icon-192x192.png`, `icon-512x512.png`, `apple-icon-180x180.png` in `public/`
- [x] 8.3 Update `client/public/sw.js` — cache static assets (HTML, CSS, JS, icons) for offline shell
- [x] 8.4 Add iOS install prompt component (detect iOS + non-standalone, show instructions)
- [x] 8.5 Add security headers in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

## 9. Unit Tests

- [x] 9.1 Test `LoginForm` renders and validates input
- [x] 9.2 Test `LoginForm` error state on invalid credentials
- [x] 9.3 Test `ChatBubble` renders user vs assistant styling
- [x] 9.4 Test `StatusIndicator` renders correct icon per status
- [x] 9.5 Test `LancamentoTable` renders rows with formatted values
- [x] 9.6 Test `FilterBar` emits correct filter values
- [x] 9.7 Test `BottomNav` highlights active tab
- [x] 9.8 Test `IAConfigForm` pre-populates and validates URL
- [x] 9.9 Test `api.ts` attaches JWT header and handles 401
- [x] 9.10 Test route protection: unauthenticated redirects to `/login`

## 10. Validation

- [x] 10.1 Verify `npm run build` succeeds (Next.js standalone)
- [x] 10.2 Verify `npm test` passes all unit tests
- [x] 10.3 Verify PWA manifest is accessible at `/manifest.json`
- [x] 10.4 Verify service worker is registered and caches assets
- [x] 10.5 Verify all pages render correctly on mobile viewport (375x812)
- [x] 10.6 Manual test: login flow, chat message, SSE streaming, dashboard with data, CSV export, config save
- [x] 10.7 Verify Apple Design System: check Action Blue (#0066cc) only used for interactive elements, no decorative gradients or extra shadows
