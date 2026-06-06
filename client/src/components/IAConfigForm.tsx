"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";

function maskKey(value: string) {
  if (!value) return "";
  if (value.length <= 4) return value;
  return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export function IAConfigForm() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyDirty, setApiKeyDirty] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    api.iaConfig().then((config) => {
      if (!touchedRef.current) {
        setBaseUrl(config.baseUrl ?? "");
        setApiKey(config.apiKey ?? "");
        setApiKeyDirty(false);
      }
    }).catch(() => setError("Erro ao carregar configurações"));
  }, []);

  const displayedKey = useMemo(() => (showKey || apiKeyDirty ? apiKey : maskKey(apiKey)), [apiKey, apiKeyDirty, showKey]);

  function onBaseUrlChange(value: string) {
    touchedRef.current = true;
    setBaseUrl(value);
  }

  function onApiKeyChange(value: string) {
    touchedRef.current = true;
    setApiKeyDirty(true);
    setApiKey(value);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    setError(null);
    if (baseUrl) {
      try {
        new URL(baseUrl);
      } catch {
        setError("URL inválida");
        return;
      }
    }
    setLoading(true);
    try {
      await api.updateIAConfig({
        baseUrl: baseUrl || null,
        ...(apiKeyDirty ? { apiKey: apiKey || null } : {}),
      });
      setApiKeyDirty(false);
      setFeedback("Configurações salvas");
    } catch {
      setError("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card-utility space-y-5" onSubmit={save}>
      <label className="block space-y-2">
        <span className="text-caption text-ink-muted-48">Base URL</span>
        <input className="form-field" value={baseUrl} onChange={(event) => onBaseUrlChange(event.target.value)} placeholder="http://localhost:11434/v1" />
      </label>
      <label className="block space-y-2">
        <span className="text-caption text-ink-muted-48">API Key</span>
        <span className="flex gap-2">
          <input className="form-field" type={showKey ? "text" : "password"} value={displayedKey} onChange={(event) => onApiKeyChange(event.target.value)} />
          <button className="btn-secondary-pill !px-3" type="button" aria-label={showKey ? "Ocultar chave" : "Mostrar chave"} onClick={() => setShowKey((value) => !value)}>
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {feedback ? <p role="status" className="text-caption text-ink-muted-80">{feedback}</p> : null}
      {error ? <p role="alert" className="text-caption text-ink-muted-80">{error}</p> : null}
      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? <LoaderCircle className="animate-spin" size={18} /> : null}
        Salvar
      </button>
    </form>
  );
}
