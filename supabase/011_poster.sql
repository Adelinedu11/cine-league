-- 011 — Affiches de films (poster_path TMDB)
-- Dépend de : 001 (is_league_member, round_league_id), 008 (round_ballot),
-- 010 (round_submission_details + colonne comment).

-- Chemin d'affiche TMDB (ex. « /abc123.jpg »). L'URL complète est construite
-- côté client : https://image.tmdb.org/t/p/w200{poster_path}.
alter table public.submissions
  add column if not exists poster_path text;

-- round_ballot renvoie désormais aussi poster_path. Ajouter une colonne au type
-- de retour change la signature → DROP avant recréation.
drop function if exists public.round_ballot(uuid);
create function public.round_ballot(_round_id uuid)
returns table(
  submission_id uuid,
  film_title text,
  platforms text[],
  poster_path text
)
language sql
security definer
set search_path = public
as $$
  select s.id as submission_id, s.film_title, s.platforms, s.poster_path
  from public.submissions s
  where s.round_id = _round_id
    and s.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id));
$$;

grant execute on function public.round_ballot(uuid) to authenticated;

-- round_submission_details renvoie aussi poster_path (round 'closed' garanti).
drop function if exists public.round_submission_details(uuid);
create function public.round_submission_details(p_round_id uuid)
returns table(
  submission_id uuid,
  film_title text,
  display_name text,
  comment text,
  poster_path text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as submission_id,
    s.film_title,
    lm.display_name,
    s.comment,
    s.poster_path
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
