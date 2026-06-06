## MODIFIED Requirements

### Requirement: Categoria enum constraint
The system SHALL constrain `categoria` to one of: `Alimentação`, `Transporte`, `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, `Receita`.

#### Scenario: Valid categoria values accepted
- **WHEN** inserting a lancamento with `categoria = 'Alimentação'`
- **THEN** the record is persisted successfully

#### Scenario: Newly added categoria values accepted
- **WHEN** inserting lancamentos with `categoria` values `Moradia`, `Diversos`, `Pet`, `Saude`, `Imposto`, or `Receita`
- **THEN** each record is persisted successfully

#### Scenario: Invalid categoria rejected
- **WHEN** inserting a lancamento with `categoria = 'InvalidCategory'`
- **THEN** a constraint violation error is raised
