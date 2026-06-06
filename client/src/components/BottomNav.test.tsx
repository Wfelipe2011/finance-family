import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("BottomNav", () => {
  it("highlights active tab", () => {
    render(<BottomNav />);

    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("style")).toContain(
      "color: var(--color-primary)",
    );
    expect(screen.getByText("Chat").closest("a")?.getAttribute("style")).toContain(
      "color: var(--color-ink-muted-48)",
    );
  });
});
