import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMoviePlatforms,
} from "@/lib/tmdb";
import {
  nextRoundStatus,
  formatRoundDate,
  formatRoundDateWithHour,
  transitionThresholdIso,
} from "@/lib/rounds";
import { getLocale, t } from "@/lib/i18n";
import type { Json } from "@/lib/supabase/database.types";
import FilmSearch from "./FilmSearch";
import CineGuessBoard from "./CineGuessBoard";
import Avatar from "@/components/Avatar";
import RoundResults from "./RoundResults";
import TicketStub from "@/components/TicketStub";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import FilmPoster from "@/components/FilmPoster";
import SubmitButton from "@/components/SubmitButton";

export default async function RoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; roundId: string }>;
  searchParams: Promise<{ error?: string; voted?: string; mystery?: string }>;
}) {
  const { id, roundId } = await params;
  const {
    error: submissionError,
    voted,
    mystery: selectedMystery,
  } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  // Admin de la ligue : débloque les actions réservées (suppression du round).
  const { data: isAdmin } = await supabase.rpc("is_league_admin", {
    _league_id: id,
  });

  const { data: round } = await supabase
    .from("rounds")
    .select(
      "id, theme, status, submission_deadline, ceremony_at, league_id, game_mode",
    )
    .eq("id", roundId)
    .eq("league_id", id)
    .maybeSingle();

  if (!round) {
    notFound();
  }

  const locale = await getLocale();
  const nextStatus = nextRoundStatus(round.status, round.game_mode);

  // La transition n'est possible qu'une fois la date seuil dépassée…
  // …sauf pour un admin de la ligue, qui peut forcer la transition (même règle
  // que la Server Action advanceStatus).
  const thresholdIso = transitionThresholdIso(
    round.status,
    round.submission_deadline,
    round.ceremony_at,
  );
  const canAdvance =
    Boolean(isAdmin) ||
    (thresholdIso !== null && Date.now() > new Date(thresholdIso).getTime());
  const advanceBlockedMessage =
    round.status === "submission" && thresholdIso
      ? t(locale, "round.votesOpenOn", {
          date: formatRoundDateWithHour(thresholdIso, locale),
        })
      : round.status === "voting" && thresholdIso
        ? t(locale, "round.canCloseOn", {
            date: formatRoundDateWithHour(thresholdIso, locale),
          })
        : null;

  // Soumission de l'utilisateur courant pour ce round (jamais celles des autres).
  const { data: mySubmission } = await supabase
    .from("submissions")
    .select("film_title, comment")
    .eq("round_id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();

  // Mode Ciné'Files : film mystère de l'utilisateur courant (le sien seulement).
  let myCineTarget: { film_title: string | null } | null = null;
  if (round.game_mode === "cine_files") {
    const { data } = await supabase
      .from("cine_files_targets")
      .select("film_title")
      .eq("round_id", roundId)
      .eq("user_id", user.id)
      .maybeSingle();
    myCineTarget = data;
  }

  // --- Server Action : faire avancer le statut du round ---
  async function advanceStatus() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const { data: membership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      redirect("/leagues?error=forbidden");
    }

    // On relit le statut ET les dates côté serveur, plutôt que de faire
    // confiance à des valeurs venues du client.
    const { data: current } = await supabase
      .from("rounds")
      .select("status, submission_deadline, ceremony_at, game_mode")
      .eq("id", roundId)
      .eq("league_id", id)
      .maybeSingle();

    if (!current) {
      redirect(`/leagues/${id}/rounds/${roundId}`);
    }

    const next = nextRoundStatus(current.status, current.game_mode);
    if (!next) {
      redirect(`/leagues/${id}/rounds/${roundId}`);
    }

    // Un admin de la ligue peut forcer la transition sans attendre la date
    // seuil ; les membres normaux y restent soumis.
    const { data: isAdmin } = await supabase.rpc("is_league_admin", {
      _league_id: id,
    });

    // Garde-fou serveur : la date seuil doit être dépassée pour transiter.
    // Empêche de forcer la transition en appelant l'action directement.
    const thresholdIso = transitionThresholdIso(
      current.status,
      current.submission_deadline,
      current.ceremony_at,
    );
    if (
      !isAdmin &&
      thresholdIso &&
      Date.now() <= new Date(thresholdIso).getTime()
    ) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=too_early`);
    }

    await supabase
      .from("rounds")
      .update({ status: next })
      .eq("id", roundId)
      .eq("league_id", id);

    redirect(`/leagues/${id}/rounds/${roundId}`);
  }

  // --- Server Action : supprimer le round (admin uniquement) ---
  async function deleteRound() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // La policy RLS DELETE (admin de la ligue) est la garde effective : un
    // non-admin ne supprimerait aucune ligne. Le bouton n'est de toute façon
    // affiché qu'aux admins.
    await supabase
      .from("rounds")
      .delete()
      .eq("id", roundId)
      .eq("league_id", id);

    redirect(`/leagues/${id}`);
  }

  // --- Server Action : soumettre (ou remplacer) un film ---
  async function submitFilm(formData: FormData) {
    "use server";
    const filmTitle = String(formData.get("film_title") ?? "").trim();
    const tmdbIdRaw = String(formData.get("tmdb_id") ?? "");
    const platformsRaw = String(formData.get("platforms") ?? "[]");
    const comment = String(formData.get("comment") ?? "").trim() || null;
    const posterPath = String(formData.get("poster_path") ?? "").trim() || null;

    if (!filmTitle) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=submit`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // Doit être membre de la ligue.
    const { data: membership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      redirect("/leagues?error=forbidden");
    }

    // Le round doit être en phase de soumission (revérifié côté serveur).
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("status")
      .eq("id", roundId)
      .eq("league_id", id)
      .maybeSingle();
    if (!currentRound || currentRound.status !== "submission") {
      redirect(`/leagues/${id}/rounds/${roundId}?error=closed`);
    }

    let platforms: string[] = [];
    try {
      const parsed = JSON.parse(platformsRaw);
      if (Array.isArray(parsed)) {
        platforms = parsed.filter((p): p is string => typeof p === "string");
      }
    } catch {
      platforms = [];
    }

    const tmdbId = /^\d+$/.test(tmdbIdRaw) ? Number(tmdbIdRaw) : null;

    // Doublon exact : bloque si un AUTRE membre a déjà soumis ce film.
    if (tmdbId !== null) {
      const { data: alreadyTaken } = await supabase.rpc(
        "film_already_submitted",
        { _round_id: roundId, _tmdb_id: tmdbId },
      );
      if (alreadyTaken) {
        redirect(`/leagues/${id}/rounds/${roundId}?error=duplicate`);
      }
    }

    // Crédits re-récupérés côté serveur (source d'autorité, pas de confiance
    // dans les valeurs venues du client) pour alimenter les comparaisons futures.
    const { director, cast: castNames } = tmdbId
      ? await fetchMovieCredits(tmdbId)
      : { director: null, cast: [] };

    // Upsert : remplace la soumission existante de l'utilisateur (contrainte
    // unique round_id + user_id).
    const { error } = await supabase.from("submissions").upsert(
      {
        round_id: roundId,
        user_id: user.id,
        film_title: filmTitle,
        tmdb_id: tmdbId,
        platforms,
        director,
        cast_names: castNames,
        comment,
        poster_path: posterPath,
      },
      { onConflict: "round_id,user_id" },
    );

    if (error) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=submit`);
    }

    redirect(`/leagues/${id}/rounds/${roundId}`);
  }

  // --- Server Action : choisir/modifier son film mystère (mode Ciné'Files) ---
  async function submitCineFile(formData: FormData) {
    "use server";
    const filmTitle = String(formData.get("film_title") ?? "").trim();
    const tmdbIdRaw = String(formData.get("tmdb_id") ?? "");

    if (!filmTitle) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=submit`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // Round en mode Ciné'Files ET en phase de soumission (revérifié serveur).
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("status, game_mode")
      .eq("id", roundId)
      .eq("league_id", id)
      .maybeSingle();
    if (
      !currentRound ||
      currentRound.status !== "submission" ||
      currentRound.game_mode !== "cine_files"
    ) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=closed`);
    }

    const tmdbId = /^\d+$/.test(tmdbIdRaw) ? Number(tmdbIdRaw) : null;

    // Métadonnées re-récupérées côté serveur (source d'autorité) pour la
    // comparaison future : crédits, détails, plateformes.
    const [{ director, cast: castNames }, details, platforms] = tmdbId
      ? await Promise.all([
          fetchMovieCredits(tmdbId),
          fetchMovieDetails(tmdbId),
          fetchMoviePlatforms(tmdbId),
        ])
      : [
          { director: null, cast: [] as string[] },
          {
            genres: [] as string[],
            releaseDate: null,
            originalLanguage: null,
            country: null,
          },
          [] as string[],
        ];

    const { error } = await supabase.from("cine_files_targets").upsert(
      {
        round_id: roundId,
        user_id: user.id,
        tmdb_id: tmdbId,
        film_title: filmTitle,
        genres: details.genres,
        release_date: details.releaseDate,
        director,
        country: details.country,
        original_language: details.originalLanguage,
        cast_names: castNames,
        platforms,
      },
      { onConflict: "round_id,user_id" },
    );

    if (error) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=submit`);
    }

    redirect(`/leagues/${id}/rounds/${roundId}`);
  }

  // --- Server Action : proposer un film pour un mystère (mode Ciné'Files) ---
  async function submitGuess(targetId: string, formData: FormData) {
    "use server";
    const guessedTitle = String(formData.get("film_title") ?? "").trim();
    const tmdbIdRaw = String(formData.get("tmdb_id") ?? "");
    const tmdbId = /^\d+$/.test(tmdbIdRaw) ? Number(tmdbIdRaw) : null;

    if (!guessedTitle || tmdbId === null) {
      redirect(`/leagues/${id}/rounds/${roundId}?error=guess`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    // Métadonnées du film DEVINÉ, re-récupérées côté serveur.
    const [{ director, cast }, details, platforms] = await Promise.all([
      fetchMovieCredits(tmdbId),
      fetchMovieDetails(tmdbId),
      fetchMoviePlatforms(tmdbId),
    ]);

    // Le feedback est calculé ENTIÈREMENT en base (submit_cine_guess,
    // SECURITY DEFINER) : les métadonnées de la cible ne quittent jamais le
    // serveur SQL. On ne transmet que les métadonnées du film deviné.
    const { error } = await supabase.rpc("submit_cine_guess", {
      _target_id: targetId,
      _guessed_tmdb_id: tmdbId,
      _guessed_title: guessedTitle,
      _guess: {
        genres: details.genres,
        releaseDate: details.releaseDate,
        director,
        country: details.country,
        originalLanguage: details.originalLanguage,
        castNames: cast,
        platforms,
      },
    });

    if (error) {
      redirect(
        `/leagues/${id}/rounds/${roundId}?mystery=${targetId}&error=guess`,
      );
    }

    // On garde le mystère ouvert après la proposition.
    redirect(`/leagues/${id}/rounds/${roundId}?mystery=${targetId}`);
  }

  // Données du bulletin de vote (uniquement en phase voting).
  let categories: { id: string; name: string }[] = [];
  let ballot: {
    submission_id: string;
    film_title: string;
    platforms: string[] | null;
    poster_path: string | null;
  }[] = [];
  // Qui a voté (existence d'un vote uniquement, jamais le contenu).
  let voters: { display_name: string; has_voted: boolean }[] = [];
  if (round.status === "voting") {
    const [{ data: cats }, { data: ballotRows }, { data: voterRows }] =
      await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        // Films du round SAUF celui du votant, sans jamais exposer les user_id.
        supabase.rpc("round_ballot", { _round_id: roundId }),
        supabase.rpc("round_voters", { _round_id: roundId }),
      ]);
    categories = cats ?? [];
    ballot = ballotRows ?? [];
    voters = voterRows ?? [];
  }

  // Qui a soumis (existence d'une soumission uniquement, jamais le film).
  // Mode compétition seulement — round_submitters s'appuie sur `submissions`.
  let submitters: { display_name: string; has_submitted: boolean }[] = [];
  if (
    round.status === "submission" &&
    round.game_mode === "competition_officielle"
  ) {
    const { data: submitterRows } = await supabase.rpc("round_submitters", {
      _round_id: roundId,
    });
    submitters = submitterRows ?? [];
  }

  // Mode Ciné'Files (round non clos) : mystères à deviner + tentatives perso.
  let cineMysteries: {
    target_id: string;
    display_name: string;
    attempts: number;
    found: boolean;
  }[] = [];
  let myGuesses: {
    target_id: string | null;
    guessed_title: string | null;
    feedback: Json | null;
    guess_meta: Json | null;
    attempt_number: number | null;
    found: boolean | null;
  }[] = [];
  if (round.game_mode === "cine_files" && round.status !== "closed") {
    const [{ data: mysteryRows }, { data: guessRows }] = await Promise.all([
      supabase.rpc("round_cine_mysteries", { _round_id: roundId }),
      supabase
        .from("cine_files_guesses")
        .select(
          "target_id, guessed_title, feedback, guess_meta, attempt_number, found",
        )
        .eq("round_id", roundId)
        .order("attempt_number", { ascending: true }),
    ]);
    cineMysteries = mysteryRows ?? [];
    myGuesses = guessRows ?? [];
  }

  // Résultats (uniquement en phase closed) : gagnant(s) par catégorie + ex-aequo.
  let results: {
    categoryId: string;
    categoryName: string;
    tie: boolean;
    winners: {
      filmTitle: string;
      displayName: string | null;
      voteCount: number;
      submissionComment: string | null;
      voteComments: string[];
      posterPath: string | null;
    }[];
  }[] = [];
  if (round.status === "closed" && round.game_mode === "competition_officielle") {
    const [{ data: rawResults }, { data: details }, { data: voteComments }] =
      await Promise.all([
        supabase.rpc("get_round_results", { p_round_id: roundId }),
        supabase.rpc("round_submission_details", { p_round_id: roundId }),
        supabase.rpc("round_vote_comments", { _round_id: roundId }),
      ]);

    // submission_id -> { titre, nom du membre, commentaire de soumission }.
    const detailsMap = new Map(
      (details ?? []).map((d) => [
        d.submission_id,
        {
          filmTitle: d.film_title,
          displayName: d.display_name,
          submissionComment: d.comment,
          posterPath: d.poster_path,
        },
      ]),
    );

    // (category_id, submission_id) -> liste des commentaires de vote (anonymes).
    const voteCommentsMap = new Map<string, string[]>();
    for (const c of voteComments ?? []) {
      const key = `${c.category_id}:${c.submission_id}`;
      const list = voteCommentsMap.get(key) ?? [];
      list.push(c.comment);
      voteCommentsMap.set(key, list);
    }

    // Regroupe les décomptes par catégorie.
    const byCategory = new Map<
      string,
      {
        name: string;
        rows: { submission_id: string; vote_count: number }[];
      }
    >();
    for (const row of rawResults ?? []) {
      const entry = byCategory.get(row.category_id) ?? {
        name: row.category_name,
        rows: [],
      };
      entry.rows.push({
        submission_id: row.submission_id,
        vote_count: row.vote_count,
      });
      byCategory.set(row.category_id, entry);
    }

    // Gagnant = max de votes ; toutes les soumissions à ce max = ex-aequo.
    results = [...byCategory.entries()].map(([categoryId, { name, rows }]) => {
      const maxVotes = Math.max(...rows.map((r) => r.vote_count));
      const winners = rows
        .filter((r) => r.vote_count === maxVotes)
        .map((r) => ({
          filmTitle: detailsMap.get(r.submission_id)?.filmTitle ?? "Film inconnu",
          displayName: detailsMap.get(r.submission_id)?.displayName ?? null,
          voteCount: r.vote_count,
          submissionComment:
            detailsMap.get(r.submission_id)?.submissionComment ?? null,
          voteComments: voteCommentsMap.get(`${categoryId}:${r.submission_id}`) ?? [],
          posterPath: detailsMap.get(r.submission_id)?.posterPath ?? null,
        }));
      return { categoryId, categoryName: name, tie: winners.length > 1, winners };
    });
  }

  // Classement d'une séance Ciné'Files clôturée.
  let cineScores: { display_name: string; total_points: number }[] = [];
  if (round.status === "closed" && round.game_mode === "cine_files") {
    const { data } = await supabase.rpc("round_cine_files_scores", {
      _round_id: roundId,
    });
    cineScores = data ?? [];
  }

  // --- Server Action : enregistrer les votes (un choix par catégorie) ---
  async function submitVotes(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const { data: membership } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      redirect("/leagues?error=forbidden");
    }

    // Le round doit être en phase de vote (revérifié côté serveur).
    const { data: currentRound } = await supabase
      .from("rounds")
      .select("status")
      .eq("id", roundId)
      .eq("league_id", id)
      .maybeSingle();
    if (!currentRound || currentRound.status !== "voting") {
      redirect(`/leagues/${id}/rounds/${roundId}?error=vote`);
    }

    // Un vote par catégorie ; on relit la liste des catégories côté serveur.
    const { data: cats } = await supabase.from("categories").select("id");
    const rows = (cats ?? [])
      .map((cat) => ({
        categoryId: cat.id,
        submissionId: formData.get(`category-${cat.id}`),
        comment: String(formData.get(`comment-${cat.id}`) ?? "").trim() || null,
      }))
      .filter(
        (r): r is { categoryId: string; submissionId: string; comment: string | null } =>
          typeof r.submissionId === "string" && r.submissionId.length > 0,
      )
      .map((r) => ({
        round_id: roundId,
        category_id: r.categoryId,
        submission_id: r.submissionId,
        voter_id: user.id,
        comment: r.comment,
      }));

    if (rows.length > 0) {
      // Upsert via une RPC SECURITY DEFINER : un upsert PostgREST classique
      // exigerait un droit SELECT sur votes pour résoudre le ON CONFLICT, or on
      // n'accorde aucun SELECT (anonymat total). La fonction fait l'upsert en base.
      const { error } = await supabase.rpc("submit_votes", { _rows: rows });
      if (error) {
        redirect(`/leagues/${id}/rounds/${roundId}?error=vote`);
      }
    }

    redirect(`/leagues/${id}/rounds/${roundId}?voted=1`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <Link
        href={`/leagues/${id}`}
        className="text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
      >
        {t(locale, "round.back")}
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl uppercase tracking-wide text-[var(--color-gold)]">
            {round.theme}
          </h1>
          <span className="font-mono rounded-full bg-[var(--color-surface-alt)] px-2 py-1 text-xs text-[var(--color-muted)]">
            {round.game_mode === "cine_files" && round.status === "submission"
              ? t(locale, "roundStatus.cineOngoing")
              : t(locale, `roundStatus.${round.status}`)}
          </span>
          <span className="font-mono rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-gold)]">
            {t(
              locale,
              round.game_mode === "cine_files"
                ? "roundMode.cineFiles"
                : "roundMode.competition",
            )}
          </span>
        </div>
        <p className="font-mono mt-3 text-xs text-[var(--color-muted)]">
          {t(locale, "round.submissionsUntil", {
            date: formatRoundDate(round.submission_deadline, locale),
          })}
          {" · "}
          {t(locale, "round.ceremonyOn", {
            date: formatRoundDate(round.ceremony_at, locale),
          })}
        </p>
      </div>

      {/* Transition de statut (après la date seuil) et actions admin. */}
      {(nextStatus || isAdmin) && (
        <div className="flex flex-wrap items-start gap-3">
          {nextStatus && (
            <div className="flex flex-col gap-2">
              <form action={advanceStatus}>
                <SubmitButton
                  locale={locale}
                  disabled={!canAdvance}
                  className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
                >
                  {round.game_mode === "cine_files"
                    ? t(locale, "roundAction.cineClose")
                    : t(locale, `roundAction.${round.status}`)}
                </SubmitButton>
              </form>
              {!canAdvance && advanceBlockedMessage && (
                <p className="font-mono text-xs text-[var(--color-muted)]">
                  {advanceBlockedMessage}
                </p>
              )}
              {submissionError === "too_early" && (
                <p className="text-xs text-red-400">
                  {t(locale, "round.tooEarly")}
                </p>
              )}
            </div>
          )}
          {isAdmin && (
            <ConfirmSubmitButton
              action={deleteRound}
              locale={locale}
              confirmMessage={t(locale, "round.deleteConfirm")}
              className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              {t(locale, "round.deleteButton")}
            </ConfirmSubmitButton>
          )}
        </div>
      )}

      {/* Phase de soumission — mode Ciné'Files : film mystère. */}
      {round.status === "submission" && round.game_mode === "cine_files" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "cinefiles.submissionTitle")}
          </h2>
          <FilmSearch
            roundId={roundId}
            locale={locale}
            existingTitle={myCineTarget?.film_title ?? null}
            existingComment={null}
            error={submissionError ?? null}
            submitFilm={submitCineFile}
            submitLabel={t(locale, "cinefiles.chooseButton")}
            showComment={false}
          />
        </section>
      )}

      {/* Phase de soumission — mode Compétition officielle. */}
      {round.status === "submission" &&
        round.game_mode === "competition_officielle" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "round.submissionTitle")}
          </h2>
          <FilmSearch
            roundId={roundId}
            locale={locale}
            existingTitle={mySubmission?.film_title ?? null}
            existingComment={mySubmission?.comment ?? null}
            error={submissionError ?? null}
            submitFilm={submitFilm}
          />

          {/* Qui a soumis (présence uniquement, jamais le film soumis). */}
          {submitters.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <h3 className="font-display text-lg tracking-wide text-[var(--color-cream)]">
                {t(locale, "round.submittersTitle")}
              </h3>
              <ul className="flex flex-col gap-1">
                {submitters.map((submitter, i) => (
                  <li
                    key={`${submitter.display_name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--color-cream)]">
                      {submitter.display_name}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {submitter.has_submitted ? "✅" : "⏳"}{" "}
                      {t(
                        locale,
                        submitter.has_submitted
                          ? "round.submitterSubmitted"
                          : "round.voterPending",
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Mode Ciné'Files (round non clos) : deviner les films mystères. */}
      {round.game_mode === "cine_files" && round.status !== "closed" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "cinefiles.guessTitle")}
          </h2>
          <CineGuessBoard
            locale={locale}
            roundId={roundId}
            hasOwnTarget={!!myCineTarget}
            mysteries={cineMysteries}
            guesses={myGuesses}
            submitGuess={submitGuess}
            error={submissionError === "guess"}
            initialSelected={selectedMystery ?? null}
          />
        </section>
      )}

      {/* Phase de vote — mode Compétition officielle. */}
      {round.status === "voting" &&
        round.game_mode === "competition_officielle" && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "round.voteTitle")}
          </h2>

          {voted === "1" && (
            <p className="rounded-lg border border-[var(--color-teal)] bg-[var(--color-teal)]/15 px-3 py-2 text-sm text-[var(--color-cream)]">
              {t(locale, "round.votesSaved")}
            </p>
          )}
          {submissionError === "vote" && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {t(locale, "round.voteError")}
            </p>
          )}

          {categories.length === 0 || ballot.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              {t(locale, "round.nothingToVote")}
            </p>
          ) : (
            <form action={submitVotes} className="flex flex-col gap-4">
              {categories.map((category) => (
                <TicketStub
                  key={category.id}
                  stub="★"
                  stubClassName="text-[var(--color-muted)]"
                >
                  <fieldset className="flex flex-col gap-2">
                    <legend className="font-display mb-1 text-lg tracking-wide text-[var(--color-cream)]">
                      {category.name}
                    </legend>
                    {ballot.map((film) => (
                      <label
                        key={film.submission_id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-cream)] transition-colors hover:border-[var(--color-muted)] has-[:checked]:border-[var(--color-gold)] has-[:checked]:bg-[var(--color-gold)]/10 has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-[var(--color-gold)]"
                      >
                        <input
                          type="radio"
                          name={`category-${category.id}`}
                          value={film.submission_id}
                          className="sr-only"
                        />
                        <FilmPoster
                          posterPath={film.poster_path}
                          alt={film.film_title}
                          width={56}
                        />
                        <span className="flex flex-1 flex-wrap items-center gap-2">
                          <span>{film.film_title}</span>
                          {film.platforms && film.platforms.length > 0 && (
                            <span className="flex flex-wrap gap-1.5">
                              {film.platforms.map((p) => (
                                <span
                                  key={p}
                                  className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-cream)]"
                                >
                                  {p}
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                    <label
                      htmlFor={`comment-${category.id}`}
                      className="mt-1 text-xs text-[var(--color-muted)]"
                    >
                      {t(locale, "round.whyChoice")}
                    </label>
                    <textarea
                      id={`comment-${category.id}`}
                      name={`comment-${category.id}`}
                      rows={2}
                      placeholder={t(locale, "round.voteCommentPlaceholder")}
                      className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
                    />
                  </fieldset>
                </TicketStub>
              ))}

              <SubmitButton
                locale={locale}
                className="rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)]"
              >
                {t(locale, "round.voteButton")}
              </SubmitButton>
            </form>
          )}

          {/* Qui a voté (présence uniquement, jamais le contenu du vote). */}
          {voters.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <h3 className="font-display text-lg tracking-wide text-[var(--color-cream)]">
                {t(locale, "round.votersTitle")}
              </h3>
              <ul className="flex flex-col gap-1">
                {voters.map((voter, i) => (
                  <li
                    key={`${voter.display_name}-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--color-cream)]">
                      {voter.display_name}
                    </span>
                    <span className="font-mono text-xs text-[var(--color-muted)]">
                      {voter.has_voted ? "✅" : "⏳"}{" "}
                      {t(
                        locale,
                        voter.has_voted
                          ? "round.voterVoted"
                          : "round.voterPending",
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Séance terminée — Compétition : résultats par catégorie. */}
      {round.status === "closed" &&
        round.game_mode === "competition_officielle" && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
              {t(locale, "round.resultsTitle")}
            </h2>
            <RoundResults results={results} locale={locale} />
          </section>
        )}

      {/* Séance terminée — Ciné'Files : classement de la séance. */}
      {round.status === "closed" && round.game_mode === "cine_files" && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {t(locale, "cinefiles.roundScoresTitle")}
          </h2>
          {cineScores.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              {t(locale, "league.cineStandingsEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {cineScores.map((entry, i) => (
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
                    {t(locale, "league.points", { count: entry.total_points })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
