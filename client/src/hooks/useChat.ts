"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatAuthor, ChatMessage, ChatMessageStatus, SSEEvent, UserProfile } from "@fin-ai/shared";
import { api } from "@/lib/api";
import { startWavRecording, type RecorderHandle } from "@/lib/audio";
import { useSSE } from "@/hooks/useSSE";

const jarvisAuthor: ChatAuthor = {
  type: "agent",
  id: "jarvis",
  displayName: "Jarvis",
};

function humanAuthor(user: UserProfile): ChatAuthor {
  return {
    type: "user",
    id: user.userId,
    displayName: user.username,
  };
}

function dataRecord(event: SSEEvent): Record<string, unknown> {
  return event.data && typeof event.data === "object" ? (event.data as Record<string, unknown>) : {};
}

function messageFromData(event: SSEEvent): ChatMessage | null {
  const data = event.data;
  if (!data || typeof data !== "object") return null;
  const candidate = data as Partial<ChatMessage>;
  if (typeof candidate.id !== "string" || typeof candidate.content !== "string") return null;
  return {
    ...candidate,
    role: candidate.role ?? (candidate.author?.type === "agent" ? "assistant" : "user"),
    status: candidate.status ?? "completed",
    created_at: candidate.created_at ?? new Date().toISOString(),
  } as ChatMessage;
}

function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    role: message.role ?? (message.author?.type === "agent" ? "assistant" : "user"),
    status: message.status ?? "completed",
    created_at: message.created_at ?? new Date().toISOString(),
  };
}

function idsFor(event: SSEEvent) {
  return [event.messageId, event.jobId].filter(Boolean);
}

function matchesEvent(message: ChatMessage, event: SSEEvent) {
  const ids = idsFor(event);
  return ids.some((id) => message.id === id) || (event.jobId ? message.id === `job-${event.jobId}` : false);
}

function assistantIdFor(event: SSEEvent) {
  const dataMessageId = dataRecord(event).messageId;
  return (
    event.messageId ??
    (typeof dataMessageId === "string" ? dataMessageId : undefined) ??
    (event.jobId ? `assistant-${event.jobId}` : "assistant-stream")
  );
}

function eventText(event: SSEEvent) {
  const data = dataRecord(event);
  return String(data.delta ?? data.content ?? data.message ?? event.message ?? "");
}

function hasJarvisMention(content: string) {
  return /(^|\s)@jarvis\b/i.test(content);
}

export function useChat(user: UserProfile | null | undefined) {
  const [groupId, setGroupId] = useState<number>();
  const [groupName, setGroupName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecorderHandle | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    api
      .familyGroups()
      .then((groups) => {
        if (!active) return;
        const group = groups[0];
        setGroupId(group?.id);
        setGroupName(group?.name ?? null);
      })
      .catch(() => setError("Erro ao carregar grupo familiar"));
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!groupId) return;
    let active = true;
    setLoadingHistory(true);
    api
      .groupChatHistory(groupId)
      .then((history) => {
        if (active) setMessages(history.map(normalizeMessage));
      })
      .catch(() => setError("Erro ao carregar histórico do grupo"))
      .finally(() => {
        if (active) setLoadingHistory(false);
      });
    return () => {
      active = false;
    };
  }, [groupId]);

  const handleSSE = useCallback((event: SSEEvent) => {
    if (groupId && event.groupId && event.groupId !== groupId) return;

    setMessages((current) => {
      if (event.type === "message.created") {
        const incoming = messageFromData(event);
        if (!incoming) return current;
        const normalized = normalizeMessage(incoming);
        const existingIndex = current.findIndex((message) => message.id === normalized.id);
        if (existingIndex >= 0) {
          return current.map((message, index) => (index === existingIndex ? normalizeMessage({ ...message, ...normalized }) : message));
        }
        const localIndex = current.findIndex(
          (message) =>
            message.status === "pending" &&
            message.content === normalized.content &&
            message.author?.type === normalized.author?.type &&
            String(message.author?.id) === String(normalized.author?.id),
        );
        if (localIndex >= 0) {
          return current.map((message, index) => (index === localIndex ? normalizeMessage({ ...message, ...normalized }) : message));
        }
        return [...current, normalized];
      }

      if (
        event.type === "assistant.started" ||
        event.type === "assistant.delta" ||
        event.type === "assistant.completed" ||
        event.type === "assistant.failed"
      ) {
        const assistantId = assistantIdFor(event);
        const text = eventText(event);
        const status: ChatMessageStatus = event.type === "assistant.failed" ? "failed" : event.type === "assistant.completed" ? "completed" : "processing_ia";
        const existing = current.find((message) => message.id === assistantId);
        if (existing) {
          return current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: event.type === "assistant.delta" ? `${message.content}${text}` : text || message.content,
                  status,
                }
              : message,
          );
        }
        return [
          ...current,
          {
            id: assistantId,
            groupId: event.groupId,
            content: text,
            role: "assistant",
            author: jarvisAuthor,
            status,
            created_at: new Date().toISOString(),
          },
        ];
      }

      const eventStatus = event.status;
      if (!eventStatus) return current;

      const updated = current.map((message) =>
        message.author?.type !== "agent" && matchesEvent(message, event) ? { ...message, status: eventStatus } : message,
      );

      if ((eventStatus === "completed" || eventStatus === "failed") && event.message) {
        const assistantId = assistantIdFor(event);
        if (!updated.some((message) => message.id === assistantId)) {
          return [
            ...updated,
            {
              id: assistantId,
              groupId: event.groupId,
              content: event.message,
              role: "assistant",
              author: jarvisAuthor,
              status: eventStatus === "failed" ? "failed" : "completed",
              created_at: new Date().toISOString(),
            },
          ];
        }
      }

      return updated;
    });
  }, [groupId]);

  const { connected } = useSSE(groupId, handleSSE);

  const send = useCallback(async (content: string, file?: File) => {
    if (!user || !groupId) return;
    const formData = new FormData();
    if (content) formData.set("content", content);
    if (file) formData.set("file", file);

    const author = humanAuthor(user);
    const localMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      groupId,
      content: content || (file?.type.startsWith("image/") ? "Imagem anexada" : "Audio gravado"),
      role: "user",
      author,
      status: "pending",
      created_at: new Date().toISOString(),
      mentions: hasJarvisMention(content) ? ["Jarvis"] : undefined,
      attachments: file
        ? [{ type: file.type.startsWith("image/") ? "image" : "audio", mime_type: file.type }]
        : undefined,
    };
    setMessages((current) => [...current, localMessage]);
    setError(null);

    try {
      const response = await api.groupChatMessage(groupId, formData);
      setMessages((current) =>
        current.map((message) =>
          message.id === localMessage.id
            ? {
                ...message,
                id: response.messageId ?? response.jobId ?? message.id,
                status: response.jobId ? response.status : "completed",
              }
            : message,
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
  }, [groupId, user]);

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
    () => ({ messages, send, toggleRecording, isRecording, connected, error, groupId, groupName, loadingHistory }),
    [connected, error, groupId, groupName, isRecording, loadingHistory, messages, send, toggleRecording],
  );
}
