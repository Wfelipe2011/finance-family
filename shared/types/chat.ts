export type ChatRole = "user" | "assistant";

export type ChatMessageStatus = "pending" | "processing" | "completed" | "failed";

export type ChatAttachmentType = "audio" | "image";

export interface ChatAttachment {
  type: ChatAttachmentType;
  mime_type: string;
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
  status: "pending";
}

export interface SSEEvent {
  status: string;
  message: string;
  data?: unknown;
}
