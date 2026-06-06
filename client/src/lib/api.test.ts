import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, setStoredToken, setUnauthorizedHandler } from "@/lib/api";

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("attaches JWT header and handles 401", async () => {
    const logout = vi.fn();
    setUnauthorizedHandler(logout);
    setStoredToken("abc");

    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiFetch("/secure")).rejects.toMatchObject({ status: 401 });

    expect(fetchMock.mock.calls[0][1].headers.get("Authorization")).toBe("Bearer abc");
    expect(logout).toHaveBeenCalled();
  });
});
