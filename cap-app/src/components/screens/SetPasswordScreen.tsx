"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import { setUserPassword } from "@/lib/db";
import { PORTAL_LABELS } from "@/lib/portal";
import { IconSpinner } from "@/components/icons";

export default function SetPasswordScreen() {
  const { pendingPwdUser, loginAs, portal } = useApp();
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const p1 = pwd1.trim();
    const p2 = pwd2.trim();

    if (p1 !== p2) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (!pendingPwdUser) return;

    setBusy(true);
    try {
      await setUserPassword(pendingPwdUser.username, p1);
      loginAs({
        username: pendingPwdUser.username,
        name: pendingPwdUser.name,
        role: pendingPwdUser.role === "teacher" ? "teacher" : "student",
      });
    } catch (err) {
      console.error("Set password error", err);
      setError("Error al guardar contraseña");
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
          <div className="portal-badge">{PORTAL_LABELS[portal]}</div>
        </div>
        <h2 className="text-2xl font-bold text-ink-900">
          Bienvenido <span>{pendingPwdUser?.name}</span>
        </h2>
        <p className="mt-2 mb-5 text-[15px] text-ink-600">
          Por favor, establece tu contraseña para acceder al campus.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            className="input"
            placeholder="Nueva Contraseña"
            required
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
          />
          <input
            type="password"
            className="input"
            placeholder="Repita la Contraseña"
            required
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary mt-1 w-full" disabled={busy}>
            {busy && <IconSpinner className="text-base" />}
            Guardar y Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
