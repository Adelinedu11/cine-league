-- 007 — Détails des soumissions pour l'affichage des résultats
-- Dépend de 001 (is_league_member, round_league_id).
--
-- get_round_results(p_round_id) donne déjà les décomptes par (catégorie,
-- submission), mais la RLS de submissions interdit de lire le titre et l'auteur
-- des soumissions des AUTRES. Cette fonction SECURITY DEFINER résout, pour un
-- round, chaque submission_id -> (titre, nom du membre qui l'a soumise).
--
-- GARDE-FOUS :
--   1. le round doit être 'closed' — empêche de révéler les auteurs pendant la
--      phase de vote (l'anonymat reste total tant que ce n'est pas terminé) ;
--   2. l'appelant doit être membre de la ligue du round.

create or replace function public.round_submission_details(p_round_id uuid)
returns table(submission_id uuid, film_title text, display_name text)
language sql
security definer
set search_path = public
as $$
  select
    s.id as submission_id,
    s.film_title,
    lm.display_name
  from submissions s
  left join league_members lm
    on lm.league_id = public.round_league_id(p_round_id)
   and lm.user_id = s.user_id
  where s.round_id = p_round_id
    and public.is_league_member(public.round_league_id(p_round_id))
    and exists (
      select 1 from rounds ro
      where ro.id = p_round_id and ro.status = 'closed'
    );
$$;

grant execute on function public.round_submission_details(uuid) to authenticated;
