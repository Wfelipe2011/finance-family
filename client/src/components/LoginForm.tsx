"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type Errors = { email?: string; password?: string; form?: string };

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Informe um email válido";
    if (password.length < 6) nextErrors.password = "Use pelo menos 6 caracteres";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    try {
      await login({ email, password });
      router.replace("/chat");
    } catch (error) {
      setErrors({ form: error instanceof ApiError && error.status === 401 ? "Email ou senha inválidos" : "Erro ao entrar" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-utility auth-card space-y-5" noValidate>
      <div>
        <p className="text-caption text-ink-muted-48">FinAI</p>
        <h1 className="font-display text-display-lg font-semibold leading-display tracking-none">Entrar</h1>
      </div>
      <label className="block space-y-2">
        <span className="text-caption text-ink-muted-80">Email</span>
        <input className="form-field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <span className="text-caption text-ink-muted-80">{errors.email}</span> : null}
      </label>
      <label className="block space-y-2">
        <span className="text-caption text-ink-muted-80">Senha</span>
        <input className="form-field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        {errors.password ? <span className="text-caption text-ink-muted-80">{errors.password}</span> : null}
      </label>
      {errors.form ? <p role="alert" className="text-caption text-ink-muted-80">{errors.form}</p> : null}
      <button className="btn-primary w-full" disabled={loading} type="submit">
        {loading ? <LoaderCircle aria-hidden className="animate-spin" size={18} /> : null}
        Entrar
      </button>
    </form>
  );
}
