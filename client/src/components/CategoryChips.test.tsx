import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CategoriaEnum } from "@fin-ai/shared";
import { CategoryChips } from "@/components/CategoryChips";

describe("CategoryChips", () => {
  it("filters by category and clears with Todos", () => {
    const onChange = vi.fn();

    const { rerender } = render(<CategoryChips value={{ dataInicio: "2026-01-01" }} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: CategoriaEnum.Alimentacao }));
    expect(onChange).toHaveBeenCalledWith({
      dataInicio: "2026-01-01",
      categoria: CategoriaEnum.Alimentacao,
    });

    rerender(<CategoryChips value={{ categoria: CategoriaEnum.Lazer }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Todos" }));

    expect(onChange).toHaveBeenCalledWith({ categoria: undefined });
  });

  it("keeps stable accessible chip targets and active state", () => {
    render(<CategoryChips value={{ categoria: CategoriaEnum.Saude }} onChange={vi.fn()} />);

    const active = screen.getByRole("button", { name: CategoriaEnum.Saude });
    const inactive = screen.getByRole("button", { name: CategoriaEnum.Transporte });

    expect(active.getAttribute("aria-pressed")).toBe("true");
    expect(active.className).toContain("min-h-11");
    expect(active.className).toContain("bg-primary");
    expect(inactive.getAttribute("aria-pressed")).toBe("false");
    expect(inactive.className).not.toContain("destructive");
  });
});
