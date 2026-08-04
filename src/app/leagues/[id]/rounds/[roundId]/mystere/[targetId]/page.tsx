import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMoviePlatforms,
} from "@/lib/tmdb";
import { getLocale, t } from "@/lib/i18n";
import {
  computeConfirmedHints,
  type CineFeedback,
  type CineMeta,
} from "@/lib/cinefiles";
import { confirmedHintLines } from "@/lib/cinefiles-hints";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import CineFeedbackChips from "@/components/CineFeedbackChips";
import CineGuessForm from "../../CineGuessForm";

const MAX_ATTEMPTS = 20;
const BONUS_FROM = 9; // ≥ 9 tentatives faites → dès la 10e

export default async function MysteryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; roundId: string; targetId: string }>;
  searchParams: Promise<{ error?: string; nohint?: string }>;
}) {
  const { id, roundId, targetId } = await params;
  const { error: pageError, nohint } = await searchParams;
  const base = `/leagues/${id}/rounds/${roundId}/mystere/${targetId}`;

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

  const locale = await getLocale();

  const { data: round } = await supabase
    .from("rounds")
    .select("id, theme, status, game_mode, league_id")
    .eq("id", roundId)
    .eq("league_id", id)
    .maybeSingle();
  if (!round) {
    notFound();
  }
  // La devinette n'a lieu qu'en Ciné'Files, round non clos.
  if (round.game_mode !== "cine_files" || round.status === "closed") {
    redirect(`/leagues/${id}/rounds/${roundId}`);
  }

  // Le mystère (anonymisation levée : nom du joueur) via la RPC dédiée.
  const { data: mysteries } = await supabase.rpc("round_cine_mysteries", {
    _round_id: roundId,
  });
  const mine = (mysteries ?? []).find((m) => m.target_id === targetId);
  if (!mine) {
    // Non éligible (film mystère perso non soumis, cible = la sienne, etc.).
    redirect(`/leagues/${id}/rounds/${roundId}`);
  }

  const [{ data: guessRows }, { data: hintRows }] = await Promise.all([
    supabase
      .from("cine_files_guesses")
      .select("guessed_title, feedback, guess_meta, attempt_number, found")
      .eq("round_id", roundId)
      .eq("target_id", targetId)
      .order("attempt_number", { ascending: true }),
    supabase
      .from("cine_files_hints")
      .select("actor_name, revealed_at")
      .eq("target_id", targetId)
      .order("revealed_at", { ascending: true }),
  ]);

  const guesses = guessRows ?? [];
  const bonusActors = (hintRows ?? [])
    .map((h) => h.actor_name)
    .filter((n): n is string => typeof n === "string");

  const hints = computeConfirmedHints(
    guesses.map((g) => ({
      feedback: (g.feedback as CineFeedback | null) ?? null,
      guessMeta: (g.guess_meta as CineMeta | null) ?? null,
    })),
  );
  const hintLines = confirmedHintLines(locale, hints);

  const attempts = mine.attempts;
  const found = mine.found;
  const exhausted = attempts >= MAX_ATTEMPTS;
  const canGuess = !found && !exhausted;
  const canBonus = !found && !exhausted && attempts >= BONUS_FROM;

  // --- Server Action : proposer un film ---
  async function submitGuess(formData: FormData) {
    "use server";
    const guessedTitle = String(formData.get("film_title") ?? "").trim();
    const tmdbIdRaw = String(formData.get("tmdb_id") ?? "");
    const tmdbId = /^\d+$/.test(tmdbIdRaw) ? Number(tmdbIdRaw) : null;
    if (!guessedTitle || tmdbId === null) {
      redirect(`${base}?error=guess`);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const [{ director, cast }, details, platforms] = await Promise.all([
      fetchMovieCredits(tmdbId),
      fetchMovieDetails(tmdbId),
      fetchMoviePlatforms(tmdbId),
    ]);

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

    revalidatePath(base);
    redirect(error ? `${base}?error=guess` : base);
  }

  // --- Server Action : demander un indice bonus ---
  async function requestBonusHint() {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect("/login");
    }

    const { data, error } = await supabase.rpc("request_cine_bonus_hint", {
      _target_id: targetId,
    });

    revalidatePath(base);
    if (error) redirect(`${base}?error=hint`);
    redirect(data === null ? `${base}?nohint=1` : base);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <Link
        href={`/leagues/${id}/rounds/${roundId}`}
        className="text-sm text-[var(--color-gold)] underline-offset-4 hover:underline"
      >
        {t(locale, "round.back")}
      </Link>

      <div className="flex items-center gap-3">
        <Avatar name={mine.display_name} size={36} />
        <div>
          <h1 className="font-display text-3xl tracking-wide text-[var(--color-gold)]">
            {t(locale, "cinefiles.proposalBy", { name: mine.display_name })}
          </h1>
          <p className="font-mono text-xs text-[var(--color-muted)]">
            {t(locale, "cinefiles.attemptCounter", {
              count: attempts,
              max: MAX_ATTEMPTS,
            })}
          </p>
        </div>
      </div>

      {/* Indices confirmés + indices bonus */}
      {(hintLines.length > 0 || bonusActors.length > 0) && (
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 px-4 py-3">
          {hintLines.length > 0 && (
            <>
              <p className="font-display text-sm tracking-wide text-[var(--color-cream)]">
                {t(locale, "cinefiles.confirmedHints")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {hintLines.map((line, k) => (
                  <li key={k} className="text-sm text-[var(--color-cream)]">
                    ✅ {line}
                  </li>
                ))}
              </ul>
            </>
          )}
          {bonusActors.length > 0 && (
            <>
              <p className="font-display mt-1 text-sm tracking-wide text-[var(--color-cream)]">
                {t(locale, "cinefiles.bonusHints")}
              </p>
              <ul className="flex flex-col gap-0.5">
                {bonusActors.map((a, k) => (
                  <li key={k} className="text-sm text-[var(--color-cream)]">
                    🎭 {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Demander un indice bonus */}
      {canBonus && (
        <form action={requestBonusHint}>
          <SubmitButton
            locale={locale}
            className="w-fit rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
          >
            {t(locale, "cinefiles.bonusButton")}
          </SubmitButton>
        </form>
      )}
      {nohint === "1" && (
        <p className="text-sm text-[var(--color-muted)]">
          {t(locale, "cinefiles.bonusEmpty")}
        </p>
      )}

      {/* Tentatives précédentes (sans images) */}
      {guesses.length > 0 && (
        <ul className="flex flex-col gap-2">
          {guesses.map((g, j) => (
            <li
              key={j}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  #{g.attempt_number}
                </span>
                <span className="text-[var(--color-cream)]">
                  {g.guessed_title}
                </span>
                {g.found && <span>✅</span>}
              </div>
              {g.feedback ? (
                <CineFeedbackChips
                  feedback={g.feedback as CineFeedback}
                  locale={locale}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {/* Nouvelle proposition, ou état terminal */}
      {found ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {t(locale, "cinefiles.solved")}
        </p>
      ) : exhausted ? (
        <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]">
          {t(locale, "cinefiles.exhausted")}
        </p>
      ) : (
        <>
          {pageError === "guess" && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {t(locale, "cinefiles.guessError")}
            </p>
          )}
          {canGuess && (
            <CineGuessForm
              locale={locale}
              roundId={roundId}
              hints={hints}
              submitGuess={submitGuess}
            />
          )}
        </>
      )}
    </main>
  );
}
