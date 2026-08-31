import { t, type Locale } from "@/lib/i18n";

/**
 * Cycle de vie d'un round : submission → voting → closed (Ciné'Files saute
 * `voting` et va directement à `closed`).
 *
 * ATTENTION — la transition n'est plus déclenchée depuis l'application. Elle
 * est entièrement pilotée en SQL par `advance_due_rounds()`
 * (supabase/035_cron_avancement_rounds.sql), appelée par un job pg_cron chaque
 * minute et en rattrapage au chargement du layout connecté. Il n'existe donc
 * plus d'équivalent TypeScript de `nextRoundStatus()` : le dupliquer ici
 * ferait courir le risque de deux logiques divergentes. Les libellés de statut
 * visibles restent dans le dictionnaire i18n (clés `roundStatus.*`).
 *
 * Ce module ne garde que le formatage des dates et le calcul de l'échéance
 * affichée (compte à rebours), qui sont bien des besoins d'affichage.
 */

/** Code de locale Intl selon la langue de l'app. */
const DATE_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** Formatte une date ISO en JJ/MM/AAAA HH:MM selon la langue. */
export function formatRoundDate(iso: string, locale: Locale = "fr"): string {
  return new Date(iso).toLocaleString(DATE_LOCALE[locale], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Format ISO → valeur d'un `<input type="datetime-local">` (YYYY-MM-DDTHH:mm),
 * en heure locale du navigateur : le composant natif n'a pas de fuseau, il
 * affiche et renvoie toujours de l'heure locale. Le retour en ISO se fait par
 * un simple `new Date(valeur)`, que le navigateur interprète lui aussi en
 * heure locale — l'aller-retour est donc symétrique.
 */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
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
 * Échéance de la phase en cours : submission → submission_deadline,
 * voting → ceremony_at. Null si la séance est clôturée. C'est la date à
 * laquelle `advance_due_rounds()` fera basculer la séance — sert au compte à
 * rebours et à la phrase « les votes s'ouvriront le… ».
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

/**
 * Système de durée ("tic-tac-boom") : à la création d'un round, l'auteur
 * choisit une durée (pas une date précise) et le serveur calcule l'échéance
 * exacte à partir de l'instant de lancement. Cette échéance est désormais
 * appliquée pour de vrai par le cron d'avancement (035) : le chrono expire
 * tout seul, sans que personne n'ait à cliquer.
 */
export type DurationPreset = {
  minutes: number;
  label: Record<Locale, string>;
};

/** Ciné'Files : séance courte, jouée en direct. */
export const CINE_FILES_DURATION_PRESETS: DurationPreset[] = [
  { minutes: 30, label: { fr: "30 minutes", en: "30 minutes" } },
  { minutes: 60, label: { fr: "1 heure", en: "1 hour" } },
  { minutes: 120, label: { fr: "2 heures", en: "2 hours" } },
  { minutes: 180, label: { fr: "3 heures", en: "3 hours" } },
  { minutes: 360, label: { fr: "6 heures", en: "6 hours" } },
  { minutes: 1440, label: { fr: "24 heures", en: "24 hours" } },
];

/** Compétition — phase de soumission. */
export const SUBMISSION_DURATION_PRESETS: DurationPreset[] = [
  { minutes: 1440, label: { fr: "1 jour", en: "1 day" } },
  { minutes: 3 * 1440, label: { fr: "3 jours", en: "3 days" } },
  { minutes: 7 * 1440, label: { fr: "7 jours", en: "7 days" } },
  { minutes: 14 * 1440, label: { fr: "14 jours", en: "14 days" } },
  { minutes: 30 * 1440, label: { fr: "30 jours", en: "30 days" } },
  { minutes: 90 * 1440, label: { fr: "90 jours", en: "90 days" } },
];

/** Compétition — phase de vote, décomptée depuis la clôture des soumissions. */
export const VOTING_DURATION_PRESETS: DurationPreset[] = [
  { minutes: 1440, label: { fr: "1 jour", en: "1 day" } },
  { minutes: 2 * 1440, label: { fr: "2 jours", en: "2 days" } },
  { minutes: 3 * 1440, label: { fr: "3 jours", en: "3 days" } },
  { minutes: 7 * 1440, label: { fr: "7 jours", en: "7 days" } },
];

/** Formatte un compte à rebours compact ("2j 04h", "03min 12s"…). */
export function formatCountdown(ms: number, locale: Locale): string {
  if (ms <= 0) return t(locale, "round.countdownEnded");
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) {
    return `${days}${t(locale, "date.daysShort")} ${pad(hours)}${t(locale, "date.hoursShort")}`;
  }
  if (hours > 0) {
    return `${pad(hours)}${t(locale, "date.hoursShort")} ${pad(minutes)}${t(locale, "date.minutesShort")}`;
  }
  return `${pad(minutes)}${t(locale, "date.minutesShort")} ${pad(seconds)}${t(locale, "date.secondsShort")}`;
}
