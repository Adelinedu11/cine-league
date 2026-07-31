import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * GET /api/tmdb/{movieId}/providers
 * Renvoie les plateformes de streaming disponibles en France pour ce film.
 * On privilégie `flatrate` (abonnement) ; à défaut on retombe sur les offres
 * en location/achat pour ne pas renvoyer une liste vide quand c'est possible.
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

  const res = await tmdbFetch(`/movie/${movieId}/watch/providers`);

  if (!res.ok) {
    return NextResponse.json(
      { error: "Erreur TMDB" },
      { status: res.status === 401 ? 500 : 502 },
    );
  }

  const data = await res.json();
  const fr = data.results?.FR;

  type Provider = { provider_name: string };
  const offers: Provider[] =
    fr?.flatrate ?? fr?.free ?? fr?.ads ?? fr?.rent ?? fr?.buy ?? [];

  const platforms = offers.map((p) => p.provider_name);

  return NextResponse.json({ platforms });
}
