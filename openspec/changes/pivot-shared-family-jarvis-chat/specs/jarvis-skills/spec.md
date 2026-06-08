## ADDED Requirements

### Requirement: Jarvis uses a generic base prompt
The system SHALL invoke Jarvis as a single generic family assistant with a concise base prompt and no finance-specific behavior unless a finance skill is active.

#### Scenario: Generic base prompt is used
- **WHEN** a group member invokes Jarvis for a non-financial summary of the conversation
- **THEN** Jarvis responds as a helpful family assistant
- **AND** finance CRUD, query, or report instructions are not included unless selected by skill routing

### Requirement: Skills registry exposes available capabilities
The system SHALL maintain a server-side skills registry and expose available Jarvis skills through `GET /api/skills`.

#### Scenario: Initial skills listed
- **WHEN** an authenticated group member requests `GET /api/skills`
- **THEN** the response includes `finance_crud`, `finance_query`, and `finance_report`
- **AND** each skill includes an id, display name, description, and enabled state

### Requirement: Finance skills load on demand
The system SHALL assemble Jarvis invocations with only the skills and tools needed for the current request.

#### Scenario: Finance CRUD skill selected
- **WHEN** a group member asks Jarvis to add, edit, or delete a financial entry
- **THEN** Jarvis is invoked with the `finance_crud` skill prompt context
- **AND** only finance mutation tools and required memory tools from that skill are available

#### Scenario: Finance query skill selected
- **WHEN** a group member asks for totals, lists, or filters of financial entries
- **THEN** Jarvis is invoked with the `finance_query` skill prompt context
- **AND** finance mutation tools are not available for that invocation

#### Scenario: Finance report skill selected
- **WHEN** a group member asks for a period summary or report
- **THEN** Jarvis is invoked with the `finance_report` skill prompt context
- **AND** report/query tools are available without exposing direct mutation tools

### Requirement: Skills expire from short context
The system SHALL remove skill prompt context and tools from future Jarvis invocations after the configured skill interaction TTL or when routing selects a different skill set.

#### Scenario: Skill expires after TTL
- **WHEN** `finance_crud` has been active for its configured number of Jarvis interactions
- **THEN** the next unrelated Jarvis invocation does not include the `finance_crud` prompt context or mutation tools

### Requirement: Jarvis memory is group-scoped
The system SHALL store Jarvis short-term and durable memory by family group, not by individual user.

#### Scenario: Group context is recalled
- **WHEN** user A says "Nossa meta deste mês é economizar no mercado"
- **AND** user B later asks "@Jarvis qual é nossa meta deste mês?"
- **THEN** Jarvis can answer using group-scoped memory or group conversation context

#### Scenario: Other group memory is isolated
- **WHEN** Jarvis stores a durable fact for group A
- **THEN** members of group B cannot retrieve that fact through Jarvis

### Requirement: Media extraction becomes Jarvis context
The system SHALL run audio/image extraction for Jarvis-invoked messages and pass compact extracted context to Jarvis without storing raw media bytes in memory.

#### Scenario: Image invocation asks what to do
- **WHEN** a group member uploads a receipt image with `@Jarvis`
- **THEN** the worker extracts compact receipt/image data
- **AND** Jarvis asks what the group wants to do with the extracted data when an action is ambiguous

#### Scenario: Audio invocation asks what to do
- **WHEN** a group member sends audio while invoking Jarvis
- **THEN** the worker transcribes or extracts compact audio data
- **AND** Jarvis uses that extraction as context without persisting raw audio in short-term or durable memory

### Requirement: Finance drafts are group-confirmable
The system SHALL keep draft-before-commit behavior for finance mutations and SHALL allow any current group member to confirm or reject a pending draft.

#### Scenario: Any member confirms draft
- **WHEN** Jarvis proposes a draft financial entry requested by user A
- **AND** user B is a member of the same group
- **AND** user B confirms the draft
- **THEN** the system commits the financial entry to the family group
- **AND** records the confirming user and original requester metadata

#### Scenario: Draft cannot be confirmed by non-member
- **WHEN** a non-member attempts to confirm a group draft
- **THEN** the system rejects the confirmation
- **AND** no financial entry is committed

### Requirement: Finance tools operate on group financial records
The system SHALL require finance skill tools to read and mutate only financial records that belong to the current family group.

#### Scenario: Query returns group records only
- **WHEN** Jarvis uses a finance query tool for group A
- **THEN** the tool returns only records with group A's id

#### Scenario: Create stores author
- **WHEN** Jarvis commits a new financial entry for the group
- **THEN** the entry belongs to the group
- **AND** stores the human author responsible for the request or confirmation
