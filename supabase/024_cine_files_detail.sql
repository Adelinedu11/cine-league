-- 024 — Ciné'Files : récap détaillé (séance + ligue)
-- Dépend de : 016, 017, 019, 020, 022.
--
-- Deux fonctions SECURITY DEFINER (rounds closed uniquement) qui renvoient un
-- récap self-contained par joueur (les tentatives des autres sont RLS-privées,
-- d'où le definer) : points, film secret, et détail des mystères / séances.

-- Détail d'une séance close : par joueur → points, son film secret, et la liste
-- des mystères qu'il a tentés (auteur, trouvé, nb essais, film proposé montré).
create or replace function public.round_cine_files_detail(_round_id uuid)
returns table(
  display_name text,
  total_points bigint,
  secret_title text,
  mysteries jsonb
)
language sql
security definer
set search_path = public
as $$
  with players as (
    select distinct t.user_id
    from public.cine_files_targets t
    where t.round_id = _round_id
  ),
  pairs as (
    select
      g.guesser_id,
      tt.user_id as author_id,
      min(g.attempt_number) filter (
        where g.found and g.attempt_number between 1 and 20
      ) as found_attempt
    from public.cine_files_guesses g
    join public.cine_files_targets tt on tt.id = g.target_id
    where g.round_id = _round_id
    group by g.guesser_id, tt.user_id
  ),
  scored as (
    select
      guesser_id,
      author_id,
      coalesce(public.compute_cine_score(found_attempt), 0) as gp,
      case
        when found_attempt between 1 and 14 then 100 - public.compute_cine_score(found_attempt)
        when found_attempt between 15 and 20 then 50
        else 0
      end as ap
    from pairs
  ),
  points as (
    select guesser_id as user_id, gp as pts from scored
    union all
    select author_id as user_id, ap as pts from scored
  ),
  ptotal as (
    select user_id, sum(pts)::bigint as total from points group by user_id
  ),
  best_guess as (
    select
      g.guesser_id,
      tt.user_id as author_id,
      bool_or(g.found) as found,
      count(*)::int as attempts,
      coalesce(
        (array_agg(g.guessed_title order by g.attempt_number)
          filter (where g.found))[1],
        (array_agg(g.guessed_title order by g.attempt_number desc))[1]
      ) as shown_title
    from public.cine_files_guesses g
    join public.cine_files_targets tt on tt.id = g.target_id
    where g.round_id = _round_id
    group by g.guesser_id, tt.user_id
  ),
  myst as (
    select
      bg.guesser_id,
      jsonb_agg(
        jsonb_build_object(
          'author', coalesce(nullif(btrim(pa.pseudo), ''), la.display_name),
          'found', bg.found,
          'attempts', bg.attempts,
          'guessedTitle', bg.shown_title
        )
        order by coalesce(nullif(btrim(pa.pseudo), ''), la.display_name)
      ) as mysteries
    from best_guess bg
    left join public.league_members la
      on la.league_id = public.round_league_id(_round_id) and la.user_id = bg.author_id
    left join public.profiles pa on pa.user_id = bg.author_id
    group by bg.guesser_id
  )
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    coalesce(pt.total, 0) as total_points,
    t.film_title as secret_title,
    coalesce(m.mysteries, '[]'::jsonb) as mysteries
  from players pl
  join public.cine_files_targets t
    on t.round_id = _round_id and t.user_id = pl.user_id
  join public.league_members lm
    on lm.league_id = public.round_league_id(_round_id) and lm.user_id = pl.user_id
  left join public.profiles p on p.user_id = pl.user_id
  left join ptotal pt on pt.user_id = pl.user_id
  left join myst m on m.guesser_id = pl.user_id
  where public.is_league_member(public.round_league_id(_round_id))
    and exists (
      select 1 from public.rounds ro
      where ro.id = _round_id and ro.status = 'closed'
    )
  order by total_points desc, display_name;
$$;

grant execute on function public.round_cine_files_detail(uuid) to authenticated;

-- Détail ligue : par joueur → points cumulés + détail par séance close
-- (thème, film secret, nb de mystères trouvés, points de la séance).
create or replace function public.league_cine_files_detail(_league_id uuid)
returns table(display_name text, total_points bigint, rounds jsonb)
language sql
security definer
set search_path = public
as $$
  with pairs as (
    select
      r.id as round_id,
      r.theme,
      g.guesser_id,
      tt.user_id as author_id,
      min(g.attempt_number) filter (
        where g.found and g.attempt_number between 1 and 20
      ) as found_attempt
    from public.cine_files_guesses g
    join public.cine_files_targets tt on tt.id = g.target_id
    join public.rounds r on r.id = g.round_id
    where r.league_id = _league_id
      and r.game_mode = 'cine_files'
      and r.status = 'closed'
      and public.is_league_member(_league_id)
    group by r.id, r.theme, g.guesser_id, tt.user_id
  ),
  scored as (
    select
      round_id, theme, guesser_id, author_id,
      (found_attempt is not null) as found,
      coalesce(public.compute_cine_score(found_attempt), 0) as gp,
      case
        when found_attempt between 1 and 14 then 100 - public.compute_cine_score(found_attempt)
        when found_attempt between 15 and 20 then 50
        else 0
      end as ap
    from pairs
  ),
  round_points as (
    select round_id, guesser_id as user_id, gp as pts from scored
    union all
    select round_id, author_id as user_id, ap as pts from scored
  ),
  per_round_points as (
    select round_id, user_id, sum(pts)::bigint as pts
    from round_points group by round_id, user_id
  ),
  per_round_found as (
    select round_id, guesser_id as user_id, count(*) filter (where found)::int as found_count
    from scored group by round_id, guesser_id
  ),
  -- base : chaque (joueur, séance) où il a un film secret
  base as (
    select t.user_id, t.round_id, r.theme, t.film_title as secret_title
    from public.cine_files_targets t
    join public.rounds r on r.id = t.round_id
    where r.league_id = _league_id
      and r.game_mode = 'cine_files'
      and r.status = 'closed'
  ),
  per_player as (
    select
      b.user_id,
      sum(coalesce(prp.pts, 0))::bigint as total_points,
      jsonb_agg(
        jsonb_build_object(
          'theme', b.theme,
          'secretTitle', b.secret_title,
          'mysteriesFound', coalesce(prf.found_count, 0),
          'points', coalesce(prp.pts, 0)
        )
        order by b.theme
      ) as rounds
    from base b
    left join per_round_points prp on prp.round_id = b.round_id and prp.user_id = b.user_id
    left join per_round_found prf on prf.round_id = b.round_id and prf.user_id = b.user_id
    group by b.user_id
  )
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    pp.total_points,
    pp.rounds
  from per_player pp
  join public.league_members lm
    on lm.league_id = _league_id and lm.user_id = pp.user_id
  left join public.profiles p on p.user_id = pp.user_id
  where public.is_league_member(_league_id)
  order by pp.total_points desc, display_name;
$$;

grant execute on function public.league_cine_files_detail(uuid) to authenticated;
