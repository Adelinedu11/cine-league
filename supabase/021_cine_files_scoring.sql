-- 021 — Scores et classements Ciné'Files
-- Dépend de : 001, 016, 017, 019 (profiles), 020.
--
-- Barème : le devineur gagne round(100*(16-essais)/15) points s'il trouve en
-- 1..15 essais (100 au 1er essai, ~7 au 15e), 0 sinon. L'auteur du mystère gagne
-- 100 - points_du_devineur si trouvé (dans les 15), ou 50 si jamais trouvé.
-- Le score est calculé par paire (devineur, cible), puis agrégé par joueur.

-- Points du devineur selon le nombre d'essais.
create or replace function public.compute_cine_score(_attempts int)
returns int
language sql
immutable
as $$
  select case
    when _attempts between 1 and 15 then round(100.0 * (16 - _attempts) / 15)::int
    else 0
  end;
$$;

-- Classement d'une séance Ciné'Files (uniquement si 'closed').
create or replace function public.round_cine_files_scores(_round_id uuid)
returns table(display_name text, total_points bigint)
language sql
security definer
set search_path = public
as $$
  with pairs as (
    -- une ligne par (devineur, cible) ayant au moins tenté ; meilleur essai
    -- trouvé dans la fenêtre 1..15.
    select
      g.guesser_id,
      t.user_id as author_id,
      min(g.attempt_number) filter (
        where g.found and g.attempt_number between 1 and 15
      ) as found_attempt
    from public.cine_files_guesses g
    join public.cine_files_targets t on t.id = g.target_id
    where g.round_id = _round_id
    group by g.guesser_id, t.user_id
  ),
  scored as (
    select
      guesser_id,
      author_id,
      coalesce(public.compute_cine_score(found_attempt), 0) as guesser_points,
      case when found_attempt is not null
           then 100 - public.compute_cine_score(found_attempt)
           else 50 end as author_points
    from pairs
  ),
  points as (
    select guesser_id as user_id, guesser_points as pts from scored
    union all
    select author_id as user_id, author_points as pts from scored
  )
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    sum(pt.pts)::bigint as total_points
  from points pt
  join public.league_members lm
    on lm.league_id = public.round_league_id(_round_id)
   and lm.user_id = pt.user_id
  left join public.profiles p on p.user_id = pt.user_id
  where public.is_league_member(public.round_league_id(_round_id))
    and exists (
      select 1 from public.rounds ro
      where ro.id = _round_id and ro.status = 'closed'
    )
  group by pt.user_id, lm.display_name, p.pseudo
  order by total_points desc;
$$;

grant execute on function public.round_cine_files_scores(uuid) to authenticated;

-- Classement Ciné'Files cumulé sur toutes les séances closed de la ligue.
create or replace function public.league_cine_files_history(_league_id uuid)
returns table(display_name text, total_points bigint)
language sql
security definer
set search_path = public
as $$
  with pairs as (
    select
      g.guesser_id,
      t.user_id as author_id,
      g.round_id,
      min(g.attempt_number) filter (
        where g.found and g.attempt_number between 1 and 15
      ) as found_attempt
    from public.cine_files_guesses g
    join public.cine_files_targets t on t.id = g.target_id
    join public.rounds r on r.id = g.round_id
    where r.league_id = _league_id
      and r.game_mode = 'cine_files'
      and r.status = 'closed'
      and public.is_league_member(_league_id)
    group by g.guesser_id, t.user_id, g.round_id
  ),
  scored as (
    select
      guesser_id,
      author_id,
      coalesce(public.compute_cine_score(found_attempt), 0) as guesser_points,
      case when found_attempt is not null
           then 100 - public.compute_cine_score(found_attempt)
           else 50 end as author_points
    from pairs
  ),
  points as (
    select guesser_id as user_id, guesser_points as pts from scored
    union all
    select author_id as user_id, author_points as pts from scored
  )
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    sum(pt.pts)::bigint as total_points
  from points pt
  join public.league_members lm
    on lm.league_id = _league_id and lm.user_id = pt.user_id
  left join public.profiles p on p.user_id = pt.user_id
  group by pt.user_id, lm.display_name, p.pseudo
  order by total_points desc;
$$;

grant execute on function public.league_cine_files_history(uuid) to authenticated;
