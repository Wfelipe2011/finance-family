import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChatJobResponse, ChatMessage, SSEEvent } from "@fin-ai/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";

let sseHandler: ((event: SSEEvent) => void) | undefined;
let streamGroupId: number | undefined;

const user = { userId: 7, username: "Wilson" };
const group = { id: 42, name: "Família", created_at: "2026-01-01T00:00:00.000Z" };

vi.mock("@/hooks/useSSE", () => ({
  useSSE: (groupId: number | undefined, onEvent: (event: SSEEvent) => void) => {
    streamGroupId = groupId;
    sseHandler = onEvent;
    return { connected: Boolean(groupId) };
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    familyGroups: vi.fn(),
    groupChatHistory: vi.fn(),
    groupChatMessage: vi.fn(),
  },
}));

vi.mock("@/lib/audio", () => ({
  startWavRecording: vi.fn(),
}));

describe("useChat group chat", () => {
  beforeEach(() => {
    sseHandler = undefined;
    streamGroupId = undefined;
    vi.mocked(api.familyGroups).mockReset();
    vi.mocked(api.groupChatHistory).mockReset();
    vi.mocked(api.groupChatMessage).mockReset();
    vi.mocked(api.familyGroups).mockResolvedValue([group]);
    vi.mocked(api.groupChatHistory).mockResolvedValue([]);
  });

  it("loads persisted group history on mount", async () => {
    const history: ChatMessage[] = [
      {
        id: "m-1",
        groupId: 42,
        content: "Mensagem salva",
        role: "user",
        author: { type: "user", id: 8, displayName: "Ana", avatarUrl: "/uploads/ana.webp" },
        status: "completed",
        created_at: "2026-01-01T00:00:00.000Z",
      },
    ];
    vi.mocked(api.groupChatHistory).mockResolvedValue(history);

    const { result } = renderHook(() => useChat(user));

    await waitFor(() => expect(result.current.groupId).toBe(42));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    expect(streamGroupId).toBe(42);
    expect(api.groupChatHistory).toHaveBeenCalledWith(42);
    expect(result.current.messages[0].author).toMatchObject({ displayName: "Ana", avatarUrl: "/uploads/ana.webp" });
  });

  it("renders a human-only message immediately without Jarvis mention metadata", async () => {
    vi.mocked(api.groupChatMessage).mockResolvedValue({
      messageId: "human-1",
      status: "job_created",
    } as ChatJobResponse);
    const { result } = renderHook(() => useChat(user));

    await waitFor(() => expect(result.current.groupId).toBe(42));

    await act(async () => {
      await result.current.send("Vou ao mercado");
    });

    expect(api.groupChatMessage).toHaveBeenCalledWith(42, expect.any(FormData));
    expect(result.current.messages[0]).toMatchObject({
      id: "human-1",
      content: "Vou ao mercado",
      author: { type: "user", id: 7, displayName: "Wilson" },
    });
    expect(result.current.messages[0].mentions).toBeUndefined();
  });

  it("tracks @Jarvis mention and streams progressive deltas into one assistant bubble", async () => {
    vi.mocked(api.groupChatMessage).mockResolvedValue({
      messageId: "human-2",
      jobId: "job-2",
      groupId: 42,
      status: "job_created",
    });
    const { result } = renderHook(() => useChat(user));

    await waitFor(() => expect(result.current.groupId).toBe(42));

    await act(async () => {
      await result.current.send("@Jarvis resume isso");
    });

    expect(result.current.messages[0]).toMatchObject({
      id: "human-2",
      mentions: ["Jarvis"],
      status: "job_created",
    });

    act(() => {
      sseHandler?.({ type: "message.status", status: "processing_ia", messageId: "human-2", jobId: "job-2", groupId: 42 });
      sseHandler?.({ type: "assistant.started", messageId: "jarvis-1", jobId: "job-2", groupId: 42, data: { content: "Olá" } });
      sseHandler?.({ type: "assistant.delta", messageId: "jarvis-1", jobId: "job-2", groupId: 42, data: { delta: " mundo" } });
      sseHandler?.({ type: "assistant.completed", messageId: "jarvis-1", jobId: "job-2", groupId: 42 });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ id: "human-2", status: "processing_ia" });
    expect(result.current.messages[1]).toMatchObject({
      id: "jarvis-1",
      content: "Olá mundo",
      author: { type: "agent", id: "jarvis", displayName: "Jarvis" },
      status: "completed",
    });
  });
});
