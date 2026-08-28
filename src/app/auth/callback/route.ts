import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Destinations autorisées après échange du code. Liste blanche volontaire :
 * rediriger vers un `next` arbitraire venu de l'URL ouvrirait une faille
 * d'open redirect (un lien de phishing pourrait renvoyer ailleurs).
 */
const ALLOWED_NEXT = ["/toile", "/leagues", "/reset-password"] as const;

function safeNext(raw: string | null): string {
  return ALLOWED_NEXT.includes((raw ?? "") as (typeof ALLOWED_NEXT)[number])
    ? raw!
    : "/leagues";
}

/**
 * Callback d'authentification : échange le `code` reçu par e-mail contre une
 * session (flux PKCE). Sert au lien de réinitialisation de mot de passe
 * (`?next=/reset-password`) et, par défaut, à l'entrée dans l'app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

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

    console.error("Échec de exchangeCodeForSession :", error);
  }

  // Code manquant ou échange en erreur. Pour un lien de récupération périmé, on
  // renvoie vers la demande d'un nouveau lien plutôt que vers la connexion.
  const fallback =
    next === "/reset-password" ? "/mot-de-passe-oublie?expired=1" : "/login?error=auth";
  return NextResponse.redirect(`${origin}${fallback}`);
}
