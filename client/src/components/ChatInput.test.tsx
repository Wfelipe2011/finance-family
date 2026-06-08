import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/ChatInput";

describe("ChatInput", () => {
  it("adds @Jarvis through the mention affordance", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={onSend} onToggleRecording={vi.fn()} isRecording={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Mencionar Jarvis" }));
    const input = screen.getByPlaceholderText("Mensagem no grupo") as HTMLInputElement;
    expect(input.value).toBe("@Jarvis ");
    fireEvent.change(input, {
      target: { value: "@Jarvis quanto gastamos?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("@Jarvis quanto gastamos?"));
  });

  it("keeps normal human conversation unprefixed", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={onSend} onToggleRecording={vi.fn()} isRecording={false} />);

    fireEvent.change(screen.getByPlaceholderText("Mensagem no grupo"), {
      target: { value: "Vou ao mercado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("Vou ao mercado"));
  });
});
