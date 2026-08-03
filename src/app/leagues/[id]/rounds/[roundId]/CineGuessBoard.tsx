"use client";

import { useState } from "react";
import FilmSearch from "./FilmSearch";
import Avatar from "@/components/Avatar";
import { t, type Locale } from "@/lib/i18n";
import {
  computeConfirmedHints,
  findContradiction,
  type CineFeedback,
  type CineMeta,
  type ConfirmedHints,
} from "@/lib/cinefiles";

type Mystery = {
  target_id: string;
  display_name: string;
  attempts: number;
  found: boolean;
};
type Guess = {
  target_id: string | null;
  guessed_title: string | null;
  feedback: unknown;
  guess_meta: unknown;
  attempt_number: number | null;
  found: boolean | null;
};

function regionName(code: string, locale: Locale): string {
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

function languageName(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

type Status = "match" | "partial" | "none";

function statusBg(status: Status): string {
  if (status === "match") return "bg-emerald-500/20";
  if (status === "partial") return "bg-amber-500/20";
  return "bg-[var(--color-surface-alt)]";
}

function Chip({
  status,
  label,
  value,
}: {
  status: Status;
  label: string;
  value: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-cream)] ${statusBg(status)}`}
    >
      <span className="font-mono opacity-70">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

export default function CineGuessBoard({
  locale,
  roundId,
  hasOwnTarget,
  mysteries,
  guesses,
  submitGuess,
  error,
  initialSelected,
}: {
  locale: Locale;
  roundId: string;
  hasOwnTarget: boolean;
  mysteries: Mystery[];
  guesses: Guess[];
  submitGuess: (targetId: string, formData: FormData) => Promise<void>;
  error: boolean;
  initialSelected: string | null;
}) {
  // Sélection initiale depuis l'URL (?mystery=) pour rester ouvert après envoi.
  const [selected, setSelected] = useState<string | null>(
    initialSelected && mysteries.some((m) => m.target_id === initialSelected)
      ? initialSelected
      : null,
  );

  if (!hasOwnTarget) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "cinefiles.chooseFirst")}
      </p>
    );
  }

  if (mysteries.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "cinefiles.noMysteries")}
      </p>
    );
  }

  function renderFeedback(fb: CineFeedback) {
    const yesNo = (b: boolean): Status => (b ? "match" : "none");
    const dir = (d: CineFeedback["decade"]) =>
      d === "exact" ? "✓" : d === "earlier" ? "↓" : d === "later" ? "↑" : "—";
    const dirStatus = (d: CineFeedback["decade"]): Status =>
      d === "exact" ? "match" : d === "unknown" ? "none" : "partial";

    return (
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Chip
          status={
            fb.genre.result === "exact"
              ? "match"
              : fb.genre.result === "partial"
                ? "partial"
                : "none"
          }
          label={t(locale, "cinefiles.critGenre")}
          value={fb.genre.shared.length ? fb.genre.shared.join(", ") : "—"}
        />
        <Chip
          status={dirStatus(fb.decade)}
          label={t(locale, "cinefiles.critDecade")}
          value={dir(fb.decade)}
        />
        <Chip
          status={dirStatus(fb.releaseYear)}
          label={t(locale, "cinefiles.critYear")}
          value={dir(fb.releaseYear)}
        />
        <Chip
          status={yesNo(fb.director)}
          label={t(locale, "cinefiles.critDirector")}
          value={fb.director ? "✓" : "✗"}
        />
        <Chip
          status={yesNo(fb.country)}
          label={t(locale, "cinefiles.critCountry")}
          value={fb.country ? "✓" : "✗"}
        />
        <Chip
          status={yesNo(fb.language)}
          label={t(locale, "cinefiles.critLanguage")}
          value={fb.language ? "✓" : "✗"}
        />
        <Chip
          status={fb.actors.sharedCount > 0 ? "partial" : "none"}
          label={t(locale, "cinefiles.critActors")}
          value={
            fb.actors.shared.length
              ? fb.actors.shared.join(", ")
              : String(fb.actors.sharedCount)
          }
        />
        <Chip
          status={fb.platforms.sharedCount > 0 ? "partial" : "none"}
          label={t(locale, "cinefiles.critPlatforms")}
          value={
            fb.platforms.shared.length
              ? fb.platforms.shared.join(", ")
              : String(fb.platforms.sharedCount)
          }
        />
      </div>
    );
  }

  const selectedMystery =
    mysteries.find((m) => m.target_id === selected) ?? null;
  const selectedAttempts = selected
    ? guesses
        .filter((g) => g.target_id === selected)
        .sort((a, b) => (a.attempt_number ?? 0) - (b.attempt_number ?? 0))
    : [];

  // Indices confirmés (agrégés sur les tentatives du mystère sélectionné).
  const hints: ConfirmedHints = computeConfirmedHints(
    selectedAttempts.map((g) => ({
      feedback: (g.feedback as CineFeedback | null) ?? null,
      guessMeta: (g.guess_meta as CineMeta | null) ?? null,
    })),
  );

  // "Label = Valeur" pour un critère confirmé (utilisé encart + contradiction).
  function hintLine(
    criterion: "country" | "language" | "director" | "year" | "decade",
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

  // Passé à FilmSearch : bloque un candidat contredisant un indice confirmé.
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
      hint: hintLine(c.criterion, c.value),
    });
  };

  // Lignes d'indices confirmés à afficher dans l'encart.
  const hintLines: string[] = [];
  if (hints.director) hintLines.push(hintLine("director", hints.director));
  if (hints.country) hintLines.push(hintLine("country", hints.country));
  if (hints.language) hintLines.push(hintLine("language", hints.language));
  if (hints.year !== undefined) hintLines.push(hintLine("year", hints.year));
  else if (hints.decade !== undefined)
    hintLines.push(hintLine("decade", hints.decade));
  if (hints.genres.length)
    hintLines.push(
      `${t(locale, "cinefiles.critGenre")} = ${hints.genres.join(", ")}`,
    );
  if (hints.actors.length)
    hintLines.push(
      `${t(locale, "cinefiles.critActors")} = ${hints.actors.join(", ")}`,
    );
  if (hints.platforms.length)
    hintLines.push(
      `${t(locale, "cinefiles.critPlatforms")} = ${hints.platforms.join(", ")}`,
    );

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {t(locale, "cinefiles.guessError")}
        </p>
      )}

      {/* Liste des mystères (boutons-cartes) */}
      <ul className="flex flex-col gap-2">
        {mysteries.map((mystery) => {
          const isOpen = selected === mystery.target_id;
          return (
            <li key={mystery.target_id}>
              <button
                type="button"
                onClick={() => setSelected(isOpen ? null : mystery.target_id)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-[var(--color-surface)] px-4 py-3 text-left transition-colors ${
                  isOpen
                    ? "border-[var(--color-gold)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-muted)]"
                }`}
              >
                <span className="flex items-center gap-2 font-display text-lg tracking-wide text-[var(--color-cream)]">
                  <Avatar name={mystery.display_name} size={26} />
                  {t(locale, "cinefiles.proposalBy", {
                    name: mystery.display_name,
                  })}
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-[var(--color-muted)]">
                  {mystery.found ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
                      {t(locale, "cinefiles.foundBadge")} ✅
                    </span>
                  ) : (
                    <span>
                      {t(
                        locale,
                        mystery.attempts > 1
                          ? "cinefiles.attempts"
                          : "cinefiles.attempt",
                        { count: mystery.attempts },
                      )}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Panneau du mystère sélectionné — sur le fond de page, comme la zone de
          soumission du mode Compétition (FilmSearch rend sa propre carte). */}
      {selectedMystery && (
        <div className="flex flex-col gap-3">
          {/* Indices confirmés (valeurs révélées, jamais tirées du mystère). */}
          {hintLines.length > 0 && (
            <div className="rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-4 py-3">
              <p className="font-display text-sm tracking-wide text-[var(--color-cream)]">
                {t(locale, "cinefiles.confirmedHints")}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {hintLines.map((line, k) => (
                  <li key={k} className="text-sm text-[var(--color-cream)]">
                    ✅ {line}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedAttempts.length === 0 ? (
            <p className="text-xs text-[var(--color-muted)]">
              {t(locale, "cinefiles.attemptsEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {selectedAttempts.map((g, j) => (
                <li key={j} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      #{g.attempt_number}
                    </span>
                    <span className="text-[var(--color-cream)]">
                      {g.guessed_title}
                    </span>
                    {g.found && <span>✅</span>}
                  </div>
                  {g.feedback
                    ? renderFeedback(g.feedback as CineFeedback)
                    : null}
                </li>
              ))}
            </ul>
          )}

          {!selectedMystery.found && (
            <FilmSearch
              key={selectedMystery.target_id}
              roundId={roundId}
              locale={locale}
              existingTitle={null}
              existingComment={null}
              error={null}
              submitFilm={submitGuess.bind(null, selectedMystery.target_id)}
              submitLabel={t(locale, "cinefiles.guessButton")}
              showComment={false}
              checkContradiction={checkContradiction}
            />
          )}
        </div>
      )}
    </div>
  );
}
