"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import FilmPoster from "@/components/FilmPoster";
import SubmitButton from "@/components/SubmitButton";
import { t, type Locale } from "@/lib/i18n";

type Movie = {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
};

type Overlap = { person: string; filmTitle: string };

function label(movie: Movie) {
  return movie.year ? `${movie.title} (${movie.year})` : movie.title;
}

export default function FilmSearch({
  roundId,
  locale,
  existingTitle,
  existingComment,
  error,
  submitFilm,
  submitLabel,
  showComment = true,
  showPoster = true,
  checkContradiction,
}: {
  roundId: string;
  locale: Locale;
  existingTitle: string | null;
  existingComment: string | null;
  error: string | null;
  submitFilm: (formData: FormData) => Promise<void>;
  submitLabel?: string;
  showComment?: boolean;
  showPoster?: boolean;
  // Mode Ciné'Files : valide un candidat contre les indices confirmés ;
  // renvoie un message de contradiction (bloquant) ou null.
  checkContradiction?: (candidate: {
    country: string | null;
    language: string | null;
    director: string | null;
    year: number | null;
    genres: string[];
  }) => string | null;
}) {
  // Si l'utilisateur a déjà soumis, on affiche d'abord un récap ; la recherche
  // ne s'ouvre que s'il clique sur « Modifier » (ou si le serveur a renvoyé une
  // erreur de soumission, pour qu'il puisse corriger).
  const [editing, setEditing] = useState(existingTitle === null || error !== null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [platforms, setPlatforms] = useState<string[] | null>(null);
  const [overlaps, setOverlaps] = useState<Overlap[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [contradiction, setContradiction] = useState<string | null>(null);

  // Recherche débouncée au fil de la saisie.
  useEffect(() => {
    const q = query.trim();
    if (selected && q === label(selected)) {
      return; // le champ affiche le film sélectionné, pas une nouvelle recherche
    }
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(q)}`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setResults(res.ok ? (data.results ?? []) : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selected]);

  async function selectMovie(movie: Movie) {
    setSelected(movie);
    setResults([]);
    setQuery(label(movie));
    setPlatforms(null);
    setOverlaps([]);
    setContradiction(null);
    setLoadingDetails(true);

    try {
      // Plateformes + crédits (+ détails si contrôle de contradiction).
      const [providersRes, creditsRes, detailsRes] = await Promise.all([
        fetch(`/api/tmdb/${movie.id}/providers`),
        fetch(`/api/tmdb/${movie.id}/credits`),
        checkContradiction
          ? fetch(`/api/tmdb/${movie.id}/details`)
          : Promise.resolve(null),
      ]);

      const providersData = providersRes.ok ? await providersRes.json() : {};
      setPlatforms(providersData.platforms ?? []);

      const creditsData = creditsRes.ok ? await creditsRes.json() : {};
      const movieDirector: string | null = creditsData.director ?? null;
      const movieCast: string[] = creditsData.cast ?? [];

      // Ciné'Files : bloque une proposition qui contredit un indice confirmé.
      if (checkContradiction && detailsRes && detailsRes.ok) {
        const d = await detailsRes.json();
        const year =
          typeof d.releaseDate === "string" && d.releaseDate.length >= 4
            ? parseInt(d.releaseDate.slice(0, 4), 10)
            : null;
        setContradiction(
          checkContradiction({
            country: d.country ?? null,
            language: d.originalLanguage ?? null,
            director: movieDirector,
            year: Number.isFinite(year) ? year : null,
            genres: d.genres ?? [],
          }),
        );
      }

      // Comparaison avec les autres soumissions (côté serveur, sans révéler
      // qui a soumis quoi).
      const overlapRes = await fetch(`/api/rounds/${roundId}/overlap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ director: movieDirector, cast: movieCast }),
      });
      const overlapData = overlapRes.ok ? await overlapRes.json() : {};
      setOverlaps(overlapData.overlaps ?? []);
    } catch {
      setPlatforms((p) => p ?? []);
    } finally {
      setLoadingDetails(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-sm text-[var(--color-cream)]">
          {t(locale, "film.alreadySubmitted")}{" "}
          <strong className="font-semibold">{existingTitle}</strong>
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
        >
          {t(locale, "film.editSubmission")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      {existingTitle && (
        <p className="text-xs text-[var(--color-muted)]">
          {t(locale, "film.currentSubmission", { title: existingTitle })}
        </p>
      )}

      {error === "duplicate" && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {t(locale, "film.errorDuplicate")}
        </p>
      )}
      {error === "closed" && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {t(locale, "film.errorClosed")}
        </p>
      )}
      {error === "submit" && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {t(locale, "film.errorSubmit")}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="film-search"
          className="text-sm font-medium text-[var(--color-cream)]"
        >
          {t(locale, "film.searchLabel")}
        </label>
        <input
          id="film-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setPlatforms(null);
            setOverlaps([]);
            setContradiction(null);
          }}
          placeholder={t(locale, "film.searchPlaceholder")}
          autoComplete="off"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
        />
        {searching && (
          <p className="text-xs text-[var(--color-muted)]">
            {t(locale, "film.searching")}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <ul className="flex flex-col overflow-hidden rounded-lg border border-[var(--color-border)]">
          {results.map((movie) => (
            <li
              key={movie.id}
              className="border-b border-[var(--color-border)] last:border-b-0"
            >
              <button
                type="button"
                onClick={() => selectMovie(movie)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)]"
              >
                {showPoster && (
                  <FilmPoster
                    posterPath={movie.posterPath}
                    alt={movie.title}
                    width={44}
                  />
                )}
                {label(movie)}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <form
          action={submitFilm}
          className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-4"
        >
          <input type="hidden" name="tmdb_id" value={selected.id} />
          <input type="hidden" name="film_title" value={selected.title} />
          <input
            type="hidden"
            name="poster_path"
            value={selected.posterPath ?? ""}
          />
          <input
            type="hidden"
            name="platforms"
            value={JSON.stringify(platforms ?? [])}
          />

          <div>
            <p className="text-sm font-medium text-[var(--color-cream)]">
              {label(selected)}
            </p>
            {loadingDetails ? (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {t(locale, "film.loadingDetails")}
              </p>
            ) : platforms && platforms.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-cream)]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--color-muted)]">
                {t(locale, "film.noPlatform")}
              </p>
            )}
          </div>

          {overlaps.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-lg border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 px-3 py-2">
              {overlaps.map((o, i) => (
                <li
                  key={`${o.person}-${o.filmTitle}-${i}`}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-gold)]"
                >
                  <TriangleAlert size={13} strokeWidth={1.8} />
                  {t(locale, "film.overlap", {
                    person: o.person,
                    film: o.filmTitle,
                  })}
                </li>
              ))}
            </ul>
          )}

          {showComment && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="comment"
                className="text-sm font-medium text-[var(--color-cream)]"
              >
                {t(locale, "round.whyChoice")}
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={3}
                defaultValue={existingComment ?? ""}
                placeholder={t(locale, "film.commentPlaceholder")}
                className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
              />
            </div>
          )}

          {contradiction && (
            <p className="flex items-center gap-1.5 rounded-lg border border-[var(--color-yellow)]/50 bg-[var(--color-yellow)]/15 px-3 py-2 text-sm text-[var(--color-yellow-ink)]">
              <TriangleAlert size={14} strokeWidth={1.8} />
              {contradiction}
            </p>
          )}

          <SubmitButton
            locale={locale}
            disabled={loadingDetails}
            className="w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
          >
            {submitLabel ?? t(locale, "film.submitButton")}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
