"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tmdbFetch } from "@/lib/tmdb";

/**
 * Actions serveur de La Toile.
 *
 * Toute la logique de comparaison vit en base (migration 029). Le rôle de ce
 * fichier est uniquement de faire l'intermédiaire — et de garantir que le
 * générique d'un film proposé est bien en base AVANT d'interroger le moteur.
 *
 * ⚠️ Le générique n'est jamais transmis par le navigateur. C'est le serveur qui
 * va le chercher chez TMDB et l'écrit lui-même : sinon il suffirait d'annoncer
 * un faux casting contenant tout le monde pour retrouver la cible en un coup.
 */

// Même périmètre que scripts/prepare-toile.mjs. Il DOIT rester identique,
// sinon on comparerait deux ensembles construits selon des règles différentes.
const CAST_LIMIT = 10;
const CREW_JOBS = new Set([
  "Director",
  "Writer",
  "Screenplay",
  "Original Music Composer",
]);

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

export type Resultat = ResultatFilm | ResultatPersonne | { kind: "erreur"; message: string };

/** Télécharge le générique d'un film et l'écrit en base (clé de service). */
async function mettreEnCache(movieId: number, titre: string, annee: string | null) {
  const res = await tmdbFetch(`/movie/${movieId}/credits`);
  if (!res.ok) return false;

  const credits = await res.json();
  const gens = new Map<number, string>();

  for (const c of (credits.cast ?? []).slice(0, CAST_LIMIT)) {
    if (c.id && c.name) gens.set(c.id, c.name);
  }
  for (const c of credits.crew ?? []) {
    if (c.id && c.name && CREW_JOBS.has(c.job)) gens.set(c.id, c.name);
  }
  if (gens.size === 0) return false;

  const admin = createAdminClient();
  const { error: filmError } = await admin
    .from("toile_films")
    .upsert({ tmdb_movie_id: movieId, titre, annee }, { onConflict: "tmdb_movie_id" });
  if (filmError) {
    console.error("Cache film :", filmError);
    return false;
  }

  const { error: peopleError } = await admin.from("toile_film_people").upsert(
    [...gens].map(([personId, nom]) => ({
      tmdb_movie_id: movieId,
      tmdb_person_id: personId,
      nom,
    })),
    { onConflict: "tmdb_movie_id,tmdb_person_id" },
  );
  if (peopleError) {
    console.error("Cache générique :", peopleError);
    return false;
  }

  return true;
}

/** Essai sur un film : le « filet large ». */
export async function essaiFilm(
  jour: string,
  movieId: number,
  titre: string,
  annee: string | null,
): Promise<Resultat> {
  const supabase = await createClient();

  let { data } = await supabase.rpc("toile_essai_film", {
    _jour: jour,
    _movie_id: movieId,
  });

  // Générique inconnu : on le récupère puis on redemande. Une seule fois — un
  // film sans générique exploitable ne le deviendra pas au second essai.
  if (data && typeof data === "object" && "erreur" in data) {
    if (data.erreur === "generique_absent") {
      const ok = await mettreEnCache(movieId, titre, annee);
      if (!ok) {
        return { kind: "erreur", message: "generique_indisponible" };
      }
      ({ data } = await supabase.rpc("toile_essai_film", {
        _jour: jour,
        _movie_id: movieId,
      }));
    }
  }

  if (!data || typeof data !== "object" || "erreur" in data) {
    return { kind: "erreur", message: "indisponible" };
  }

  const brut = data as {
    cible_presente: boolean;
    personnes: { nom: string; films: number }[];
  };

  return {
    kind: "film",
    id: movieId,
    label: titre,
    detail: annee,
    ciblePresente: brut.cible_presente,
    personnes: brut.personnes ?? [],
  };
}

/** Essai sur une personne : la « sonde précise ». C'est ici qu'on gagne. */
export async function essaiPersonne(
  jour: string,
  personId: number,
  nom: string,
): Promise<Resultat> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("toile_essai_personne", {
    _jour: jour,
    _person_id: personId,
  });

  if (!data || typeof data !== "object" || "erreur" in data) {
    return { kind: "erreur", message: "indisponible" };
  }

  const brut = data as { trouve: boolean; films?: number };

  return {
    kind: "personne",
    id: personId,
    label: nom,
    detail: null,
    trouve: brut.trouve,
    films: brut.films ?? 0,
  };
}

/**
 * Un indice de rattrapage, désigné par son rang (1, 2 ou 3).
 *
 * Le palier de déblocage (10 / 15 / 20 essais) est vérifié côté interface
 * seulement : le compteur d'essais vit dans le navigateur, puisqu'on joue sans
 * compte. C'est assumé — aucun de ces trois indices ne donne la réponse à lui
 * seul, donc contourner le verrou n'apporte rien d'autre que trois
 * renseignements vagues obtenus trop tôt.
 */
export async function obtenirIndice(jour: string, rang: number) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("toile_indice", {
    _jour: jour,
    _rang: rang,
  });
  if (!data || typeof data !== "object" || "erreur" in data) return null;
  return data as { rang: number; cle: string; valeur: string | null };
}

/**
 * Révélation de la cible. Appelée uniquement après victoire ou abandon —
 * ce contrôle ne peut pas vivre en base, qui ignore où en est le joueur.
 */
export async function revelerCible(jour: string) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("toile_reveler", { _jour: jour });
  return (data ?? null) as { nom: string; tmdb_id: number; metier: string } | null;
}
