"use client";

import { useEffect, useState } from "react";
import { CHAT_MESSAGE_STATUSES, type ChatSSEEventType, type SSEEvent } from "@fin-ai/shared";
import { apiUrl, getStoredToken } from "@/lib/api";

function toSSEEvent(data: string): SSEEvent | null {
  try {
    const parsed = JSON.parse(data) as Partial<SSEEvent>;
    const status = parsed.status && CHAT_MESSAGE_STATUSES.includes(parsed.status) ? parsed.status : undefined;
    const type = typeof parsed.type === "string" ? (parsed.type as ChatSSEEventType) : undefined;
    if (!status && !type) return null;
    return {
      ...parsed,
      type,
      status,
      message: typeof parsed.message === "string" ? parsed.message : undefined,
      messageId: typeof parsed.messageId === "string" ? parsed.messageId : undefined,
      jobId: typeof parsed.jobId === "string" ? parsed.jobId : undefined,
      groupId: typeof parsed.groupId === "number" ? parsed.groupId : undefined,
    };
  } catch {
    return { status: "completed", message: data };
  }
}

export function useSSE(groupId: number | undefined, onEvent: (event: SSEEvent) => void) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const token = getStoredToken();
    const params = token ? `?token=${encodeURIComponent(token)}` : "";
    const source = new EventSource(apiUrl(`/groups/${groupId}/chat/stream${params}`));

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
  }, [groupId, onEvent]);

  return { connected };
}
