"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Search, Film, User, Flame, Lightbulb } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { PopTicket, PopTrophy } from "@/components/pop/PopShapes";
import {
  essaiFilm,
  essaiPersonne,
  obtenirIndice,
  revelerCible,
  type Resultat,
} from "./actions";

// Paliers de rattrapage. Pas de limite d'essais, donc un indice unique
// laisserait sans rien quelqu'un encore bloqué au 25e coup.
const PALIERS = [
  { rang: 1, aPartirDe: 10 },
  { rang: 2, aPartirDe: 15 },
  { rang: 3, aPartirDe: 20 },
];

type Partie = {
  jour: string;
  numero: number;
  metier: string | null;
  amorce: { tmdb_id: number; titre: string; annee: string | null };
};

type Suggestion = {
  kind: "film" | "personne";
  id: number;
  label: string;
  detail: string | null;
};

type Indice = { rang: number; cle: string; valeur: string | null };

type Etat = {
  essais: Resultat[];
  gagne: boolean;
  abandon: boolean;
  cible: { nom: string } | null;
  indices: Indice[];
};

// Référence stable : `useSyncExternalStore` compare les instantanés par
// identité. Recréer un objet vide à chaque appel provoquerait une boucle de
// rendus infinie.
const ETAT_VIDE: Etat = {
  essais: [],
  gagne: false,
  abandon: false,
  cible: null,
  indices: [],
};

/**
 * La partie vit dans localStorage, qui en est la source de vérité.
 *
 * Deux raisons. On joue sans compte, donc il n'y a pas de base où l'écrire. Et
 * surtout on quitte la page pour chercher un titre puis on revient : une partie
 * qui ne survit pas à un rechargement est un cul-de-sac — la leçon a déjà été
 * payée sur l'écran « mot de passe oublié ».
 *
 * On passe par `useSyncExternalStore` plutôt que par un effet d'hydratation :
 * c'est la façon prévue de lire un stockage externe sans décalage entre le
 * rendu serveur et le rendu client. Bénéfice au passage, deux onglets ouverts
 * restent synchronisés.
 *
 * Ce qui est stocké, ce sont les RÉSULTATS déjà vus par le joueur. Rien de
 * secret n'y transite : la cible n'apparaît qu'une fois la partie terminée.
 */
function creerStore(cle: string) {
  const abonnes = new Set<() => void>();
  let brutEnCache: string | null = null;
  let etatEnCache: Etat = ETAT_VIDE;

  return {
    subscribe(onChange: () => void) {
      abonnes.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        abonnes.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },
    lire(): Etat {
      let brut: string | null = null;
      try {
        brut = localStorage.getItem(cle);
      } catch {
        // Navigation privée stricte : on joue sans reprise plutôt que de
        // planter.
        return ETAT_VIDE;
      }
      if (brut !== brutEnCache) {
        brutEnCache = brut;
        etatEnCache = brut ? { ...ETAT_VIDE, ...JSON.parse(brut) } : ETAT_VIDE;
      }
      return etatEnCache;
    },
    lireServeur(): Etat {
      return ETAT_VIDE;
    },
    ecrire(etat: Etat) {
      try {
        localStorage.setItem(cle, JSON.stringify(etat));
      } catch {
        // idem : ne pas pouvoir sauver n'interrompt pas la partie en cours.
      }
      brutEnCache = null; // force la relecture au prochain instantané
      abonnes.forEach((fn) => fn());
    },
  };
}

/** Écran de jeu de La Toile. */
export default function ToileGame({
  locale,
  partie,
}: {
  locale: Locale;
  partie: Partie;
}) {
  const store = useMemo(() => creerStore(`toile:${partie.jour}`), [partie.jour]);
  const etat = useSyncExternalStore(
    store.subscribe,
    store.lire,
    store.lireServeur,
  );
  const { essais, gagne, abandon, cible, indices } = etat;

  const [saisie, setSaisie] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [enCours, setEnCours] = useState(false);
  const dernierAppel = useRef(0);

  // Recherche. Le jeton `dernierAppel` évite qu'une réponse lente écrase une
  // réponse plus récente — sur une recherche à la frappe, c'est fréquent.
  async function chercher(q: string) {
    setSaisie(q);
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const jeton = ++dernierAppel.current;
    try {
      const res = await fetch(
        `/api/toile/search?query=${encodeURIComponent(q.trim())}`,
      );
      const data = await res.json();
      if (jeton === dernierAppel.current) {
        setSuggestions(data.results ?? []);
      }
    } catch {
      if (jeton === dernierAppel.current) setSuggestions([]);
    }
  }

  const dejaJoue = (s: Suggestion) =>
    essais.some(
      (e) => e.kind !== "erreur" && e.kind === s.kind && e.id === s.id,
    );

  async function proposer(s: Suggestion) {
    if (enCours || gagne || dejaJoue(s)) return;
    setEnCours(true);
    setSaisie("");
    setSuggestions([]);

    const resultat =
      s.kind === "film"
        ? await essaiFilm(partie.jour, s.id, s.label, s.detail)
        : await essaiPersonne(partie.jour, s.id, s.label);

    if (resultat.kind !== "erreur") {
      const trouve = resultat.kind === "personne" && resultat.trouve;
      store.ecrire({
        ...etat,
        essais: [resultat, ...etat.essais],
        gagne: etat.gagne || trouve,
        cible: trouve ? await revelerCible(partie.jour) : etat.cible,
      });
    }
    setEnCours(false);
  }

  async function demanderIndice(rang: number) {
    if (indices.some((i) => i.rang === rang)) return;
    const indice = await obtenirIndice(partie.jour, rang);
    if (!indice) return;
    store.ecrire({
      ...etat,
      indices: [...etat.indices, indice].sort((a, b) => a.rang - b.rang),
    });
  }

  async function donnerSaLangue() {
    store.ecrire({
      ...etat,
      abandon: true,
      cible: await revelerCible(partie.jour),
    });
  }

  // Noms déjà repérés : un même collaborateur retrouvé par un autre film ne
  // doit pas donner l'impression d'une information neuve.
  const dejaVus = new Set<string>();
  const essaisAnnotes = [...essais].reverse().map((e) => {
    if (e.kind !== "film") return { e, nouveaux: new Set<string>() };
    const nouveaux = new Set<string>();
    for (const p of e.personnes) {
      if (!dejaVus.has(p.nom)) {
        nouveaux.add(p.nom);
        dejaVus.add(p.nom);
      }
    }
    return { e, nouveaux };
  });
  essaisAnnotes.reverse();

  const termine = gagne || abandon;

  return (
    <>
      {/* En-tête */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display text-3xl tracking-wide text-[var(--color-gold)]">
            La Toile
          </h1>
          <span className="text-sm text-[var(--color-muted)]">
            n° {partie.numero}
          </span>
        </div>
        <Link
          href="/leagues"
          className="text-xs text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
        >
          {t(locale, "toile.versLeagues")}
        </Link>
      </div>

      {/* Amorce */}
      <section className="rounded-2xl border-2 border-[var(--color-cream)] bg-[var(--color-gold-bright)]/20 p-5">
        <p className="font-mono text-[11px] tracking-wider text-[var(--color-gold)]">
          {t(locale, "toile.amorce")}
        </p>
        <p className="font-display mt-1 text-xl tracking-wide text-[var(--color-cream)]">
          {partie.amorce.titre}
          {partie.amorce.annee && (
            <span className="ml-2 text-sm font-normal text-[var(--color-muted)]">
              {partie.amorce.annee}
            </span>
          )}
        </p>
        <p className="mt-2 text-sm text-[var(--color-cream)]/85">
          {t(locale, "toile.amorceExplication")}
        </p>
        {partie.metier && (
          <p className="mt-3 text-sm text-[var(--color-cream)]/85">
            {t(locale, "toile.indiceMetier", { metier: partie.metier })}
          </p>
        )}
      </section>

      {/* Fin de partie */}
      {termine && cible && (
        <section
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 border-[var(--color-cream)] p-6 text-center ${
            gagne ? "bg-[var(--color-sage)]/25" : "bg-[var(--color-yellow)]/25"
          }`}
        >
          {gagne ? (
            <PopTrophy size={64} />
          ) : (
            <PopTicket size={72} fill="var(--color-yellow)" />
          )}
          <h2 className="font-display text-2xl tracking-wide text-[var(--color-cream)]">
            {gagne
              ? t(locale, "toile.gagne", { coups: essais.length })
              : t(locale, "toile.perdu")}
          </h2>
          <p className="text-lg text-[var(--color-cream)]">{cible.nom}</p>
        </section>
      )}

      {/* Indices de rattrapage */}
      {!termine && essais.length >= PALIERS[0].aPartirDe && (
        <section className="flex flex-col gap-2 rounded-2xl border-2 border-[var(--color-yellow)] bg-[var(--color-yellow)]/20 p-4">
          {indices.map((i) => (
            <p
              key={i.rang}
              className="flex items-start gap-2 text-sm text-[var(--color-cream)]"
            >
              <Lightbulb
                size={15}
                strokeWidth={1.8}
                className="mt-0.5 shrink-0 text-[var(--color-yellow-ink)]"
              />
              {t(locale, `toile.indice.${i.cle}`, { valeur: i.valeur ?? "?" })}
            </p>
          ))}

          {PALIERS.filter(
            (p) =>
              essais.length >= p.aPartirDe &&
              !indices.some((i) => i.rang === p.rang),
          ).map((p) => (
            <button
              key={p.rang}
              type="button"
              onClick={() => demanderIndice(p.rang)}
              className="flex items-center gap-2 self-start rounded-lg border-2 border-[var(--color-cream)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-0.5"
            >
              <Lightbulb size={14} strokeWidth={1.8} />
              {t(locale, "toile.demanderIndice")}
            </button>
          ))}

          {/* Prochain palier, pour que l'effort ait un horizon. */}
          {(() => {
            const suivant = PALIERS.find((p) => essais.length < p.aPartirDe);
            return suivant ? (
              <p className="text-xs text-[var(--color-muted)]">
                {t(locale, "toile.prochainIndice", {
                  n: suivant.aPartirDe - essais.length,
                })}
              </p>
            ) : null;
          })()}
        </section>
      )}

      {/* Saisie */}
      {!termine && (
        <section className="relative">
          <div className="flex items-center gap-2 rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] px-3">
            <Search size={16} className="shrink-0 text-[var(--color-muted)]" />
            <input
              type="text"
              value={saisie}
              onChange={(e) => chercher(e.target.value)}
              disabled={enCours}
              placeholder={t(locale, "toile.placeholder")}
              className="w-full bg-transparent py-3 text-sm text-[var(--color-cream)] outline-none placeholder:text-[var(--color-cream)]/40 disabled:opacity-50"
            />
          </div>

          {suggestions.length > 0 && (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border-2 border-[var(--color-cream)] bg-[var(--color-surface)] py-1">
              {suggestions.map((s) => {
                const joue = dejaJoue(s);
                return (
                  <li key={`${s.kind}-${s.id}`}>
                    <button
                      type="button"
                      onClick={() => proposer(s)}
                      disabled={joue}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-cream)] transition-colors hover:bg-[var(--color-surface-alt)] disabled:opacity-40"
                    >
                      {s.kind === "film" ? (
                        <Film size={14} className="shrink-0 text-[var(--color-muted)]" />
                      ) : (
                        <User size={14} className="shrink-0 text-[var(--color-muted)]" />
                      )}
                      <span className="flex-1 truncate">{s.label}</span>
                      {s.detail && (
                        <span className="shrink-0 text-xs text-[var(--color-muted)]">
                          {s.detail}
                        </span>
                      )}
                      {joue && (
                        <span className="shrink-0 text-xs text-[var(--color-muted)]">
                          {t(locale, "toile.dejaJoue")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Essais, du plus récent au plus ancien */}
      <section className="flex flex-col gap-2">
        {essaisAnnotes.map(({ e, nouveaux }, i) => {
          if (e.kind === "erreur") return null;

          if (e.kind === "personne") {
            return (
              <article
                key={`p-${e.id}-${i}`}
                className="rounded-xl border border-[var(--color-border)] px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <User size={14} className="shrink-0 text-[var(--color-muted)]" />
                  <span className="flex-1 text-sm font-medium text-[var(--color-cream)]">
                    {e.label}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      e.films > 0
                        ? "bg-[var(--color-sage)]/25 text-[var(--color-sage-ink)]"
                        : "bg-[var(--color-coral)]/20 text-[var(--color-coral-ink)]"
                    }`}
                  >
                    {e.films > 0
                      ? t(locale, "toile.nFilms", { n: e.films })
                      : t(locale, "toile.aucunFilm")}
                  </span>
                </div>
              </article>
            );
          }

          const froid = !e.ciblePresente && e.personnes.length === 0;
          return (
            <article
              key={`f-${e.id}-${i}`}
              className={`rounded-xl border border-[var(--color-border)] px-3 py-2.5 ${
                froid ? "opacity-55" : ""
              }`}
            >
              <div className="flex items-baseline gap-2">
                <Film size={14} className="shrink-0 self-center text-[var(--color-muted)]" />
                <span className="flex-1 text-sm font-medium text-[var(--color-cream)]">
                  {e.label}
                </span>
                {e.detail && (
                  <span className="text-xs text-[var(--color-muted)]">{e.detail}</span>
                )}
              </div>

              {e.ciblePresente && (
                <p className="mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-xs bg-[var(--color-coral)]/25 text-[var(--color-coral-ink)]">
                  <Flame size={13} strokeWidth={2} />
                  {t(locale, "toile.brulant")}
                </p>
              )}

              {froid ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {t(locale, "toile.aucunePersonne")}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.personnes.map((p) => {
                    const neuf = nouveaux.has(p.nom);
                    return (
                      <span
                        key={p.nom}
                        className={`rounded px-2 py-0.5 text-xs ${
                          neuf
                            ? "bg-[var(--color-sage)]/25 text-[var(--color-sage-ink)]"
                            : "bg-[var(--color-surface-alt)] text-[var(--color-muted)] line-through"
                        }`}
                      >
                        {p.nom} · {t(locale, "toile.nFilms", { n: p.films })}
                      </span>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Pied */}
      {!termine && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-sm text-[var(--color-muted)]">
            {t(locale, "toile.nEssais", { n: essais.length })}
          </span>
          <button
            type="button"
            onClick={donnerSaLangue}
            className="text-sm text-[var(--color-muted)] underline decoration-[var(--color-border)] underline-offset-4 hover:text-[var(--color-cream)]"
          >
            {t(locale, "toile.abandonner")}
          </button>
        </div>
      )}
    </>
  );
}
