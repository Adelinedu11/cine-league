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

Rejouer un fichier est sans risque : fonctions en `create or replace`,
colonnes en `add column if not exists`, policies précédées de
`drop policy if exists`.

## Hors périmètre

La fonction `create_league(_name, _display_name)` a été créée directement
dans Supabase. `008_admin_and_features.sql` en fournit une **reconstruction**
(pour insérer le créateur en `admin`) : compare-la à la définition réelle en
base avant de l'exécuter. De même, `get_round_results(p_round_id)` a été créée
directement et n'est pas versionnée ; `008` en dépend sans la redéfinir.
