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
export const MAX_CATEGORIES = 5;

export type CategoryOption = {
  id: string;
  name: string;
  propre: boolean;
  choisie: boolean;
};

export default function RoundModeDateFields({
  locale,
  categoryOptions,
}: {
  locale: Locale;
  categoryOptions: CategoryOption[];
}) {
  const [mode, setMode] = useState<Mode>("competition_officielle");

  // Pré-remplies avec le dernier choix de la ligue — ou tout ce qui est
  // disponible si elle n'a encore jamais lancé de séance en compétition.
  const [categories, setCategories] = useState<string[]>(() => {
    const dejaChoisies = categoryOptions.filter((o) => o.choisie);
    return (dejaChoisies.length ? dejaChoisies : categoryOptions)
      .slice(0, MAX_CATEGORIES)
      .map((o) => o.id);
  });
  const plein = categories.length >= MAX_CATEGORIES;

  function basculer(id: string) {
    setCategories((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_CATEGORIES
          ? prev
          : [...prev, id],
    );
  }
  const [closeMinutes, setCloseMinutes] = useState(
    CINE_FILES_DURATION_PRESETS[2]?.minutes ?? 120,
  );
  const [submissionMinutes, setSubmissionMinutes] = useState(
    SUBMISSION_DURATION_PRESETS[2]?.minutes ?? 10080,
  );
  const [votingMinutes, setVotingMinutes] = useState(
    VOTING_DURATION_PRESETS[2]?.minutes ?? 4320,
  );

  // Mode « date personnalisée » : on mémorise une DATE ABSOLUE, pas une durée.
  // Réservé à la Compétition officielle, dont les listes de durées plafonnent
  // (7 jours pour le vote) ; Ciné'Files se joue en direct sur quelques heures
  // et n'en a pas besoin. null = on est en mode durée prédéfinie.
  const [submissionCustomIso, setSubmissionCustomIso] = useState<string | null>(
    null,
  );
  const [votingCustomIso, setVotingCustomIso] = useState<string | null>(null);

  // Initialisation paresseuse (exécutée une seule fois, au montage) : sert
  // uniquement à l'aperçu affiché à l'utilisateur, l'échéance réelle est de
  // toute façon recalculée par le serveur au moment de la création.
  const [now] = useState(() => Date.now());

  // La phase de vote se décompte depuis la clôture des soumissions : il faut
  // donc connaître la durée de soumission RÉELLEMENT retenue, date perso
  // comprise, pour caler la base du second champ.
  const submissionMinutesEffectives = submissionCustomIso
    ? Math.round((new Date(submissionCustomIso).getTime() - now) / 60_000)
    : submissionMinutes;
  const baseVote = now + submissionMinutesEffectives * 60_000;

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

      {/* Catégories de vote — uniquement en Compétition officielle, puisque
          Ciné'Files se joue en devinant un film mystère et n'a rien à
          départager. Le choix se fait ICI, à l'ouverture de la séance : c'est
          le moment où la question se pose. */}
      {mode === "competition_officielle" && categoryOptions.length > 0 && (
        <fieldset className="rounded-lg border border-[var(--color-border)] p-3">
          <legend className={`${labelClass} px-1`}>
            {t(locale, "categories.titre")}
          </legend>
          <p className="mb-2 text-xs text-[var(--color-muted)]">
            {t(locale, "categories.aide", {
              n: categories.length,
              max: MAX_CATEGORIES,
            })}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categoryOptions.map((o) => {
              const active = categories.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => basculer(o.id)}
                  disabled={!active && plein}
                  aria-pressed={active}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "border-[var(--color-cream)] bg-[var(--color-sage)]/30 text-[var(--color-cream)]"
                      : plein
                        ? "border-[var(--color-border)] text-[var(--color-muted)] opacity-40"
                        : "border-[var(--color-border)] text-[var(--color-cream)] hover:border-[var(--color-cream)]"
                  }`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
          {/* Transmises au serveur : un champ caché par catégorie retenue. */}
          {categories.map((id) => (
            <input key={id} type="hidden" name="category_ids" value={id} />
          ))}

          {/* Catégorie libre. Volontairement un simple champ de texte plutôt
              qu'un bouton « ajouter » : le serveur la crée au moment de créer
              la séance, ce qui évite un aller-retour et un état intermédiaire
              à gérer. Elle reste privée à la ligue. */}
          {!plein && (
            <input
              type="text"
              name="custom_category"
              maxLength={60}
              placeholder={t(locale, "categories.nouvellePlaceholder")}
              className={`${inputClass} mt-2 text-xs placeholder:text-[var(--color-cream)]/40`}
            />
          )}
        </fieldset>
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
            customIso={submissionCustomIso}
            onCustomIsoChange={setSubmissionCustomIso}
          />

          {/* `baseVote` intègre la date perso de soumission : si elle change,
              la base du vote se déplace et `DurationSelect` retraduit la date
              absolue en minutes — la date de cérémonie affichée reste celle
              que l'utilisateur a saisie. */}
          <DurationSelect
            name="voting_duration_minutes"
            label={t(locale, "league.ceremonyLabel")}
            presets={VOTING_DURATION_PRESETS}
            locale={locale}
            value={votingMinutes}
            onChange={setVotingMinutes}
            baseIsoMs={baseVote}
            customIso={votingCustomIso}
            onCustomIsoChange={setVotingCustomIso}
          />
        </>
      )}
    </>
  );
}
