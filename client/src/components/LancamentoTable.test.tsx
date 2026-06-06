import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CategoriaEnum, type LancamentoDTO } from "@fin-ai/shared";
import { LancamentoTable } from "@/components/LancamentoTable";

describe("LancamentoTable", () => {
  it("renders rows with formatted values", () => {
    const item: LancamentoDTO = {
      id: 1,
      descricao: "Mercado",
      valor: 50,
      data: "2026-01-01",
      categoria: CategoriaEnum.Alimentacao,
      usuario_id: 1,
      created_at: "2026-01-01T00:00:00.000Z",
    };

    render(<LancamentoTable items={[item]} />);

    expect(screen.getAllByText("Mercado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("R$ 50,00").length).toBeGreaterThan(0);
    expect(screen.getByText("01/01/2026")).toBeTruthy();
  });

  it("renders expandable mobile rows alongside the desktop table", () => {
    const item: LancamentoDTO = {
      id: 1,
      descricao: "Mercado",
      valor: 50,
      data: "2026-01-01",
      categoria: CategoriaEnum.Alimentacao,
      usuario_id: 1,
      created_at: "2026-01-01T00:00:00.000Z",
    };

    render(<LancamentoTable items={[item]} />);

    fireEvent.click(screen.getByRole("button", { name: /Mercado/i }));

    expect(screen.getByRole("button", { name: "Editar Mercado" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Excluir Mercado" })).toBeTruthy();
  });
});
