/**
 * Comparaison Ciné'Files : à partir des métadonnées d'un film DEVINÉ et du film
 * MYSTÈRE (cible), calcule un feedback par critère. Les directions (earlier /
 * later) décrivent la CIBLE relativement au film deviné : « earlier » = la cible
 * est plus ancienne que la proposition, « later » = plus récente.
 *
 * ⚠️ SOURCE DE VÉRITÉ : le feedback réellement stocké est calculé EN BASE par la
 * fonction SECURITY DEFINER `submit_cine_guess` (supabase/018), pour ne jamais
 * exposer les métadonnées de la cible. `computeFeedback` ci-dessous en est le
 * miroir de référence (types + règles) ; garder les deux alignés en cas d'évol.
 */

export type CineMeta = {
  tmdbId: number | null;
  genres: string[];
  releaseDate: string | null; // "YYYY-MM-DD"
  director: string | null;
  country: string | null;
  originalLanguage: string | null;
  castNames: string[];
  platforms: string[];
};

export type Direction = "exact" | "earlier" | "later" | "unknown";

export type CineFeedback = {
  genre: { result: "exact" | "partial" | "none"; shared: string[] };
  decade: Direction;
  releaseYear: Direction;
  director: boolean;
  country: boolean;
  language: boolean;
  actors: { sharedCount: number; shared: string[] };
  platforms: { sharedCount: number; shared: string[] };
};

/** Intersection insensible à la casse, en conservant la casse d'origine (guess). */
function sharedItems(a: string[], b: string[]): string[] {
  const setB = new Set(b.map((x) => x.trim().toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of a) {
    const key = item.trim().toLowerCase();
    if (key && setB.has(key) && !seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

function sameSet(a: string[], b: string[]): boolean {
  const norm = (arr: string[]) =>
    [...new Set(arr.map((x) => x.trim().toLowerCase()).filter(Boolean))].sort();
  const na = norm(a);
  const nb = norm(b);
  return na.length === nb.length && na.every((v, i) => v === nb[i]);
}

function yearOf(date: string | null): number | null {
  if (!date) return null;
  const y = parseInt(date.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function direction(target: number | null, guess: number | null): Direction {
  if (target === null || guess === null) return "unknown";
  if (target === guess) return "exact";
  return target < guess ? "earlier" : "later";
}

function eq(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ---------------------------------------------------------------------------
// Indices confirmés + détection de contradiction (côté joueur)
// ---------------------------------------------------------------------------

/** Année depuis une date "YYYY-MM-DD". */
export function yearFromDate(date: string | null): number | null {
  return yearOf(date);
}

/**
 * Indices confirmés par un joueur pour un mystère, agrégés sur ses tentatives.
 * Scalaires : première tentative où le critère était `exact` → valeur du film
 * proposé (= celle du mystère, donc révélable). Sets : union cumulée des
 * éléments partagés. Les valeurs country/language restent en codes ISO ;
 * l'affichage les convertit en noms.
 */
export type ConfirmedHints = {
  director?: string;
  country?: string;
  language?: string;
  year?: number;
  decade?: number;
  genres: string[];
  actors: string[];
  platforms: string[];
};

// feedback / guessMeta peuvent être null (ex. tentatives d'avant la mise en
// cache de guess_meta, ou données incomplètes) — la fonction reste robuste.
export type CineAttempt = {
  feedback: CineFeedback | null;
  guessMeta: CineMeta | null;
};

function pushUnique(target: string[], items: string[] | undefined): void {
  for (const item of items ?? []) {
    const key = item.trim().toLowerCase();
    if (key && !target.some((x) => x.trim().toLowerCase() === key)) {
      target.push(item);
    }
  }
}

export function computeConfirmedHints(attempts: CineAttempt[]): ConfirmedHints {
  const hints: ConfirmedHints = { genres: [], actors: [], platforms: [] };
  for (const { feedback: fb, guessMeta: gm } of attempts) {
    if (!fb) continue;

    // Valeurs scalaires révélées : nécessitent les métadonnées du film proposé.
    if (gm) {
      if (!hints.director && fb.director && gm.director) {
        hints.director = gm.director;
      }
      if (!hints.country && fb.country && gm.country) {
        hints.country = gm.country;
      }
      if (!hints.language && fb.language && gm.originalLanguage) {
        hints.language = gm.originalLanguage;
      }
      if (hints.year === undefined && fb.releaseYear === "exact") {
        const y = yearOf(gm.releaseDate);
        if (y !== null) hints.year = y;
      }
      if (hints.decade === undefined && fb.decade === "exact") {
        const y = yearOf(gm.releaseDate);
        if (y !== null) hints.decade = Math.floor(y / 10) * 10;
      }
    }

    // Unions cumulées : issues du feedback seul (disponible pour toute tentative).
    pushUnique(hints.genres, fb.genre?.shared);
    pushUnique(hints.actors, fb.actors?.shared);
    pushUnique(hints.platforms, fb.platforms?.shared);
  }
  return hints;
}

export type Contradiction = {
  criterion: "country" | "language" | "director" | "year" | "decade";
  value: string | number;
};

/** Première contradiction entre un candidat et les indices confirmés. */
export function findContradiction(
  hints: ConfirmedHints,
  candidate: {
    country: string | null;
    language: string | null;
    director: string | null;
    year: number | null;
  },
): Contradiction | null {
  if (hints.country && candidate.country && !eq(hints.country, candidate.country)) {
    return { criterion: "country", value: hints.country };
  }
  if (
    hints.language &&
    candidate.language &&
    !eq(hints.language, candidate.language)
  ) {
    return { criterion: "language", value: hints.language };
  }
  if (hints.director && candidate.director && !eq(hints.director, candidate.director)) {
    return { criterion: "director", value: hints.director };
  }
  if (
    hints.year !== undefined &&
    candidate.year !== null &&
    candidate.year !== hints.year
  ) {
    return { criterion: "year", value: hints.year };
  }
  if (
    hints.decade !== undefined &&
    candidate.year !== null &&
    Math.floor(candidate.year / 10) * 10 !== hints.decade
  ) {
    return { criterion: "decade", value: hints.decade };
  }
  return null;
}

export function computeFeedback(guess: CineMeta, target: CineMeta): CineFeedback {
  const sharedGenres = sharedItems(guess.genres, target.genres);
  const genreResult =
    sharedGenres.length === 0
      ? "none"
      : sameSet(guess.genres, target.genres)
        ? "exact"
        : "partial";

  const guessYear = yearOf(guess.releaseDate);
  const targetYear = yearOf(target.releaseDate);
  const guessDecade = guessYear === null ? null : Math.floor(guessYear / 10) * 10;
  const targetDecade =
    targetYear === null ? null : Math.floor(targetYear / 10) * 10;

  const sharedActors = sharedItems(guess.castNames, target.castNames);
  const sharedPlatforms = sharedItems(guess.platforms, target.platforms);

  return {
    genre: { result: genreResult, shared: sharedGenres },
    decade: direction(targetDecade, guessDecade),
    releaseYear: direction(targetYear, guessYear),
    director: eq(guess.director, target.director),
    country: eq(guess.country, target.country),
    language: eq(guess.originalLanguage, target.originalLanguage),
    actors: { sharedCount: sharedActors.length, shared: sharedActors },
    platforms: { sharedCount: sharedPlatforms.length, shared: sharedPlatforms },
  };
}
