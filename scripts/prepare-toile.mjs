/**
 * Préparation des cibles de La Toile.
 *
 * Transforme une liste de noms (scripts/cibles.txt) en données jouables :
 * identifiant TMDB, ensemble des collaborateurs, film d'amorce, validation.
 *
 * Lancer avec :  node scripts/prepare-toile.mjs
 *
 * ─── Pourquoi un script hors ligne plutôt qu'un calcul à la volée ───────────
 * Reconstruire le réseau d'une personnalité demande une requête par film de sa
 * filmographie. Fait au moment où un joueur ouvre la page, c'est plusieurs
 * secondes d'attente et des centaines d'appels. Fait ici, une fois, c'est
 * gratuit pour toujours — et surtout ça permet de VÉRIFIER une cible avant de
 * la programmer, plutôt que de découvrir en production qu'elle est injouable.
 *
 * ─── Le cache disque ───────────────────────────────────────────────────────
 * Chaque réponse TMDB est écrite dans scripts/.cache/. Relancer le script ne
 * recoûte donc presque rien, ce qui permet d'itérer sur la liste de cibles
 * sans marteler l'API.
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = join(ROOT, "scripts", ".cache");
const OUT_DIR = join(ROOT, "scripts", "out");

// ─── Périmètre des collaborations ──────────────────────────────────────────
// Le graphe du cinéma est si dense que compter toute l'équipe rendrait chaque
// essai positif, donc sans valeur. On se limite aux postes que le joueur peut
// reconnaître et nommer.
const CAST_LIMIT = 10;
const CREW_JOBS = new Set([
  "Director",
  "Writer",
  "Screenplay",
  "Original Music Composer",
]);

// ─── Seuils de validation ──────────────────────────────────────────────────
// Premier passage : 30 cibles sur 30 retenues, donc des seuils qui ne
// filtraient rien et donnaient une fausse assurance. Relevés, et complétés par
// le seul qui compte vraiment : le nombre de collaborateurs RÉCURRENTS. Une
// cible n'ayant que des collaborations uniques donne un thermomètre plat, où
// tout vaut 1 film.
const MIN_FILMS = 8;
const MIN_COLLABORATORS = 40;
const MIN_STRONG_COLLABORATORS = 5; // personnes vues sur 2 films ou plus

// Un plafond, aussi. Samuel L. Jackson sort à 196 collaborateurs récurrents,
// contre une cinquantaine pour la médiane : les univers partagés type Marvel le
// relient à tout le monde. Le symptôme n'est pas qu'il soit facile, c'est que
// PRESQUE TOUT ESSAI renvoie une connexion — le thermomètre ne mesure plus rien.
const MAX_STRONG_COLLABORATORS = 120;

// Un film trop confidentiel n'apprend rien au joueur : son casting ne lui dit
// rien, et il ne le proposera jamais.
const MIN_FILM_VOTES = 50;

// ─── Contraintes sur l'amorce ──────────────────────────────────────────────
// Premier passage : presque toutes les amorces étaient des films 2026 non
// sortis. Ce n'était pas un hasard mais un biais de sélection — un film annoncé
// n'a que trois ou quatre acteurs renseignés, donc il satisfait trivialement le
// critère « ne partage qu'une seule personne ». Mon test choisissait
// systématiquement les films aux données les plus incomplètes.
const AMORCE_MIN_VOTES = 1000;
const AMORCE_MIN_PEOPLE = 10; // générique réellement renseigné

// La personne qui relie l'amorce à la cible doit être une collaboratrice
// RÉCURRENTE. Deuxième passage : l'amorce d'Agnès Varda passait par Tim Robbins
// à un seul film — un lien si ténu qu'il n'apprend rien au joueur. Un fil unique
// ne sert que s'il est solide.
const AMORCE_MIN_LINK_FILMS = 2;

// Taille de la réserve de films populaires où l'on cherche les amorces.
const AMORCE_POOL_PAGES = 15; // 20 films par page

// ───────────────────────────────────────────────────────────────────────────
// Accès TMDB
// ───────────────────────────────────────────────────────────────────────────

/** Lit TMDB_API_KEY depuis .env.local sans dépendance externe. */
async function loadApiKey() {
  const raw = await readFile(join(ROOT, ".env.local"), "utf8");
  const line = raw
    .split("\n")
    .find((l) => l.trim().startsWith("TMDB_API_KEY="));
  if (!line) {
    throw new Error("TMDB_API_KEY absente de .env.local");
  }
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

let API_KEY = null;

/** Nom de fichier de cache sûr pour un chemin + params. */
function cacheKey(path, params) {
  const q = new URLSearchParams(params).toString();
  return `${path}${q ? `?${q}` : ""}`.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
}

let callCount = 0;

/**
 * Appel TMDB avec cache disque. Même détection v3/v4 que src/lib/tmdb.ts :
 * un token v4 (JWT) commence par « eyJ » et passe en en-tête.
 */
async function tmdb(path, params = {}) {
  const file = join(CACHE_DIR, cacheKey(path, params));
  try {
    await access(file);
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    // pas en cache, on appelle
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const isV4 = API_KEY.startsWith("eyJ");
  if (!isV4) url.searchParams.set("api_key", API_KEY);

  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(isV4 ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
  });

  callCount++;
  // Politesse envers l'API : on ne cherche pas la vitesse, ce script tourne
  // une fois. 60 ms entre deux appels reste très en dessous des limites.
  await new Promise((r) => setTimeout(r, 60));

  if (res.status === 429) {
    console.log("   … limite de débit atteinte, pause de 5 s");
    await new Promise((r) => setTimeout(r, 5000));
    return tmdb(path, params);
  }
  if (!res.ok) {
    throw new Error(`TMDB ${res.status} sur ${path}`);
  }

  const data = await res.json();
  await writeFile(file, JSON.stringify(data));
  return data;
}

// ───────────────────────────────────────────────────────────────────────────
// Extraction
// ───────────────────────────────────────────────────────────────────────────

/**
 * Personnes retenues au générique d'un film, sous forme d'identifiants TMDB.
 * On travaille par identifiant et jamais par nom : les homonymes et les
 * variantes d'orthographe (accents, initiales) fausseraient les comparaisons.
 */
async function filmPeople(movieId) {
  const credits = await tmdb(`/movie/${movieId}/credits`);
  const ids = new Map(); // id → nom

  for (const c of (credits.cast ?? []).slice(0, CAST_LIMIT)) {
    if (c.id) ids.set(c.id, c.name);
  }
  for (const c of credits.crew ?? []) {
    if (c.id && CREW_JOBS.has(c.job)) ids.set(c.id, c.name);
  }
  return ids;
}

/** Filmographie retenue d'une personne : ses films en tant qu'acteur ou aux postes clés. */
async function personFilms(personId) {
  const credits = await tmdb(`/person/${personId}/movie_credits`);
  const films = new Map(); // id → { title, year }

  const keep = (m) => {
    if (!m.id || !m.title) return;
    // Les films sans date sont souvent des projets annoncés jamais sortis.
    if (!m.release_date) return;

    // Documentaires et apparitions « dans son propre rôle ». C'est le filtre
    // le plus important du script : Martin Scorsese apparaît comme lui-même
    // dans 243 documentaires sur cinéma, ce qui le relierait à tous leurs
    // intervenants. Sans ce filtre, 85 % de sa filmographie est du bruit — et
    // le jeu renvoie des liens absurdes du genre « Agnès Varda ↔ Tim Robbins ».
    if ((m.genre_ids ?? []).includes(99)) return;
    if (/\b(self|himself|herself)\b/i.test(m.character ?? "")) return;

    if ((m.vote_count ?? 0) < MIN_FILM_VOTES) return;

    films.set(m.id, { title: m.title, year: m.release_date.slice(0, 4) });
  };

  for (const m of credits.cast ?? []) keep(m);
  for (const m of credits.crew ?? []) {
    if (CREW_JOBS.has(m.job)) keep(m);
  }
  return films;
}

// ───────────────────────────────────────────────────────────────────────────
// Traitement d'une cible
// ───────────────────────────────────────────────────────────────────────────

async function prepareTarget(name, amorcePool) {
  const search = await tmdb("/search/person", { query: name });
  const person = (search.results ?? [])[0];
  if (!person) {
    return { name, ok: false, raison: "introuvable sur TMDB" };
  }

  const films = await personFilms(person.id);
  if (films.size < MIN_FILMS) {
    return {
      name,
      ok: false,
      raison: `seulement ${films.size} films (minimum ${MIN_FILMS})`,
    };
  }

  // Ensemble des collaborateurs : toutes les personnes croisées dans sa
  // filmographie, avec le nombre de films partagés — c'est ce nombre qui fait
  // le thermomètre du jeu, un acteur fétiche valant bien plus qu'un figurant.
  const collaborators = new Map(); // id → { nom, films }
  for (const movieId of films.keys()) {
    let people;
    try {
      people = await filmPeople(movieId);
    } catch {
      continue; // un film illisible ne doit pas faire échouer la cible
    }
    for (const [id, personName] of people) {
      if (id === person.id) continue; // la cible n'est pas sa propre collaboratrice
      const prev = collaborators.get(id);
      collaborators.set(id, {
        nom: personName,
        films: (prev?.films ?? 0) + 1,
      });
    }
  }

  if (collaborators.size < MIN_COLLABORATORS) {
    return {
      name,
      ok: false,
      raison: `seulement ${collaborators.size} collaborateurs (minimum ${MIN_COLLABORATORS})`,
    };
  }

  const strong = [...collaborators.values()].filter((c) => c.films >= 2);
  if (strong.length < MIN_STRONG_COLLABORATORS) {
    return {
      name,
      ok: false,
      raison: `seulement ${strong.length} collaborateurs récurrents (minimum ${MIN_STRONG_COLLABORATORS}) — thermomètre trop plat`,
    };
  }
  if (strong.length > MAX_STRONG_COLLABORATORS) {
    return {
      name,
      ok: false,
      raison: `${strong.length} collaborateurs récurrents (maximum ${MAX_STRONG_COLLABORATORS}) — reliée à tout le monde, thermomètre inutile`,
    };
  }

  // ─── Amorce ───────────────────────────────────────────────────────────
  // Un film qui ne contient PAS la cible et ne partage avec elle qu'UNE SEULE
  // personne. La partie test l'a montré : une amorce à trois fils invisibles
  // donne au joueur une pièce qu'il ne peut pas manipuler.
  // On collecte TOUS les candidats valides avant d'en choisir un. Prendre le
  // premier revenait à toujours servir le film le plus populaire du moment :
  // au deuxième passage, 11 cibles sur 29 avaient un Spider-Man en amorce, et
  // 13 films distincts seulement. Un joueur quotidien aurait vu la même amorce
  // toute la semaine.
  const candidates = [];
  for (const candidate of amorcePool) {
    if (films.has(candidate.id)) continue; // la cible y figure
    // Générique incomplet : un film annoncé n'a que quelques acteurs
    // renseignés et satisferait le critère « une seule personne » par défaut
    // de données, pas par vraie proximité.
    if (candidate.people.size < AMORCE_MIN_PEOPLE) continue;
    if (candidate.people.has(person.id)) continue;

    const shared = [...candidate.people.keys()].filter((id) =>
      collaborators.has(id),
    );
    if (shared.length !== 1) continue;

    const link = collaborators.get(shared[0]);
    if (link.films < AMORCE_MIN_LINK_FILMS) continue;

    candidates.push({
      tmdb_id: candidate.id,
      titre: candidate.title,
      annee: candidate.year,
      // Consignés pour vérification humaine ; jamais envoyés au navigateur.
      _lien: link.nom,
      _lien_films: link.films,
    });
  }

  if (!candidates.length) {
    return {
      name,
      ok: false,
      raison: "aucune amorce reliée par un collaborateur récurrent",
    };
  }

  // Choix déterministe : même cible, même amorce à chaque exécution, mais
  // réparti dans la liste plutôt que toujours en tête.
  const amorce = candidates[person.id % candidates.length];

  return {
    name,
    ok: true,
    tmdb_id: person.id,
    nom: person.name,
    metier: person.known_for_department ?? null,
    nb_films: films.size,
    nb_collaborateurs: collaborators.size,
    nb_collaborateurs_recurrents: strong.length,
    // Pour contrôle à l'œil : des noms invraisemblables ici trahissent une
    // pollution des données qu'aucun seuil ne détectera.
    top_collaborateurs: [...collaborators.values()]
      .sort((a, b) => b.films - a.films)
      .slice(0, 8)
      .map((c) => `${c.nom} (${c.films})`),
    amorce,
    collaborateurs: Object.fromEntries(
      [...collaborators].map(([id, v]) => [id, v]),
    ),
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Programme principal
// ───────────────────────────────────────────────────────────────────────────

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });
  API_KEY = await loadApiKey();

  const raw = await readFile(join(ROOT, "scripts", "cibles.txt"), "utf8");
  const names = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  console.log(`${names.length} cibles à préparer.\n`);

  // Réserve de films connus où chercher les amorces. Constituée une fois et
  // réutilisée pour toutes les cibles : c'est ce qui rend le script tenable.
  console.log("Constitution de la réserve d'amorces…");
  const amorcePool = [];
  const seen = new Set();

  const collectPool = async (params, pages) => {
    for (let page = 1; page <= pages; page++) {
      const list = await tmdb("/discover/movie", {
        sort_by: "popularity.desc",
        page: String(page),
        ...params,
      });
      const today = new Date().toISOString().slice(0, 10);
      for (const m of list.results ?? []) {
        if (!m.id || !m.title || !m.release_date || seen.has(m.id)) continue;
        // Films non sortis : casting incomplet, et le joueur ne les connaît
        // pas. Ils dominaient les amorces du premier passage.
        if (m.release_date > today) continue;
        if ((m.vote_count ?? 0) < AMORCE_MIN_VOTES) continue;
        seen.add(m.id);
        amorcePool.push({
          id: m.id,
          title: m.title,
          year: m.release_date.slice(0, 4),
        });
      }
    }
  };

  // Films internationaux très vus.
  await collectPool({ "vote_count.gte": "2000" }, AMORCE_POOL_PAGES);

  // ET du cinéma français, avec un seuil de votes plus bas : sans ça, une
  // cible comme Audrey Tautou ou Omar Sy ne trouverait aucune amorce, la
  // réserve étant presque entièrement anglophone.
  await collectPool(
    { "vote_count.gte": "300", with_original_language: "fr" },
    AMORCE_POOL_PAGES,
  );
  for (const film of amorcePool) {
    try {
      film.people = await filmPeople(film.id);
    } catch {
      film.people = new Map();
    }
  }
  console.log(`   ${amorcePool.length} films dans la réserve.\n`);

  const retenues = [];
  const ecartees = [];

  for (const name of names) {
    process.stdout.write(`${name} … `);
    try {
      const result = await prepareTarget(name, amorcePool);
      if (result.ok) {
        retenues.push(result);
        console.log(
          `retenue (${result.nb_films} films, ${result.nb_collaborateurs_recurrents} récurrents, amorce : ${result.amorce.titre} ${result.amorce.annee} via ${result.amorce._lien} ×${result.amorce._lien_films})`,
        );
      } else {
        ecartees.push(result);
        console.log(`ÉCARTÉE — ${result.raison}`);
      }
    } catch (err) {
      ecartees.push({ name, ok: false, raison: String(err.message ?? err) });
      console.log(`ERREUR — ${err.message ?? err}`);
    }
  }

  await writeFile(
    join(OUT_DIR, "toile-cibles.json"),
    JSON.stringify({ retenues, ecartees }, null, 2),
  );

  console.log(`\n─────────────────────────────────────────`);
  console.log(`${retenues.length} cibles retenues, ${ecartees.length} écartées.`);
  console.log(`${callCount} appels TMDB (le reste venait du cache).`);
  console.log(`Résultat : scripts/out/toile-cibles.json`);

  if (ecartees.length) {
    console.log(`\nÉcartées :`);
    for (const e of ecartees) console.log(`  · ${e.name} — ${e.raison}`);
  }
}

main().catch((err) => {
  console.error("\nÉchec :", err);
  process.exit(1);
});
