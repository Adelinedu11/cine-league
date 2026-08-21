import type { Metadata, Viewport } from "next";
import { Oswald, Poppins } from "next/font/google";
import { getLocale, t } from "@/lib/i18n";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

// Favicon : pictogramme ticket vectoriel (plus d'emoji), encodé en data-URI.
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="8" y="26" width="84" height="48" rx="10" fill="#0E2396"/><line x1="62" y1="26" x2="62" y2="74" stroke="#EDEBE9" stroke-width="4" stroke-dasharray="6 6"/><circle cx="62" cy="26" r="7" fill="#EDEBE9"/><circle cx="62" cy="74" r="7" fill="#EDEBE9"/></svg>`,
)}`;

// Barre de statut mobile alignée sur le fond du thème clair (direction v2).
export const viewport: Viewport = {
  themeColor: "#EDEBE9",
};

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: "Ciné League",
    description: t(locale, "meta.description"),
    icons: {
      icon: { url: FAVICON, type: "image/svg+xml" },
      apple: [{ url: "/icons/apple-touch-icon.png" }],
    },
    appleWebApp: {
      capable: true,
      title: "Ciné League",
      statusBarStyle: "default",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Applique le thème mémorisé avant la première peinture (évite le flash de
  // mauvaise couleur). Depuis la direction v2, le clair est le thème par
  // défaut ; seul le mode sombre pose un attribut.
  const themeScript = `(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${poppins.variable} ${oswald.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Standalone iOS : Next émet déjà `mobile-web-app-capable` ; on ajoute
            la variante Apple pour les anciennes versions d'iOS Safari. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
