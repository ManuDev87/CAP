/**
 * Grupo CAP — Service Worker (generated at build time by scripts/build-sw.mjs)
 *
 * Strategy:
 *  - Precache: the full app shell (HTML, JS/CSS chunks, fonts, images, exam
 *    data chunks, PDF). Everything needed to run 100% offline.
 *  - Navigations: network-first, falling back to the cached app shell.
 *  - Static assets: cache-first (hashed assets are immutable).
 *  - Cross-origin (Firebase, PDFs): bypassed — always network.
 */
const VERSION = "__BUILD_VERSION__";
const PRECACHE = `cap-precache-${VERSION}`;
const PRECACHE_URLS = __PRECACHE_LIST__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== PRECACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase & friends

  // Page navigations: network-first, offline fallback to the app shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(PRECACHE)
              .then((cache) => cache.put("/index.html", copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html")
            .then((cached) => cached || Response.error())
        )
    );
    return;
  }

  // Static assets: cache-first, then network (and cache whatever was missed)
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches
              .open(PRECACHE)
              .then((cache) => cache.put(request, copy));
          }
          return response;
        })
    )
  );
});
