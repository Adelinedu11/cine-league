import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatRoundDate } from "@/lib/rounds";
import { getLocale, t } from "@/lib/i18n";
import TicketStub from "@/components/TicketStub";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";

// Couleur du stub (languette) selon le statut du round.
const ROUND_STATUS_STUB_CLASS: Record<string, string> = {
  submission: "text-[var(--color-gold)]",
  voting: "text-[var(--color-gold)]",
  closed: "text-[var(--color-gold)]",
};

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: pageError } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!league) {
    notFound();
  }

  // Accès réservé aux membres de la ligue.
  const { data: membership } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    redirect("/leagues?error=forbidden");
  }

  const locale = await getLocale();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("id, theme, status, submission_deadline, ceremony_at")
    .eq("league_id", id)
    .order("ceremony_at", { ascending: true });

  // Admin de la ligue, liste des membres et classement des victoires.
  const [{ data: isAdmin }, { data: members }, { data: winHistory }] =
    await Promise.all([
      supabase.rpc("is_league_admin", { _league_id: id }),
      supabase.rpc("league_members_list", { _league_id: id }),
      supabase.rpc("league_win_history", { _league_id: id }),
    ]);

  // --- Server Action : créer un round ---
  async function createRound(formData: FormData) {
    "use server";
    const theme = String(formData.get("theme") ?? "").trim();
    const submissionDeadline = String(formData.get("submission_deadline") ?? "");
    const ceremonyAt = String(formData.get("ceremony_at") ?? "");

    if (!theme || !submissionDeadline || !ceremonyAt) {
      redirect(`/leagues/${id}?error=round`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // Vérifie l'appartenance avant d'autoriser la création.
    const { data: membership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      redirect("/leagues?error=forbidden");
    }

    const { data: round, error } = await supabase
      .from("rounds")
      .insert({
        league_id: id,
        theme,
        status: "submission",
        submission_deadline: new Date(submissionDeadline).toISOString(),
        ceremony_at: new Date(ceremonyAt).toISOString(),
      })
      .select("id")
      .single();

    if (error || !round) {
      redirect(`/leagues/${id}?error=round`);
    }

    redirect(`/leagues/${id}/rounds/${round.id}`);
  }

  // --- Server Action : exclure un membre (admin uniquement) ---
  // La fonction remove_league_member rejoue elle-même les garde-fous (admin de
  // la ligue, pas d'auto-exclusion), indépendamment de la RLS.
  async function removeMember(memberId: string) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    await supabase.rpc("remove_league_member", { _member_id: memberId });
    redirect(`/leagues/${id}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 p-6">
      <Link
        href="/leagues"
        className="text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
      >
        {t(locale, "league.back")}
      </Link>

      <div className="flex flex-col gap-3">
        <span className="font-mono flex w-fit items-center gap-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[11px] tracking-wide text-[var(--color-muted)]">
          <Ticket size={13} strokeWidth={1.5} /> {t(locale, "league.badge")}
        </span>
        <h1 className="font-display text-5xl uppercase tracking-wide text-[var(--color-gold)]">
          {league.name}
        </h1>
        <p className="max-w-md text-[var(--color-muted)]">
          {t(locale, "league.pitch")}
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          {t(locale, "league.inviteCode")}
          <code className="font-mono rounded bg-[var(--color-gold)] px-2 py-1 text-xs font-medium text-[var(--color-bg)]">
            {league.invite_code}
          </code>
        </p>
      </div>

      {/* Liste des rounds */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t(locale, "league.roundsTitle")}</h2>
        {!rounds || rounds.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t(locale, "league.roundsEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rounds.map((round) => (
              <li key={round.id}>
                <Link
                  href={`/leagues/${id}/rounds/${round.id}`}
                  className="block transition-opacity hover:opacity-90"
                >
                  <TicketStub
                    stub={t(locale, `roundStatus.${round.status}`)}
                    stubClassName={
                      ROUND_STATUS_STUB_CLASS[round.status] ??
                      "text-[var(--color-gold)]"
                    }
                  >
                    <span className="block font-medium uppercase text-[var(--color-cream)]">
                      {round.theme}
                    </span>
                    <p className="font-mono mt-2 text-xs text-[var(--color-muted)]">
                      {t(locale, "round.submissionsUntil", {
                        date: formatRoundDate(round.submission_deadline, locale),
                      })}
                    </p>
                    <p className="font-mono mt-1 text-xs text-[var(--color-muted)]">
                      {t(locale, "round.ceremonyOn", {
                        date: formatRoundDate(round.ceremony_at, locale),
                      })}
                    </p>
                  </TicketStub>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Classement (historique des victoires) */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t(locale, "league.standingsTitle")}
        </h2>
        {!winHistory || winHistory.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t(locale, "league.standingsEmpty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {winHistory.map((entry, i) => (
              <li
                key={`${entry.display_name}-${i}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="font-display w-6 text-center text-xl text-[var(--color-gold)]">
                    {i + 1}
                  </span>
                  <span className="text-[var(--color-cream)]">
                    {entry.display_name}
                  </span>
                </span>
                <span className="font-mono text-sm text-[var(--color-muted)]">
                  {t(locale, entry.wins_count > 1 ? "league.wins" : "league.win", {
                    count: entry.wins_count,
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Membres */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {t(locale, "league.membersTitle")}
        </h2>
        <ul className="flex flex-col gap-2">
          {(members ?? []).map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-[var(--color-cream)]">
                  {member.display_name}
                </span>
                {member.role === "admin" && (
                  <span className="font-mono rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-gold)]">
                    {t(locale, "league.adminBadge")}
                  </span>
                )}
              </span>
              {isAdmin && member.user_id !== user.id && (
                <ConfirmSubmitButton
                  action={removeMember.bind(null, member.id)}
                  confirmMessage={t(locale, "league.excludeConfirm", {
                    name: member.display_name,
                  })}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  {t(locale, "league.exclude")}
                </ConfirmSubmitButton>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Créer un round */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
          {t(locale, "league.createRoundTitle")}
        </h2>
        <form action={createRound} className="mt-4 flex flex-col gap-3">
          <label
            htmlFor="theme"
            className="text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "league.themeLabel")}
          </label>
          <input
            id="theme"
            name="theme"
            type="text"
            required
            placeholder={t(locale, "league.themePlaceholder")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
          />

          <label
            htmlFor="submission_deadline"
            className="text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "league.deadlineLabel")}
          </label>
          <input
            id="submission_deadline"
            name="submission_deadline"
            type="datetime-local"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]"
          />

          <label
            htmlFor="ceremony_at"
            className="text-sm font-medium text-[var(--color-cream)]"
          >
            {t(locale, "league.ceremonyLabel")}
          </label>
          <input
            id="ceremony_at"
            name="ceremony_at"
            type="datetime-local"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]"
          />

          {pageError === "round" && (
            <p className="text-sm text-red-400">
              {t(locale, "league.createRoundError")}
            </p>
          )}

          <button
            type="submit"
            className="mt-1 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
          >
            {t(locale, "league.createRoundButton")}
          </button>
        </form>
      </section>
    </main>
  );
}
