"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bouton bascule clair/sombre. Depuis la direction v2, le clair est le thème
 * par défaut : ce composant écrit data-theme="dark" sur <html> (absence
 * d'attribut = clair par défaut) et mémorise le choix dans localStorage.
 * Le thème est appliqué avant peinture par le script inline du layout racine ;
 * ce composant ne gère que la bascule et l'icône.
 */
export default function ThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Reflète l'état réel posé par le script inline au chargement.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage indisponible : la bascule reste effective pour la session.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(locale, theme === "light" ? "toggle.toDark" : "toggle.toLight")}
      className="shrink-0 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-sm transition-colors hover:border-[var(--color-gold)]"
    >
      {theme === "light" ? (
        <Moon size={15} strokeWidth={1.8} />
      ) : (
        <Sun size={15} strokeWidth={1.8} />
      )}
    </button>
  );
}
