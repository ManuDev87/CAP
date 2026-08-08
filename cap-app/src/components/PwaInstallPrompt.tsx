"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Nueva clave: invalida dismiss antiguos que ocultaban el modal. */
const STORAGE_KEY = "cap-pwa-dismiss-v2";
const DISMISS_MS = 24 * 60 * 60 * 1000; // 1 día
const SHOW_DELAY_MS = 2000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let earlyDeferred: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    earlyDeferred = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("cap-pwa-ready"));
  });
}

function isStandalone(): boolean {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    const nav = navigator as Navigator & { standalone?: boolean };
    if (nav.standalone === true) return true;
  } catch {
    /* ignore */
  }
  return false;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

function isDismissed(): boolean {
  try {
    const until = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    /* ignore */
  }
}

/**
 * Modal de instalación ~2 s tras cargar.
 * Portal a body + z-index inline (por encima del login z-5000).
 */
export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIos(isIos());

    // Ya instalada como app → no molestar
    if (isStandalone()) return;
    if (isDismissed()) return;

    const sync = () => {
      if (earlyDeferred) setDeferred(earlyDeferred);
    };
    sync();
    window.addEventListener("cap-pwa-ready", sync);

    const t = window.setTimeout(() => {
      if (isStandalone()) return;
      if (isDismissed()) return;
      sync();
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => {
      window.removeEventListener("cap-pwa-ready", sync);
      window.clearTimeout(t);
    };
  }, []);

  if (!mounted || !visible) return null;

  const canNative = Boolean(deferred || earlyDeferred);

  async function handleInstall() {
    const ev = deferred || earlyDeferred;
    if (!ev) return;
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      earlyDeferred = null;
      setDeferred(null);
      setVisible(false);
      if (outcome !== "accepted") setDismissed();
    } catch {
      /* cancelado */
    }
  }

  function handleLater() {
    setDismissed();
    setVisible(false);
  }

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "16px",
        paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.55)",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={72}
            height={72}
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              display: "block",
              margin: "0 auto",
            }}
          />
          <h2
            id="pwa-install-title"
            style={{
              margin: "14px 0 0",
              fontSize: 18,
              fontWeight: 700,
              color: "#1c2b33",
            }}
          >
            ¿Instalar Grupo CAP?
          </h2>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              lineHeight: 1.45,
              color: "#52616a",
            }}
          >
            Añádela a tu pantalla de inicio y úsala como una app, a pantalla
            completa.
          </p>
        </div>

        {ios && (
          <ol
            style={{
              margin: "16px 0 0",
              padding: "12px 14px",
              background: "#f0f3f1",
              borderRadius: 12,
              fontSize: 13,
              color: "#37474f",
              textAlign: "left",
              lineHeight: 1.55,
            }}
          >
            <li>
              1. Pulsa <strong>Compartir</strong> en Chrome/Safari
            </li>
            <li>
              2. Elige <strong>Añadir a pantalla de inicio</strong>
            </li>
            <li>
              3. Confirma con <strong>Añadir</strong>
            </li>
          </ol>
        )}

        {!ios && !canNative && (
          <p
            style={{
              margin: "16px 0 0",
              padding: "12px 14px",
              background: "#f0f3f1",
              borderRadius: 12,
              fontSize: 13,
              color: "#37474f",
              textAlign: "left",
              lineHeight: 1.45,
            }}
          >
            En Chrome: menú <strong>⋮</strong> →{" "}
            <strong>Instalar aplicación</strong> o{" "}
            <strong>Añadir a la pantalla de inicio</strong>.
          </p>
        )}

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {canNative && (
            <button
              type="button"
              onClick={handleInstall}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 12,
                padding: "14px 16px",
                background: "#0A8442",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Instalar ahora
            </button>
          )}
          <button
            type="button"
            onClick={handleLater}
            style={{
              width: "100%",
              border: "1px solid #e2e8ea",
              borderRadius: 12,
              padding: "14px 16px",
              background: "#fff",
              color: "#37474f",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
