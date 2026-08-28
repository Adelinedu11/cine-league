"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Check, Flag, Hourglass, Sparkles } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { cleDuJour, creerStore } from "@/lib/toile-etat";

/**
 * « Tu as déjà joué aujourd'hui » sur la page d'accueil.
 *
 * Composant client, parce que la partie vit dans le navigateur : le serveur ne
 * sait pas — et ne doit pas savoir — où en est un joueur anonyme.
 *
 * Il lit exactement le même stockage que l'écran de jeu, via le module partagé
 * `toile-etat`. Une seconde implémentation finirait par diverger et afficherait
 * un jour « pas encore joué » à quelqu'un en pleine partie.
 *
 * Rendu serveur : état vide, donc « pas encore joué ». C'est le bon repli — un
 * visiteur qui découvre le site n'a effectivement pas joué.
 */
export default function StatutDuJour({
  locale,
  jour,
}: {
  locale: Locale;
  jour: string;
}) {
  const store = useMemo(() => creerStore(cleDuJour(jour)), [jour]);
  const etat = useSyncExternalStore(
    store.subscribe,
    store.lire,
    store.lireServeur,
  );

  const { essais, gagne, abandon } = etat;

  const { Icone, texte, ton } = gagne
    ? {
        Icone: Check,
        texte: t(locale, "toile.statutGagne", { coups: essais.length }),
        ton: "bg-[var(--color-sage)]/30 text-[var(--color-sage-ink)]",
      }
    : abandon
      ? {
          Icone: Flag,
          texte: t(locale, "toile.statutAbandon"),
          ton: "bg-[var(--color-surface-alt)] text-[var(--color-muted)]",
        }
      : essais.length > 0
        ? {
            Icone: Hourglass,
            texte: t(locale, "toile.statutEnCours", { n: essais.length }),
            ton: "bg-[var(--color-yellow)]/30 text-[var(--color-yellow-ink)]",
          }
        : {
            Icone: Sparkles,
            texte: t(locale, "toile.statutPasJoue"),
            ton: "bg-[var(--color-coral)]/25 text-[var(--color-coral-ink)]",
          };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${ton}`}
    >
      <Icone size={13} strokeWidth={2} />
      {texte}
    </span>
  );
}
