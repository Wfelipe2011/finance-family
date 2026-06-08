## ADDED Requirements

### Requirement: Family groups own shared chat
The system SHALL provide family groups as the primary chat boundary, with each authenticated user reading and writing messages only in groups where they are a member.

#### Scenario: Member loads group chat
- **WHEN** an authenticated user requests chat history for a family group where they are a member
- **THEN** the system returns the persisted messages for that group ordered by creation time
- **AND** the response includes enough author metadata to render the human or Jarvis avatar and display name

#### Scenario: Non-member cannot load group chat
- **WHEN** an authenticated user requests chat history for a family group where they are not a member
- **THEN** the system rejects the request with a forbidden response

### Requirement: Messages preserve human and Jarvis authorship
The system SHALL persist every group message with an author type and either a human user author or the Jarvis agent author.

#### Scenario: Human message is stored with author
- **WHEN** a group member sends "Vou passar no mercado"
- **THEN** the system stores the message with `authorType: "user"` and the authenticated user's id
- **AND** the message is visible to every connected group member

#### Scenario: Jarvis message is stored with agent author
- **WHEN** Jarvis responds in the group chat
- **THEN** the system stores the message with `authorType: "agent"` and the Jarvis agent identifier
- **AND** the message is visible after page reload

### Requirement: Human conversation does not invoke Jarvis by default
The system SHALL persist and stream messages that do not mention Jarvis without creating a Jarvis AI job, unless the group has Jarvis always-on enabled.

#### Scenario: Human-only message is not sent to LLM
- **WHEN** a group member sends "Acho melhor comprar ração amanhã" without mentioning `@Jarvis`
- **AND** the group does not have Jarvis always-on enabled
- **THEN** the message is stored and streamed to the group
- **AND** no media extractor or LLM job is created

#### Scenario: Later mention can use earlier context
- **WHEN** group members first discuss "comprar ração amanhã" without mentioning Jarvis
- **AND** a member later sends "@Jarvis transforma isso em lançamento se fizer sentido"
- **THEN** Jarvis receives the triggering message and relevant prior group conversation context

### Requirement: Jarvis mention creates an AI job
The system SHALL create a Jarvis job when a group message contains a normalized `@Jarvis` mention.

#### Scenario: Mention invokes Jarvis
- **WHEN** a group member sends "@Jarvis quanto gastamos com mercado este mês?"
- **THEN** the system stores the human message
- **AND** creates a queued Jarvis job for the group
- **AND** returns an accepted response with a job identifier

#### Scenario: Mention matching is case-insensitive
- **WHEN** a group member sends "@jarvis resume a conversa"
- **THEN** the system treats the message as a Jarvis invocation

### Requirement: Jarvis always-on setting invokes Jarvis without mention
The system SHALL support a group-level setting that keeps Jarvis active in the conversation so messages create Jarvis jobs even without an explicit mention.

#### Scenario: Always-on routes message to Jarvis
- **WHEN** `jarvisAlwaysOn` is enabled for the group
- **AND** a group member sends "Quanto foi o gasto do mercado?"
- **THEN** the system stores the message and creates a Jarvis job

#### Scenario: Always-on can be disabled
- **WHEN** `jarvisAlwaysOn` is disabled for the group
- **AND** a group member sends a message without `@Jarvis`
- **THEN** the system stores the message without creating a Jarvis job

### Requirement: Group streams deliver chat events to members
The system SHALL provide a group-scoped event stream that broadcasts new messages and Jarvis job updates only to authenticated group members.

#### Scenario: Member receives peer message
- **WHEN** user A sends a message to a family group
- **THEN** user B connected to the same group's stream receives a new-message event

#### Scenario: Non-member cannot subscribe
- **WHEN** an authenticated user attempts to subscribe to a group stream for a group where they are not a member
- **THEN** the system rejects the stream subscription
