## ADDED Requirements

### Requirement: Lancamentos table
The system SHALL render a table at `/dashboard` with columns: Descrição, Valor (R$ formatted), Data, Categoria, and the table SHALL be horizontally scrollable on mobile.

#### Scenario: Table with data
- **WHEN** dashboard page loads and user has lancamentos
- **THEN** a table is displayed with rows sorted by date descending

#### Scenario: Empty state
- **WHEN** user has no lancamentos
- **THEN** an empty state message is shown: "Nenhum lançamento encontrado"

#### Scenario: Valor formatted as currency
- **WHEN** a lancamento has `valor: 50`
- **THEN** the table shows "R$ 50,00"

### Requirement: Filters
The system SHALL provide date range and categoria filters above the table. Filters SHALL trigger API re-fetch with query params.

#### Scenario: Filter by date range
- **WHEN** user selects `dataInicio: 2026-01-01` and `dataFim: 2026-01-31`
- **THEN** `GET /lancamentos?dataInicio=2026-01-01&dataFim=2026-01-31` is called and table updates

#### Scenario: Filter by categoria
- **WHEN** user selects `categoria: Alimentação` from a dropdown
- **THEN** `GET /lancamentos?categoria=Alimentação` is called and table updates

#### Scenario: Clear filters
- **WHEN** user clears all filters
- **THEN** `GET /lancamentos` (no params) is called and full list is shown

### Requirement: Export CSV button
The system SHALL provide a button that triggers CSV download of the currently filtered lancamentos.

#### Scenario: Export filtered CSV
- **WHEN** user clicks "Exportar CSV" with active filters
- **THEN** a CSV file is downloaded with only the filtered records, filename `lancamentos.csv`

#### Scenario: Export all CSV
- **WHEN** user clicks "Exportar CSV" with no filters
- **THEN** a CSV file is downloaded with all user's records

### Requirement: Loading state
The system SHALL show a skeleton or spinner while lancamentos are loading.

#### Scenario: Table loading
- **WHEN** dashboard page mounts and data is being fetched
- **THEN** a loading skeleton is displayed instead of empty table

### Requirement: Error state
The system SHALL show an error message with retry button if the lancamentos fetch fails.

#### Scenario: Fetch error
- **WHEN** `GET /lancamentos` returns an error
- **THEN** an error message "Erro ao carregar lançamentos" is shown with a "Tentar novamente" button