"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, Settings } from "lucide-react";

const items = [
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/config", label: "Config", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 20,
        borderTop: "1px solid var(--color-hairline)",
        background: "var(--color-canvas-parchment)",
        padding: "8px 16px calc(env(safe-area-inset-bottom) + 8px)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          maxWidth: 448,
          margin: "0 auto",
        }}
      >
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                minHeight: 58,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                borderRadius: "var(--radius-md)",
                color: active ? "var(--color-primary)" : "var(--color-ink-muted-48)",
                fontSize: 12,
                lineHeight: 1,
                letterSpacing: "var(--tracking-fine)",
              }}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden size={22} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
