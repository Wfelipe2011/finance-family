## ADDED Requirements

### Requirement: User login with email and password
The system SHALL authenticate users via `POST /auth/login` with email and password, returning a JWT access token on success.

#### Scenario: Successful login
- **WHEN** a user sends `POST /auth/login` with valid `{ email, password }`
- **THEN** the response is `200 OK` with `{ access_token: string }` containing a signed JWT

#### Scenario: Invalid credentials
- **WHEN** a user sends `POST /auth/login` with incorrect password
- **THEN** the response is `401 Unauthorized`

#### Scenario: User not found
- **WHEN** a user sends `POST /auth/login` with an email not in the database
- **THEN** the response is `401 Unauthorized`

### Requirement: JWT token contains user identity
The system SHALL include `sub` (userId) and `username` in the JWT payload, signed with `JWT_SECRET` from environment.

#### Scenario: JWT payload structure
- **WHEN** a JWT is issued after successful login
- **THEN** the decoded payload contains `{ sub: number, username: string, iat: number, exp: number }`

### Requirement: Global JWT guard protects all routes
The system SHALL apply `JwtAuthGuard` globally via `APP_GUARD`, requiring a valid JWT for all endpoints except those explicitly marked `@Public()`.

#### Scenario: Unauthenticated request rejected
- **WHEN** a request without `Authorization: Bearer <token>` header hits a protected endpoint
- **THEN** the response is `401 Unauthorized`

#### Scenario: Expired token rejected
- **WHEN** a request with an expired JWT hits a protected endpoint
- **THEN** the response is `401 Unauthorized`

### Requirement: Public decorator for opt-out routes
The system SHALL provide a `@Public()` decorator that marks specific routes as exempt from JWT authentication.

#### Scenario: Login route is public
- **WHEN** `POST /auth/login` is called without authentication
- **THEN** the request passes through the global guard and reaches the handler

### Requirement: Password hashing with bcrypt
The system SHALL hash user passwords using bcrypt with a minimum of 10 salt rounds. Passwords SHALL never be stored or logged in plain text.

#### Scenario: Password stored as hash
- **WHEN** a user is created
- **THEN** the `password_hash` field contains a bcrypt hash, not the plain password

#### Scenario: Password verification
- **WHEN** validating login credentials
- **THEN** bcrypt.compare is used to check the password against the stored hash