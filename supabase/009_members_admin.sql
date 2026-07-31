-- 009 — Support UI admin : liste des membres + exclusion
-- Dépend de : 001 (is_league_member) et 008 (colonne role, is_league_admin).
--
-- Ces deux fonctions sont en SECURITY DEFINER : elles fonctionnent quel que soit
-- l'état RLS de league_members (activée ou non). Elles rejouent elles-mêmes les
-- garde-fous, ce qui rend l'exclusion sûre même appelée directement.

-- Liste des membres d'une ligue (réservée aux membres de cette ligue).
-- Admins d'abord, puis ordre alphabétique du nom affiché.
create or replace function public.league_members_list(_league_id uuid)
returns table(id uuid, user_id uuid, display_name text, role text)
language sql
security definer
set search_path = public
as $$
  select lm.id, lm.user_id, lm.display_name, lm.role
  from public.league_members lm
  where lm.league_id = _league_id
    and public.is_league_member(_league_id)
  order by (lm.role = 'admin') desc, lm.display_name;
$$;

grant execute on function public.league_members_list(uuid) to authenticated;

-- Exclusion d'un membre : réservé aux admins de la ligue, jamais soi-même.
-- Garde-fous rejoués côté fonction (indépendants de la RLS) :
--   1. le membre doit exister ;
--   2. l'appelant doit être admin de la ligue du membre ciblé ;
--   3. un admin ne peut pas s'auto-exclure.
create or replace function public.remove_league_member(_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _target_user uuid;
begin
  select league_id, user_id
    into _league_id, _target_user
  from public.league_members
  where id = _member_id;

  if _league_id is null then
    return; -- membre introuvable : no-op silencieux
  end if;

  if not public.is_league_admin(_league_id) then
    raise exception 'Seul un admin peut exclure un membre';
  end if;

  if _target_user = auth.uid() then
    raise exception 'Un admin ne peut pas s''exclure lui-même';
  end if;

  delete from public.league_members where id = _member_id;
end;
$$;

grant execute on function public.remove_league_member(uuid) to authenticated;
