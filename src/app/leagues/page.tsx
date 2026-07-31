import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getLocale, t } from "@/lib/i18n";
import TicketStub from "@/components/TicketStub";

export default async function LeaguesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const { error: joinError } = await searchParams;

  // Ligues dont l'utilisateur est déjà membre.
  const { data: memberships } = await supabase
    .from("league_members")
    .select("league:leagues(id, name, invite_code)")
    .eq("user_id", user.id);

  const leagues = (memberships ?? [])
    .map((m) => m.league)
    .filter((league) => league !== null);

  // --- Server Action : créer une ligue ---
  async function createLeague(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      redirect("/leagues?error=name");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const displayName = user.email ?? user.id;

    // Insère la ligue + le membre de façon atomique côté base (SECURITY DEFINER),
    // ce qui évite aussi la récursion RLS. Retourne l'id de la ligue créée.
    const { data: leagueId, error } = await supabase.rpc("create_league", {
      _name: name,
      _display_name: displayName,
    });

    if (error || !leagueId) {
      redirect("/leagues?error=create");
    }

    redirect(`/leagues/${leagueId}`);
  }

  // --- Server Action : rejoindre une ligue ---
  async function joinLeague(formData: FormData) {
    "use server";
    const inviteCode = String(formData.get("invite_code") ?? "").trim();
    if (!inviteCode) {
      redirect("/leagues?error=invalid");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (!league) {
      redirect("/leagues?error=invalid");
    }

    // Déjà membre ? On ne réinsère pas, on redirige directement vers la ligue.
    const { data: existingMember } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("league_id", league.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      redirect(`/leagues/${league.id}`);
    }

    const { error: memberError } = await supabase
      .from("league_members")
      .insert({
        league_id: league.id,
        user_id: user.id,
        display_name: user.email ?? user.id,
      });

    if (memberError) {
      redirect("/leagues?error=join");
    }

    redirect(`/leagues/${league.id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-10 p-6">
      <div className="flex flex-col gap-3">
        <span className="font-mono flex w-fit items-center gap-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] tracking-wide text-[var(--color-muted)]">
          <Ticket size={13} strokeWidth={1.5} /> {t(locale, "leagues.badge")}
        </span>
        <h1 className="font-display text-5xl tracking-wide text-[var(--color-gold)]">
          {t(locale, "leagues.title")}
        </h1>
        <p className="max-w-md text-[var(--color-muted)]">
          {t(locale, "leagues.subtitle")}
        </p>
      </div>

      {/* Liste des ligues */}
      <section className="flex flex-col gap-3">
        {leagues.length === 0 ? (
          <p className="text-sm text-[var(--color-cream)]/60">
            {t(locale, "leagues.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {leagues.map((league) => (
              <li key={league.id}>
                <Link
                  href={`/leagues/${league.id}`}
                  className="block transition-opacity hover:opacity-90"
                >
                  <TicketStub stub={league.invite_code}>
                    <span className="font-medium uppercase text-[var(--color-cream)]">
                      {league.name}
                    </span>
                  </TicketStub>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Créer une ligue */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
          {t(locale, "leagues.createTitle")}
        </h2>
        <form action={createLeague} className="mt-4 flex flex-col gap-3">
          <label
            htmlFor="name"
            className="text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "leagues.nameLabel")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t(locale, "leagues.namePlaceholder")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />
          {joinError === "create" && (
            <p className="text-sm text-red-400">
              {t(locale, "leagues.createError")}
            </p>
          )}
          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
          >
            {t(locale, "leagues.createButton")}
          </button>
        </form>
      </section>

      {/* Rejoindre une ligue */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
          {t(locale, "leagues.joinTitle")}
        </h2>
        <form action={joinLeague} className="mt-4 flex flex-col gap-3">
          <label
            htmlFor="invite_code"
            className="text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "leagues.inviteLabel")}
          </label>
          <input
            id="invite_code"
            name="invite_code"
            type="text"
            required
            placeholder={t(locale, "leagues.invitePlaceholder")}
            className="font-mono w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />
          {joinError === "invalid" && (
            <p className="text-sm text-red-400">
              {t(locale, "leagues.invalidCode")}
            </p>
          )}
          {joinError === "join" && (
            <p className="text-sm text-red-400">
              {t(locale, "leagues.joinError")}
            </p>
          )}
          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
          >
            {t(locale, "leagues.joinButton")}
          </button>
        </form>
      </section>
    </main>
  );
}
