"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { ChatMessage, ChatMessageStatus, SSEEvent } from "@fin-ai/shared";
import { api } from "@/lib/api";
import { startWavRecording, type RecorderHandle } from "@/lib/audio";
import { useSSE } from "@/hooks/useSSE";

export function useChat(userId: number | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecorderHandle | null>(null);

  const handleSSE = useCallback((event: SSEEvent) => {
    const status = event.status as ChatMessageStatus;
    setMessages((current) => [
      ...current.map((message) =>
        message.role === "user" && message.status !== "completed"
          ? { ...message, status: status === "completed" ? ("completed" as ChatMessageStatus) : message.status }
          : message,
      ),
      {
        id: `assistant-${Date.now()}`,
        content: event.message,
        role: "assistant",
        status: status === "failed" ? "failed" : "completed",
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const { connected } = useSSE(userId, handleSSE);

  const send = useCallback(async (content: string, file?: File) => {
    const formData = new FormData();
    if (content) formData.set("content", content);
    if (file) formData.set("file", file);

    const localMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      content: content || (file?.type.startsWith("image/") ? "Imagem anexada" : "Audio gravado"),
      role: "user",
      status: "pending",
      created_at: new Date().toISOString(),
      attachments: file
        ? [{ type: file.type.startsWith("image/") ? "image" : "audio", mime_type: file.type }]
        : undefined,
    };
    setMessages((current) => [...current, localMessage]);
    setError(null);

    try {
      const response = await api.chatMessage(formData);
      setMessages((current) =>
        current.map((message) =>
          message.id === localMessage.id ? { ...message, id: response.jobId, status: response.status } : message,
        ),
      );
    } catch {
      setMessages((current) =>
        current.map((message) =>
          message.id === localMessage.id ? { ...message, status: "failed" } : message,
        ),
      );
      setError("Erro ao enviar mensagem");
    }
  }, []);

  const toggleRecording = useCallback(async () => {
    if (recorderRef.current) {
      const file = await recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      await send("", file);
      return;
    }
    recorderRef.current = await startWavRecording();
    setIsRecording(true);
  }, [send]);

  return useMemo(
    () => ({ messages, send, toggleRecording, isRecording, connected, error }),
    [connected, error, isRecording, messages, send, toggleRecording],
  );
}
