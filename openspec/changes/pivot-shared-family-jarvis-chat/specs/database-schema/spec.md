## MODIFIED Requirements

### Requirement: Lancamento entity with usuario binding
The system SHALL have a `Lancamento` entity with fields: `id` (auto-increment PK), `descricao`, `valor` (decimal), `data` (date, defaults to today), `categoria` (enum), `group_id` (FK to family group), `created_by_usuario_id` (FK to Usuario), optional `requested_by_usuario_id`, and `created_at`.

#### Scenario: Create lancamentos table with group ownership
- **WHEN** TypeORM synchronizes the database
- **THEN** the `lancamentos` table supports a required family group reference and a human author reference
- **AND** financial entries can be filtered by `group_id`

#### Scenario: Author is preserved
- **WHEN** a group member creates or confirms a lancamento
- **THEN** the record stores the family group id and the responsible author user id

## ADDED Requirements

### Requirement: Family group entities exist
The system SHALL have family group and group membership entities that allow multiple authenticated users to belong to a shared family group.

#### Scenario: Create family group tables
- **WHEN** TypeORM synchronizes the database
- **THEN** the database contains tables for family groups and user memberships
- **AND** each membership links a `usuario_id` to a `group_id`

### Requirement: Group settings include Jarvis configuration
The system SHALL persist group-level Jarvis settings including the `jarvisAlwaysOn` flag and optional Jarvis avatar reference.

#### Scenario: Jarvis always-on setting stored
- **WHEN** a group member enables Jarvis always-on
- **THEN** the setting is persisted for the family group
- **AND** later message routing uses the persisted value

### Requirement: Chat messages are group-owned with authors
The system SHALL persist chat messages with `group_id`, `author_type`, optional `author_usuario_id`, optional `agent_id`, content, status, attachments metadata, and timestamps.

#### Scenario: Human message row
- **WHEN** a human group member sends a message
- **THEN** the row stores the group id, `author_type = "user"`, and the human author id

#### Scenario: Jarvis message row
- **WHEN** Jarvis sends a message
- **THEN** the row stores the group id, `author_type = "agent"`, and the Jarvis agent id

### Requirement: Avatar asset metadata exists
The system SHALL persist uploaded avatar metadata including owner kind, owner id, storage path, public URL, MIME type, size, and timestamps.

#### Scenario: Avatar metadata stored
- **WHEN** a valid avatar is uploaded
- **THEN** the database stores metadata that can be joined into user or Jarvis chat author responses

### Requirement: Jarvis drafts are persisted by group
The system SHALL persist pending Jarvis finance drafts by group so any group member can confirm or reject them.

#### Scenario: Pending draft stored
- **WHEN** Jarvis proposes a finance mutation draft
- **THEN** the draft is stored with group id, requester id, source message id, operation, payload, and status
