## ADDED Requirements

### Requirement: Docker Compose persists uploaded avatars
The system SHALL configure Docker Compose with a persistent uploads volume mounted into the server container for avatar files.

#### Scenario: Uploads volume configured
- **WHEN** inspecting `docker-compose.yml`
- **THEN** the server service mounts a named volume or configured host path for uploaded files
- **AND** the server reads its upload directory from environment configuration

#### Scenario: Avatar survives rebuild
- **WHEN** an avatar file is uploaded
- **AND** the server container is rebuilt and restarted with the same uploads volume
- **THEN** the uploaded avatar file remains available

### Requirement: Upload path documented in environment
The system SHALL document the avatar upload directory and public uploads base URL in environment examples.

#### Scenario: Env example includes uploads configuration
- **WHEN** inspecting `.env.example`
- **THEN** it documents the server upload directory and public URL/base path used for avatar assets
