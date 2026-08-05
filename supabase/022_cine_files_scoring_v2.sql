-- 022 — Ciné'Files : 20 essais + nouveau palier de score
-- Dépend de : 016, 017, 018, 019, 020, 021.
--
-- Barème v2 (par paire devineur/cible) :
--   • trouvé en 1..14  → devineur round(100*(16-essais)/15), auteur 100 - ce score
--   • trouvé en 15..20 → devineur 10, auteur 50
--   • jamais trouvé (jusqu'à 20 essais) → devineur 0, auteur 0
-- Et on plafonne à 20 tentatives par (devineur, cible), et on bloque après une
-- tentative trouvée.

-- Points du devineur selon le nombre d'essais.
create or replace function public.compute_cine_score(_attempts int)
returns int
language sql
immutable
as $$
  select case
    when _attempts between 1 and 14 then round(100.0 * (16 - _attempts) / 15)::int
    when _attempts between 15 and 20 then 10
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
    select
      g.guesser_id,
      t.user_id as author_id,
      min(g.attempt_number) filter (
        where g.found and g.attempt_number between 1 and 20
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
      case
        when found_attempt between 1 and 14
          then 100 - public.compute_cine_score(found_attempt)
        when found_attempt between 15 and 20 then 50
        else 0
      end as author_points
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
        where g.found and g.attempt_number between 1 and 20
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
      case
        when found_attempt between 1 and 14
          then 100 - public.compute_cine_score(found_attempt)
        when found_attempt between 15 and 20 then 50
        else 0
      end as author_points
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

-- submit_cine_guess : idem 020, + plafond de 20 essais et blocage post-trouvé.
create or replace function public.submit_cine_guess(
  _target_id uuid,
  _guessed_tmdb_id integer,
  _guessed_title text,
  _guess jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.cine_files_targets%rowtype;
  ro public.rounds%rowtype;
  g_genres    text[] := coalesce(array(select jsonb_array_elements_text(_guess->'genres')), '{}');
  g_cast      text[] := coalesce(array(select jsonb_array_elements_text(_guess->'castNames')), '{}');
  g_platforms text[] := coalesce(array(select jsonb_array_elements_text(_guess->'platforms')), '{}');
  g_release text := nullif(_guess->>'releaseDate', '');
  g_director text := nullif(_guess->>'director', '');
  g_country text := nullif(_guess->>'country', '');
  g_lang text := nullif(_guess->>'originalLanguage', '');
  shared_genres text[];
  shared_cast text[];
  shared_platforms text[];
  genre_result text;
  g_year int; t_year int;
  g_decade int; t_decade int;
  fb jsonb;
  _found boolean;
  _existing int;
  _attempt int;
begin
  select * into t from public.cine_files_targets where id = _target_id;
  if not found then
    raise exception 'Cible introuvable';
  end if;
  select * into ro from public.rounds where id = t.round_id;

  if t.user_id = auth.uid()
     or ro.game_mode <> 'cine_files'
     or ro.status = 'closed'
     or not public.is_league_member(ro.league_id)
     or not exists (
       select 1 from public.cine_files_targets me
       where me.round_id = t.round_id and me.user_id = auth.uid()
     )
  then
    raise exception 'Tentative non autorisée';
  end if;

  -- Blocage post-victoire et plafond de 20 essais.
  select count(*)::int into _existing
  from public.cine_files_guesses
  where target_id = _target_id and guesser_id = auth.uid();

  -- Alias cg + colonne qualifiée : `found` seul serait pris pour la variable
  -- plpgsql spéciale FOUND (bug), pas pour la colonne.
  if exists (
    select 1 from public.cine_files_guesses cg
    where cg.target_id = _target_id and cg.guesser_id = auth.uid() and cg.found
  ) then
    raise exception 'Film déjà trouvé';
  end if;

  if _existing >= 20 then
    raise exception 'Nombre d''essais épuisé';
  end if;

  shared_genres := coalesce(array(
    select distinct x from unnest(g_genres) x
    where lower(btrim(x)) = any (
      select lower(btrim(y)) from unnest(coalesce(t.genres, '{}')) y
    )
  ), '{}');
  shared_cast := coalesce(array(
    select distinct x from unnest(g_cast) x
    where lower(btrim(x)) = any (
      select lower(btrim(y)) from unnest(coalesce(t.cast_names, '{}')) y
    )
  ), '{}');
  shared_platforms := coalesce(array(
    select distinct x from unnest(g_platforms) x
    where lower(btrim(x)) = any (
      select lower(btrim(y)) from unnest(coalesce(t.platforms, '{}')) y
    )
  ), '{}');

  if array_length(shared_genres, 1) is null then
    genre_result := 'none';
  elsif (
    select array(select distinct lower(btrim(x)) from unnest(g_genres) x order by 1)
  ) = (
    select array(select distinct lower(btrim(y)) from unnest(coalesce(t.genres, '{}')) y order by 1)
  ) then
    genre_result := 'exact';
  else
    genre_result := 'partial';
  end if;

  g_year := nullif(left(coalesce(g_release, ''), 4), '')::int;
  t_year := case when t.release_date is null then null
                 else extract(year from t.release_date)::int end;
  g_decade := case when g_year is null then null else (g_year / 10) * 10 end;
  t_decade := case when t_year is null then null else (t_year / 10) * 10 end;

  fb := jsonb_build_object(
    'genre', jsonb_build_object('result', genre_result, 'shared', to_jsonb(shared_genres)),
    'decade', public._cine_dir(t_decade, g_decade),
    'releaseYear', public._cine_dir(t_year, g_year),
    'director', (g_director is not null and t.director is not null
                 and lower(btrim(g_director)) = lower(btrim(t.director))),
    'country', (g_country is not null and t.country is not null
                and lower(btrim(g_country)) = lower(btrim(t.country))),
    'language', (g_lang is not null and t.original_language is not null
                 and lower(btrim(g_lang)) = lower(btrim(t.original_language))),
    'actors', jsonb_build_object(
      'sharedCount', coalesce(array_length(shared_cast, 1), 0),
      'shared', to_jsonb(shared_cast)),
    'platforms', jsonb_build_object(
      'sharedCount', coalesce(array_length(shared_platforms, 1), 0),
      'shared', to_jsonb(shared_platforms))
  );

  _found := t.tmdb_id is not null and _guessed_tmdb_id = t.tmdb_id;
  _attempt := _existing + 1;

  insert into public.cine_files_guesses (
    round_id, target_id, guesser_id, guessed_tmdb_id, guessed_title,
    feedback, guess_meta, attempt_number, found
  )
  values (
    t.round_id, _target_id, auth.uid(), _guessed_tmdb_id, _guessed_title,
    fb, _guess, _attempt, _found
  );

  return fb;
end;
$$;

grant execute on function public.submit_cine_guess(uuid, integer, text, jsonb)
  to authenticated;
