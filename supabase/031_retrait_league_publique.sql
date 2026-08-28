-- 031 — Retrait de la league publique, remplacée par La Toile
-- Dépend de : 028 (qu'elle défait en partie), 029/030 (La Toile).
--
-- La league « Ciné League Officielle » existait pour donner quelque chose à
-- faire aux inscrits sans amis. C'est désormais le rôle de La Toile, et le
-- quotidien le remplit mieux : une league d'inconnus a un coût d'animation
-- récurrent (quelqu'un doit ouvrir une séance chaque semaine, pour toujours) et
-- sa valeur vient de connaître les autres joueurs — ce qui n'est jamais le cas.
--
-- ⚠️ CE QU'ON GARDE DE 028, ET QUI ÉTAIT SON VRAI APPORT :
-- la fermeture des leagues privées. Avant elle, la policy d'insertion sur
-- `league_members` vérifiait QUI s'inscrit mais jamais DANS QUELLE league :
-- n'importe quel utilisateur connaissant un UUID pouvait s'ajouter à n'importe
-- quelle league. `join_league_by_code()` reste le seul chemin d'entrée, et il
-- vérifie le code en base.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Plus d'adhésion automatique à l'inscription
-- =====================================================================

drop trigger if exists on_auth_user_created_join_public on auth.users;
drop function if exists public.join_public_league_on_signup();

-- =====================================================================
-- 2. Suppression de la league publique et de ses membres
-- =====================================================================
-- Les adhésions d'abord : on ne présume pas d'un ON DELETE CASCADE sur une
-- table créée hors migration.

delete from public.league_members
where league_id in (select id from public.leagues where is_public);

delete from public.leagues where is_public;

-- =====================================================================
-- 3. Retour à des policies simples
-- =====================================================================

-- Lecture des leagues : réservée à leurs membres, sans exception.
drop policy if exists "leagues_select_public" on public.leagues;

-- Lecture des membres : idem.
drop policy if exists "league_members_select_same_league" on public.league_members;
create policy "league_members_select_same_league"
on public.league_members for select
using ( public.is_league_member(league_id) );

-- Adhésion : PLUS AUCUNE policy d'insertion. C'est volontaire et c'est le
-- réglage le plus sûr — il ne reste littéralement aucun moyen de s'ajouter à
-- une league depuis le navigateur. Les deux chemins légitimes sont des
-- fonctions SECURITY DEFINER, qui ne sont pas soumises à la RLS :
--   · create_league()      → insère le créateur en admin,
--   · join_league_by_code() → insère après vérification du code.
drop policy if exists "league_members_insert_public_only" on public.league_members;
drop policy if exists "league_members_insert_own" on public.league_members;

-- =====================================================================
-- 4. Nettoyage du schéma
-- =====================================================================
-- L'index partiel doit tomber avant la colonne qu'il indexe.

drop index if exists public.leagues_single_public;
drop function if exists public.public_league_id();

alter table public.leagues drop column if exists is_public;
