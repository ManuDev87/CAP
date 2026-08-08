"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cap-pwa-install-dismissed";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 1800;

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

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    isIos() ||
    /android|mobile|webos|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent
    ) ||
    window.matchMedia("(max-width: 900px) and (pointer: coarse)").matches
  );
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
 * Banner de instalación PWA.
 * - Chromium: beforeinstallprompt (captura temprana + botón nativo).
 * - iOS / resto: instrucciones manuales.
 * - Si ya está en modo standalone (icono de inicio), no se muestra.
 *
 * Nota: en el navegador SIEMPRE se ve la barra de URL. Solo desaparece
 * al abrir la app desde el icono de pantalla de inicio (display: standalone).
 */
export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [ios, setIos] = useState(false);
  const [canNativeInstall, setCanNativeInstall] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    setIos(isIos());

    const syncDeferred = () => {
      if (earlyDeferred) {
        setDeferred(earlyDeferred);
        setCanNativeInstall(true);
      }
    };
    syncDeferred();

    const onReady = () => syncDeferred();
    window.addEventListener("cap-pwa-ready", onReady);

    // Mostrar siempre (móvil y escritorio) tras un breve delay,
    // aunque beforeinstallprompt no haya llegado aún.
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

  async function handleInstall() {
    const promptEvent = deferred || earlyDeferred;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        earlyDeferred = null;
        setDeferred(null);
        setCanNativeInstall(false);
        setVisible(false);
        if (outcome === "dismissed") dismiss();
      } catch {
        /* usuario canceló o navegador bloqueó */
      }
      return;
    }
    // Sin API nativa: el texto de ayuda ya está visible.
  }

  function handleLater() {
    dismiss();
    setVisible(false);
  }

  const showNativeButton = canNativeInstall || Boolean(deferred || earlyDeferred);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-pop animate-pop-in">
        <div className="flex gap-3">
          <img
            src="/icons/icon-192.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p
              id="pwa-install-title"
              className="font-bold text-ink-900 text-[15px] leading-snug"
            >
              Instala Grupo CAP en tu móvil
            </p>
            <p className="mt-1 text-[13px] text-ink-600 leading-snug">
              Así se abre a pantalla completa, sin barra de dirección, como una
              app.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLater}
            className="shrink-0 self-start rounded-lg px-2 py-1 text-ink-400 text-lg leading-none hover:bg-appbg hover:text-ink-700"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {ios && (
          <ol className="mt-3 space-y-1.5 rounded-xl bg-appbg px-3 py-2.5 text-[13px] text-ink-700">
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
          <p className="mt-3 rounded-xl bg-appbg px-3 py-2.5 text-[13px] text-ink-700 leading-snug">
            En Chrome: menú <strong>⋮</strong> →{" "}
            <strong>Instalar aplicación</strong> o{" "}
            <strong>Añadir a la pantalla de inicio</strong>.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          {showNativeButton && (
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-btn-brand hover:bg-brand-600 active:translate-y-px"
            >
              Instalar app
            </button>
          )}
          <button
            type="button"
            onClick={handleLater}
            className={`rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-appbg ${
              showNativeButton ? "" : "flex-1"
            }`}
          >
            Ahora no
          </button>
        </div>

        {!isMobile() && !ios && (
          <p className="mt-2 text-[11px] text-ink-400 leading-snug">
            Tip: en el móvil se usa mejor. Tras instalarla, ábrela desde el
            icono (no desde la pestaña del navegador).
          </p>
        )}
      </div>
    </div>
  );
}
