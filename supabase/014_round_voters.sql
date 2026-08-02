-- 014 — Visibilité « qui a voté » (sans jamais révéler le contenu du vote)
-- Dépend de : 001 (is_league_member, round_league_id).
--
-- Renvoie, pour un round, chaque membre de la ligue + un booléen has_voted.
-- SÉCURITÉ / ANONYMAT : has_voted ne s'appuie que sur l'EXISTENCE d'au moins un
-- vote du membre pour ce round ; jamais de category_id ni de submission_id, donc
-- le contenu des votes reste secret. Réservé aux membres de la ligue.

create or replace function public.round_voters(_round_id uuid)
returns table(display_name text, has_voted boolean)
language sql
security definer
set search_path = public
as $$
  select
    lm.display_name,
    exists (
      select 1 from public.votes v
      where v.round_id = _round_id
        and v.voter_id = lm.user_id
    ) as has_voted
  from public.league_members lm
  where lm.league_id = public.round_league_id(_round_id)
    and public.is_league_member(public.round_league_id(_round_id))
  order by has_voted desc, lm.display_name;
$$;

grant execute on function public.round_voters(uuid) to authenticated;
