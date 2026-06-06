## ADDED Requirements

### Requirement: Root layout with bottom navigation
The system SHALL provide a root layout with a bottom navigation bar containing 3 tabs: Chat, Dashboard, Config. The active tab SHALL be highlighted with Action Blue.

#### Scenario: Bottom nav visible on all authenticated pages
- **WHEN** user is authenticated and on `/chat`, `/dashboard`, or `/config`
- **THEN** the bottom navigation bar is visible with 3 tabs

#### Scenario: Active tab highlighted
- **WHEN** user is on `/chat`
- **THEN** the Chat tab icon and label are colored `--color-primary` (#0066cc)

#### Scenario: Navigate via tabs
- **WHEN** user taps the Dashboard tab
- **THEN** navigation occurs to `/dashboard`

### Requirement: PWA manifest
The system SHALL serve a valid `manifest.json` at `/manifest.json` with FinAI metadata: `name: 'FinAI'`, `short_name: 'FinAI'`, `display: 'standalone'`, `theme_color: '#1d1d1f'`, `background_color: '#ffffff'`, icons (192x192 and 512x512).

#### Scenario: Manifest accessible
- **WHEN** browser requests `/manifest.json`
- **THEN** a valid JSON web manifest is returned

### Requirement: Service worker for offline shell
The system SHALL register a service worker at `/sw.js` that caches static assets (HTML, CSS, JS, icons) for offline shell rendering.

#### Scenario: Service worker installed
- **WHEN** the PWA loads for the first time
- **THEN** the service worker is installed and caches static assets

#### Scenario: Offline shell
- **WHEN** the device is offline
- **THEN** the app shell (navigation, layout) is still visible from cache

### Requirement: Apple touch icon
The system SHALL include `<link rel="apple-touch-icon">` in the layout head pointing to a 180x180 icon.

#### Scenario: Apple touch icon present
- **WHEN** inspecting the page head
- **THEN** `<link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">` is present

### Requirement: Mobile meta tags
The system SHALL include viewport meta tag with `user-scalable=no`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (black-translucent), and `theme-color` in the layout head.

#### Scenario: Mobile-optimized viewport
- **WHEN** the page loads on mobile
- **THEN** the viewport is configured for standalone PWA experience

### Requirement: iOS install prompt
The system SHALL show an install prompt for iOS users to add the app to their home screen (following Next.js PWA guide pattern), only when the app is not already installed.

#### Scenario: Install prompt shown on iOS
- **WHEN** user opens the app on iOS Safari and it's not installed
- **THEN** an install instruction is shown: "Toque em Compartilhar e depois Adicionar à Tela de Início"

#### Scenario: No prompt when installed
- **WHEN** user opens the app in standalone mode (already installed)
- **THEN** no install prompt is shown