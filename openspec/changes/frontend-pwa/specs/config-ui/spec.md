## ADDED Requirements

### Requirement: IA config form
The system SHALL render a form at `/config` with fields: `baseUrl` (text input), `apiKey` (password input with show/hide toggle). Pre-populated with existing values from `GET /config/ia`.

#### Scenario: Load existing config
- **WHEN** config page mounts
- **THEN** `GET /config/ia` is called and fields are populated with current values

#### Scenario: Save config
- **WHEN** user edits values and clicks "Salvar"
- **THEN** `PUT /config/ia` is called and a success toast is shown

#### Scenario: apiKey masked display
- **WHEN** an existing apiKey is loaded
- **THEN** the field shows only the last 4 characters as visible text (e.g., `•••••••••••••xxxx`)

### Requirement: Config validation
The system SHALL validate that `baseUrl` is a valid URL format before allowing save.

#### Scenario: Invalid URL rejected
- **WHEN** user enters `not-a-url` in baseUrl and tries to save
- **THEN** an error "URL inválida" is shown and the request is not sent

#### Scenario: Empty fields allowed
- **WHEN** user clears both fields and saves
- **THEN** the config is saved with null values (IA will be unavailable until configured)

### Requirement: Config save feedback
The system SHALL show loading state on save button and success/error feedback after the request completes.

#### Scenario: Save success feedback
- **WHEN** `PUT /config/ia` returns 200
- **THEN** a success toast "Configurações salvas" is displayed

#### Scenario: Save error feedback
- **WHEN** `PUT /config/ia` returns an error
- **THEN** an error toast "Erro ao salvar configurações" is displayed