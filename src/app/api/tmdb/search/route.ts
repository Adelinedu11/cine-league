import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * GET /api/tmdb/search?query=...
 * Proxifie la recherche de films TMDB (la clé reste côté serveur) et renvoie
 * une liste simplifiée : { id, title, year, posterPath }.
 * Réservé aux utilisateurs connectés pour éviter l'abus de la clé TMDB.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (!process.env.TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB non configuré" }, { status: 500 });
  }

  const res = await tmdbFetch("/search/movie", {
    query,
    language: "fr-FR",
    include_adult: "false",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Erreur TMDB" },
      { status: res.status === 401 ? 500 : 502 },
    );
  }

  const data = await res.json();
  const results = (data.results ?? []).map(
    (m: {
      id: number;
      title: string;
      release_date?: string;
      poster_path?: string | null;
    }) => ({
      id: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.slice(0, 4) : null,
      posterPath: m.poster_path ?? null,
    }),
  );

  return NextResponse.json({ results });
}
