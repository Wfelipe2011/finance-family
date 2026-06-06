import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoriaEnum } from "@fin-ai/shared";
import { FilterBar } from "@/components/FilterBar";

describe("FilterBar", () => {
  it("emits correct filter values", () => {
    const onChange = vi.fn();
    render(<FilterBar value={{}} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Inicio"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByLabelText("Categoria"), { target: { value: CategoriaEnum.Alimentacao } });

    expect(onChange).toHaveBeenCalledWith({ dataInicio: "2026-01-01" });
    expect(onChange).toHaveBeenCalledWith({ categoria: CategoriaEnum.Alimentacao });
  });
});
