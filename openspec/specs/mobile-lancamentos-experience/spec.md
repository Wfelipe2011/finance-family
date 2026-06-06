## Purpose
Defines the mobile lancamentos browsing, filtering, and expandable row experience while preserving desktop usability.

## Requirements

### Requirement: Mobile category chips filter lancamentos
The system SHALL provide a horizontally scrollable category chip control on mobile that filters lancamentos using the existing category filter behavior.

#### Scenario: Select category chip
- **WHEN** the user taps a category chip
- **THEN** the lancamentos list refreshes or filters to that category
- **AND** the selected chip has a visually distinct active state

#### Scenario: All chip clears category filter
- **WHEN** the user taps the "Todos" chip
- **THEN** the category filter is cleared and all matching lancamentos are shown

### Requirement: Mobile lancamentos render as expandable rows
The system SHALL render lancamentos on mobile as one-line rows that expand on tap to reveal secondary metadata and actions.

#### Scenario: Closed row shows scan-critical data
- **WHEN** a lancamento row is not expanded
- **THEN** it displays description, category, and formatted value without edit/delete buttons visible

#### Scenario: Expanded row shows details and actions
- **WHEN** the user expands a lancamento row
- **THEN** it reveals formatted date, responsible user, edit action, and delete action

### Requirement: Desktop behavior remains usable
The system SHALL preserve a dense desktop/table-compatible lancamentos experience on wider viewports.

#### Scenario: Desktop viewport
- **WHEN** the lancamentos page is viewed on a desktop-width viewport
- **THEN** users can still scan multiple lancamentos, filter by category/date, and export CSV without losing existing capabilities

### Requirement: Destructive delete uses Red Apple only
The system SHALL use a Red Apple destructive color for delete actions and SHALL NOT use that color for non-destructive interactive elements.

#### Scenario: Delete action is destructive styled
- **WHEN** a lancamento row is expanded
- **THEN** the delete action uses the Red Apple destructive style

#### Scenario: Non-destructive actions use Action Blue
- **WHEN** a user sees filter, edit, export, or primary actions
- **THEN** those actions use Action Blue or neutral styling, not Red Apple

### Requirement: Mobile interactions are accessible
The system SHALL provide accessible labels, focus states, and stable touch targets for chips and expandable rows.

#### Scenario: Keyboard expands row
- **WHEN** a keyboard user focuses a lancamento row control and activates it
- **THEN** the row expands or collapses without layout overlap

#### Scenario: Touch targets are stable
- **WHEN** a user taps category chips or row actions on a small phone viewport
- **THEN** controls remain at least 44px tall or have an equivalent accessible hit area
