# SQL Supabase — Ciné League

Trace versionnée du schéma applicatif, des fonctions et des policies RLS.
**Ces fichiers ne sont pas appliqués automatiquement** (pas de migrations
Supabase configurées) : il faut les exécuter à la main dans
**Supabase → SQL Editor**.

## Ordre d'exécution

Le préfixe numérique donne l'ordre, imposé par les dépendances :

| Fichier | Contenu | Dépend de |
| --- | --- | --- |
| `001_functions.sql` | `is_league_member`, `round_league_id` | — |
| `002_submissions_schema.sql` | colonnes `director`, `cast_names` sur `submissions` | — |
| `003_rpc.sql` | `film_already_submitted`, `round_credit_overlaps`, `round_ballot` | 001, 002 |
| `004_policies.sql` | policies RLS `categories`, `rounds`, `submissions` | 001 |
| `005_votes_policies.sql` | policy RLS UPDATE `votes` (anonymat : aucun SELECT) | 001 |
| `006_submit_votes.sql` | RPC `submit_votes` (upsert votes sans SELECT, contourne RLS) | 001 |
| `007_round_results.sql` | RPC `round_submission_details` (titre + auteur, round `closed`) | 001 |
| `008_admin_and_features.sql` | rôle `admin` (colonne + `create_league` + `is_league_admin` + policies DELETE), `platforms` dans `round_ballot`, RPC `league_win_history` | 001, `get_round_results` |
| `009_members_admin.sql` | RPC `league_members_list`, `remove_league_member` (SECURITY DEFINER, admin only) | 001, 008 |
| `010_comments.sql` | colonnes `comment` sur `submissions`/`votes`, `round_submission_details` (+comment), `submit_votes` (+comment), RPC `round_vote_comments` | 001, 006, 007 |
| `011_poster.sql` | colonne `poster_path` sur `submissions`, `round_ballot` (+poster_path), `round_submission_details` (+poster_path) | 001, 008, 010 |
| `012_league_admin_actions.sql` | policies UPDATE / DELETE sur `leagues` (admin : renommer / supprimer) | 008 |
| `013_find_league_by_code.sql` | RPC `find_league_by_invite_code` — ⚠️ **retirée par `028`** (résolvait un code → id sans contrôler l'adhésion derrière) | — |
| `014_round_voters.sql` | RPC `round_voters` (membres + `has_voted`, sans jamais exposer le contenu des votes) | 001 |
| `015_round_submitters.sql` | RPC `round_submitters` (membres + `has_submitted`, sans jamais exposer le film soumis) | 001 |
| `016_cine_files_foundation.sql` | colonne `game_mode` sur `rounds` + table `cine_files_targets` (films mystères) + RLS | 001 |
| `017_cine_files_guesses.sql` | table `cine_files_guesses` + RLS + RPC `round_cine_mysteries` / `get_cine_target` (mécanique de devinette) | 001, 016 |
| `018_cine_files_feedback_sql.sql` | feedback calculé 100 % en base (`submit_cine_guess`, SECURITY DEFINER, ne renvoie que le feedback) ; **remplace** `get_cine_target` (retirée) | 016, 017 |
| `019_profiles.sql` | table `profiles` (pseudo global) + RLS ; toutes les fonctions de nom passent à `coalesce(pseudo, display_name)` ; `round_cine_mysteries` renvoie le nom du joueur (attribution) | 008, 009, 011, 014, 015, 017 |
| `020_cine_guess_meta.sql` | colonne `guess_meta` sur `cine_files_guesses` (métadonnées du film proposé) + `submit_cine_guess` la stocke — pour indices confirmés & blocage des contradictions | 016, 017, 018 |
| `021_cine_files_scoring.sql` | `compute_cine_score`, `round_cine_files_scores`, `league_cine_files_history` (barème + classements Ciné'Files) | 016, 017, 019, 020 |
| `022_cine_files_scoring_v2.sql` | barème v2 (20 essais : 1-14 formule, 15-20 → 10/50, non trouvé → 0/0) + garde ≤20 dans `submit_cine_guess` | 021 |
| `023_cine_files_hints.sql` | table `cine_files_hints` + RLS + `request_cine_bonus_hint` (indice bonus acteur dès la 10e tentative) | 016, 017, 020 |
| `024_cine_files_detail.sql` | `round_cine_files_detail` / `league_cine_files_detail` (récap détaillé séance + ligue) | 016, 017, 019, 020, 022 |
| `025_cine_files_scoring_10_10.sql` | palier 15-20 essais → auteur 10 pts (au lieu de 50) dans les 4 fonctions de score | 022, 024 |
| `026_update_round_dates.sql` | RPC `update_round_dates` (admin : modifie `submission_deadline` / `ceremony_at`, valide cérémonie > soumission, ne touche pas au statut) | 001, 008 |
| `027_notifications.sql` | table `notifications` + RLS + RPC `sync_round_deadline_notifications` (alerte T-1h, à la demande), `notify_round_created` (league lancée / activité), `notify_round_activity` (soumission/vote/tentative), `list_recent_notifications`, `mark_all_notifications_read` | 001 |
| `028_public_league.sql` | colonne `is_public` + league « Ciné League Officielle » (unicité garantie par index partiel), policy de lecture publique, **fermeture réelle des leagues privées** (l'insertion directe dans `league_members` n'est plus permise que vers la league publique ; les privées passent par `join_league_by_code`, qui vérifie le code en base), trigger d'adhésion auto à l'inscription + rattrapage des comptes existants | 001, 008, 013, 019 |
| `029_toile.sql` | **La Toile** (jeu quotidien) : tables `toile_targets` / `toile_collaborators` / `toile_films` / `toile_film_people`, RLS totalement fermée sur les cibles, RPC `toile_du_jour`, `toile_essai_film`, `toile_essai_personne`, `toile_reveler`, `toile_programmer`. La cible ne sort jamais de la base. | — |
| `030_toile_indices.sql` | Échelle d'indices de La Toile : colonnes `indice_epoque` / `indice_pays` / `indice_nb_films` + RPC `toile_indice(_jour, _rang)`. Paliers 10/15/20 vérifiés côté interface seulement — aucun indice ne révèle la cible à lui seul. | 029 |
| `031_retrait_league_publique.sql` | **Défait la league publique de `028`** (trigger d'adhésion auto, league officielle, colonne `is_public`, `public_league_id`), remplacée par La Toile. **Garde le vrai apport de 028** : plus aucune policy d'insertion sur `league_members`, l'adhésion passe exclusivement par `create_league()` et `join_league_by_code()`. | 028, 029 |
| `032_categories_par_ligue.sql` | Catégories choisies par ligue (5 max) : colonne `league_id` sur `categories` (null = catalogue commun), tables `league_categories` (sélection) et `round_categories` (photo prise au lancement par déclencheur), RPC `set_league_categories`, `create_league_category`, `round_categories_list`, `league_categories_options`. **On ne supprime jamais une ligne de `categories`** — `get_round_results` y joint les votes pour le nom affiché. | 001, 008 |
| `033_categories_competition_seulement.sql` | Le déclencheur de photo ignore les séances qui ne sont pas en Compétition officielle (Ciné'Files n'a pas de catégories), et nettoie les photos inutiles posées par `032` — sauf sur les séances ayant des votes. | 032 |
| `034_categories_par_seance.sql` | Le choix des catégories passe de la configuration de la ligue à l'ouverture d'une séance ; `league_categories` devient la mémoire du dernier choix (pré-remplissage du formulaire suivant). | 032, 033 |
| `035_cron_avancement_rounds.sql` | **Avancement automatique des séances.** `advance_due_rounds()` fait basculer submission → voting → closed dès l'échéance dépassée (Ciné'Files : submission → closed), notifie tous les membres (`kind` `phase_changed`, nouveau) ; job `pg_cron` « avancer-rounds » chaque minute + rattrapage au chargement du layout connecté. `update_round_dates` **remplace** celle de `026` : accepte une date passée (= clôturer maintenant), ignore `submission_deadline` hors phase de soumission, refuse une séance déjà `closed`. Le bouton « faire avancer » a disparu de l'interface. | 001, 008, 026, 027 |
| `036_commentaires_bulletin.sql` | `round_ballot` (+`comment`) : le commentaire de soumission (« commentaire du directeur ») est visible dès la phase de vote, **sans son auteur** — l'attribution reste réservée à la cérémonie | 001, 010, 011 |

Rejouer un fichier est sans risque : fonctions en `create or replace`,
colonnes en `add column if not exists`, policies précédées de
`drop policy if exists`.

## Extensions à activer

`035` est le premier fichier à dépendre d'une extension. **Activer `pg_cron`
avant de le jouer** : Supabase → Database → Extensions → `pg_cron`. Le
`create extension if not exists pg_cron` présent dans le fichier suffit en
principe, mais le dashboard est la voie recommandée par Supabase.

⚠️ Les jobs `pg_cron` **ne tournent pas** quand le projet est en pause — ce qui
arrive après 7 jours d'inactivité sur le plan gratuit. D'où l'appel de
rattrapage à `advance_due_rounds()` dans `src/app/leagues/layout.tsx` : la
première visite après un réveil remet les séances à la bonne phase.

Vérifier le job :

```sql
select jobid, jobname, schedule, active from cron.job;
select jobid, status, return_message, start_time
  from cron.job_run_details order by start_time desc limit 10;
```

## Hors périmètre

`create_league(_name, _display_name)`, `get_round_results(p_round_id)` et
`round_ballot(_round_id)` ont été créées directement dans Supabase et ne sont
versionnées nulle part. **Leurs définitions réelles ont été relevées en base le
28/08/2026** et vérifiées — ce ne sont plus des suppositions :

- `create_league` correspond exactement à la reconstruction de `008`.
- `get_round_results` regroupe par `votes.category_id` en joignant `categories`
  pour retrouver le nom affiché. D'où l'interdiction de supprimer une catégorie
  (voir `032`). Conséquence connexe : **une catégorie sans aucun vote
  n'apparaît pas au palmarès**.
- `round_ballot` renvoie les soumissions de la séance sauf la sienne.

Pour les relire à tout moment :

```sql
select pg_get_functiondef(oid) from pg_proc
where proname in ('get_round_results', 'create_league', 'round_ballot')
  and pronamespace = 'public'::regnamespace;
```
