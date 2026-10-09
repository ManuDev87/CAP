"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { ApiError, createCheckoutRemote } from "@/lib/api";
import {
  EURO_PER_MONTH,
  MAX_PAID_MONTHS,
  PAID_MONTH_OPTIONS,
  formatPaidUntil,
  monthsTotal,
} from "@/lib/billing";
import { IconSpinner } from "@/components/icons";

export default function PaywallScreen() {
  const { user, logout } = useApp();
  const [months, setMonths] = useState(1);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    const n = Number(custom);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_PAID_MONTHS) return n;
    return months;
  }, [custom, months]);

  async function pay() {
    if (!user) return;
    setError(null);
    setBusy(true);
    try {
      const { url } = await createCheckoutRemote(user.username, selected);
      if (!url) throw new ApiError("No se pudo abrir el pago", 500);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error de conexión");
      setBusy(false);
    }
  }

  return (
    <div className="screen-overlay gradient-auth z-5000 flex items-center justify-center">
      <div className="auth-card text-left">
        <div className="auth-brand">
          <div className="portal-badge">Portal Alumno</div>
          <div className="auth-brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo.png" alt="Logo Grupo CAP" className="junta-logo" />
          </div>
          <div className="brand-badge">Grupo CAP</div>
        </div>
        <h2 className="mb-2 text-center text-2xl font-bold text-ink-900">
          Elige tus meses
        </h2>
        <p className="mb-5 text-center text-sm leading-relaxed text-ink-500">
          Un solo cobro, no es una suscripción. Cuando se acabe el tiempo, el
          acceso se corta hasta que vuelvas a pagar.
        </p>
        {user?.paidUntil ? (
          <p className="mb-4 text-center text-sm text-ink-500">
            Último acceso: {formatPaidUntil(user.paidUntil)}
          </p>
        ) : null}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PAID_MONTH_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
                selected === n && !custom
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-ink-900/15 text-ink-700 hover:border-brand-400"
              }`}
              onClick={() => {
                setMonths(n);
                setCustom("");
              }}
            >
              {n} {n === 1 ? "mes" : "meses"}
              <span className="mt-1 block text-xs font-medium text-ink-400">
                {monthsTotal(n)} €
              </span>
            </button>
          ))}
        </div>
        <label className="mb-4 block text-sm font-medium text-ink-600">
          Otra cantidad (1–{MAX_PAID_MONTHS} meses)
          <input
            type="number"
            min={1}
            max={MAX_PAID_MONTHS}
            className="input mt-1"
            placeholder="Meses"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        </label>
        <p className="mb-4 text-center text-lg font-bold text-ink-900">
          {monthsTotal(selected)} € · {selected}{" "}
          {selected === 1 ? "mes" : "meses"} · {EURO_PER_MONTH} €/mes
        </p>
        {error && <p className="error-text mb-3 text-center">{error}</p>}
        <button
          type="button"
          className="btn-primary w-full"
          disabled={busy}
          onClick={pay}
        >
          {busy && <IconSpinner className="text-base" />}
          {busy ? "Abriendo pago..." : "Pagar ahora"}
        </button>
        <button
          type="button"
          className="mt-3 w-full text-sm font-semibold text-ink-400 hover:text-ink-700"
          onClick={logout}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
