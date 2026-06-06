import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthenticatedLayout from "@/app/(authenticated)/layout";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/chat",
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false, isReady: true }),
}));

describe("AuthenticatedLayout", () => {
  it("redirects unauthenticated users to login", async () => {
    render(<AuthenticatedLayout><div>Privado</div></AuthenticatedLayout>);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("Privado")).toBeNull();
  });
});
