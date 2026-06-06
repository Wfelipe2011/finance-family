"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginRequest, UserProfile } from "@fin-ai/shared";
import { api, getStoredToken, setStoredToken, setUnauthorizedHandler } from "@/lib/api";

type AuthContextValue = {
  user: UserProfile | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(undefined);
  }, [logout]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getStoredToken();
      setToken(stored);
      if (!stored) {
        setIsReady(true);
        return;
      }
      api
        .me()
        .then(setUser)
        .catch(() => {
          setStoredToken(null);
          setToken(null);
          setUser(null);
        })
        .finally(() => setIsReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await api.login(payload);
    setStoredToken(response.access_token);
    setToken(response.access_token);
    const profile = await api.me().catch(() => ({
      userId: 0,
      username: payload.email,
    }));
    setUser(profile);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [isReady, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
