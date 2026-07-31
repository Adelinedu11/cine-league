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
 * Récupère le réalisateur et les 5 premiers acteurs principaux d'un film.
 * Renvoie des valeurs vides en cas d'échec (jamais d'exception réseau).
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
      .slice(0, 5)
      .map((c: { name?: string }) => c.name)
      .filter((name: unknown): name is string => typeof name === "string");

    return { director, cast };
  } catch {
    return { director: null, cast: [] };
  }
}
