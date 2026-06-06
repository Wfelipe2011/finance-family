"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    router.replace(isAuthenticated ? "/chat" : "/login");
  }, [isAuthenticated, isReady, router]);

  return <main className="flex min-h-dvh items-center justify-center tile-parchment">FinAI</main>;
}
