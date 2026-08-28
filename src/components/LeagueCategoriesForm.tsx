"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";

export const MAX_CATEGORIES = 5;

export type Option = {
  id: string;
  name: string;
  propre: boolean;
  choisie: boolean;
};

/**
 * Choix des catégories de vote d'une ligue, réservé à l'admin.
 *
 * Le plafond de cinq est aussi vérifié en base (`set_league_categories`) : ce
 * qu'on fait ici n'est qu'un confort d'interface. Un contrôle uniquement côté
 * navigateur ne protège rien — on peut appeler la fonction directement.
 *
 * Les catégories retirées ne sont jamais supprimées, seulement déselectionnées :
 * les palmarès des séances passées continuent d'y faire référence.
 */
export default function LeagueCategoriesForm({
  locale,
  options,
  enregistrer,
  creerCategorie,
}: {
  locale: Locale;
  options: Option[];
  enregistrer: (ids: string[]) => Promise<{ erreur?: string } | void>;
  creerCategorie: (nom: string) => Promise<{ erreur?: string } | void>;
}) {
  const [choisies, setChoisies] = useState<string[]>(
    options.filter((o) => o.choisie).map((o) => o.id),
  );
  const [nouvelle, setNouvelle] = useState("");
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [enregistre, setEnregistre] = useState(false);

  const plein = choisies.length >= MAX_CATEGORIES;

  function basculer(id: string) {
    setEnregistre(false);
    setErreur("");
    setChoisies((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_CATEGORIES
          ? prev
          : [...prev, id],
    );
  }

  async function soumettre() {
    if (choisies.length === 0) {
      setErreur(t(locale, "categories.auMoinsUne"));
      return;
    }
    setBusy(true);
    setErreur("");
    const res = await enregistrer(choisies);
    if (res && "erreur" in res && res.erreur) {
      setErreur(res.erreur);
    } else {
      setEnregistre(true);
    }
    setBusy(false);
  }

  async function ajouter() {
    if (nouvelle.trim() === "") return;
    setBusy(true);
    setErreur("");
    const res = await creerCategorie(nouvelle.trim());
    if (res && "erreur" in res && res.erreur) {
      setErreur(res.erreur);
      setBusy(false);
      return;
    }
    setNouvelle("");
    setBusy(false);
    // La liste est rechargée par la revalidation côté serveur.
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-muted)]">
        {t(locale, "categories.aide", {
          n: choisies.length,
          max: MAX_CATEGORIES,
        })}
      </p>

      <ul className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = choisies.includes(o.id);
          const bloquee = !active && plein;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => basculer(o.id)}
                disabled={bloquee}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-[var(--color-cream)] bg-[var(--color-sage)]/30 text-[var(--color-cream)]"
                    : bloquee
                      ? "border-[var(--color-border)] text-[var(--color-muted)] opacity-40"
                      : "border-[var(--color-border)] text-[var(--color-cream)] hover:border-[var(--color-cream)]"
                }`}
              >
                {active && <Check size={13} strokeWidth={2.5} />}
                {o.name}
                {o.propre && (
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {t(locale, "categories.propre")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Écrire la sienne */}
      <div className="flex gap-2">
        <input
          type="text"
          value={nouvelle}
          onChange={(e) => setNouvelle(e.target.value)}
          maxLength={60}
          placeholder={t(locale, "categories.nouvellePlaceholder")}
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 focus:border-[var(--color-gold)]"
        />
        <button
          type="button"
          onClick={ajouter}
          disabled={busy || nouvelle.trim() === ""}
          className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-cream)] transition-colors hover:border-[var(--color-cream)] disabled:opacity-40"
        >
          <Plus size={14} strokeWidth={2} />
          {t(locale, "categories.ajouter")}
        </button>
      </div>

      {erreur && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400"
        >
          {erreur}
        </p>
      )}
      {enregistre && (
        <p
          role="status"
          className="rounded-lg border border-[var(--color-teal)] bg-[var(--color-teal)]/15 px-3 py-2 text-sm text-[var(--color-cream)]"
        >
          {t(locale, "categories.enregistre")}
        </p>
      )}

      <button
        type="button"
        onClick={soumettre}
        disabled={busy}
        className="self-start rounded-lg bg-[var(--color-gold)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-flesh)] hover:text-[var(--color-flesh-ink)] disabled:opacity-50"
      >
        {busy ? t(locale, "common.sending") : t(locale, "categories.enregistrer")}
      </button>

      <p className="text-xs text-[var(--color-muted)]">
        {t(locale, "categories.note")}
      </p>
    </div>
  );
}
