-- 020 — Stocke les métadonnées du film PROPOSÉ à chaque tentative
-- Dépend de : 016, 017, 018.
--
-- Nécessaire pour afficher les « indices confirmés » avec leur vraie valeur
-- (prise du film proposé, jamais du mystère) et pour bloquer les propositions
-- contradictoires. guess_meta = métadonnées du film deviné (public, choisi par
-- le joueur) — aucune fuite sur le mystère.

alter table public.cine_files_guesses
  add column if not exists guess_meta jsonb;

-- submit_cine_guess : idem 018, mais stocke aussi guess_meta = _guess.
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

  select count(*)::int + 1 into _attempt
  from public.cine_files_guesses
  where target_id = _target_id and guesser_id = auth.uid();

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
