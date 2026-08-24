import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import HeaderMenu from "@/components/HeaderMenu";
import NotificationsBell from "@/components/NotificationsBell";
import { PopTicket } from "@/components/pop/PopShapes";
import { getLocale, t } from "@/lib/i18n";

export default async function LeaguesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();

  // Pseudo global (prioritaire sur l'e-mail) pour le lien profil du header.
  const { data: profile } = await supabase
    .from("profiles")
    .select("pseudo")
    .eq("user_id", user.id)
    .maybeSingle();
  const headerName = profile?.pseudo?.trim() || user.email || "?";

  // Alerte T-1h "à la demande" : calculée à chaque visite d'une page connectée
  // plutôt que par un cron (voir backlog point 13) — best effort, ne bloque
  // jamais le rendu de la page si ça échoue.
  await supabase.rpc("sync_round_deadline_notifications");
  const { data: notifications } = await supabase.rpc(
    "list_recent_notifications",
    { _limit: 20 },
  );

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  async function markAllNotificationsRead() {
    "use server";
    const supabase = await createClient();
    await supabase.rpc("mark_all_notifications_read");
    revalidatePath("/leagues", "layout");
  }

  return (
    <>
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-4">
          {/* Le logo mène aux règles du jeu : c'est la question la plus
              fréquente en cours de partie (« ça rapporte combien ? »). Le
              retour vers les leagues est repris dans le menu hamburger, sans
              quoi on n'aurait plus de chemin direct depuis une séance. */}
          <Link
            href="/regles"
            aria-label={`Ciné League — ${t(locale, "rules.title")}`}
            className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-[var(--color-cream)] px-3 py-1.5 transition-transform hover:-translate-y-0.5"
          >
            <PopTicket size={36} fill="var(--color-gold-bright)" />
            <span className="font-display text-2xl tracking-wide text-[var(--color-gold)]">
              Ciné League
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell
              notifications={notifications ?? []}
              locale={locale}
              markAllRead={markAllNotificationsRead}
            />
            <HeaderMenu locale={locale} name={headerName} signOut={signOut} />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
