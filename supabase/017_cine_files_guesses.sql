-- 017 — Mécanique de devinette Ciné'Files
-- Dépend de : 001 (is_league_member, round_league_id), 016 (cine_files_targets).

-- 1. Tentatives de devinette.
create table if not exists public.cine_files_guesses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade,
  target_id uuid references public.cine_files_targets(id) on delete cascade,
  guesser_id uuid references auth.users(id) on delete cascade,
  guessed_tmdb_id integer,
  guessed_title text,
  feedback jsonb,
  attempt_number int,
  found boolean default false,
  guessed_at timestamptz default now()
);

create index if not exists cine_files_guesses_target_guesser_idx
  on public.cine_files_guesses (target_id, guesser_id);

-- 2. RLS
alter table public.cine_files_guesses enable row level security;

-- SELECT : un joueur ne voit QUE ses propres tentatives (jamais celles des
-- autres joueurs sur le même mystère).
drop policy if exists "cine_files_guesses_select" on public.cine_files_guesses;
create policy "cine_files_guesses_select"
on public.cine_files_guesses for select
using ( guesser_id = auth.uid() );

-- INSERT autorisé seulement si :
--   - c'est bien sa propre tentative ;
--   - round en mode cine_files et statut ≠ closed ;
--   - le joueur a déjà soumis son propre film mystère pour ce round ;
--   - la cible n'est pas sa propre soumission.
drop policy if exists "cine_files_guesses_insert" on public.cine_files_guesses;
create policy "cine_files_guesses_insert"
on public.cine_files_guesses for insert
with check (
  guesser_id = auth.uid()
  and exists (
    select 1 from public.rounds ro
    where ro.id = round_id
      and ro.game_mode = 'cine_files'
      and ro.status <> 'closed'
  )
  and exists (
    select 1 from public.cine_files_targets me
    where me.round_id = round_id and me.user_id = auth.uid()
  )
  and exists (
    select 1 from public.cine_files_targets tgt
    where tgt.id = target_id
      and tgt.round_id = round_id
      and tgt.user_id <> auth.uid()
  )
);

-- 3. Liste anonymisée des mystères à deviner (autres films du round), avec le
-- nombre de tentatives du joueur courant et s'il a trouvé. SECURITY DEFINER car
-- la RLS de cine_files_targets masque les lignes des autres avant 'closed'.
-- Ne renvoie NI le titre NI le propriétaire — juste l'id (anonymisé côté UI).
-- Vide tant que le joueur n'a pas soumis son propre film mystère.
create or replace function public.round_cine_mysteries(_round_id uuid)
returns table(target_id uuid, attempts int, found boolean)
language sql
security definer
set search_path = public
as $$
  select
    t.id as target_id,
    (
      select count(*)::int from public.cine_files_guesses g
      where g.target_id = t.id and g.guesser_id = auth.uid()
    ) as attempts,
    exists (
      select 1 from public.cine_files_guesses g
      where g.target_id = t.id and g.guesser_id = auth.uid() and g.found
    ) as found
  from public.cine_files_targets t
  where t.round_id = _round_id
    and t.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id))
    and exists (
      select 1 from public.cine_files_targets me
      where me.round_id = _round_id and me.user_id = auth.uid()
    )
  order by t.created_at, t.id;
$$;

grant execute on function public.round_cine_mysteries(uuid) to authenticated;

-- 4. Métadonnées d'une cible pour calculer le feedback côté serveur (Server
-- Action submitGuess). SECURITY DEFINER, avec les mêmes garde-fous que l'INSERT
-- des tentatives. ⚠️ Renvoie les métadonnées cachées (dont tmdb_id) : réservé au
-- calcul serveur — voir la note de sécurité dans le README.
create or replace function public.get_cine_target(_target_id uuid)
returns table(
  tmdb_id integer,
  genres text[],
  release_date date,
  director text,
  country text,
  original_language text,
  cast_names text[],
  platforms text[]
)
language sql
security definer
set search_path = public
as $$
  select
    t.tmdb_id, t.genres, t.release_date, t.director, t.country,
    t.original_language, t.cast_names, t.platforms
  from public.cine_files_targets t
  join public.rounds ro on ro.id = t.round_id
  where t.id = _target_id
    and t.user_id <> auth.uid()
    and ro.game_mode = 'cine_files'
    and ro.status <> 'closed'
    and public.is_league_member(ro.league_id)
    and exists (
      select 1 from public.cine_files_targets me
      where me.round_id = t.round_id and me.user_id = auth.uid()
    );
$$;

grant execute on function public.get_cine_target(uuid) to authenticated;
