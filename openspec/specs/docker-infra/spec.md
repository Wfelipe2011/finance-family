## ADDED Requirements

### Requirement: Docker Compose dev environment
The system SHALL provide a `docker-compose.yml` with 3 services: `db` (postgres:17-alpine), `server` (NestJS), `client` (Next.js), with proper healthchecks and dependency ordering.

#### Scenario: All services start
- **WHEN** running `docker compose up`
- **THEN** all 3 services reach healthy state: db accepts connections, server responds on port 3001, client responds on port 3000

#### Scenario: Database healthcheck
- **WHEN** the db service starts
- **THEN** Docker healthcheck runs `pg_isready -U postgres` and reports healthy

### Requirement: Docker Compose test environment
The system SHALL provide a `docker-compose.test.yml` with isolated PostgreSQL instance for integration tests, using a separate database name (`fin_ai_test`).

#### Scenario: Test database is isolated
- **WHEN** running `docker compose -f docker-compose.test.yml up -d`
- **THEN** a separate PostgreSQL container starts with database `fin_ai_test`, not affecting the dev database

#### Scenario: Test database tears down cleanly
- **WHEN** running `docker compose -f docker-compose.test.yml down -v`
- **THEN** all test data volumes are removed

### Requirement: Server Dockerfile with standalone build
The system SHALL provide a `Dockerfile.server` that builds NestJS with SWC and produces a production image with only runtime dependencies.

#### Scenario: Server image size is optimized
- **WHEN** building the server Docker image
- **THEN** the final image excludes devDependencies and the NestJS CLI, containing only `dist/` and production `node_modules`

### Requirement: Client Dockerfile with standalone output
The system SHALL provide a `Dockerfile.client` using Next.js `output: 'standalone'` for a minimal production image (~150MB).

#### Scenario: Client standalone build
- **WHEN** building the client Docker image
- **THEN** the Next.js build generates a standalone output that includes only required runtime files

#### Scenario: Client image size is small
- **WHEN** inspecting the final client Docker image
- **THEN** the image size is under 200MB (standalone output excludes unnecessary files)

### Requirement: PWA manifest scaffold
The system SHALL create `client/src/app/manifest.ts` with basic PWA metadata: name, short_name, description, icons, theme_color matching DESIGN.md.

#### Scenario: Manifest is accessible
- **WHEN** the client is running
- **THEN** `GET /manifest.json` returns a valid web app manifest with `display: 'standalone'` and `theme_color: '#1d1d1f'` (ink color from DESIGN.md)

### Requirement: PWA service worker scaffold
The system SHALL create `client/public/sw.js` with a minimal service worker that caches static assets for offline shell rendering.

#### Scenario: Service worker is registered
- **WHEN** the client loads in a browser
- **THEN** the service worker at `/sw.js` is served with `Content-Type: application/javascript` and `Cache-Control: no-cache` headers