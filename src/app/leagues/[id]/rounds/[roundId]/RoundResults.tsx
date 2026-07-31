"use client";

import { useState } from "react";
import TicketStub from "@/components/TicketStub";
import FilmPoster from "@/components/FilmPoster";
import { t, type Locale } from "@/lib/i18n";

type Winner = {
  filmTitle: string;
  displayName: string | null;
  voteCount: number;
  submissionComment: string | null;
  voteComments: string[];
  posterPath: string | null;
};

type CategoryResult = {
  categoryId: string;
  categoryName: string;
  tie: boolean;
  winners: Winner[];
};

export default function RoundResults({
  results,
  locale,
}: {
  results: CategoryResult[];
  locale: Locale;
}) {
  // Toggle local : révèle le nom des membres pour toutes les catégories.
  const [revealed, setRevealed] = useState(false);

  if (results.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "results.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="self-start rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-cream)] transition-colors hover:border-[var(--color-gold)]"
      >
        {t(locale, revealed ? "results.hideCredits" : "results.showCredits")}
      </button>

      <ul className="flex flex-col gap-4">
        {results.map((category) => {
          const voteCount = category.winners[0]?.voteCount ?? 0;
          return (
            <li key={category.categoryId}>
              <TicketStub
                stub={t(locale, voteCount > 1 ? "results.votes" : "results.vote", {
                  count: voteCount,
                })}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-lg tracking-wide text-[var(--color-cream)]">
                    {category.categoryName}
                  </h3>
                  {category.tie && (
                    <span className="rounded-full bg-[var(--color-surface-alt)] px-2 py-0.5 text-xs text-[var(--color-gold)]">
                      {t(locale, "results.tie")}
                    </span>
                  )}
                </div>

                <ul className="mt-2 flex flex-col gap-3">
                  {category.winners.map((winner, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-[var(--color-cream)]"
                    >
                      <FilmPoster
                        posterPath={winner.posterPath}
                        alt={winner.filmTitle}
                        width={64}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{winner.filmTitle}</span>
                        {revealed && (
                          <span className="text-[var(--color-muted)]">
                            {` · ${t(locale, "results.submittedBy")} `}
                            <span className="font-medium text-[var(--color-cream)]">
                              {winner.displayName ?? t(locale, "results.unknown")}
                            </span>
                          </span>
                        )}

                        {/* Commentaires de vote (anonymes). */}
                      {winner.voteComments.length > 0 && (
                        <ul className="mt-1.5 flex flex-col gap-1">
                          {winner.voteComments.map((comment, j) => (
                            <li
                              key={j}
                              className="text-xs italic text-[var(--color-muted)]"
                            >
                              « {comment} »
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Commentaire de soumission (visible une fois le
                          générique révélé, avec le nom du soumissionnaire). */}
                      {revealed && winner.submissionComment && (
                        <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                          {t(locale, "results.noteBy", {
                            name:
                              winner.displayName ?? t(locale, "results.unknown"),
                            comment: winner.submissionComment,
                          })}
                        </p>
                      )}
                      </div>
                    </li>
                  ))}
                </ul>
              </TicketStub>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
