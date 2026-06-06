"use client";

import { useEffect, useState } from "react";
import { CHAT_MESSAGE_STATUSES, type SSEEvent } from "@fin-ai/shared";
import { apiUrl, getStoredToken } from "@/lib/api";

function toSSEEvent(data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data) as Partial<SSEEvent>;
    return parsed.status && CHAT_MESSAGE_STATUSES.includes(parsed.status)
      ? {
          status: parsed.status,
          message: typeof parsed.message === "string" ? parsed.message : "",
          jobId: typeof parsed.jobId === "string" ? parsed.jobId : undefined,
          data: parsed.data,
        }
      : null;
  } catch {
    return { status: "completed", message: data };
  }
}

export function useSSE(userId: number | undefined, onEvent: (event: SSEEvent) => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const token = getStoredToken();
    const params = token ? `?token=${encodeURIComponent(token)}` : "";
    const source = new EventSource(apiUrl(`/chat/stream/${userId}${params}`));

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      const event = toSSEEvent(message.data);
      if (event) onEvent(event);
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [onEvent, userId]);

  return { connected };
}
