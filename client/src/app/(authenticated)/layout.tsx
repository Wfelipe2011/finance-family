"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isReady, router]);

  if (!isReady) return <main className="flex min-h-dvh items-center justify-center">FinAI</main>;
  if (!isAuthenticated) return null;

  return (
    <div
      style={{
        minHeight: "100dvh",
        paddingBottom: 96,
        background: "var(--color-canvas-parchment)",
        color: "var(--color-ink)",
      }}
    >
      <div
        style={{
          width: "min(100%, 768px)",
          margin: "0 auto",
          padding: "24px 16px",
        }}
      >
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
