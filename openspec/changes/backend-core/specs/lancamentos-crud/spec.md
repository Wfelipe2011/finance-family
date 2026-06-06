## ADDED Requirements

### Requirement: Create lancamento
The system SHALL allow authenticated users to create a lancamento via `POST /lancamentos` with `{ descricao, valor, categoria, data? }`. The `usuario_id` SHALL be extracted from the JWT, not from the request body.

#### Scenario: Successful creation
- **WHEN** an authenticated user POSTs a valid lancamento
- **THEN** the response is `201 Created` with the lancamento including `usuario_id` from the JWT

#### Scenario: Creation rejected when not authenticated
- **WHEN** an unauthenticated request hits `POST /lancamentos`
- **THEN** the response is `401 Unauthorized`

### Requirement: List lancamentos with filters
The system SHALL return lancamentos belonging to the authenticated user via `GET /lancamentos` with optional query params: `dataInicio`, `dataFim`, `categoria`.

#### Scenario: List all lancamentos for user
- **WHEN** user requests `GET /lancamentos` without filters
- **THEN** the response is `200 OK` with an array of LancamentoDTO objects belonging to that user only

#### Scenario: Filter by date range
- **WHEN** user requests `GET /lancamentos?dataInicio=2026-01-01&dataFim=2026-01-31`
- **THEN** the response includes only lancamentos with `data` within that range

#### Scenario: Filter by categoria
- **WHEN** user requests `GET /lancamentos?categoria=Alimentação`
- **THEN** the response includes only lancamentos with that categoria

#### Scenario: User cannot see other user's lancamentos
- **WHEN** user A requests lancamentos
- **THEN** the response does NOT include any lancamento where `usuario_id` is user B's ID

### Requirement: Update lancamento
The system SHALL allow updating a lancamento via `PUT /lancamentos/:id` with partial fields. Users SHALL only update their own lancamentos.

#### Scenario: Successful update
- **WHEN** user updates their own lancamento with `{ valor: 100 }`
- **THEN** the response is `200 OK` with the updated lancamento

#### Scenario: Cannot update another user's lancamento
- **WHEN** user A tries to update user B's lancamento
- **THEN** the response is `404 Not Found` (not 403, to avoid leaking existence)

### Requirement: Delete lancamento
The system SHALL allow deleting a lancamento via `DELETE /lancamentos/:id`. Users SHALL only delete their own.

#### Scenario: Successful deletion
- **WHEN** user deletes their own lancamento
- **THEN** the response is `204 No Content`

### Requirement: Export lancamentos as CSV
The system SHALL export filtered lancamentos as CSV via `GET /lancamentos/export` with the same filter params as list.

#### Scenario: CSV export
- **WHEN** user requests `GET /lancamentos/export`
- **THEN** the response has `Content-Type: text/csv` and `Content-Disposition: attachment; filename="lancamentos.csv"`
- **AND** the CSV body contains header row: `id,descricao,valor,data,categoria`

### Requirement: Categoria validation
The system SHALL validate that `categoria` is one of: `Alimentação`, `Transporte`, `Lazer`, `Saúde`, `Outros`.

#### Scenario: Invalid categoria rejected
- **WHEN** creating a lancamento with `categoria: "InvalidCategory"`
- **THEN** the response is `400 Bad Request`