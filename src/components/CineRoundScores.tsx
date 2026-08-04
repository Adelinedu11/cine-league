"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";
import { t, type Locale } from "@/lib/i18n";

type MysteryDetail = {
  author: string;
  found: boolean;
  attempts: number;
  guessedTitle: string | null;
};

export type CineRoundPlayer = {
  display_name: string;
  total_points: number;
  secret_title: string | null;
  mysteries: unknown;
};

/** Classement d'une séance Ciné'Files, chaque joueur dépliable pour le détail. */
export default function CineRoundScores({
  players,
  locale,
}: {
  players: CineRoundPlayer[];
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
        const mysteries = (Array.isArray(p.mysteries)
          ? p.mysteries
          : []) as MysteryDetail[];
        const foundCount = mysteries.filter((m) => m.found).length;
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

            {isOpen && (
              <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm">
                <p className="text-[var(--color-muted)]">
                  {t(locale, "cinefiles.secretFilm")} :{" "}
                  <span className="text-[var(--color-cream)]">
                    {p.secret_title ?? "—"}
                  </span>
                </p>
                <p className="text-[var(--color-muted)]">
                  {t(locale, "cinefiles.foundCount", {
                    count: foundCount,
                    total: mysteries.length,
                  })}
                </p>
                {mysteries.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {mysteries.map((m, k) => (
                      <li
                        key={k}
                        className="flex items-center justify-between gap-2 text-[var(--color-cream)]"
                      >
                        <span>
                          {m.found ? "✅" : "❌"} {m.author} —{" "}
                          {m.guessedTitle ?? "—"}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-muted)]">
                          {m.attempts}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
