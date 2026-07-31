-- 003 — Fonctions RPC appelées par l'application
-- Dépend de : 001 (is_league_member, round_league_id) et 002 (colonnes
-- director / cast_names sur submissions).
--
-- Note : la fonction create_league(_name, _display_name) a été créée
-- directement dans Supabase ; elle n'est pas reprise ici.

-- =====================================================================
-- Doublon exact (blocage à la soumission)
-- ---------------------------------------------------------------------
-- Vrai si un AUTRE membre a déjà soumis ce tmdb_id pour ce round.
-- SECURITY DEFINER : contourne la RLS stricte de submissions sans rien
-- exposer d'autre qu'un booléen.
-- =====================================================================
create or replace function public.film_already_submitted(
  _round_id uuid,
  _tmdb_id integer
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.submissions
    where round_id = _round_id
      and tmdb_id = _tmdb_id
      and user_id <> auth.uid()
  );
$$;

-- =====================================================================
-- Chevauchement de personnes (avertissement non bloquant)
-- ---------------------------------------------------------------------
-- Pour un ensemble de personnes candidates (_people = réalisateur + casting
-- du film sélectionné), renvoie UNIQUEMENT les paires (personne, titre) en
-- commun avec les soumissions des AUTRES membres du même round.
-- Ne révèle jamais qui a soumis, ni les films sans personne en commun.
-- Réservé aux membres de la ligue (garde d'appartenance dans le WHERE).
-- =====================================================================
create or replace function public.round_credit_overlaps(
  _round_id uuid,
  _people text[]
)
returns table(person text, film_title text)
language sql
security definer
set search_path = public
as $$
  select distinct person, s.film_title
  from public.submissions s,
       unnest(
         coalesce(s.cast_names, array[]::text[])
         || case when s.director is not null then array[s.director] else array[]::text[] end
       ) as person
  where s.round_id = _round_id
    and s.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id))
    and person = any(_people);
$$;

-- =====================================================================
-- Bulletin de vote (phase voting)
-- ---------------------------------------------------------------------
-- Renvoie les films d'un round pour construire le bulletin : id + titre
-- UNIQUEMENT, jamais le user_id. Exclut la soumission du votant lui-même
-- (« sauf celui du membre connecté »). SECURITY DEFINER pour contourner la
-- RLS stricte de submissions sans jamais révéler qui a soumis quoi.
-- Réservé aux membres de la ligue.
-- =====================================================================
create or replace function public.round_ballot(_round_id uuid)
returns table(submission_id uuid, film_title text)
language sql
security definer
set search_path = public
as $$
  select s.id as submission_id, s.film_title
  from public.submissions s
  where s.round_id = _round_id
    and s.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id));
$$;
