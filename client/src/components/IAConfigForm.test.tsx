import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IAConfigForm } from "@/components/IAConfigForm";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    iaConfig: vi.fn(),
    updateIAConfig: vi.fn(),
    familyGroups: vi.fn(),
    skills: vi.fn(),
    groupSettings: vi.fn(),
    updateGroupSettings: vi.fn(),
    uploadUserAvatar: vi.fn(),
    uploadJarvisAvatar: vi.fn(),
  },
}));

describe("IAConfigForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.iaConfig).mockResolvedValue({ baseUrl: "http://localhost:11434/v1", apiKey: "abcdef1234" });
    vi.mocked(api.updateIAConfig).mockResolvedValue({ baseUrl: "http://localhost:11434/v1", apiKey: "abcdef1234" });
    vi.mocked(api.familyGroups).mockResolvedValue([{ id: 42, name: "Família", created_at: "2026-01-01T00:00:00.000Z" }]);
    vi.mocked(api.skills).mockResolvedValue([
      {
        id: "finance_crud",
        displayName: "Finance CRUD",
        description: "Cria e edita lançamentos",
        enabled: true,
      },
      {
        id: "finance_query",
        displayName: "Finance Query",
        description: "Consulta lançamentos",
        enabled: true,
      },
    ]);
    vi.mocked(api.groupSettings).mockResolvedValue({
      id: 1,
      group_id: 42,
      jarvisAlwaysOn: false,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(api.updateGroupSettings).mockResolvedValue({
      id: 1,
      group_id: 42,
      jarvisAlwaysOn: true,
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    vi.mocked(api.uploadUserAvatar).mockResolvedValue({
      avatar: {
        id: 1,
        ownerType: "user",
        ownerId: 7,
        publicUrl: "/uploads/user.webp",
        mimeType: "image/webp",
        size: 10,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
    vi.mocked(api.uploadJarvisAvatar).mockResolvedValue({
      avatar: {
        id: 2,
        ownerType: "agent",
        ownerId: "jarvis",
        group_id: 42,
        publicUrl: "/uploads/jarvis.webp",
        mimeType: "image/webp",
        size: 10,
        created_at: "2026-01-01T00:00:00.000Z",
      },
    });
  });

  it("pre-populates and validates URL", async () => {
    render(<IAConfigForm />);

    expect(await screen.findByDisplayValue("http://localhost:11434/v1")).toBeTruthy();
    const baseUrl = screen.getByLabelText("Base URL");
    fireEvent.change(baseUrl, { target: { value: "not-a-url" } });
    fireEvent.submit(screen.getByRole("button", { name: "Salvar" }).closest("form") as HTMLFormElement);

    expect(screen.getByText("URL inválida")).toBeTruthy();
    expect(api.updateIAConfig).not.toHaveBeenCalled();
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

  it("renders skills and saves the always-on setting", async () => {
    render(<IAConfigForm />);

    expect(await screen.findByText("Finance CRUD")).toBeTruthy();
    expect(screen.getByText("Finance Query")).toBeTruthy();

    const alwaysOn = await screen.findByLabelText("Jarvis sempre ativo");
    fireEvent.click(alwaysOn);

    await waitFor(() => expect(api.updateGroupSettings).toHaveBeenCalledWith(42, { jarvisAlwaysOn: true }));
  });

  it("uploads user and Jarvis avatars", async () => {
    const { container } = render(<IAConfigForm />);

    await screen.findByText("Finance CRUD");
    const inputs = container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    const userFile = new File(["avatar"], "user.webp", { type: "image/webp" });
    const jarvisFile = new File(["avatar"], "jarvis.webp", { type: "image/webp" });

    fireEvent.change(inputs[0], { target: { files: [userFile] } });
    fireEvent.change(inputs[1], { target: { files: [jarvisFile] } });

    await waitFor(() => expect(api.uploadUserAvatar).toHaveBeenCalledWith(expect.any(FormData)));
    await waitFor(() => expect(api.uploadJarvisAvatar).toHaveBeenCalledWith(42, expect.any(FormData)));
  });
});
