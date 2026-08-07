"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import DurationSelect from "@/components/DurationSelect";
import {
  CINE_FILES_DURATION_PRESETS,
  SUBMISSION_DURATION_PRESETS,
  VOTING_DURATION_PRESETS,
} from "@/lib/rounds";

type Mode = "competition_officielle" | "cine_files";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]";
const labelClass = "text-sm font-medium text-[var(--color-cream)]";

/**
 * Champs de « Créer une séance » : mode, thème (+ note en Ciné'Files) et
 * durée(s) — système "tic-tac-boom" (voir backlog point 13) : on choisit une
 * durée depuis le lancement plutôt qu'une date précise, le serveur calcule
 * l'échéance exacte à la création. Compétition : durée de soumission + durée
 * de vote (enchaînée après la soumission). Ciné'Files : une seule durée de
 * clôture (le serveur la copie dans les deux colonnes submission_deadline /
 * ceremony_at).
 */
export default function RoundModeDateFields({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<Mode>("competition_officielle");
  const [closeMinutes, setCloseMinutes] = useState(
    CINE_FILES_DURATION_PRESETS[2]?.minutes ?? 120,
  );
  const [submissionMinutes, setSubmissionMinutes] = useState(
    SUBMISSION_DURATION_PRESETS[2]?.minutes ?? 10080,
  );
  const [votingMinutes, setVotingMinutes] = useState(
    VOTING_DURATION_PRESETS[2]?.minutes ?? 4320,
  );

  // Initialisation paresseuse (exécutée une seule fois, au montage) : sert
  // uniquement à l'aperçu affiché à l'utilisateur, l'échéance réelle est de
  // toute façon recalculée par le serveur au moment de la création.
  const [now] = useState(() => Date.now());

  return (
    <>
      <label htmlFor="game_mode" className={labelClass}>
        {t(locale, "league.modeLabel")}
      </label>
      <select
        id="game_mode"
        name="game_mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as Mode)}
        className={inputClass}
      >
        <option value="competition_officielle">
          {t(locale, "roundMode.competition")}
        </option>
        <option value="cine_files">{t(locale, "roundMode.cineFiles")}</option>
      </select>

      <label htmlFor="theme" className={labelClass}>
        {t(locale, "league.themeLabel")}
      </label>
      <input
        id="theme"
        name="theme"
        type="text"
        required
        placeholder={t(locale, "league.themePlaceholder")}
        className={`${inputClass} placeholder:text-[var(--color-cream)]/40`}
      />
      {mode === "cine_files" && (
        <p className="-mt-1 text-xs text-[var(--color-muted)]">
          {t(locale, "cinefiles.createNote")}
        </p>
      )}

      {mode === "cine_files" ? (
        <DurationSelect
          name="close_duration_minutes"
          label={t(locale, "league.closeDateLabel")}
          presets={CINE_FILES_DURATION_PRESETS}
          locale={locale}
          value={closeMinutes}
          onChange={setCloseMinutes}
          baseIsoMs={now}
        />
      ) : (
        <>
          <DurationSelect
            name="submission_duration_minutes"
            label={t(locale, "league.deadlineLabel")}
            presets={SUBMISSION_DURATION_PRESETS}
            locale={locale}
            value={submissionMinutes}
            onChange={setSubmissionMinutes}
            baseIsoMs={now}
          />

          <DurationSelect
            name="voting_duration_minutes"
            label={t(locale, "league.ceremonyLabel")}
            presets={VOTING_DURATION_PRESETS}
            locale={locale}
            value={votingMinutes}
            onChange={setVotingMinutes}
            baseIsoMs={now + submissionMinutes * 60_000}
          />
        </>
      )}
    </>
  );
}
