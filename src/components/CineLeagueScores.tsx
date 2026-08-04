"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { t, type Locale } from "@/lib/i18n";

type RoundDetail = {
  theme: string;
  secretTitle: string | null;
  mysteriesFound: number;
  points: number;
};

export type CineLeaguePlayer = {
  display_name: string;
  total_points: number;
  rounds: unknown;
};

/** Classement Ciné'Files de la ligue, chaque joueur dépliable (détail par séance). */
export default function CineLeagueScores({
  players,
  locale,
}: {
  players: CineLeaguePlayer[];
  locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(null);

  if (players.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "league.cineStandingsEmpty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {players.map((p, i) => {
        const rounds = (Array.isArray(p.rounds) ? p.rounds : []) as RoundDetail[];
        const isOpen = open === i;

        return (
          <li
            key={`${p.display_name}-${i}`}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="font-display w-6 text-center text-xl text-[var(--color-gold)]">
                  {i + 1}
                </span>
                <Avatar name={p.display_name} size={28} />
                <span className="text-[var(--color-cream)]">
                  {p.display_name}
                </span>
              </span>
              <span className="font-mono text-sm text-[var(--color-muted)]">
                {t(locale, "league.points", { count: p.total_points })}
              </span>
            </button>

            {isOpen && rounds.length > 0 && (
              <ul className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm">
                {rounds.map((r, k) => (
                  <li key={k} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium uppercase text-[var(--color-cream)]">
                        {r.theme}
                      </span>
                      <span className="font-mono text-xs text-[var(--color-muted)]">
                        {t(locale, "league.points", { count: r.points })}
                      </span>
                    </div>
                    <span className="text-[var(--color-muted)]">
                      {t(locale, "cinefiles.secretFilm")} :{" "}
                      <span className="text-[var(--color-cream)]">
                        {r.secretTitle ?? "—"}
                      </span>{" "}
                      · {t(locale, "cinefiles.foundShort", { count: r.mysteriesFound })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
