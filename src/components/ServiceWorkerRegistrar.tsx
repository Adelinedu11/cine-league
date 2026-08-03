"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker (/sw.js) après le montage. Ne rend rien.
 * Ne fonctionne qu'en contexte sécurisé (HTTPS ou localhost).
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Échec d'enregistrement du service worker :", err);
      });
      return;
    }

    // En développement, le cache-first du SW ressert des bundles /_next/static
    // périmés (traductions/labels obsolètes malgré un rebuild). On le retire et
    // on vide ses caches.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister()))
      .catch(() => {});
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
  }, []);

  return null;
}
