import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@fin-ai/shared";
import { ChatBubble } from "@/components/ChatBubble";

const base: ChatMessage = {
  id: "1",
  content: "Teste",
  role: "user",
  author: { type: "user", id: 7, displayName: "Wilson", avatarUrl: "/uploads/wilson.webp" },
  status: "pending",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("ChatBubble", () => {
  it("renders human author metadata and avatar", () => {
    render(<ChatBubble message={base} currentUserId={7} />);

    expect(screen.getByText("Wilson")).toBeTruthy();
    expect((screen.getByRole("img", { name: "Wilson" }) as HTMLImageElement).getAttribute("src")).toBe(
      "/uploads/wilson.webp",
    );
    expect(screen.getByText("Teste").closest("div")?.className).toContain("bg-canvas");
  });

  it("renders Jarvis as an agent bubble with fallback initials", () => {
    render(
      <ChatBubble
        message={{
          ...base,
          id: "2",
          role: "assistant",
          author: { type: "agent", id: "jarvis", displayName: "Jarvis" },
        }}
      />,
    );

    expect(screen.getByText("Jarvis")).toBeTruthy();
    expect(screen.getByText("J")).toBeTruthy();
    expect(screen.getByText("Teste").closest("div")?.className).toContain("bg-canvas-parchment");
  });
});
