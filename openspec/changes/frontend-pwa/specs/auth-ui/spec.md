## ADDED Requirements

### Requirement: Login page
The system SHALL render a login page at `/login` with email and password inputs, a submit button, and error feedback. The page SHALL use Apple Design System styling.

#### Scenario: Login form displayed
- **WHEN** an unauthenticated user navigates to `/`
- **THEN** they are redirected to `/login` showing email input, password input, and "Entrar" button

#### Scenario: Successful login redirects to chat
- **WHEN** user submits valid credentials
- **THEN** the JWT is stored in localStorage, `Authorization` header is set, and user is redirected to `/chat`

#### Scenario: Failed login shows error
- **WHEN** user submits invalid credentials
- **THEN** an error message is displayed (e.g., "Email ou senha inválidos") and user stays on login page

#### Scenario: Login button shows loading state
- **WHEN** the login request is in flight
- **THEN** the submit button shows a loading indicator and is disabled

### Requirement: Auth context provider
The system SHALL provide a React context (`AuthProvider`) that stores the JWT token, user profile, and exposes `login()`, `logout()`, `isAuthenticated` state.

#### Scenario: Auth state persists across page navigation
- **WHEN** user navigates from chat to dashboard
- **THEN** the auth context still has the JWT and user info

#### Scenario: Logout clears auth state
- **WHEN** user clicks logout
- **THEN** the JWT is removed from localStorage, auth state is cleared, and user is redirected to `/login`

### Requirement: Protected route guard
The system SHALL redirect unauthenticated users to `/login` and redirect authenticated users away from `/login` to `/chat`.

#### Scenario: Unauthenticated user blocked
- **WHEN** an unauthenticated user tries to access `/chat`, `/dashboard`, or `/config`
- **THEN** they are redirected to `/login`

#### Scenario: Authenticated user skips login
- **WHEN** an authenticated user navigates to `/login`
- **THEN** they are redirected to `/chat`

### Requirement: API client with JWT
The system SHALL provide an API client (`lib/api.ts`) that automatically attaches `Authorization: Bearer <token>` to all requests and handles 401 responses by triggering logout.

#### Scenario: Authenticated request
- **WHEN** the API client makes a request and a JWT exists
- **THEN** the request includes `Authorization: Bearer <token>` header

#### Scenario: 401 triggers logout
- **WHEN** any API request returns 401
- **THEN** the user is automatically logged out and redirected to `/login`