"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bouton "Où regarder ?" replié par défaut sur les cartes de vote de la
 * Compétition officielle. Au clic, déplie la liste des plateformes de
 * streaming déjà récupérées via TMDB pour ce film.
 */
export default function WhereToWatch({
  platforms,
  locale,
}: {
  platforms: string[];
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);

  if (!platforms || platforms.length === 0) return null;

  return (
    <span className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={(e) => {
          // Le bouton vit dans un <label> qui coche le radio du film : on
          // évite que le clic sur "Où regarder ?" ne sélectionne le film.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-xs text-[var(--color-muted)] transition-colors hover:border-[var(--color-muted)] hover:text-[var(--color-cream)]"
      >
        {open ? t(locale, "round.hideWhereToWatch") : t(locale, "round.whereToWatch")}
      </button>
      {open && (
        <span className="flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <span
              key={p}
              className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-cream)]"
            >
              {p}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
