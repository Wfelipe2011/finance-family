## ADDED Requirements

### Requirement: Get IA configuration
The system SHALL return the authenticated user's IA configuration via `GET /config/ia`.

#### Scenario: Retrieve existing config
- **WHEN** an authenticated user requests `GET /config/ia`
- **THEN** the response is `200 OK` with `{ baseUrl: string, apiKey: string }`

#### Scenario: No config yet
- **WHEN** a user has not configured IA settings
- **THEN** the response is `200 OK` with `{ baseUrl: null, apiKey: null }`

### Requirement: Update IA configuration
The system SHALL allow updating the IA configuration via `PUT /config/ia` with `{ baseUrl?, apiKey? }`. The config SHALL be per-user.

#### Scenario: Set base URL and API key
- **WHEN** user sends `PUT /config/ia` with `{ baseUrl: 'http://192.168.1.100:8080/v1', apiKey: 'sk-xxx' }`
- **THEN** the config is persisted and `200 OK` is returned

#### Scenario: Partial update
- **WHEN** user sends `PUT /config/ia` with only `{ baseUrl: 'http://...' }`
- **THEN** only the baseUrl is updated; apiKey remains unchanged

### Requirement: Config isolation between users
The system SHALL ensure each user's IA config is isolated — user A cannot read or modify user B's config.

#### Scenario: Config isolation
- **WHEN** user A requests `GET /config/ia`
- **THEN** the response contains only user A's config, not user B's