// Service worker minimal : cache-first pour les assets statiques.
// Pas d'offline complexe — on ne met pas en cache la navigation/HTML pour
// éviter des pages périmées.
const CACHE = "cine-league-v1";

self.addEventListener("install", () => {
  // Active immédiatement la nouvelle version.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purge les anciens caches versionnés.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/"));

  if (!isStaticAsset) return; // tout le reste : réseau normal

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        }),
    ),
  );
});
