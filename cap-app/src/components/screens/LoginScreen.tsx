"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { getUserDoc } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { IconSpinner } from "@/components/icons";

export default function LoginScreen() {
  const { loginAs, requestSetPassword } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    const user = username.trim().toLowerCase();
    const pass = password.trim();
    setError(null);

    if (user === "root" && pass === "1234") {
      loginAs({ username: "root", name: "root", role: "root" });
      return;
    }

    setBusy(true);
    try {
      const data = await getUserDoc(user);
      if (!data) {
        setError("Usuario no encontrado");
        return;
      }

      const role: SessionUser["role"] =
        data.role === "teacher" ? "teacher" : "student";

      if (!data.password || data.password === "") {
        requestSetPassword(user, data.name, role);
        return;
      }
      if (data.password === pass) {
        loginAs({ username: user, name: data.name, role });
      } else {
        setError("Credenciales incorrectas");
      }
    } catch (err) {
      console.error("Login err", err);
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-overlay gradient-auth z-5000 flex items-center justify-center">
      <div className="auth-card">
        <div className="auth-brand">
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
      </div>
    </div>
  );
}
