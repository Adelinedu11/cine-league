import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMovieDetails } from "@/lib/tmdb";

/**
 * GET /api/tmdb/{movieId}/details
 * Renvoie les métadonnées de comparaison Ciné'Files : genres (noms),
 * release_date, original_language, pays de production principal.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ movieId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { movieId } = await params;
  if (!/^\d+$/.test(movieId)) {
    return NextResponse.json({ error: "movieId invalide" }, { status: 400 });
  }

  if (!process.env.TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB non configuré" }, { status: 500 });
  }

  const details = await fetchMovieDetails(movieId);
  return NextResponse.json(details);
}
