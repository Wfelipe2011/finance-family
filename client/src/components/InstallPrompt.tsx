"use client";

import { useEffect, useState } from "react";

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const timer = window.setTimeout(() => setShow(Boolean(ios && !standalone)), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-30 rounded-lg border border-hairline bg-canvas p-4 text-caption text-ink">
      Toque em Compartilhar e depois Adicionar a Tela de Inicio
      <button type="button" className="ml-3 text-primary" onClick={() => setShow(false)}>Fechar</button>
    </div>
  );
}
