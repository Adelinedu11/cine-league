"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import LocaleToggle from "@/components/LocaleToggle";
import { t, type Locale } from "@/lib/i18n";

/**
 * Menu hamburger du header : regroupe profil, règles, bascules thème/langue et
 * déconnexion. Se ferme au clic en dehors, à Échap, ou après un clic sur un lien.
 */
export default function HeaderMenu({
  locale,
  name,
  signOut,
}: {
  locale: Locale;
  name: string;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const rowClass =
    "flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--color-cream)]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu"
        className="flex shrink-0 items-center rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        >
          {/* Utilisateur (non cliquable) */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
            <Avatar name={name} size={28} />
            <span className="font-mono truncate text-sm text-[var(--color-muted)]">
              {name}
            </span>
          </div>

          {/* La Toile en tête : c'est le geste quotidien, et donc la première
              chose qu'on vient chercher. */}
          <Link
            href="/toile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            {t(locale, "header.toile")}
          </Link>
          {/* Le logo de l'en-tête mène désormais aux règles : ce raccourci
              reprend le retour vers les leagues qu'il assurait avant. Sans lui,
              on n'aurait plus aucun chemin direct depuis le fond d'une séance. */}
          <Link
            href="/leagues"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            {t(locale, "header.myLeagues")}
          </Link>
          <Link
            href="/profil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            {t(locale, "header.profile")}
          </Link>
          <Link
            href="/regles"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            {t(locale, "header.rules")}
          </Link>

          <div className={rowClass}>
            <span>{t(locale, "header.theme")}</span>
            <ThemeToggle locale={locale} />
          </div>
          <div className={rowClass}>
            <span>{t(locale, "header.language")}</span>
            <LocaleToggle locale={locale} />
          </div>

          <div className="border-t border-[var(--color-border)]">
            <form action={signOut}>
              <button
                type="submit"
                className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                {t(locale, "header.signOut")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
