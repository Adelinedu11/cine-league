import { NextResponse, type NextRequest } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * GET /api/toile/search?query=...
 *
 * Recherche unique pour La Toile : films ET personnes dans le même appel, via
 * `/search/multi`. Un seul champ côté joueur, parce qu'un film est un filet
 * large et un nom une sonde précise — deux outils du même jeu, pas deux modes.
 *
 * ⚠️ Contrairement à /api/tmdb/search, cette route est OUVERTE aux visiteurs
 * non connectés : on peut jouer à La Toile sans compte. Elle proxifie la clé
 * TMDB, qui reste côté serveur, et ne révèle évidemment rien de la cible.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!process.env.TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB non configuré" }, { status: 500 });
  }

  const res = await tmdbFetch("/search/multi", {
    query,
    language: "fr-FR",
    include_adult: "false",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erreur TMDB" }, { status: 502 });
  }

  type MultiResult = {
    id: number;
    media_type?: string;
    title?: string;
    name?: string;
    release_date?: string;
    poster_path?: string | null;
    profile_path?: string | null;
    popularity?: number;
    known_for_department?: string;
  };

  const results = ((await res.json()).results ?? [])
    .filter(
      (r: MultiResult) => r.media_type === "movie" || r.media_type === "person",
    )
    .map((r: MultiResult) =>
      r.media_type === "movie"
        ? {
            kind: "film" as const,
            id: r.id,
            label: r.title ?? "",
            detail: r.release_date ? r.release_date.slice(0, 4) : null,
            imagePath: r.poster_path ?? null,
          }
        : {
            kind: "personne" as const,
            id: r.id,
            label: r.name ?? "",
            detail: r.known_for_department === "Directing" ? "Réalisation" : null,
            imagePath: r.profile_path ?? null,
          },
    )
    .filter((r: { label: string }) => r.label !== "")
    .slice(0, 12);

  return NextResponse.json({ results });
}
