"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cap-pwa-install-dismissed";
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 2000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Captura temprana: el evento puede dispararse antes de hidratar React. */
let earlyDeferred: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    earlyDeferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("cap-pwa-ready"));
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return mq || Boolean(iosStandalone);
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000)
    );
  } catch {
    /* ignore */
  }
}

/**
 * Modal de instalación PWA (~2 s tras entrar).
 * No usa alert() nativo (bloquea la UI y no permite instalar).
 * Si ya está abierta como app (standalone), no se muestra.
 */
export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    setIos(isIos());

    const syncDeferred = () => {
      if (earlyDeferred) setDeferred(earlyDeferred);
    };
    syncDeferred();

    const onReady = () => syncDeferred();
    window.addEventListener("cap-pwa-ready", onReady);

    const showTimer = setTimeout(() => {
      if (isStandalone() || isDismissed()) return;
      syncDeferred();
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener("cap-pwa-ready", onReady);
      clearTimeout(showTimer);
    };
  }, []);

  if (!visible) return null;

  const showNativeButton = Boolean(deferred || earlyDeferred);

  async function handleInstall() {
    const promptEvent = deferred || earlyDeferred;
    if (!promptEvent) return;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      earlyDeferred = null;
      setDeferred(null);
      setVisible(false);
      if (outcome === "dismissed") dismiss();
    } catch {
      /* cancelado */
    }
  }

  function handleLater() {
    dismiss();
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-black/55 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-pop animate-pop-in border border-line"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <img
            src="/icons/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl shadow-card"
          />
          <div>
            <h2
              id="pwa-install-title"
              className="font-bold text-ink-900 text-lg leading-snug"
            >
              ¿Instalar Grupo CAP?
            </h2>
            <p className="mt-2 text-sm text-ink-600 leading-relaxed">
              Añádela a tu pantalla de inicio y úsala como una app: a pantalla
              completa, más rápida y sin la barra del navegador.
            </p>
          </div>
        </div>

        {ios && (
          <ol className="mt-4 space-y-1.5 rounded-xl bg-appbg px-3 py-3 text-left text-[13px] text-ink-700">
            <li>
              1. Pulsa <strong>Compartir</strong> en Safari
            </li>
            <li>
              2. Elige <strong>Añadir a pantalla de inicio</strong>
            </li>
            <li>
              3. Confirma con <strong>Añadir</strong>
            </li>
          </ol>
        )}

        {!ios && !showNativeButton && (
          <p className="mt-4 rounded-xl bg-appbg px-3 py-3 text-left text-[13px] text-ink-700 leading-snug">
            En Chrome: menú <strong>⋮</strong> →{" "}
            <strong>Instalar aplicación</strong> /{" "}
            <strong>Añadir a la pantalla de inicio</strong>.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {showNativeButton && (
            <button
              type="button"
              onClick={handleInstall}
              className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-btn-brand hover:bg-brand-600 active:translate-y-px"
            >
              Instalar ahora
            </button>
          )}
          <button
            type="button"
            onClick={handleLater}
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-appbg"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
