import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, IBM_Plex_Mono } from "next/font/google";
import { getLocale, t } from "@/lib/i18n";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

// Favicon : emoji ticket rendu dans un <text> SVG, encodé en data-URI.
const FAVICON = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="52" font-size="76" text-anchor="middle" dominant-baseline="central">🎟️</text></svg>`,
)}`;

// Barre de statut mobile alignée sur le fond du thème sombre.
export const viewport: Viewport = {
  themeColor: "#150A0C",
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  // mauvaise couleur). Seul le mode clair pose un attribut ; l'absence
  // d'attribut = thème sombre par défaut.
  const themeScript = `(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${bebasNeue.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
