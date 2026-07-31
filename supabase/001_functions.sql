-- 001 — Fonctions de base (aucune dépendance entre elles)
-- À exécuter en premier : les policies (004) et les RPC (003) en dépendent.
--
-- Toutes en SECURITY DEFINER : elles s'exécutent avec les droits du
-- propriétaire et contournent donc la RLS, ce qui évite les récursions de
-- policy (erreur Postgres 42P17) quand une policy doit tester l'appartenance.

-- Vrai si l'utilisateur courant est membre de la ligue donnée.
create or replace function public.is_league_member(_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = _league_id and user_id = auth.uid()
  );
$$;

-- Ligue à laquelle appartient un round (submissions n'a pas de league_id ;
-- on remonte au round pour retrouver la ligue).
create or replace function public.round_league_id(_round_id uuid)
returns uuid
language sql
security definer
set search_path = public
as $$
  select league_id from public.rounds where id = _round_id;
$$;
