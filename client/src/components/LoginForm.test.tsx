import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/LoginForm";
import { ApiError } from "@/lib/api";

const replace = vi.fn();
const login = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ login }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    login.mockReset();
    replace.mockReset();
  });

  it("renders and validates input", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe um email válido")).toBeTruthy();
    expect(screen.getByText("Use pelo menos 6 caracteres")).toBeTruthy();
  });

  it("shows invalid credential error", async () => {
    login.mockRejectedValue(new ApiError("Unauthorized", 401));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Email ou senha inválidos")).toBeTruthy();
    await waitFor(() => expect(replace).not.toHaveBeenCalled());
  });
});
