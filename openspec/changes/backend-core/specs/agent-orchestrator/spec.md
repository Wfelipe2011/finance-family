## ADDED Requirements

### Requirement: Orchestrator agent classifies user intent
The system SHALL have an Orchestrator Agent that receives user input and classifies it as either a `consult` (query/read) or `operate` (create/edit) intent. Its prompt SHALL be minimal (under 300 tokens).

#### Scenario: Query intent classified
- **WHEN** user asks "Quanto gastei essa semana?"
- **THEN** the Orchestrator calls `chamar_subagente_consultor`

#### Scenario: Create intent classified
- **WHEN** user says "Gastei 50 reais de gasolina"
- **THEN** the Orchestrator calls `chamar_subagente_operador`

#### Scenario: Multimodal input classified
- **WHEN** user sends an image of a receipt
- **THEN** the Orchestrator calls `chamar_subagente_operador`

### Requirement: Subagente Consultor queries database
The system SHALL have a Consultor Subagent with the tool `consultar_gastos_db` that accepts filter parameters (dataInicio, dataFim, categoria) and returns formatted results from the PostgreSQL database.

#### Scenario: Query by category
- **WHEN** the Consultor receives a request about "gastos com alimentação"
- **THEN** it calls `consultar_gastos_db` with `categoria: 'Alimentação'` and returns summarized results

#### Scenario: Query by date range
- **WHEN** the Consultor receives "gastos do último mês"
- **THEN** it calls `consultar_gastos_db` with appropriate date range

### Requirement: Subagente Operador mutates database
The system SHALL have an Operador Subagent with tools `adicionar_gasto_db` and `editar_gasto_db`. It SHALL operate stateless — receiving no conversation history.

#### Scenario: Add expense from text
- **WHEN** the Operador receives "Gasto de 50 reais em gasolina no posto Shell"
- **THEN** it calls `adicionar_gasto_db` with `{ descricao: 'Posto Shell', valor: 50, categoria: 'Transporte' }`

#### Scenario: Add expense from image
- **WHEN** the Operador receives a receipt image (base64)
- **THEN** it extracts `descricao`, `valor`, `categoria` from the image and calls `adicionar_gasto_db`

#### Scenario: Add expense from audio
- **WHEN** the Operador receives audio data (base64 .wav)
- **THEN** the LLM transcribes the audio, extracts intent, and calls `adicionar_gasto_db`

#### Scenario: Edit existing expense
- **WHEN** the Operador receives "Mude o valor do último mercado para 150"
- **THEN** it calls `editar_gasto_db` with the correct ID and new value

### Requirement: Tools are Zod-typed and secure
The system SHALL define all LangChain tools with Zod schemas. Tools SHALL access the database through TypeORM repositories. Each tool SHALL receive `usuario_id` from the agent context and SHALL only access/modify data belonging to that user.

#### Scenario: Tool prevents cross-user access
- **WHEN** user A's agent calls `consultar_gastos_db`
- **THEN** only lancamentos with `usuario_id` matching user A are returned

#### Scenario: Tool schema validation
- **WHEN** a tool is called with invalid arguments
- **THEN** the Zod schema validation fails with a descriptive error

### Requirement: Context window management
The system SHALL respect the 4k token limit by: (1) Orchestrator prompt under 300 tokens, (2) Operador receives NO conversation history, (3) Consultor receives only DB query results, (4) short-term memory limited to last 5 turns.

#### Scenario: Operador has clean context
- **WHEN** the Operador agent is invoked
- **THEN** its message array contains only the current user input (no prior conversation turns)

#### Scenario: Orchestrator has limited history
- **WHEN** the Orchestrator agent is invoked
- **THEN** its message array contains at most the last 5 user-assistant pairs