"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  PORTAL_LABELS,
  roleMatchesPortal,
  wrongPortalMessage,
} from "@/lib/portal";
import { ApiError, loginRemote } from "@/lib/api";
import { signInWithAppToken } from "@/lib/authSession";
import { IconSpinner } from "@/components/icons";

export default function LoginScreen() {
  const { loginAs, requestSetPassword, portal, showSignup } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const user = username.trim().toLowerCase();
    const pass = password.trim();
    setError(null);
    setBusy(true);
    try {
      const remote = await loginRemote(user, pass);
      if (!roleMatchesPortal(remote.user.role, portal)) {
        setError(wrongPortalMessage(portal));
        return;
      }
      if (!remote.token) {
        setError("No se pudo abrir la sesión");
        return;
      }
      await signInWithAppToken(remote.token);
      if (remote.mustSetPassword) {
        requestSetPassword(
          remote.user.username,
          remote.user.name,
          remote.user.role,
          remote.user.role === "student" ? remote.user.capTrack : undefined
        );
        return;
      }
      loginAs({
        username: remote.user.username,
        name: remote.user.name,
        role: remote.user.role,
        capTrack:
          remote.user.role === "student" ? remote.user.capTrack : undefined,
        billing: remote.user.billing ?? undefined,
        paidUntil: remote.user.paidUntil ?? undefined,
        schoolCode: remote.user.schoolCode ?? undefined,
        trialEndsAt: remote.user.trialEndsAt ?? undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-overlay gradient-auth z-5000 flex items-center justify-center">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="portal-badge">{PORTAL_LABELS[portal]}</div>
          <div className="auth-brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Logo Grupo CAP" className="junta-logo" />
          </div>
          <div className="brand-badge">Grupo CAP</div>
        </div>
        <h2 className="mb-5 text-2xl font-bold text-ink-900">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="text"
            className="input"
            placeholder="Usuario"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder="Contraseña (vacío si es primera vez)"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <IconSpinner className="text-base" />}
            {busy ? "Comprobando..." : "Entrar"}
          </button>
        </form>
        {portal !== "admin" && (
          <button
            type="button"
            className="mt-4 text-sm font-semibold text-brand-600"
            onClick={showSignup}
          >
            {portal === "profesor"
              ? "Alta gratuita de autoescuela"
              : "Crear cuenta con código de autoescuela"}
          </button>
        )}
        <p className="auth-legal">
          Este portal no es un organismo oficial.{" "}
          <a href="/aviso-legal.html">Aviso legal y fuentes</a>
        </p>
      </div>
    </div>
  );
}
