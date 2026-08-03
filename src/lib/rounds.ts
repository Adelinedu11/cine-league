import { t, type Locale } from "@/lib/i18n";

/**
 * Cycle de vie d'un round : submission → voting → closed.
 * La transition est déclenchée manuellement par un membre.
 * Les libellés visibles (statut, action) sont désormais dans le dictionnaire
 * i18n (clés `roundStatus.*` et `roundAction.*`).
 */

/** État suivant dans le cycle (undefined si déjà au dernier état). */
export const ROUND_NEXT_STATUS: Record<string, string | undefined> = {
  submission: "voting",
  voting: "closed",
};

/**
 * État suivant selon le mode de jeu. Ciné'Files n'a que 2 phases :
 * submission → closed (on saute voting). Compétition : cycle complet.
 */
export function nextRoundStatus(
  status: string,
  gameMode: string,
): string | undefined {
  if (gameMode === "cine_files") {
    return status === "submission" ? "closed" : undefined;
  }
  return ROUND_NEXT_STATUS[status];
}

/** Code de locale Intl selon la langue de l'app. */
const DATE_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** Formatte une date ISO en JJ/MM/AAAA HH:MM selon la langue. */
export function formatRoundDate(iso: string, locale: Locale = "fr"): string {
  return new Date(iso).toLocaleString(DATE_LOCALE[locale], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Formatte une date ISO en « JJ/MM/AAAA à HH:MM » (pour les phrases). */
export function formatRoundDateWithHour(
  iso: string,
  locale: Locale = "fr",
): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(DATE_LOCALE[locale]);
  const time = d.toLocaleTimeString(DATE_LOCALE[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${t(locale, "date.at")} ${time}`;
}

/**
 * Date/heure seuil à dépasser pour autoriser la transition depuis `status` :
 * submission → submission_deadline, voting → ceremony_at. Null sinon.
 */
export function transitionThresholdIso(
  status: string,
  submissionDeadline: string,
  ceremonyAt: string,
): string | null {
  if (status === "submission") return submissionDeadline;
  if (status === "voting") return ceremonyAt;
  return null;
}
