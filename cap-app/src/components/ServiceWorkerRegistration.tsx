"use client";

import { useEffect } from "react";

/**
 * Registers the service worker generated at build time (out/sw.js).
 * No-op in development, where the precache manifest doesn't exist.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("SW registration failed:", err);
      });
    };

    // Registrar cuanto antes para que beforeinstallprompt pueda dispararse.
    register();
  }, []);

  return null;
}
