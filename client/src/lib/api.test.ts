import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, apiFetch, setStoredToken, setUnauthorizedHandler } from "@/lib/api";

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

  it("uses group-scoped chat, skills, settings, and avatar endpoints", async () => {
    setStoredToken("abc");
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await api.groupChatHistory(42);
    await api.groupChatMessage(42, new FormData());
    await api.skills();
    await api.groupSettings(42);
    await api.updateGroupSettings(42, { jarvisAlwaysOn: true });
    await api.uploadUserAvatar(new FormData());
    await api.uploadJarvisAvatar(42, new FormData());

    const paths = fetchMock.mock.calls.map((call) => String(call[0]));
    expect(paths).toEqual([
      "https://api-family.wfelipe.com.br/groups/42/chat/messages",
      "https://api-family.wfelipe.com.br/groups/42/chat/messages",
      "https://api-family.wfelipe.com.br/api/skills",
      "https://api-family.wfelipe.com.br/groups/42/settings",
      "https://api-family.wfelipe.com.br/groups/42/settings",
      "https://api-family.wfelipe.com.br/users/me/avatar",
      "https://api-family.wfelipe.com.br/groups/42/jarvis/avatar",
    ]);
  });
});
