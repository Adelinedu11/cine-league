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
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Échec d'enregistrement du service worker :", err);
    });
  }, []);

  return null;
}
