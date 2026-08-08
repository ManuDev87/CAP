"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cap-pwa-install-dismissed";
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 2500;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

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
 * Bottom banner to install the PWA.
 * - Chromium/Android: uses beforeinstallprompt → native install dialog.
 * - iOS Safari: shows Share → Add to Home Screen instructions.
 * Hidden when already running as installed app.
 */
export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    let showTimer: ReturnType<typeof setTimeout> | undefined;
    const ios = isIos();

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    window.addEventListener("beforeinstallprompt", onBip);

    // iOS never fires beforeinstallprompt — show instructional banner.
    if (ios) {
      showTimer = setTimeout(() => {
        setIosHelp(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  if (!visible) return null;

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      setVisible(false);
      if (outcome === "dismissed") dismiss();
      return;
    }
    // iOS: keep banner open showing steps (already iosHelp).
    setIosHelp(true);
  }

  function handleLater() {
    dismiss();
    setVisible(false);
  }

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
              Instala Grupo CAP
            </p>
            <p className="mt-1 text-[13px] text-ink-600 leading-snug">
              {iosHelp
                ? "Añádela a tu pantalla de inicio y úsala como una app, sin barra del navegador."
                : "Instálala en tu dispositivo para abrirla a pantalla completa, como una app."}
            </p>
          </div>
        </div>

        {iosHelp && (
          <ol className="mt-3 space-y-1.5 rounded-xl bg-appbg px-3 py-2.5 text-[13px] text-ink-700">
            <li>
              1. Pulsa <strong>Compartir</strong> en la barra de Safari
            </li>
            <li>
              2. Elige <strong>Añadir a pantalla de inicio</strong>
            </li>
            <li>
              3. Confirma con <strong>Añadir</strong>
            </li>
          </ol>
        )}

        <div className="mt-3 flex gap-2">
          {!iosHelp && (
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
              iosHelp ? "flex-1" : ""
            }`}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
