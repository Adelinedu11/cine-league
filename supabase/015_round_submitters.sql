-- 015 — Visibilité « qui a soumis » (sans jamais révéler le film soumis)
-- Dépend de : 001 (is_league_member, round_league_id). Pendant de 014_round_voters.
--
-- Renvoie, pour un round, chaque membre de la ligue + un booléen has_submitted.
-- SÉCURITÉ / ANONYMAT : has_submitted ne s'appuie que sur l'EXISTENCE d'une
-- soumission du membre pour ce round ; jamais de film_title ni d'autre détail,
-- donc l'anonymat des soumissions reste total. Réservé aux membres de la ligue.

create or replace function public.round_submitters(_round_id uuid)
returns table(display_name text, has_submitted boolean)
language sql
security definer
set search_path = public
as $$
  select
    lm.display_name,
    exists (
      select 1 from public.submissions s
      where s.round_id = _round_id
        and s.user_id = lm.user_id
    ) as has_submitted
  from public.league_members lm
  where lm.league_id = public.round_league_id(_round_id)
    and public.is_league_member(public.round_league_id(_round_id))
  order by has_submitted desc, lm.display_name;
$$;

grant execute on function public.round_submitters(uuid) to authenticated;
