const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Appelle l'API TMDB côté serveur.
 * Supporte les deux formats de clé :
 *  - clé v3 (`api_key` en query param),
 *  - token v4 (JWT, en header `Authorization: Bearer`) — détecté via le préfixe `eyJ`.
 * `TMDB_API_KEY` reste une variable serveur (jamais exposée au client).
 */
export async function tmdbFetch(
  path: string,
  params: Record<string, string> = {},
): Promise<Response> {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY manquante");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const isV4Token = key.startsWith("eyJ");
  if (!isV4Token) {
    url.searchParams.set("api_key", key);
  }

  return fetch(url, {
    headers: {
      accept: "application/json",
      ...(isV4Token ? { Authorization: `Bearer ${key}` } : {}),
    },
  });
}

/**
 * Récupère le réalisateur et les 20 premiers acteurs (au billing) d'un film.
 * 20 (et non 5) pour inclure les seconds rôles dans l'indice « casting » de
 * Ciné'Files et alimenter les indices bonus. Valeurs vides si échec.
 */
export async function fetchMovieCredits(
  movieId: string | number,
): Promise<{ director: string | null; cast: string[] }> {
  try {
    const res = await tmdbFetch(`/movie/${movieId}/credits`, {
      language: "fr-FR",
    });
    if (!res.ok) {
      return { director: null, cast: [] };
    }
    const data = await res.json();

    const director =
      (data.crew ?? []).find(
        (c: { job?: string; name?: string }) => c.job === "Director",
      )?.name ?? null;

    const cast = (data.cast ?? [])
      .slice(0, 20)
      .map((c: { name?: string }) => c.name)
      .filter((name: unknown): name is string => typeof name === "string");

    return { director, cast };
  } catch {
    return { director: null, cast: [] };
  }
}

/**
 * Détails d'un film pour la comparaison Ciné'Files : genres, date de sortie,
 * langue originale, pays de production principal. Valeurs nulles/vides en cas
 * d'échec (jamais d'exception réseau).
 */
export async function fetchMovieDetails(movieId: string | number): Promise<{
  genres: string[];
  releaseDate: string | null;
  originalLanguage: string | null;
  country: string | null;
}> {
  try {
    const res = await tmdbFetch(`/movie/${movieId}`, { language: "fr-FR" });
    if (!res.ok) {
      return {
        genres: [],
        releaseDate: null,
        originalLanguage: null,
        country: null,
      };
    }
    const data = await res.json();

    const genres = (data.genres ?? [])
      .map((g: { name?: string }) => g.name)
      .filter((n: unknown): n is string => typeof n === "string");

    const releaseDate =
      typeof data.release_date === "string" && data.release_date !== ""
        ? data.release_date
        : null;

    const originalLanguage =
      typeof data.original_language === "string" ? data.original_language : null;

    const country =
      (data.production_countries ?? [])[0]?.iso_3166_1 ??
      (data.origin_country ?? [])[0] ??
      null;

    return { genres, releaseDate, originalLanguage, country };
  } catch {
    return {
      genres: [],
      releaseDate: null,
      originalLanguage: null,
      country: null,
    };
  }
}

/**
 * Plateformes de streaming FR d'un film (même logique que la route providers),
 * pour un usage côté serveur (Server Actions).
 */
export async function fetchMoviePlatforms(
  movieId: string | number,
): Promise<string[]> {
  try {
    const res = await tmdbFetch(`/movie/${movieId}/watch/providers`);
    if (!res.ok) return [];
    const data = await res.json();
    const fr = data.results?.FR;
    type Provider = { provider_name: string };
    const offers: Provider[] =
      fr?.flatrate ?? fr?.free ?? fr?.ads ?? fr?.rent ?? fr?.buy ?? [];
    return offers
      .map((p) => p.provider_name)
      .filter((n): n is string => typeof n === "string");
  } catch {
    return [];
  }
}
