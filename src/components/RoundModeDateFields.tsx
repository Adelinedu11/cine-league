"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";

type Mode = "competition_officielle" | "cine_files";

const inputClass =
  "w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]";
const labelClass = "text-sm font-medium text-[var(--color-cream)]";

/**
 * Champs de « Créer une séance » : mode, thème (+ note en Ciné'Files) et date(s).
 * Compétition : date limite de soumission + date de cérémonie.
 * Ciné'Files : une seule « Date de clôture » (le serveur la copie dans les deux
 * colonnes submission_deadline / ceremony_at).
 */
export default function RoundModeDateFields({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<Mode>("competition_officielle");

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
        <>
          <label htmlFor="submission_deadline" className={labelClass}>
            {t(locale, "league.closeDateLabel")}
          </label>
          <input
            id="submission_deadline"
            name="submission_deadline"
            type="datetime-local"
            required
            className={inputClass}
          />
        </>
      ) : (
        <>
          <label htmlFor="submission_deadline" className={labelClass}>
            {t(locale, "league.deadlineLabel")}
          </label>
          <input
            id="submission_deadline"
            name="submission_deadline"
            type="datetime-local"
            required
            className={inputClass}
          />

          <label htmlFor="ceremony_at" className={labelClass}>
            {t(locale, "league.ceremonyLabel")}
          </label>
          <input
            id="ceremony_at"
            name="ceremony_at"
            type="datetime-local"
            required
            className={inputClass}
          />
        </>
      )}
    </>
  );
}
