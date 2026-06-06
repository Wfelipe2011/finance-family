## Purpose
Defines the PostgreSQL schema requirements for users, financial entries, categories, and pg-boss infrastructure.

## Requirements

### Requirement: Usuario entity exists
The system SHALL have a `Usuario` entity with fields: `id` (auto-increment PK), `nome`, `email` (unique), `password_hash`, `created_at`.

#### Scenario: Create usuario table
- **WHEN** TypeORM synchronizes the database
- **THEN** the `usuarios` table exists with columns: `id SERIAL PRIMARY KEY`, `nome VARCHAR(100) NOT NULL`, `email VARCHAR(100) UNIQUE NOT NULL`, `password_hash VARCHAR(255) NOT NULL`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### Requirement: Lancamento entity with usuario binding
The system SHALL have a `Lancamento` entity with fields: `id` (auto-increment PK), `descricao`, `valor` (decimal), `data` (date, defaults to today), `categoria` (enum), `usuario_id` (FK to Usuario), `created_at`.

#### Scenario: Create lancamentos table
- **WHEN** TypeORM synchronizes the database
- **THEN** the `lancamentos` table exists with columns: `id SERIAL PRIMARY KEY`, `descricao VARCHAR(255) NOT NULL`, `valor NUMERIC(10,2) NOT NULL`, `data DATE NOT NULL DEFAULT CURRENT_DATE`, `categoria VARCHAR(50) NOT NULL`, `usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL`, `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

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

### Requirement: pg-boss schema auto-created
The system SHALL configure pg-boss to auto-create its internal tables (`pgboss.job`, `pgboss.schedule`, etc.) in a separate schema upon connection.

#### Scenario: pg-boss tables exist after startup
- **WHEN** the NestJS server starts and connects to PostgreSQL
- **THEN** the `pgboss` schema exists with tables for job management (job, schedule, archive, etc.)
