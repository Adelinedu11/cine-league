"use client";

import FilmSearch from "./FilmSearch";
import { findContradiction, type ConfirmedHints } from "@/lib/cinefiles";
import { hintLine } from "@/lib/cinefiles-hints";
import { t, type Locale } from "@/lib/i18n";

/**
 * Formulaire de proposition Ciné'Files (page dédiée, sans images). Réutilise
 * FilmSearch en lui fournissant le contrôle de contradiction construit à partir
 * des indices confirmés.
 */
export default function CineGuessForm({
  locale,
  roundId,
  hints,
  submitGuess,
}: {
  locale: Locale;
  roundId: string;
  hints: ConfirmedHints;
  submitGuess: (formData: FormData) => Promise<void>;
}) {
  const checkContradiction = (candidate: {
    country: string | null;
    language: string | null;
    director: string | null;
    year: number | null;
    genres: string[];
  }): string | null => {
    const c = findContradiction(hints, candidate);
    if (!c) return null;
    return t(locale, "cinefiles.contradiction", {
      hint: hintLine(locale, c.criterion, c.value),
    });
  };

  return (
    <FilmSearch
      roundId={roundId}
      locale={locale}
      existingTitle={null}
      existingComment={null}
      error={null}
      submitFilm={submitGuess}
      submitLabel={t(locale, "cinefiles.guessButton")}
      showComment={false}
      showPoster={false}
      checkContradiction={checkContradiction}
    />
  );
}
