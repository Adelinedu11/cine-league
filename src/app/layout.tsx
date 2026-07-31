import type { Metadata } from "next";
import { Inter, Bebas_Neue, IBM_Plex_Mono } from "next/font/google";
import { getLocale, t } from "@/lib/i18n";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
