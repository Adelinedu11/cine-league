import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatRoundDate } from "@/lib/rounds";
import { getLocale, t } from "@/lib/i18n";
import TicketStub from "@/components/TicketStub";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import RenameLeagueForm from "@/components/RenameLeagueForm";
import SubmitButton from "@/components/SubmitButton";
import RoundModeDateFields from "@/components/RoundModeDateFields";
import Avatar from "@/components/Avatar";
import LeagueTabs from "@/components/LeagueTabs";

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
    .select("id, theme, status, submission_deadline, ceremony_at, game_mode")
    .eq("league_id", id)
    .order("ceremony_at", { ascending: true });

  // Admin, membres, classement compétition, classement Ciné'Files.
  const [
    { data: isAdmin },
    { data: members },
    { data: winHistory },
    { data: cineHistory },
  ] = await Promise.all([
    supabase.rpc("is_league_admin", { _league_id: id }),
    supabase.rpc("league_members_list", { _league_id: id }),
    supabase.rpc("league_win_history", { _league_id: id }),
    supabase.rpc("league_cine_files_history", { _league_id: id }),
  ]);

  // --- Server Action : créer un round ---
  async function createRound(formData: FormData) {
    "use server";
    const theme = String(formData.get("theme") ?? "").trim();
    const submissionDeadline = String(formData.get("submission_deadline") ?? "");
    const gameModeRaw = String(formData.get("game_mode") ?? "");
    const gameMode =
      gameModeRaw === "cine_files" ? "cine_files" : "competition_officielle";
    // Ciné'Files : une seule date (clôture) → copiée dans les deux colonnes.
    const ceremonyAt =
      gameMode === "cine_files"
        ? submissionDeadline
        : String(formData.get("ceremony_at") ?? "");

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
        game_mode: gameMode,
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

  // --- Server Action : renommer la ligue (admin uniquement) ---
  // La policy RLS UPDATE (is_league_admin) est la garde effective : un
  // non-admin ne mettrait à jour aucune ligne.
  async function renameLeague(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "").trim();
    if (!name) {
      redirect(`/leagues/${id}`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    await supabase.from("leagues").update({ name }).eq("id", id);
    redirect(`/leagues/${id}`);
  }

  // --- Server Action : supprimer la ligue (admin uniquement) ---
  // Cascade sur les tables liées (ON DELETE CASCADE). Garde effective : la
  // policy RLS DELETE (is_league_admin).
  async function deleteLeague() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    await supabase.from("leagues").delete().eq("id", id);
    redirect("/leagues");
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
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-5xl uppercase tracking-wide text-[var(--color-gold)]">
            {league.name}
          </h1>
          {isAdmin && (
            <RenameLeagueForm
              action={renameLeague}
              currentName={league.name}
              locale={locale}
            />
          )}
        </div>
        <p className="max-w-md text-[var(--color-muted)]">
          {t(locale, "league.pitch")}
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
          {t(locale, "league.inviteCode")}
          <code className="font-mono rounded bg-[var(--color-gold)] px-2 py-1 text-xs font-medium text-[var(--color-bg)]">
            {league.invite_code}
          </code>
        </p>
        {isAdmin && (
          <ConfirmSubmitButton
            action={deleteLeague}
            locale={locale}
            confirmMessage={t(locale, "league.deleteLeagueConfirm")}
            className="w-fit rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            {t(locale, "league.deleteLeagueButton")}
          </ConfirmSubmitButton>
        )}
      </div>

      <LeagueTabs
        tabs={[
          {
            id: "rounds",
            label: t(locale, "league.tabRounds"),
            content: (
              <>
                {/* Liste des séances */}
                <section className="flex flex-col gap-3">
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
                              <span className="mb-1 flex w-fit items-center gap-1 rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--color-muted)]">
                                {round.game_mode === "cine_files" ? "🔎" : "🏆"}{" "}
                                {t(
                                  locale,
                                  round.game_mode === "cine_files"
                                    ? "roundMode.cineFiles"
                                    : "roundMode.competition",
                                )}
                              </span>
                              <span className="block font-medium uppercase text-[var(--color-cream)]">
                                {round.theme}
                              </span>
                              <p className="font-mono mt-2 text-xs text-[var(--color-muted)]">
                                {t(locale, "round.submissionsUntil", {
                                  date: formatRoundDate(
                                    round.submission_deadline,
                                    locale,
                                  ),
                                })}
                              </p>
                              <p className="font-mono mt-1 text-xs text-[var(--color-muted)]">
                                {t(locale, "round.ceremonyOn", {
                                  date: formatRoundDate(
                                    round.ceremony_at,
                                    locale,
                                  ),
                                })}
                              </p>
                            </TicketStub>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Créer une séance */}
                <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                  <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
                    {t(locale, "league.createRoundTitle")}
                  </h2>
                  <form
                    action={createRound}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <RoundModeDateFields locale={locale} />

                    {pageError === "round" && (
                      <p className="text-sm text-red-400">
                        {t(locale, "league.createRoundError")}
                      </p>
                    )}

                    <SubmitButton
                      locale={locale}
                      className="mt-1 w-full rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
                    >
                      {t(locale, "league.createRoundButton")}
                    </SubmitButton>
                  </form>
                </section>
              </>
            ),
          },
          {
            id: "members",
            label: t(locale, "league.tabMembers"),
            content: (
              <section className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2">
                  {(members ?? []).map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={member.display_name} size={28} />
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
                          locale={locale}
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
            ),
          },
          {
            id: "standings",
            label: t(locale, "league.tabStandings"),
            content: (
              <>
                {/* Classement compétition (victoires par catégorie) */}
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
                            <Avatar name={entry.display_name} size={28} />
                            <span className="text-[var(--color-cream)]">
                              {entry.display_name}
                            </span>
                          </span>
                          <span className="font-mono text-sm text-[var(--color-muted)]">
                            {t(
                              locale,
                              entry.wins_count > 1
                                ? "league.wins"
                                : "league.win",
                              { count: entry.wins_count },
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Classement Ciné'Files */}
                <section className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">
                    🔎 {t(locale, "league.cineStandingsTitle")}
                  </h2>
                  {!cineHistory || cineHistory.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)]">
                      {t(locale, "league.cineStandingsEmpty")}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {cineHistory.map((entry, i) => (
                        <li
                          key={`${entry.display_name}-${i}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                        >
                          <span className="flex items-center gap-3">
                            <span className="font-display w-6 text-center text-xl text-[var(--color-gold)]">
                              {i + 1}
                            </span>
                            <Avatar name={entry.display_name} size={28} />
                            <span className="text-[var(--color-cream)]">
                              {entry.display_name}
                            </span>
                          </span>
                          <span className="font-mono text-sm text-[var(--color-muted)]">
                            {t(locale, "league.points", {
                              count: entry.total_points,
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            ),
          },
        ]}
      />
    </main>
  );
}
