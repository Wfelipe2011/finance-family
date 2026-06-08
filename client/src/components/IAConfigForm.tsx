"use client";

import type { JarvisSkillDTO } from "@fin-ai/shared";
import { Bot, Eye, EyeOff, LoaderCircle, Upload, UserCircle } from "lucide-react";
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
  const [groupId, setGroupId] = useState<number | null>(null);
  const [jarvisAlwaysOn, setJarvisAlwaysOn] = useState(false);
  const [skills, setSkills] = useState<JarvisSkillDTO[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const touchedRef = useRef(false);
  const userAvatarRef = useRef<HTMLInputElement>(null);
  const jarvisAvatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.iaConfig().then((config) => {
      if (!touchedRef.current) {
        setBaseUrl(config.baseUrl ?? "");
        setApiKey(config.apiKey ?? "");
        setApiKeyDirty(false);
      }
    }).catch(() => setError("Erro ao carregar configurações"));
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([api.familyGroups(), api.skills()])
      .then(([groups, loadedSkills]) => {
        if (!active) return;
        const group = groups[0];
        setGroupId(group?.id ?? null);
        setSkills(loadedSkills);
        if (!group) return;
        setSettingsLoading(true);
        api
          .groupSettings(group.id)
          .then((settings) => {
            if (active) setJarvisAlwaysOn(settings.jarvisAlwaysOn);
          })
          .catch(() => setError("Erro ao carregar configuração do grupo"))
          .finally(() => {
            if (active) setSettingsLoading(false);
          });
      })
      .catch(() => setError("Erro ao carregar recursos do grupo"));
    return () => {
      active = false;
    };
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

  async function toggleJarvisAlwaysOn(checked: boolean) {
    if (!groupId) return;
    const previous = jarvisAlwaysOn;
    setJarvisAlwaysOn(checked);
    setError(null);
    try {
      const settings = await api.updateGroupSettings(groupId, { jarvisAlwaysOn: checked });
      setJarvisAlwaysOn(settings.jarvisAlwaysOn);
      setFeedback("Configurações do grupo salvas");
    } catch {
      setJarvisAlwaysOn(previous);
      setError("Erro ao salvar configuração do grupo");
    }
  }

  async function uploadAvatar(owner: "user" | "jarvis", file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem");
      return;
    }
    const activeGroupId = groupId;
    if (owner === "jarvis" && !activeGroupId) return;
    const formData = new FormData();
    formData.set("file", file);
    setError(null);
    try {
      if (owner === "user") await api.uploadUserAvatar(formData);
      else if (activeGroupId) await api.uploadJarvisAvatar(activeGroupId, formData);
      setFeedback(owner === "user" ? "Avatar do usuário atualizado" : "Avatar do Jarvis atualizado");
    } catch {
      setError("Erro ao enviar avatar");
    }
  }

  return (
    <div className="space-y-4">
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

      <section className="card-utility space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-tagline font-semibold leading-tagline tracking-none">Jarvis</h2>
            <p className="text-caption text-ink-muted-48">Grupo familiar</p>
          </div>
          <label className="flex items-center gap-3 text-caption text-ink-muted-80">
            <span>sempre ativo</span>
            <input
              aria-label="Jarvis sempre ativo"
              className="size-5 accent-primary"
              type="checkbox"
              checked={jarvisAlwaysOn}
              disabled={!groupId || settingsLoading}
              onChange={(event) => void toggleJarvisAlwaysOn(event.target.checked)}
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn-secondary-pill justify-center" type="button" onClick={() => userAvatarRef.current?.click()}>
            <UserCircle size={18} />
            Avatar usuário
          </button>
          <button className="btn-secondary-pill justify-center" type="button" disabled={!groupId} onClick={() => jarvisAvatarRef.current?.click()}>
            <Upload size={18} />
            Avatar Jarvis
          </button>
          <input
            ref={userAvatarRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              void uploadAvatar("user", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <input
            ref={jarvisAvatarRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              void uploadAvatar("jarvis", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="card-utility space-y-3">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <h2 className="font-display text-tagline font-semibold leading-tagline tracking-none">Skills</h2>
        </div>
        <ul className="space-y-2">
          {skills.map((skill) => (
            <li key={skill.id} className="rounded-md border border-hairline bg-canvas p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{skill.displayName}</p>
                  <p className="text-caption text-ink-muted-48">{skill.description}</p>
                </div>
                <span className="shrink-0 text-caption text-ink-muted-80">{skill.enabled ? "ativo" : "inativo"}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
