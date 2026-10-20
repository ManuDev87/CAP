"use client";

import { useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  ApiError,
  registerStudentRemote,
  registerTeacherRemote,
} from "@/lib/api";
import { signInWithAppToken } from "@/lib/authSession";
import type { CapTrack } from "@/lib/types";
import { CAP_TRACK_LABELS } from "@/lib/types";
import { IconSpinner } from "@/components/icons";

export default function SignupScreen() {
  const { portal, loginAs, showLogin, schoolCodeFromUrl } = useApp();
  const isTeacher = portal === "profesor";
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState(schoolCodeFromUrl);
  const [capTrack, setCapTrack] = useState<CapTrack>("mercancias");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isTeacher) {
        const { user, token } = await registerTeacherRemote({
          username,
          password,
          name,
          schoolName,
        });
        if (!token) throw new ApiError("No se pudo abrir la sesión", 500);
        await signInWithAppToken(token);
        loginAs({
          username: user.username,
          name: user.name,
          role: "teacher",
          schoolCode: user.schoolCode ?? undefined,
          trialEndsAt: user.trialEndsAt ?? undefined,
        });
        return;
      }
      const { user, token } = await registerStudentRemote({
        username,
        password,
        name,
        schoolCode,
        capTrack,
      });
      if (!token) throw new ApiError("No se pudo abrir la sesión", 500);
      await signInWithAppToken(token);
      loginAs({
        username: user.username,
        name: user.name,
        role: "student",
        capTrack: user.capTrack,
        billing: user.billing === "school" ? "school" : "prepaid",
        paidUntil: user.paidUntil ?? undefined,
        schoolCode: user.schoolCode ?? undefined,
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
          <div className="portal-badge">
            {isTeacher ? "Alta autoescuela" : "Alta alumno"}
          </div>
          <div className="auth-brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Logo Grupo CAP" className="junta-logo" />
          </div>
          <div className="brand-badge">Grupo CAP</div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-ink-900">
          {isTeacher ? "Registrar autoescuela" : "Crear cuenta"}
        </h2>
        {isTeacher ? (
          <p className="mb-5 text-sm leading-relaxed text-ink-500">
            Alta gratuita para ver la plataforma. Cuando metas alumnos, eliges
            comprar un pack de plazas o enviarles el enlace para que paguen
            ellos.
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <input
            className="input"
            placeholder="Nombre"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Usuario"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Contraseña (mín. 6)"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isTeacher ? (
            <input
              className="input"
              placeholder="Nombre de la autoescuela"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          ) : (
            <>
              <input
                className="input"
                placeholder="Código de la autoescuela"
                required
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
              />
              <select
                className="input"
                value={capTrack}
                onChange={(e) => setCapTrack(e.target.value as CapTrack)}
                aria-label="Modalidad"
              >
                {(Object.keys(CAP_TRACK_LABELS) as CapTrack[]).map((id) => (
                  <option key={id} value={id}>
                    {CAP_TRACK_LABELS[id]}
                  </option>
                ))}
              </select>
              <p className="text-xs font-medium text-ink-400">
                Después eliges 1, 2, 3 o más meses. Se cobra una sola vez.
              </p>
            </>
          )}
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy && <IconSpinner className="text-base" />}
            {busy
              ? "Creando..."
              : isTeacher
                ? "Empezar prueba gratis"
                : "Continuar al pago"}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-brand-600"
          onClick={showLogin}
        >
          Ya tengo cuenta
        </button>
      </div>
    </div>
  );
}
