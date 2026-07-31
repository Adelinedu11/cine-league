import type { MetadataRoute } from "next";

/**
 * Manifest PWA (format Next.js App Router → sert /manifest.webmanifest et
 * injecte automatiquement <link rel="manifest">).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ciné League",
    short_name: "Ciné League",
    description: "Ligues de cinéma entre amis",
    start_url: "/",
    display: "standalone",
    background_color: "#150A0C",
    theme_color: "#150A0C",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
