## ADDED Requirements

### Requirement: User registration
The system SHALL allow creating new users via `POST /users` with `{ nome, email, password }`. The endpoint SHALL be public (marked `@Public()`).

#### Scenario: Successful registration
- **WHEN** a new user registers with unique email
- **THEN** the response is `201 Created` with the user object (excluding `password_hash`)

#### Scenario: Duplicate email rejected
- **WHEN** a user registers with an email that already exists
- **THEN** the response is `409 Conflict`

### Requirement: Get current user profile
The system SHALL return the authenticated user's profile via `GET /auth/profile` with `{ userId, username }` from the JWT.

#### Scenario: Profile retrieved for authenticated user
- **WHEN** an authenticated user requests `GET /auth/profile`
- **THEN** the response is `200 OK` with `{ userId: number, username: string }`

### Requirement: User entity validation
The system SHALL validate that `nome` is 1-100 characters and `email` matches a valid email format.

#### Scenario: Invalid email rejected
- **WHEN** a user registers with `email: "not-an-email"`
- **THEN** the response is `400 Bad Request` with validation error details

#### Scenario: Empty name rejected
- **WHEN** a user registers with `nome: ""`
- **THEN** the response is `400 Bad Request` with validation error details