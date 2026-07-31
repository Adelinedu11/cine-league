import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";

/**
 * Page d'accueil. Point d'arrivée après connexion (le callback d'auth redirige
 * ici). Un visiteur non connecté est renvoyé vers /login.
 */
export default async function AccueilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 p-6 text-center">
      <span className="font-mono flex items-center gap-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] tracking-wide text-[var(--color-muted)]">
        <Ticket size={13} strokeWidth={1.5} /> {t(locale, "home.badge")}
      </span>

      <div className="flex items-center gap-3">
        <Ticket
          size={40}
          strokeWidth={1.5}
          className="text-[var(--color-gold)]"
        />
        <h1 className="font-display text-6xl tracking-wide text-[var(--color-gold)]">
          Ciné League
        </h1>
      </div>

      <p className="max-w-md text-[var(--color-muted)]">{t(locale, "home.pitch")}</p>

      <Link
        href="/leagues"
        className="font-display rounded-lg bg-[var(--color-gold)] px-6 py-3 text-xl tracking-wide text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
      >
        {t(locale, "home.cta")}
      </Link>

      <p className="font-mono text-xs text-[var(--color-muted)]">
        {t(locale, "home.loggedInAs", { email: user.email ?? "" })}
      </p>
    </main>
  );
}
