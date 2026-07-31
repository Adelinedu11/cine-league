import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/rounds/{roundId}/overlap
 * Corps : { director: string | null, cast: string[] }
 * Renvoie les personnes en commun avec les soumissions des AUTRES membres :
 * { overlaps: [{ person, filmTitle }] }.
 * La comparaison est faite en base (fonction SECURITY DEFINER) pour ne jamais
 * exposer les soumissions des autres ni leurs auteurs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { roundId } = await params;

  const body = await request.json().catch(() => ({}));
  const director =
    typeof body?.director === "string" ? body.director : null;
  const cast: string[] = Array.isArray(body?.cast)
    ? body.cast.filter((x: unknown): x is string => typeof x === "string")
    : [];

  const people = [...(director ? [director] : []), ...cast];
  if (people.length === 0) {
    return NextResponse.json({ overlaps: [] });
  }

  const { data, error } = await supabase.rpc("round_credit_overlaps", {
    _round_id: roundId,
    _people: people,
  });

  if (error) {
    return NextResponse.json({ overlaps: [] });
  }

  const overlaps = (data ?? []).map((row) => ({
    person: row.person,
    filmTitle: row.film_title,
  }));

  return NextResponse.json({ overlaps });
}
