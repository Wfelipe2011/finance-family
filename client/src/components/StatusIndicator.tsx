import type { ChatMessageStatus } from "@fin-ai/shared";
import { AlertCircle, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";

export function StatusIndicator({ status }: { status: ChatMessageStatus }) {
  if (status === "pending") return <Clock3 aria-label="pending" className="text-ink-muted-48" size={16} />;
  if (status === "processing") return <LoaderCircle aria-label="processing" className="animate-spin text-primary" size={16} />;
  if (status === "failed") return <AlertCircle aria-label="failed" className="text-ink-muted-80" size={16} />;
  return <CheckCircle2 aria-label="completed" className="text-ink-muted-80" size={16} />;
}
