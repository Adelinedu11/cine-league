import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase à utiliser côté navigateur (Client Components).
 * Les variables NEXT_PUBLIC_* sont injectées au build/au démarrage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
