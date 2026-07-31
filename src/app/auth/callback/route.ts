import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback d'authentification : échange le `code` reçu par e-mail contre une
 * session (flux PKCE), puis redirige vers la page d'accueil.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = "/accueil";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // En prod derrière un proxy/load-balancer, l'hôte réel est dans
      // x-forwarded-host ; en local on utilise directement l'origine.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code manquant ou échange en erreur : retour à la page de connexion.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
