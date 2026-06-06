## Why

The current lancamentos list uses a traditional table/filter layout that is dense on mobile and does not match the Apple-like PWA direction. The mobile experience should prioritize fast touch filtering, one-line scannability, and progressive disclosure of details/actions.

## What Changes

- Replace the mobile lancamentos table presentation with a responsive card-list experience while preserving the existing desktop/table affordances where they still fit.
- Add horizontal quick-touch category chips using Tailwind v4 CSS-first styling and the current token system.
- Add expandable one-line lancamento rows that reveal date, responsible user, and quick actions only after tap.
- Keep Action Blue as the primary interactive color and explicitly allow Red Apple for destructive delete actions.
- Keep export and existing filter behavior available without increasing visual density on small screens.
- Add accessible tap targets, keyboard/focus handling, and responsive tests for mobile and desktop layouts.

## Capabilities

### New Capabilities
- `mobile-lancamentos-experience`: Mobile-first lancamentos filtering and expandable list/card interaction model.

### Modified Capabilities
- None.

## Impact

- **Client lancamentos UI**: lancamentos page, `LancamentoTable`, filter components/hooks, design tokens/classes, and tests.
- **Design system**: introduce a narrowly scoped destructive action color token for Red Apple delete interactions.
- **Shared/server contracts**: no API change expected; the UI continues consuming existing lancamento DTOs and filter/export endpoints.
- **Tailwind**: use Tailwind v4 CSS-first patterns already present in the client.
