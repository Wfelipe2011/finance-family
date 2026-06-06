import { render, screen } from "@testing-library/react";
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

    expect(screen.getByText("Mercado")).toBeTruthy();
    expect(screen.getByText("R$ 50,00")).toBeTruthy();
    expect(screen.getByText("01/01/2026")).toBeTruthy();
  });
});
