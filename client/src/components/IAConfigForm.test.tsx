import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IAConfigForm } from "@/components/IAConfigForm";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    iaConfig: vi.fn(),
    updateIAConfig: vi.fn(),
  },
}));

describe("IAConfigForm", () => {
  beforeEach(() => {
    vi.mocked(api.iaConfig).mockResolvedValue({ baseUrl: "http://localhost:11434/v1", apiKey: "abcdef1234" });
    vi.mocked(api.updateIAConfig).mockResolvedValue({ baseUrl: "http://localhost:11434/v1", apiKey: "abcdef1234" });
  });

  it("pre-populates and validates URL", async () => {
    render(<IAConfigForm />);

    expect(await screen.findByDisplayValue("http://localhost:11434/v1")).toBeTruthy();
    const baseUrl = screen.getByLabelText("Base URL");
    fireEvent.change(baseUrl, { target: { value: "not-a-url" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("URL inválida")).toBeTruthy();
    await waitFor(() => expect(api.updateIAConfig).not.toHaveBeenCalled());
  });

  it("does not overwrite user edits when config loading finishes later", async () => {
    let resolveConfig: (value: { baseUrl: string; apiKey: string }) => void = () => undefined;
    vi.mocked(api.iaConfig).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveConfig = resolve;
      }),
    );

    render(<IAConfigForm />);

    const baseUrl = screen.getByLabelText("Base URL");
    fireEvent.change(baseUrl, { target: { value: "http://typed.local/v1" } });
    resolveConfig({ baseUrl: "http://localhost:11434/v1", apiKey: "abcdef1234" });

    await waitFor(() => expect((baseUrl as HTMLInputElement).value).toBe("http://typed.local/v1"));
  });

  it("omits masked apiKey when only base URL changes", async () => {
    render(<IAConfigForm />);

    const baseUrl = await screen.findByLabelText("Base URL");
    fireEvent.change(baseUrl, { target: { value: "http://127.0.0.1:11434/v1" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(api.updateIAConfig).toHaveBeenCalledWith({
        baseUrl: "http://127.0.0.1:11434/v1",
      }),
    );
  });
});
