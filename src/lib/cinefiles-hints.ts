import { t, type Locale } from "@/lib/i18n";
import type { ConfirmedHints, Contradiction } from "@/lib/cinefiles";

/** Nom de pays localisé depuis un code ISO (ex. "FR" → "France"). */
export function regionName(code: string, locale: Locale): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(
        code.toUpperCase(),
      ) ?? code
    );
  } catch {
    return code;
  }
}

/** Nom de langue localisé depuis un code ISO (ex. "en" → "anglais"). */
export function languageName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** "Critère = Valeur" pour un indice confirmé / une contradiction. */
export function hintLine(
  locale: Locale,
  criterion: Contradiction["criterion"],
  value: string | number,
): string {
  switch (criterion) {
    case "country":
      return `${t(locale, "cinefiles.critCountry")} = ${regionName(String(value), locale)}`;
    case "language":
      return `${t(locale, "cinefiles.critLanguage")} = ${languageName(String(value), locale)}`;
    case "director":
      return `${t(locale, "cinefiles.critDirector")} = ${value}`;
    case "year":
      return `${t(locale, "cinefiles.critYear")} = ${value}`;
    case "decade":
      return `${t(locale, "cinefiles.critDecade")} = ${value}s`;
  }
}

/** Les lignes d'indices confirmés à afficher (scalaires + unions). */
export function confirmedHintLines(
  locale: Locale,
  hints: ConfirmedHints,
): string[] {
  const lines: string[] = [];
  if (hints.director) lines.push(hintLine(locale, "director", hints.director));
  if (hints.country) lines.push(hintLine(locale, "country", hints.country));
  if (hints.language) lines.push(hintLine(locale, "language", hints.language));
  if (hints.year !== undefined) lines.push(hintLine(locale, "year", hints.year));
  else if (hints.decade !== undefined)
    lines.push(hintLine(locale, "decade", hints.decade));
  if (hints.genres.length)
    lines.push(`${t(locale, "cinefiles.critGenre")} = ${hints.genres.join(", ")}`);
  if (hints.actors.length)
    lines.push(`${t(locale, "cinefiles.critActors")} = ${hints.actors.join(", ")}`);
  if (hints.platforms.length)
    lines.push(
      `${t(locale, "cinefiles.critPlatforms")} = ${hints.platforms.join(", ")}`,
    );
  return lines;
}
