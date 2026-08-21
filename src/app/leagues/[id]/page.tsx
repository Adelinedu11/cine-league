import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Ticket, Trophy, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatRoundDate, transitionThresholdIso } from "@/lib/rounds";
import { getLocale, t } from "@/lib/i18n";
import TicketStub from "@/components/TicketStub";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import RenameLeagueForm from "@/components/RenameLeagueForm";
import SubmitButton from "@/components/SubmitButton";
import RoundModeDateFields from "@/components/RoundModeDateFields";
import Avatar from "@/components/Avatar";
import LeagueTabs from "@/components/LeagueTabs";
import CineLeagueScores from "@/components/CineLeagueScores";
import RoundCountdown from "@/components/RoundCountdown";

// Couleur du stub (languette) selon le statut du round — un code couleur
// distinct par statut (direction v2 / docs/design-spec-v2.md), pour ne plus
// confondre visuellement "en cours" et "terminé".
const ROUND_STATUS_STUB_CLASS: Record<string, string> = {
  submission: "text-[var(--color-gold-bright)]",
  voting: "text-[var(--color-coral)]",
  closed: "text-[var(--color-sage-ink)]",
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

  // Séparation "En cours" / "Archives" : bascule automatique dès que le
  // round passe en `closed`, aucune action admin requise. Pas de colonne
  // `closed_at` dédiée : `ceremony_at` sert de date de clôture pour le tri
  // décroissant des archives (c'est la date d'échéance du round dans les
  // deux modes de jeu).
  const activeRounds = (rounds ?? []).filter((r) => r.status !== "closed");
  const archivedRounds = (rounds ?? [])
    .filter((r) => r.status === "closed")
    .sort(
      (a, b) =>
        new Date(b.ceremony_at).getTime() - new Date(a.ceremony_at).getTime(),
    );

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
    supabase.rpc("league_cine_files_detail", { _league_id: id }),
  ]);

  // Rendu factorisé de la liste des séances (utilisé pour "En cours" et
  // "Archives") : mêmes tickets, seule la source de données change.
  function renderRoundsList(list: typeof activeRounds, emptyKey: string) {
    return (
      <section className="flex flex-col gap-3">
        {list.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            {t(locale, emptyKey)}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((round) => (
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
                      {round.game_mode === "cine_files" ? (
                        <Search size={11} strokeWidth={1.8} />
                      ) : (
                        <Trophy size={11} strokeWidth={1.8} />
                      )}
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
                        date: formatRoundDate(round.ceremony_at, locale),
                      })}
                    </p>
                    {round.status !== "closed" && (
                      <RoundCountdown
                        targetIso={
                          transitionThresholdIso(
                            round.status,
                            round.submission_deadline,
                            round.ceremony_at,
                          ) ?? round.ceremony_at
                        }
                        locale={locale}
                      />
                    )}
                  </TicketStub>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  // --- Server Action : créer un round ---
  // Système de durée ("tic-tac-boom", backlog point 13) : l'auteur choisit
  // une durée depuis le lancement plutôt qu'une date précise ; le serveur
  // calcule l'échéance exacte ici, à l'instant de la création — plus robuste
  // qu'une date fixe comparée par un cron (qui n'existe pas dans ce projet).
  async function createRound(formData: FormData) {
    "use server";
    const theme = String(formData.get("theme") ?? "").trim();
    const gameModeRaw = String(formData.get("game_mode") ?? "");
    const gameMode =
      gameModeRaw === "cine_files" ? "cine_files" : "competition_officielle";

    const launchedAt = Date.now();
    let submissionDeadline: string;
    let ceremonyAt: string;

    if (gameMode === "cine_files") {
      // Ciné'Files : une seule durée (clôture) → copiée dans les deux colonnes.
      const closeMinutes = Number(formData.get("close_duration_minutes"));
      if (!theme || !Number.isFinite(closeMinutes) || closeMinutes <= 0) {
        redirect(`/leagues/${id}?error=round`);
      }
      submissionDeadline = new Date(
        launchedAt + closeMinutes * 60_000,
      ).toISOString();
      ceremonyAt = submissionDeadline;
    } else {
      // Compétition : durée de soumission, puis durée de vote enchaînée
      // après la clôture des soumissions.
      const submissionMinutes = Number(
        formData.get("submission_duration_minutes"),
      );
      const votingMinutes = Number(formData.get("voting_duration_minutes"));
      if (
        !theme ||
        !Number.isFinite(submissionMinutes) ||
        submissionMinutes <= 0 ||
        !Number.isFinite(votingMinutes) ||
        votingMinutes <= 0
      ) {
        redirect(`/leagues/${id}?error=round`);
      }
      submissionDeadline = new Date(
        launchedAt + submissionMinutes * 60_000,
      ).toISOString();
      ceremonyAt = new Date(
        launchedAt + (submissionMinutes + votingMinutes) * 60_000,
      ).toISOString();
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
        submission_deadline: submissionDeadline,
        ceremony_at: ceremonyAt,
      })
      .select("id")
      .single();

    if (error || !round) {
      redirect(`/leagues/${id}?error=round`);
    }

    // Notification in-app "league lancée" (1ère séance) ou "activité"
    // (séances suivantes) — best effort, ne bloque jamais la création.
    await supabase.rpc("notify_round_created", { _round_id: round.id });

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
                {/* Séances : "En cours" / "Archives" (bascule auto sur closed) */}
                <LeagueTabs
                  tabs={[
                    {
                      id: "active",
                      label: t(locale, "league.tabRoundsActive"),
                      content: renderRoundsList(
                        activeRounds,
                        "league.roundsEmpty",
                      ),
                    },
                    {
                      id: "archived",
                      label: t(locale, "league.tabRoundsArchived"),
                      content: renderRoundsList(
                        archivedRounds,
                        "league.archivesEmpty",
                      ),
                    },
                  ]}
                />

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

                {/* Classement Ciné'Files (détaillé, dépliable) */}
                <section className="flex flex-col gap-3">
                  <h2 className="flex items-center gap-1.5 text-lg font-semibold">
                    <Search size={16} strokeWidth={1.8} />
                    {t(locale, "league.cineStandingsTitle")}
                  </h2>
                  <CineLeagueScores
                    players={cineHistory ?? []}
                    locale={locale}
                  />
                </section>
              </>
            ),
          },
        ]}
      />
    </main>
  );
}
