import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Client Supabase à privilèges élevés — CÔTÉ SERVEUR UNIQUEMENT.
 *
 * La clé `service_role` contourne toute la RLS. Elle est indispensable pour un
 * seul usage dans l'app : remplir le cache des génériques de La Toile
 * (`toile_films` / `toile_film_people`), dont les tables sont volontairement
 * fermées à l'écriture par le joueur. Si le navigateur pouvait y insérer un
 * générique, il suffirait d'inventer un film contenant toutes les
 * personnalités du monde pour retrouver la cible en un coup.
 *
 * ⚠️ Ne jamais importer ce module depuis un Client Component, et ne jamais
 * exposer la clé dans une variable NEXT_PUBLIC_*. Le garde-fou ci-dessous fait
 * échouer bruyamment toute tentative d'exécution dans un navigateur, plutôt que
 * de laisser fuir la clé en silence.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() ne doit jamais être appelé côté navigateur.",
    );
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
