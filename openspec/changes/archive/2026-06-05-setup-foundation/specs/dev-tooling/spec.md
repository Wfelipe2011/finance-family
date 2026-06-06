## ADDED Requirements

### Requirement: SWC builder configured in NestJS
The system SHALL configure the NestJS CLI to use SWC builder, reducing compilation time by ~20x compared to the default TypeScript compiler.

#### Scenario: nest-cli.json has SWC builder
- **WHEN** inspecting `server/nest-cli.json`
- **THEN** `compilerOptions.builder` is `"swc"` or `{ "type": "swc" }`

#### Scenario: SWC build succeeds
- **WHEN** running `npm run build` in the server directory
- **THEN** the build completes successfully using SWC instead of tsc

### Requirement: SWC type checking enabled
The system SHALL enable `--type-check` via SWC builder config to run `tsc --noEmit` alongside compilation for type safety.

#### Scenario: Type check in nest-cli.json
- **WHEN** inspecting `server/nest-cli.json`
- **THEN** `compilerOptions.typeCheck` is `true`

### Requirement: Vitest configured in server
The system SHALL configure Vitest in the server project with `unplugin-swc` for SWC compatibility, support for path aliases (`src/`), and E2E test config.

#### Scenario: Server vitest config exists
- **WHEN** running `npm test` in the server directory
- **THEN** Vitest executes tests using SWC transformation

#### Scenario: Server E2E tests use separate config
- **WHEN** running `npm run test:e2e` in the server directory
- **THEN** Vitest uses a dedicated e2e config file with `include: ['**/*.e2e-spec.ts']`

### Requirement: Vitest configured in client
The system SHALL configure Vitest in the client project with `@vitejs/plugin-react`, `jsdom` environment, and `vite-tsconfig-paths`.

#### Scenario: Client vitest config exists
- **WHEN** running `npm test` in the client directory
- **THEN** Vitest executes React component tests with jsdom environment

### Requirement: Dev scripts defined
The system SHALL have package.json scripts for development: `dev` (docker compose up), `dev:server` (nest start), `dev:client` (next dev), `test` (vitest), `test:e2e` (vitest e2e), `lint` (eslint).

#### Scenario: Root dev starts everything
- **WHEN** running `docker compose up` from the project root
- **THEN** PostgreSQL, NestJS server, and Next.js client all start and are reachable

### Requirement: .env.example with all variables
The system SHALL provide a `.env.example` file at the project root documenting every required environment variable with descriptions and example values.

#### Scenario: Complete env documentation
- **WHEN** a developer sets up the project for the first time
- **THEN** copying `.env.example` to `.env` and filling values is sufficient to run the full stack

#### Scenario: Required variables documented
- **WHEN** inspecting `.env.example`
- **THEN** the following variables are documented: `DATABASE_URL`, `JWT_SECRET`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`, `SERVER_PORT`, `CLIENT_PORT`