import { act, renderHook, waitFor } from "@testing-library/react";
import type { SSEEvent } from "@fin-ai/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChat } from "@/hooks/useChat";
import { api } from "@/lib/api";

let sseHandler: ((event: SSEEvent) => void) | undefined;

vi.mock("@/hooks/useSSE", () => ({
  useSSE: (_userId: number | undefined, onEvent: (event: SSEEvent) => void) => {
    sseHandler = onEvent;
    return { connected: true };
  },
}));

vi.mock("@/lib/api", () => ({
  api: {
    chatMessage: vi.fn(),
  },
}));

vi.mock("@/lib/audio", () => ({
  startWavRecording: vi.fn(),
}));

describe("useChat lifecycle mapping", () => {
  beforeEach(() => {
    sseHandler = undefined;
    vi.mocked(api.chatMessage).mockReset();
  });

  it("keeps upload local before acceptance and maps lifecycle events to one user message", async () => {
    vi.mocked(api.chatMessage).mockResolvedValue({ jobId: "job-1", status: "job_created" });
    const { result } = renderHook(() => useChat(7));

    await act(async () => {
      await result.current.send("Quanto gastei?");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      id: "job-1",
      role: "user",
      status: "job_created",
    });

    act(() => {
      sseHandler?.({ status: "processing_ia", message: "Processando", jobId: "job-1" });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ id: "job-1", status: "processing_ia" });
  });

  it("appends a completed assistant response once", async () => {
    vi.mocked(api.chatMessage).mockResolvedValue({ jobId: "job-2", status: "job_created" });
    const { result } = renderHook(() => useChat(7));

    await act(async () => {
      await result.current.send("Oi");
    });

    act(() => {
      sseHandler?.({ status: "completed", message: "Resposta final", jobId: "job-2" });
      sseHandler?.({ status: "completed", message: "Resposta final", jobId: "job-2" });
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[0]).toMatchObject({ id: "job-2", status: "completed" });
    expect(result.current.messages[1]).toMatchObject({
      id: "assistant-job-2",
      role: "assistant",
      content: "Resposta final",
      status: "completed",
    });
  });

  it("marks failed without duplicate progress bubbles", async () => {
    vi.mocked(api.chatMessage).mockResolvedValue({ jobId: "job-3", status: "job_created" });
    const { result } = renderHook(() => useChat(7));

    await act(async () => {
      await result.current.send("Oi");
    });

    act(() => {
      sseHandler?.({ status: "failed", message: "Nao foi possivel processar.", jobId: "job-3" });
      sseHandler?.({ status: "failed", message: "Nao foi possivel processar.", jobId: "job-3" });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toMatchObject({ id: "job-3", status: "failed" });
    expect(result.current.messages[1]).toMatchObject({
      id: "assistant-job-3",
      role: "assistant",
      status: "failed",
    });
  });
});
