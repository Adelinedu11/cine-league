/**
 * Chargement des cibles de La Toile dans Supabase.
 *
 * Lit scripts/out/toile-cibles.json (produit par prepare-toile.mjs) et le
 * réinjecte dans `toile_targets` + `toile_collaborators`.
 *
 * Lancer avec :  node scripts/seed-toile.mjs
 *
 * ─── Pourquoi un script plutôt qu'un gros fichier SQL ──────────────────────
 * 28 cibles et 11 543 lignes de collaborateurs feraient un SQL d'environ un
 * méga-octet à coller dans l'éditeur Supabase — pénible, et à refaire à chaque
 * fois que tu retouches ta liste de noms. Ce script est rejouable à volonté.
 *
 * ─── La clé de service ─────────────────────────────────────────────────────
 * La RLS de `toile_targets` est totalement fermée : aucune policy de lecture ni
 * d'écriture, c'est ce qui garantit que la réponse du jour ne peut pas fuir.
 * Écrire dedans demande donc la clé `service_role`, qui contourne la RLS.
 *
 * ⚠️ Cette clé donne un accès TOTAL à ta base. Elle ne doit jamais partir vers
 * un navigateur, jamais apparaître dans une variable NEXT_PUBLIC_*, jamais
 * être commitée. `.env.local` est déjà ignoré par git.
 *
 * À récupérer dans Supabase → Project Settings → API → service_role, puis à
 * ajouter dans .env.local :
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function env(name) {
  const raw = await readFile(join(ROOT, ".env.local"), "utf8");
  const line = raw.split("\n").find((l) => l.trim().startsWith(`${name}=`));
  if (!line) throw new Error(`${name} absente de .env.local`);
  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const URL_BASE = await env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = await env("SUPABASE_SERVICE_ROLE_KEY");

/** Appel PostgREST avec la clé de service. */
async function rest(path, { method = "POST", body, prefer } = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status} ${await res.text()}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function main() {
  const data = JSON.parse(
    await readFile(join(ROOT, "scripts", "out", "toile-cibles.json"), "utf8"),
  );
  const cibles = data.retenues;
  console.log(`${cibles.length} cibles à charger.\n`);

  for (const c of cibles) {
    // upsert sur tmdb_person_id : relancer le script met à jour au lieu de
    // dupliquer, et n'écrase pas play_date si la cible est déjà programmée.
    const [row] = await rest(
      "toile_targets?on_conflict=tmdb_person_id&select=id",
      {
        prefer: "resolution=merge-duplicates,return=representation",
        body: [
          {
            tmdb_person_id: c.tmdb_id,
            nom: c.nom,
            metier: c.metier,
            amorce_tmdb_id: c.amorce.tmdb_id,
            amorce_titre: c.amorce.titre,
            amorce_annee: c.amorce.annee,
            indice_epoque: c.indice_epoque,
            indice_pays: c.indice_pays,
            indice_nb_films: c.indice_nb_films,
          },
        ],
      },
    );

    const collaborateurs = Object.entries(c.collaborateurs).map(
      ([personId, v]) => ({
        target_id: row.id,
        tmdb_person_id: Number(personId),
        nom: v.nom,
        films: v.films,
      }),
    );

    // Par paquets : une seule requête de 2 000 lignes passe mal, et un échec
    // en fin de course laisserait une cible à moitié chargée.
    const TAILLE = 500;
    for (let i = 0; i < collaborateurs.length; i += TAILLE) {
      await rest(
        "toile_collaborators?on_conflict=target_id,tmdb_person_id",
        {
          prefer: "resolution=merge-duplicates,return=minimal",
          body: collaborateurs.slice(i, i + TAILLE),
        },
      );
    }

    console.log(`${c.nom.padEnd(22)} ${collaborateurs.length} collaborateurs`);
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`${cibles.length} cibles chargées.`);
  console.log(
    `Programme ensuite les journées dans le SQL Editor :\n` +
      `   select public.toile_programmer(current_date);`,
  );
}

main().catch((err) => {
  console.error("\nÉchec :", err.message ?? err);
  process.exit(1);
});
