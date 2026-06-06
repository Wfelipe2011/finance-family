import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@fin-ai/shared";
import { ChatBubble } from "@/components/ChatBubble";

const base: ChatMessage = {
  id: "1",
  content: "Teste",
  role: "user",
  status: "pending",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("ChatBubble", () => {
  it("renders user and assistant styling", () => {
    const { rerender } = render(<ChatBubble message={base} />);
    expect(screen.getByText("Teste").closest("div")?.className).toContain("bg-primary/10");

    rerender(<ChatBubble message={{ ...base, role: "assistant" }} />);
    expect(screen.getByText("Teste").closest("div")?.className).toContain("bg-canvas-parchment");
  });
});
