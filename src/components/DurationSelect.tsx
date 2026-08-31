"use client";

import { useMemo } from "react";
import { t, type Locale } from "@/lib/i18n";
import {
  formatRoundDateWithHour,
  toDatetimeLocalValue,
  type DurationPreset,
} from "@/lib/rounds";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]";
const labelClass = "text-sm font-medium text-[var(--color-cream)]";

/** Valeur sentinelle du <select> pour « je saisis une date précise ». */
const CUSTOM = "custom";

/**
 * Sélecteur d'échéance pour la création d'un round. Deux façons de répondre à
 * la même question :
 *
 *  - une DURÉE depuis l'instant de lancement, choisie dans une liste
 *    ("tic-tac-boom") — le cas courant, et le seul que connaît le serveur ;
 *  - une DATE précise, quand les durées proposées ne suffisent pas (typiquement
 *    la phase de vote, plafonnée à 7 jours).
 *
 * Dans les deux cas le champ envoyé au serveur reste un nombre de MINUTES : la
 * date saisie est convertie en écart par rapport à `baseIsoMs`. Le contrat de
 * `createRound` est donc inchangé, et le calcul d'échéance reste fait côté
 * serveur à l'instant réel de la création.
 *
 * L'option « date personnalisée » n'est proposée que si `onCustomIsoChange`
 * est fourni.
 */
export default function DurationSelect({
  name,
  label,
  presets,
  locale,
  value,
  onChange,
  baseIsoMs,
  customIso,
  onCustomIsoChange,
}: {
  name: string;
  label: string;
  presets: DurationPreset[];
  locale: Locale;
  value: number;
  onChange: (minutes: number) => void;
  /** 0 tant que l'instant de référence (Date.now() calculé par le parent
   * dans un effet) n'est pas encore connu — on masque alors l'aperçu plutôt
   * que d'afficher une date fausse. */
  baseIsoMs: number;
  /** Date absolue visée, ou null pour le mode « durée prédéfinie ». */
  customIso?: string | null;
  /** Absent = pas d'option « date personnalisée » sur ce champ. */
  onCustomIsoChange?: (iso: string | null) => void;
}) {
  const customAutorise = typeof onCustomIsoChange === "function";
  const enPerso = customAutorise && customIso != null;

  // Minutes réellement transmises. En mode date, c'est l'écart entre la date
  // choisie et la base — écart qui se recalcule tout seul si la base bouge
  // (cas du champ de vote, dont la base est la fin des soumissions) : la date
  // absolue affichée ne bouge pas, sa traduction en minutes s'adapte.
  const minutesEffectives = useMemo(() => {
    if (!enPerso || !customIso || baseIsoMs <= 0) return value;
    return Math.round((new Date(customIso).getTime() - baseIsoMs) / 60_000);
  }, [enPerso, customIso, baseIsoMs, value]);

  // Une base qui avance peut rendre la date choisie antérieure à l'ouverture
  // de la phase : on le dit au lieu d'envoyer une durée négative.
  const datePassee = enPerso && minutesEffectives <= 0;

  const preview = useMemo(
    () =>
      baseIsoMs > 0 && !datePassee
        ? formatRoundDateWithHour(
            new Date(baseIsoMs + minutesEffectives * 60_000).toISOString(),
            locale,
          )
        : null,
    [minutesEffectives, baseIsoMs, locale, datePassee],
  );

  function changerSelection(brut: string) {
    if (brut === CUSTOM) {
      // On préremplit avec l'échéance courante plutôt qu'un champ vide :
      // l'utilisateur ajuste une date qui a déjà du sens.
      onCustomIsoChange?.(new Date(baseIsoMs + value * 60_000).toISOString());
      return;
    }
    onCustomIsoChange?.(null);
    onChange(Number(brut));
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <select
        id={name}
        value={enPerso ? CUSTOM : value}
        onChange={(e) => changerSelection(e.target.value)}
        className={inputClass}
      >
        {presets.map((p) => (
          <option key={p.minutes} value={p.minutes}>
            {p.label[locale]}
          </option>
        ))}
        {customAutorise && (
          <option value={CUSTOM}>{t(locale, "league.customDate")}</option>
        )}
      </select>

      {enPerso && (
        <input
          type="datetime-local"
          // Volontairement sans `name` : ce champ ne part pas au serveur, il
          // ne sert qu'à produire les minutes du champ caché ci-dessous. Il
          // participe malgré tout à la validation native du formulaire, ce qui
          // bloque l'envoi si la date est antérieure à `min`.
          required
          value={toDatetimeLocalValue(customIso!)}
          min={
            baseIsoMs > 0
              ? toDatetimeLocalValue(new Date(baseIsoMs + 60_000).toISOString())
              : undefined
          }
          onChange={(e) => {
            const d = new Date(e.target.value);
            if (!Number.isNaN(d.getTime())) {
              onCustomIsoChange?.(d.toISOString());
            }
          }}
          className={`${inputClass} mt-1`}
        />
      )}

      {/* Le serveur ne reçoit que des minutes, en mode durée comme en mode
          date. Vidé si la date est invalide : createRound rejette alors la
          création (garde-fou, la validation native devrait suffire). */}
      <input
        type="hidden"
        name={name}
        value={datePassee ? "" : minutesEffectives}
      />

      {datePassee && (
        <p className="text-xs text-red-400">
          {t(locale, "league.customDateTooEarly", {
            date: formatRoundDateWithHour(
              new Date(baseIsoMs).toISOString(),
              locale,
            ),
          })}
        </p>
      )}

      {preview && (
        <p className="text-xs text-[var(--color-muted)]">
          {t(locale, "league.durationPreview", { date: preview })}
        </p>
      )}
    </div>
  );
}
