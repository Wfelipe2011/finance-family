export type ChatRole = "user" | "assistant";
export type ChatAuthorType = "user" | "agent";

export const CHAT_MESSAGE_STATUSES = [
  "pending",
  "job_created",
  "transcribing",
  "processing_ia",
  "completed",
  "failed",
] as const;

export type ChatMessageStatus = (typeof CHAT_MESSAGE_STATUSES)[number];

export type ChatAttachmentType = "audio" | "image";

export interface ChatAttachment {
  type: ChatAttachmentType;
  mime_type: string;
  url?: string;
  name?: string;
  size?: number;
}

export interface ChatAuthor {
  type: ChatAuthorType;
  id: string | number;
  displayName: string;
  avatarUrl?: string | null;
}

export interface FamilyContext {
  userId: number;
  groupId?: number;
  spouseId?: number | null;
  currentDate: string;
  currentDateTime: string;
  dayOfWeek: string;
  timezone: string;
  location?: string | null;
  jarvisAlwaysOn?: boolean;
  recentMessages?: Array<{
    author: string;
    content: string;
    created_at: string;
  }>;
}

export interface ChatMessage {
  id: string;
  groupId?: number;
  content: string;
  role: ChatRole;
  author?: ChatAuthor;
  status: ChatMessageStatus;
  created_at: string;
  mentions?: string[];
  attachments?: ChatAttachment[];
  jarvisContent?: string | null;
}

export interface ChatJobResponse {
  jobId?: string;
  status: "job_created" | "completed";
  messageId?: string;
  groupId?: number;
}

export type ChatSSEEventType =
  | "message.created"
  | "message.status"
  | "assistant.started"
  | "assistant.delta"
  | "assistant.completed"
  | "assistant.failed";

export interface SSEEvent {
  type?: ChatSSEEventType | string;
  status?: ChatMessageStatus;
  message?: string;
  messageId?: string;
  jobId?: string;
  groupId?: number;
  data?: unknown;
}
