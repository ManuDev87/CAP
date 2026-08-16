/* Uninstall leftover PWA workers from when this domain served the app. */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll({ type: "window" });
      })
      .then(function (clients) {
        clients.forEach(function (client) {
          if (client.url && "navigate" in client) client.navigate(client.url);
        });
      })
  );
});
