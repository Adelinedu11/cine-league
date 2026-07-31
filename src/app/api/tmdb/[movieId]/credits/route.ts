import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchMovieCredits } from "@/lib/tmdb";

/**
 * GET /api/tmdb/{movieId}/credits
 * Renvoie le réalisateur et les 5 premiers acteurs principaux :
 * { director: string | null, cast: string[] }.
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

  const { director, cast } = await fetchMovieCredits(movieId);

  return NextResponse.json({ director, cast });
}
