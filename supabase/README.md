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
| `013_find_league_by_code.sql` | RPC `find_league_by_invite_code` (résout un code → id, contourne la RLS pour `joinLeague`) | — |
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

Rejouer un fichier est sans risque : fonctions en `create or replace`,
colonnes en `add column if not exists`, policies précédées de
`drop policy if exists`.

## Hors périmètre

La fonction `create_league(_name, _display_name)` a été créée directement
dans Supabase. `008_admin_and_features.sql` en fournit une **reconstruction**
(pour insérer le créateur en `admin`) : compare-la à la définition réelle en
base avant de l'exécuter. De même, `get_round_results(p_round_id)` a été créée
directement et n'est pas versionnée ; `008` en dépend sans la redéfinir.
