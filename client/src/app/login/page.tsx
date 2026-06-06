"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) router.replace("/chat");
  }, [isAuthenticated, isReady, router]);

  return (
    <main className="flex min-h-dvh items-center justify-center tile-parchment px-4 py-10">
      <LoginForm />
    </main>
  );
}
