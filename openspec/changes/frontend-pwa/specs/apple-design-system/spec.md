## ADDED Requirements

### Requirement: Color tokens defined as CSS custom properties
The system SHALL define all color tokens from DESIGN.md as CSS custom properties on `:root`: `--color-primary` (#0066cc), `--color-ink` (#1d1d1f), `--color-canvas` (#ffffff), `--color-canvas-parchment` (#f5f5f7), `--color-surface-tile-1` (#272729), `--color-hairline` (#e0e0e0), and ALL other colors in DESIGN.md/colors.

#### Scenario: Action Blue available
- **WHEN** using `text-primary` in a Tailwind class
- **THEN** the element has `color: #0066cc`

#### Scenario: Ink color available
- **WHEN** using `text-ink` in a Tailwind class
- **THEN** the element has `color: #1d1d1f`

### Requirement: Typography tokens defined
The system SHALL define typography tokens from DESIGN.md: `--font-display` (SF Pro Display), `--font-text` (SF Pro Text), body at 17px/400/1.47/-0.374px, display-lg at 40px/600/1.10, tagline at 21px/600/1.19, caption at 14px/400/1.43.

#### Scenario: Body text uses correct font
- **WHEN** using `font-text` class
- **THEN** text renders with `font-family: 'SF Pro Text', system-ui, -apple-system, sans-serif`

#### Scenario: Display headline uses correct tracking
- **WHEN** using `text-display-lg` class
- **THEN** text has `font-size: 40px`, `font-weight: 600`, `letter-spacing: 0` (no negative tracking for display-lg per DESIGN.md)

### Requirement: Spacing tokens defined
The system SHALL define spacing tokens from DESIGN.md: xxs (4px), xs (8px), sm (12px), md (17px), lg (24px), xl (32px), xxl (48px), section (80px).

#### Scenario: Section padding available
- **WHEN** using `p-section` class
- **THEN** element has `padding: 80px`

### Requirement: Border radius tokens defined
The system SHALL define radius tokens: `--radius-none` (0px), `--radius-sm` (8px), `--radius-md` (11px), `--radius-lg` (18px), `--radius-pill` (9999px), `--radius-full` (9999px).

#### Scenario: Pill button
- **WHEN** using `rounded-pill` class
- **THEN** element has `border-radius: 9999px`

### Requirement: Component classes defined
The system SHALL define Tailwind utility classes for DESIGN.md components: `btn-primary` (Action Blue pill, 11px 22px padding), `btn-secondary-pill` (ghost pill with blue border), `btn-dark-utility` (ink background, small radius), `card-utility` (white, 18px radius, hairline border), `tile-light`, `tile-dark`, `tile-parchment` (full-bleed sections).

#### Scenario: Primary button
- **WHEN** a `<button className="btn-primary">` is rendered
- **THEN** it has `background: #0066cc`, `color: white`, `border-radius: 9999px`, `padding: 11px 22px`

#### Scenario: Utility card
- **WHEN** a `<div className="card-utility">` is rendered
- **THEN** it has `background: white`, `border-radius: 18px`, `border: 1px solid #e0e0e0`, `padding: 24px`

### Requirement: Product shadow defined
The system SHALL define exactly one drop-shadow per DESIGN.md philosophy: `--shadow-product: rgba(0, 0, 0, 0.22) 3px 5px 30px 0`, used only on imagery, never on cards/buttons/text.

#### Scenario: Product shadow class
- **WHEN** using `shadow-product` class
- **THEN** element has `box-shadow: rgba(0,0,0,0.22) 3px 5px 30px 0`