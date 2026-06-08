## ADDED Requirements

### Requirement: Users can upload real profile avatars
The system SHALL allow authenticated users to upload image files as their profile avatar.

#### Scenario: User avatar upload succeeds
- **WHEN** an authenticated user uploads a valid PNG, JPEG, or WebP avatar within the configured size limit
- **THEN** the system stores the file in the uploads directory
- **AND** persists avatar metadata linked to that user
- **AND** returns a URL that the client can render

#### Scenario: Invalid avatar file rejected
- **WHEN** an authenticated user uploads a non-image file as an avatar
- **THEN** the system rejects the upload
- **AND** no file metadata is persisted

### Requirement: Jarvis avatar can be configured
The system SHALL allow group configuration to upload and assign a real avatar image for Jarvis.

#### Scenario: Jarvis avatar upload succeeds
- **WHEN** a group member uploads a valid image for Jarvis
- **THEN** the system stores the file in the uploads directory
- **AND** associates the avatar with Jarvis for that group
- **AND** future Jarvis messages include the avatar URL

### Requirement: Uploaded avatars persist across container rebuilds
The system SHALL store uploaded avatar files in a server path backed by a Docker volume.

#### Scenario: Avatar remains after server restart
- **WHEN** a user uploads an avatar
- **AND** the server container is restarted or rebuilt with the configured uploads volume
- **THEN** the avatar URL still resolves to the uploaded image

### Requirement: Chat renders configured avatars
The system SHALL include avatar metadata in chat author responses so the client can render avatars for each user and Jarvis.

#### Scenario: Chat history includes avatars
- **WHEN** the client loads group chat history
- **THEN** each message includes author display metadata with the current avatar URL when configured
