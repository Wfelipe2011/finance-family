"use client";

import { useEffect, useState } from "react";
import type { SSEEvent } from "@fin-ai/shared";
import { apiUrl, getStoredToken } from "@/lib/api";

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
      try {
        onEvent(JSON.parse(message.data) as SSEEvent);
      } catch {
        onEvent({ status: "completed", message: message.data });
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [onEvent, userId]);

  return { connected };
}
