## ADDED Requirements

### Requirement: Chat message list
The system SHALL render a scrollable list of chat messages at `/chat`, with user messages on the right and assistant messages on the left, styled per Apple Design System.

#### Scenario: Messages displayed
- **WHEN** the chat page loads
- **THEN** all messages from the current session are displayed with user messages right-aligned and assistant messages left-aligned

#### Scenario: Auto-scroll to latest
- **WHEN** a new message arrives
- **THEN** the chat list auto-scrolls to the bottom

### Requirement: Chat input — text
The system SHALL provide a text input at the bottom of the chat page for typing messages, with a send button.

#### Scenario: Send text message
- **WHEN** user types "Quanto gastei no Carrefour?" and presses send
- **THEN** `POST /chat/message` is called with the text content, the message appears in the list with `pending` status indicator

### Requirement: Chat input — audio recording
The system SHALL provide a microphone button that starts `.wav` audio recording. On stop, the audio SHALL be uploaded to `POST /chat/message` as `multipart/form-data`.

#### Scenario: Record and send audio
- **WHEN** user taps microphone, speaks, and taps stop
- **THEN** a `.wav` file is created and uploaded; the message appears with audio attachment indicator

#### Scenario: Recording indicator
- **WHEN** audio is being recorded
- **THEN** a visual indicator (pulsing red dot or waveform) is shown

### Requirement: Chat input — image upload
The system SHALL provide an attachment button that opens the device's image picker (camera or gallery). Selected image is uploaded to `POST /chat/message`.

#### Scenario: Upload receipt image
- **WHEN** user attaches an image and sends
- **THEN** `POST /chat/message` is called with the image as `multipart/form-data`; message shows image thumbnail

#### Scenario: Invalid file type rejected
- **WHEN** user selects a non-image file
- **THEN** an error feedback is shown before upload

### Requirement: Message status indicators
The system SHALL display visual status for each message: `pending` (clock icon, gray), `processing` (spinner, blue), `completed` (check, green), `failed` (error, red).

#### Scenario: Pending state
- **WHEN** a message is just sent and not yet in the queue
- **THEN** it shows a gray clock icon

#### Scenario: Processing state
- **WHEN** the worker is processing the message
- **THEN** it shows a blue spinning indicator

#### Scenario: Completed state
- **WHEN** the SSE event `{ status: 'completed' }` arrives
- **THEN** the assistant response appears and the status changes to a green checkmark

### Requirement: SSE streaming connection
The system SHALL open an `EventSource` connection to `/chat/stream/:userId` on chat page mount, and update messages as events arrive.

#### Scenario: Receive completion event
- **WHEN** an SSE event `{ status: 'completed', message: 'Gasto de R$ 50 em Posto Shell adicionado!' }` arrives
- **THEN** the assistant message is added to the chat list with `completed` status

#### Scenario: SSE reconnection
- **WHEN** the SSE connection drops
- **THEN** `EventSource` automatically reconnects

#### Scenario: SSE cleanup on unmount
- **WHEN** user navigates away from chat page
- **THEN** the `EventSource` connection is closed

### Requirement: Chat page empty state
The system SHALL show a welcome message when no messages exist: "FinAI — Seu assistente financeiro. Pergunte sobre gastos ou envie um comprovante!"

#### Scenario: Empty chat
- **WHEN** chat page loads with no messages
- **THEN** a centered welcome message is displayed with FinAI branding