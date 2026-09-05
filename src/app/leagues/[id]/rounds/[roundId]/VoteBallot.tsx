"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

/**
 * Bulletin de vote : une catégorie = un bloc dépliable contenant un menu
 * déroulant (le gagnant) et le commentaire du jury.
 *
 * POURQUOI CE DÉCOUPAGE : les films sont désormais présentés UNE SEULE FOIS,
 * au-dessus, dans « La sélection » (affiche, plateformes, commentaire du
 * directeur). Les répéter en entier dans chaque catégorie donnait, à 5 films
 * et 4 catégories, 20 lignes à parcourir pour 4 décisions.
 *
 * Composant client uniquement pour l'affichage : afficher le film choisi sur
 * la ligne repliée et la progression demande de suivre les valeurs. Les champs
 * gardent les noms attendus par la Server Action (`category-{id}` et
 * `comment-{id}`) : c'est bien le formulaire natif qui est envoyé, pas cet état.
 */
export default function VoteBallot({
  categories,
  films,
  locale,
}: {
  categories: { id: string; name: string }[];
  films: { submission_id: string; film_title: string }[];
  locale: Locale;
}) {
  // categoryId -> submission_id choisi (chaîne vide = pas encore choisi).
  const [picks, setPicks] = useState<Record<string, string>>({});
  const done = categories.filter((c) => picks[c.id]).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Progression : combien de catégories sont remplies. */}
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-sage)] transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${(done / Math.max(categories.length, 1)) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
          {t(locale, "round.ballotProgress", {
            done,
            total: categories.length,
          })}
        </span>
      </div>

      {categories.map((category, index) => {
        const picked = films.find(
          (f) => f.submission_id === picks[category.id],
        );
        return (
          <details
            key={category.id}
            // La première catégorie est ouverte : sinon la page ne montre
            // qu'une pile de barres fermées, on ne voit pas quoi y faire.
            open={index === 0}
            className="group overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] open:border-[var(--color-gold)]"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="font-display flex-1 text-lg tracking-wide text-[var(--color-cream)]">
                {category.name}
              </span>
              <span
                className={`flex items-center gap-1.5 text-right text-xs font-medium ${
                  picked
                    ? "text-[var(--color-sage-ink)]"
                    : "text-[var(--color-muted)]"
                }`}
              >
                {picked && <Check size={13} strokeWidth={2.2} />}
                {picked ? picked.film_title : t(locale, "round.pickNone")}
              </span>
              <ChevronDown
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
                className="shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>

            <div className="flex flex-col gap-2 border-t border-[var(--color-border)] px-4 py-3">
              <label htmlFor={`category-${category.id}`} className="sr-only">
                {category.name}
              </label>
              <select
                id={`category-${category.id}`}
                name={`category-${category.id}`}
                value={picks[category.id] ?? ""}
                onChange={(e) =>
                  setPicks((prev) => ({
                    ...prev,
                    [category.id]: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none focus:border-[var(--color-gold)]"
              >
                <option value="">{t(locale, "round.pickPlaceholder")}</option>
                {films.map((film) => (
                  <option key={film.submission_id} value={film.submission_id}>
                    {film.film_title}
                  </option>
                ))}
              </select>

              <label
                htmlFor={`comment-${category.id}`}
                className="mt-1 text-xs font-medium text-[var(--color-cream)]"
              >
                {t(locale, "round.juryComment")}
              </label>
              <textarea
                id={`comment-${category.id}`}
                name={`comment-${category.id}`}
                rows={2}
                placeholder={t(locale, "round.voteCommentPlaceholder")}
                className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
              />
            </div>
          </details>
        );
      })}
    </div>
  );
}
