import type {
  AvatarUploadResponse,
  IAConfig,
  ChatJobResponse,
  ChatMessage,
  FamilyGroupDTO,
  FamilyGroupSettingsDTO,
  LancamentoDTO,
  LancamentoFilterDTO,
  LoginRequest,
  LoginResponse,
  JarvisSkillDTO,
  UpdateFamilyGroupSettingsDTO,
  UpdateIAConfigDTO,
  UserProfile,
} from "@fin-ai/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api-family.wfelipe.com.br";
const TOKEN_KEY = "finai.token";

let onUnauthorized: (() => void) | undefined;

export function setUnauthorizedHandler(handler: (() => void) | undefined) {
  onUnauthorized = handler;
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();

  if (token && !options.skipAuth) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(apiUrl(path), { ...options, headers });

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    throw new ApiError(response.statusText || "Erro na API", response.status);
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as T;
  return (await response.text()) as T;
}

export const api = {
  login(payload: LoginRequest) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });
  },
  me() {
    return apiFetch<UserProfile>("/auth/profile");
  },
  lancamentos(filters: LancamentoFilterDTO = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    const query = params.toString();
    return apiFetch<LancamentoDTO[]>(`/lancamentos${query ? `?${query}` : ""}`);
  },
  exportLancamentos(filters: LancamentoFilterDTO = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    const query = params.toString();
    return apiFetch<string>(`/lancamentos/export${query ? `?${query}` : ""}`);
  },
  familyGroups() {
    return apiFetch<FamilyGroupDTO[]>("/groups");
  },
  groupChatHistory(groupId: number) {
    return apiFetch<ChatMessage[]>(`/groups/${groupId}/chat/messages`);
  },
  groupChatMessage(groupId: number, formData: FormData) {
    return apiFetch<ChatJobResponse>(`/groups/${groupId}/chat/messages`, {
      method: "POST",
      body: formData,
    });
  },
  skills() {
    return apiFetch<JarvisSkillDTO[]>("/api/skills");
  },
  groupSettings(groupId: number) {
    return apiFetch<FamilyGroupSettingsDTO>(`/groups/${groupId}/settings`);
  },
  updateGroupSettings(groupId: number, payload: UpdateFamilyGroupSettingsDTO) {
    return apiFetch<FamilyGroupSettingsDTO>(`/groups/${groupId}/settings`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  uploadUserAvatar(formData: FormData) {
    return apiFetch<AvatarUploadResponse>("/users/me/avatar", { method: "POST", body: formData });
  },
  uploadJarvisAvatar(groupId: number, formData: FormData) {
    return apiFetch<AvatarUploadResponse>(`/groups/${groupId}/jarvis/avatar`, {
      method: "POST",
      body: formData,
    });
  },
  iaConfig() {
    return apiFetch<IAConfig>("/config/ia");
  },
  updateIAConfig(payload: UpdateIAConfigDTO) {
    return apiFetch<IAConfig>("/config/ia", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
