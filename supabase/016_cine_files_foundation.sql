-- 016 — Fondation du mode de jeu « Ciné'Files »
-- Dépend de : 001 (is_league_member, round_league_id).
--
-- Ajoute un mode de jeu par round et une table de « films mystères » propre au
-- mode Ciné'Files (chaque membre choisit secrètement un film ; les métadonnées
-- TMDB sont mises en cache pour de futures comparaisons).

-- 1. Mode de jeu sur le round. 'competition_officielle' = mode historique.
alter table public.rounds
  add column if not exists game_mode text not null default 'competition_officielle';

alter table public.rounds
  drop constraint if exists rounds_game_mode_check;
alter table public.rounds
  add constraint rounds_game_mode_check
  check (game_mode in ('competition_officielle', 'cine_files'));

-- 2. Table des films mystères (mode Ciné'Files).
create table if not exists public.cine_files_targets (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  tmdb_id integer,
  film_title text,
  -- Métadonnées mises en cache pour la comparaison.
  genres text[],
  release_date date,
  director text,
  country text,
  original_language text,
  cast_names text[],
  platforms text[],
  created_at timestamptz default now(),
  unique (round_id, user_id) -- un seul film secret par personne par round
);

-- 3. RLS
alter table public.cine_files_targets enable row level security;

-- SELECT : sa propre ligne ; ou toutes celles du round s'il est 'closed'
-- (réservé aux membres de la ligue, pour préserver l'anonymat avant la fin).
drop policy if exists "cine_files_targets_select" on public.cine_files_targets;
create policy "cine_files_targets_select"
on public.cine_files_targets for select
using (
  user_id = auth.uid()
  or (
    public.is_league_member(public.round_league_id(round_id))
    and exists (
      select 1 from public.rounds ro
      where ro.id = round_id and ro.status = 'closed'
    )
  )
);

-- INSERT : sa propre ligne, uniquement si le round est en mode 'cine_files'
-- et en phase 'submission', et que l'utilisateur est membre de la ligue.
drop policy if exists "cine_files_targets_insert" on public.cine_files_targets;
create policy "cine_files_targets_insert"
on public.cine_files_targets for insert
with check (
  user_id = auth.uid()
  and public.is_league_member(public.round_league_id(round_id))
  and exists (
    select 1 from public.rounds ro
    where ro.id = round_id
      and ro.status = 'submission'
      and ro.game_mode = 'cine_files'
  )
);

-- UPDATE : modifier sa propre ligne, mêmes conditions de round.
drop policy if exists "cine_files_targets_update" on public.cine_files_targets;
create policy "cine_files_targets_update"
on public.cine_files_targets for update
using ( user_id = auth.uid() )
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rounds ro
    where ro.id = round_id
      and ro.status = 'submission'
      and ro.game_mode = 'cine_files'
  )
);
