/**
 * Pré-remplissage du cache des génériques (toile_films / toile_film_people).
 *
 * Lancer avec :  node scripts/seed-films.mjs
 *
 * ─── Pourquoi ─────────────────────────────────────────────────────────────
 * `toile_essai_film` lit le générique EN BASE et refuse de deviner : si le film
 * proposé est inconnu, elle répond `generique_absent` et c'est au serveur
 * applicatif d'aller le chercher chez TMDB. Ça marche, mais le tout premier
 * joueur de chaque film paie une seconde d'attente.
 *
 * Or on a déjà, sur le disque, les génériques de tous les films téléchargés par
 * prepare-toile.mjs — la réserve d'amorces et les filmographies des 28 cibles.
 * Soit largement de quoi couvrir les films que les gens proposent réellement.
 * Autant les verser en base tout de suite.
 *
 * Rejouable sans risque : les insertions sont en upsert.
 */

import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = join(ROOT, "scripts", ".cache");

// Même périmètre que prepare-toile.mjs — il DOIT rester identique, sinon le
// jeu comparerait des ensembles construits selon deux règles différentes.
const CAST_LIMIT = 10;
const CREW_JOBS = new Set([
  "Director",
  "Writer",
  "Screenplay",
  "Original Music Composer",
]);

async function env(name) {
  const raw = await readFile(join(ROOT, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${name}=`));
  if (!line) throw new Error(`${name} absente de .env.local`);
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const URL_BASE = await env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = await env("SUPABASE_SERVICE_ROLE_KEY");

async function rest(path, body, prefer) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} → ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const fichiers = await readdir(CACHE_DIR);

  // 1. Titres et années. Les réponses /movie/{id}/credits ne contiennent pas
  //    le titre du film : on le récupère dans les listes discover et dans les
  //    filmographies, où il figure.
  const titres = new Map();
  const noter = (m) => {
    if (m?.id && m.title && m.release_date) {
      titres.set(m.id, { titre: m.title, annee: m.release_date.slice(0, 4) });
    }
  };

  for (const f of fichiers) {
    if (f.startsWith("_discover_movie")) {
      const d = JSON.parse(await readFile(join(CACHE_DIR, f), "utf8"));
      for (const m of d.results ?? []) noter(m);
    } else if (f.includes("movie_credits")) {
      const d = JSON.parse(await readFile(join(CACHE_DIR, f), "utf8"));
      for (const m of d.cast ?? []) noter(m);
      for (const m of d.crew ?? []) noter(m);
    }
  }
  console.log(`${titres.size} titres de films connus.`);

  // 2. Génériques.
  const films = [];
  const personnes = [];

  for (const f of fichiers) {
    const m = f.match(/^_movie_(\d+)_credits\.json$/);
    if (!m) continue;
    const movieId = Number(m[1]);
    const meta = titres.get(movieId);
    if (!meta) continue; // titre inconnu : on ne peut pas l'afficher au joueur

    const credits = JSON.parse(await readFile(join(CACHE_DIR, f), "utf8"));
    const gens = new Map();
    for (const c of (credits.cast ?? []).slice(0, CAST_LIMIT)) {
      if (c.id && c.name) gens.set(c.id, c.name);
    }
    for (const c of credits.crew ?? []) {
      if (c.id && c.name && CREW_JOBS.has(c.job)) gens.set(c.id, c.name);
    }
    if (gens.size === 0) continue;

    films.push({ tmdb_movie_id: movieId, titre: meta.titre, annee: meta.annee });
    for (const [personId, nom] of gens) {
      personnes.push({
        tmdb_movie_id: movieId,
        tmdb_person_id: personId,
        nom,
      });
    }
  }

  console.log(`${films.length} génériques à charger (${personnes.length} lignes).\n`);

  // 3. Envoi par paquets. Les films d'abord : toile_film_people les référence.
  const PAQUET = 500;
  for (let i = 0; i < films.length; i += PAQUET) {
    await rest(
      "toile_films?on_conflict=tmdb_movie_id",
      films.slice(i, i + PAQUET),
      "resolution=merge-duplicates,return=minimal",
    );
    process.stdout.write(`\r  films : ${Math.min(i + PAQUET, films.length)}/${films.length}`);
  }
  console.log("");

  for (let i = 0; i < personnes.length; i += PAQUET) {
    await rest(
      "toile_film_people?on_conflict=tmdb_movie_id,tmdb_person_id",
      personnes.slice(i, i + PAQUET),
      "resolution=merge-duplicates,return=minimal",
    );
    process.stdout.write(
      `\r  personnes : ${Math.min(i + PAQUET, personnes.length)}/${personnes.length}`,
    );
  }
  console.log(`\n\nCache des génériques chargé.`);
}

main().catch((err) => {
  console.error("\nÉchec :", err.message ?? err);
  process.exit(1);
});
