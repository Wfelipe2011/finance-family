export type ChatRole = "user" | "assistant";

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
}

export interface FamilyContext {
  userId: number;
  spouseId?: number | null;
  currentDate: string;
  currentDateTime: string;
  dayOfWeek: string;
  timezone: string;
  location?: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: ChatRole;
  status: ChatMessageStatus;
  created_at: string;
  attachments?: ChatAttachment[];
}

export interface ChatJobResponse {
  jobId: string;
  status: "job_created";
}

export interface SSEEvent {
  status: ChatMessageStatus;
  message: string;
  jobId?: string;
  data?: unknown;
}
