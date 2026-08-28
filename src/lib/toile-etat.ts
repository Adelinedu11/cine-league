/**
 * État d'une partie de La Toile, et son stockage navigateur.
 *
 * Mutualisé entre l'écran de jeu et le badge de la page d'accueil : les deux
 * doivent lire exactement la même chose, et une duplication finirait par
 * diverger silencieusement.
 *
 * ─── Pourquoi localStorage ────────────────────────────────────────────────
 * On joue sans compte, donc il n'y a pas de base où écrire la partie. Et
 * surtout on quitte la page pour chercher un titre puis on revient : une partie
 * qui ne survit pas à un rechargement est un cul-de-sac.
 *
 * ─── Pourquoi useSyncExternalStore ────────────────────────────────────────
 * C'est la façon prévue par React de lire un stockage externe sans décalage
 * entre le rendu serveur et le rendu client. Une hydratation par effet est
 * refusée par les règles de React 19, et à raison. Bénéfice au passage : deux
 * onglets ouverts restent synchronisés.
 *
 * Ce qui est stocké, ce sont les RÉSULTATS déjà vus par le joueur. Rien de
 * secret n'y transite : la cible n'apparaît qu'une fois la partie terminée.
 */

export type ResultatFilm = {
  kind: "film";
  id: number;
  label: string;
  detail: string | null;
  ciblePresente: boolean;
  personnes: { nom: string; films: number }[];
};

export type ResultatPersonne = {
  kind: "personne";
  id: number;
  label: string;
  detail: string | null;
  trouve: boolean;
  films: number;
};

export type Resultat =
  | ResultatFilm
  | ResultatPersonne
  | { kind: "erreur"; message: string };

export type Indice = { rang: number; cle: string; valeur: string | null };

export type Etat = {
  essais: Resultat[];
  gagne: boolean;
  abandon: boolean;
  cible: { nom: string } | null;
  indices: Indice[];
};

// Référence stable : `useSyncExternalStore` compare les instantanés par
// identité. Recréer un objet vide à chaque appel provoquerait une boucle de
// rendus infinie.
export const ETAT_VIDE: Etat = {
  essais: [],
  gagne: false,
  abandon: false,
  cible: null,
  indices: [],
};

export function cleDuJour(jour: string) {
  return `toile:${jour}`;
}

export function creerStore(cle: string) {
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
