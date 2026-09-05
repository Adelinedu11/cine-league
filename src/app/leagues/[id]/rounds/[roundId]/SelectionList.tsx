import FilmPoster from "@/components/FilmPoster";
import WhereToWatch from "@/components/WhereToWatch";
import { t, type Locale } from "@/lib/i18n";

type Film = {
  film_title: string;
  platforms: string[] | null;
  poster_path: string | null;
  comment: string | null;
};

/**
 * « La sélection » : tous les films de la séance présentés UNE SEULE FOIS en
 * haut de la phase de vote — affiche, plateformes et commentaire du directeur.
 * Le bulletin qui suit ne répète plus que les titres, dans un menu déroulant.
 *
 * ANONYMAT : aucun nom n'est affiché ici, pas même sur les commentaires. Seule
 * la soumission du joueur est identifiée — c'est la sienne, il la connaît. Qui
 * a proposé quoi ne se révèle qu'à la cérémonie (round 'closed').
 */
export default function SelectionList({
  films,
  mine,
  locale,
}: {
  films: (Film & { submission_id: string })[];
  mine: Film | null;
  locale: Locale;
}) {
  const total = films.length + (mine ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl tracking-wide text-[var(--color-cream)]">
          {t(locale, "round.selectionTitle")}
        </h3>
        <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
          {t(locale, "round.selectionCount", { count: total })}
        </span>
      </div>

      <p className="text-xs text-[var(--color-muted)]">
        {t(locale, "round.selectionAnonymous")}
      </p>

      {mine ? (
        <ul className="flex flex-col gap-2">
          <FilmCard film={mine} locale={locale} mine />
          {films.map((film) => (
            <FilmCard key={film.submission_id} film={film} locale={locale} />
          ))}
        </ul>
      ) : (
        <>
          <p className="text-sm text-[var(--color-muted)]">
            {t(locale, "round.yourFilmNone")}
          </p>
          <ul className="flex flex-col gap-2">
            {films.map((film) => (
              <FilmCard key={film.submission_id} film={film} locale={locale} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FilmCard({
  film,
  locale,
  mine = false,
}: {
  film: Film;
  locale: Locale;
  mine?: boolean;
}) {
  return (
    <li
      className={`flex gap-3 rounded-lg border p-3 ${
        mine
          ? "border-[var(--color-gold)] bg-[var(--color-gold)]/5"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <FilmPoster
        posterPath={film.poster_path}
        alt={film.film_title}
        width={56}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--color-cream)]">
          {film.film_title}
          {mine && (
            <span className="rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-bg)]">
              {t(locale, "round.yourFilmBadge")}
            </span>
          )}
          <WhereToWatch platforms={film.platforms ?? []} locale={locale} />
        </span>

        <p className="text-xs text-[var(--color-muted)]">
          <span className="font-medium text-[var(--color-gold)]">
            {t(locale, "round.directorCommentLabel")}
          </span>
          {" · "}
          {film.comment ? (
            <span className="italic">« {film.comment} »</span>
          ) : mine ? (
            t(locale, "round.yourFilmNoComment")
          ) : (
            "—"
          )}
        </p>

        {mine && (
          <p className="font-mono text-[11px] text-[var(--color-muted)]">
            {t(locale, "round.yourFilmOut")}
          </p>
        )}
      </div>
    </li>
  );
}
