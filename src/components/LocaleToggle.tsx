"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/locale-actions";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bascule FR/EN. Affiche la langue vers laquelle on peut basculer et appelle
 * la Server Action setLocale (qui écrit le cookie et rafraîchit l'affichage).
 */
export default function LocaleToggle({ locale }: { locale: Locale }) {
  const [isPending, startTransition] = useTransition();
  const next: Locale = locale === "fr" ? "en" : "fr";

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => setLocale(next))}
      aria-label={t(locale, "toggle.locale")}
      className="shrink-0 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)] disabled:opacity-50"
    >
      {next.toUpperCase()}
    </button>
  );
}
