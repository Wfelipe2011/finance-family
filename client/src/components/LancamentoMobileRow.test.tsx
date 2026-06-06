import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoriaEnum, type LancamentoDTO } from "@fin-ai/shared";
import { LancamentoMobileRow } from "@/components/LancamentoMobileRow";

const item: LancamentoDTO = {
  id: 1,
  descricao: "Mercado",
  valor: 50,
  data: "2026-01-01",
  categoria: CategoriaEnum.Alimentacao,
  usuario_id: 2,
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("LancamentoMobileRow", () => {
  it("shows scan-critical fields while collapsed", () => {
    render(<LancamentoMobileRow item={item} />);

    expect(screen.getByText("Mercado")).toBeTruthy();
    expect(screen.getByText(CategoriaEnum.Alimentacao)).toBeTruthy();
    expect(screen.getByText("R$ 50,00")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar Mercado" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir Mercado" })).toBeNull();
  });

  it("expands and collapses with pointer activation", () => {
    render(<LancamentoMobileRow item={item} />);

    const row = screen.getByRole("button", { name: /Mercado/i });
    expect(row.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(row);
    expect(row.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("01/01/2026")).toBeTruthy();
    expect(screen.getByText("Usuário 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar Mercado" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Excluir Mercado" })).toBeTruthy();

    fireEvent.click(row);
    expect(row.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Excluir Mercado" })).toBeNull();
  });

  it("uses Red Apple only for the destructive delete action", () => {
    render(<LancamentoMobileRow item={item} />);

    fireEvent.click(screen.getByRole("button", { name: /Mercado/i }));

    const edit = screen.getByRole("button", { name: "Editar Mercado" });
    const remove = screen.getByRole("button", { name: "Excluir Mercado" });

    expect(edit.className).toContain("btn-secondary-pill");
    expect(edit.className).not.toContain("destructive");
    expect(remove.className).toContain("btn-destructive");
  });

  it("supports keyboard activation through the native button", () => {
    render(<LancamentoMobileRow item={item} />);

    const row = screen.getByRole("button", { name: /Mercado/i });
    row.focus();
    fireEvent.keyDown(row, { key: "Enter", code: "Enter" });
    fireEvent.click(row);

    expect(row.getAttribute("aria-expanded")).toBe("true");
  });
});
