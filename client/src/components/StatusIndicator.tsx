import type { ChatMessageStatus } from "@fin-ai/shared";
import { AlertCircle, CheckCircle2, Clock3, FileScan, LoaderCircle, UploadCloud } from "lucide-react";

export function StatusIndicator({ status }: { status: ChatMessageStatus }) {
  const states = {
    pending: {
      icon: UploadCloud,
      label: "Enviando",
      className: "text-ink-muted-48",
    },
    job_created: {
      icon: Clock3,
      label: "Na fila",
      className: "text-ink-muted-48",
    },
    transcribing: {
      icon: FileScan,
      label: "Lendo arquivo",
      className: "text-ink-muted-48",
    },
    processing_ia: {
      icon: LoaderCircle,
      label: "IA processando",
      className: "text-primary",
    },
    completed: {
      icon: CheckCircle2,
      label: "Concluido",
      className: "text-ink-muted-80",
    },
    failed: {
      icon: AlertCircle,
      label: "Falhou",
      className: "text-ink-muted-80",
    },
  } satisfies Record<ChatMessageStatus, { icon: typeof Clock3; label: string; className: string }>;
  const state = states[status];
  const Icon = state.icon;

  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center gap-1.5 text-caption leading-tight ${state.className}`}
      aria-label={status}
    >
      <Icon className={status === "processing_ia" ? "shrink-0 animate-spin" : "shrink-0"} size={16} />
      <span className="min-w-0 break-words">{state.label}</span>
    </span>
  );
}
