import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/hooks/useAuth";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinAI",
  description: "Assistente financeiro pessoal para o casal.",
  applicationName: "FinAI",
  manifest: "/manifest.json",
  icons: {
    apple: [{ url: "/apple-icon-180x180.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinAI",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1d1d1f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider>
          {children}
          <ServiceWorkerRegister />
          <InstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
