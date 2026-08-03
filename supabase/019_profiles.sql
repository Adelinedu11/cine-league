-- 019 — Pseudo global (table profiles) + attribution des noms partout
-- Dépend de : 001, 008, 009, 011, 014, 015, 017.
--
-- 1. Table profiles : un pseudo global par utilisateur (prioritaire sur le
--    display_name par ligue). 2. Toutes les fonctions qui renvoient un nom de
--    membre passent à coalesce(profiles.pseudo, league_members.display_name).
--    3. round_cine_mysteries renvoie désormais le nom du joueur (attribution).

-- =====================================================================
-- 1. Table profiles
-- =====================================================================
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pseudo text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Lecture par tout utilisateur connecté (le pseudo n'est pas sensible).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles for select
using ( auth.role() = 'authenticated' );

-- Écriture uniquement de sa propre ligne.
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"
on public.profiles for insert
with check ( user_id = auth.uid() );

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update"
on public.profiles for update
using ( user_id = auth.uid() )
with check ( user_id = auth.uid() );

-- =====================================================================
-- 2. Fonctions de nom → coalesce(pseudo, display_name)
--    (mêmes signatures : create or replace suffit, sauf round_cine_mysteries).
-- =====================================================================

-- Liste des membres.
create or replace function public.league_members_list(_league_id uuid)
returns table(id uuid, user_id uuid, display_name text, role text)
language sql
security definer
set search_path = public
as $$
  select
    lm.id,
    lm.user_id,
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    lm.role
  from public.league_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.league_id = _league_id
    and public.is_league_member(_league_id)
  order by (lm.role = 'admin') desc,
           coalesce(nullif(btrim(p.pseudo), ''), lm.display_name);
$$;

-- Classement des victoires.
create or replace function public.league_win_history(_league_id uuid)
returns table(display_name text, wins_count bigint)
language sql
security definer
set search_path = public
as $$
  with results as (
    select
      gr.submission_id,
      gr.vote_count,
      max(gr.vote_count) over (partition by r.id, gr.category_id) as top_votes
    from public.rounds r
    cross join lateral public.get_round_results(r.id) gr
    where r.league_id = _league_id
      and r.status = 'closed'
      and public.is_league_member(_league_id)
  )
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    count(*) as wins_count
  from results w
  join public.submissions s on s.id = w.submission_id
  join public.league_members lm
    on lm.league_id = _league_id and lm.user_id = s.user_id
  left join public.profiles p on p.user_id = lm.user_id
  where w.vote_count = w.top_votes
    and w.top_votes > 0
  group by lm.user_id, lm.display_name, p.pseudo
  order by wins_count desc;
$$;

-- Générique des résultats (titre + auteur + commentaire + affiche).
create or replace function public.round_submission_details(p_round_id uuid)
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
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    s.comment,
    s.poster_path
  from submissions s
  left join league_members lm
    on lm.league_id = public.round_league_id(p_round_id)
   and lm.user_id = s.user_id
  left join public.profiles p on p.user_id = s.user_id
  where s.round_id = p_round_id
    and public.is_league_member(public.round_league_id(p_round_id))
    and exists (
      select 1 from rounds ro
      where ro.id = p_round_id and ro.status = 'closed'
    );
$$;

-- Qui a voté.
create or replace function public.round_voters(_round_id uuid)
returns table(display_name text, has_voted boolean)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    exists (
      select 1 from public.votes v
      where v.round_id = _round_id and v.voter_id = lm.user_id
    ) as has_voted
  from public.league_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.league_id = public.round_league_id(_round_id)
    and public.is_league_member(public.round_league_id(_round_id))
  order by has_voted desc,
           coalesce(nullif(btrim(p.pseudo), ''), lm.display_name);
$$;

-- Qui a soumis.
create or replace function public.round_submitters(_round_id uuid)
returns table(display_name text, has_submitted boolean)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    exists (
      select 1 from public.submissions s
      where s.round_id = _round_id and s.user_id = lm.user_id
    ) as has_submitted
  from public.league_members lm
  left join public.profiles p on p.user_id = lm.user_id
  where lm.league_id = public.round_league_id(_round_id)
    and public.is_league_member(public.round_league_id(_round_id))
  order by has_submitted desc,
           coalesce(nullif(btrim(p.pseudo), ''), lm.display_name);
$$;

-- =====================================================================
-- 3. Ciné'Files : attribution (nom du joueur) au lieu de l'anonymat.
--    Signature modifiée (ajout display_name) → drop + recreate.
-- =====================================================================
drop function if exists public.round_cine_mysteries(uuid);
create function public.round_cine_mysteries(_round_id uuid)
returns table(target_id uuid, display_name text, attempts int, found boolean)
language sql
security definer
set search_path = public
as $$
  select
    t.id as target_id,
    coalesce(nullif(btrim(p.pseudo), ''), lm.display_name) as display_name,
    (
      select count(*)::int from public.cine_files_guesses g
      where g.target_id = t.id and g.guesser_id = auth.uid()
    ) as attempts,
    exists (
      select 1 from public.cine_files_guesses g
      where g.target_id = t.id and g.guesser_id = auth.uid() and g.found
    ) as found
  from public.cine_files_targets t
  left join public.league_members lm
    on lm.league_id = public.round_league_id(_round_id) and lm.user_id = t.user_id
  left join public.profiles p on p.user_id = t.user_id
  where t.round_id = _round_id
    and t.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id))
    and exists (
      select 1 from public.cine_files_targets me
      where me.round_id = _round_id and me.user_id = auth.uid()
    )
  order by coalesce(nullif(btrim(p.pseudo), ''), lm.display_name), t.id;
$$;

grant execute on function public.round_cine_mysteries(uuid) to authenticated;
