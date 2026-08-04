-- 023 — Ciné'Files : indices bonus (acteur aléatoire) à partir de la 10e tentative
-- Dépend de : 001, 016, 017, 020.
--
-- À partir de la 10e tentative (≥ 9 faites), le devineur peut demander un indice
-- bonus : on tire au hasard un acteur du casting complet de la cible parmi ceux
-- pas encore révélés (via l'indice « casting » ou un précédent bonus). L'indice
-- vient de TMDB (cast_names de la cible), pas d'une saisie de l'auteur.

create table if not exists public.cine_files_hints (
  id uuid primary key default gen_random_uuid(),
  round_id uuid references public.rounds(id) on delete cascade,
  target_id uuid references public.cine_files_targets(id) on delete cascade,
  guesser_id uuid references auth.users(id) on delete cascade,
  actor_name text,
  revealed_at timestamptz default now()
);

create index if not exists cine_files_hints_target_guesser_idx
  on public.cine_files_hints (target_id, guesser_id);

alter table public.cine_files_hints enable row level security;

-- SELECT : le joueur ne voit que ses propres indices. Écriture uniquement via la
-- fonction SECURITY DEFINER ci-dessous (aucune policy INSERT côté client).
drop policy if exists "cine_files_hints_select" on public.cine_files_hints;
create policy "cine_files_hints_select"
on public.cine_files_hints for select
using ( guesser_id = auth.uid() );

-- Tire et enregistre un acteur bonus. Renvoie l'acteur, ou NULL si plus aucun
-- acteur à révéler. Ne renvoie jamais le casting complet de la cible.
create or replace function public.request_cine_bonus_hint(_target_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.cine_files_targets%rowtype;
  ro public.rounds%rowtype;
  _attempts int;
  _actor text;
begin
  select * into t from public.cine_files_targets where id = _target_id;
  if not found then
    raise exception 'Cible introuvable';
  end if;
  select * into ro from public.rounds where id = t.round_id;

  -- Mêmes garde-fous que les tentatives.
  if t.user_id = auth.uid()
     or ro.game_mode <> 'cine_files'
     or ro.status = 'closed'
     or not public.is_league_member(ro.league_id)
     or not exists (
       select 1 from public.cine_files_targets me
       where me.round_id = t.round_id and me.user_id = auth.uid()
     )
  then
    raise exception 'Indice non autorisé';
  end if;

  -- Déjà trouvé : plus d'indice.
  if exists (
    select 1 from public.cine_files_guesses
    where target_id = _target_id and guesser_id = auth.uid() and found
  ) then
    raise exception 'Film déjà trouvé';
  end if;

  -- Éligibilité : à partir de la 10e tentative (≥ 9 tentatives faites).
  select count(*)::int into _attempts
  from public.cine_files_guesses
  where target_id = _target_id and guesser_id = auth.uid();
  if _attempts < 9 then
    raise exception 'Indice bonus disponible à partir de la 10e tentative';
  end if;

  -- Acteur au hasard parmi le casting non encore révélé (casting + bonus passés).
  with revealed as (
    select lower(btrim(a)) as name
    from public.cine_files_guesses g,
         jsonb_array_elements_text(
           coalesce(g.feedback -> 'actors' -> 'shared', '[]'::jsonb)
         ) a
    where g.target_id = _target_id and g.guesser_id = auth.uid()
    union
    select lower(btrim(h.actor_name))
    from public.cine_files_hints h
    where h.target_id = _target_id and h.guesser_id = auth.uid()
  )
  select x into _actor
  from unnest(coalesce(t.cast_names, '{}')) x
  where btrim(x) <> '' and lower(btrim(x)) not in (select name from revealed)
  order by random()
  limit 1;

  if _actor is null then
    return null; -- plus d'acteur à révéler
  end if;

  insert into public.cine_files_hints (round_id, target_id, guesser_id, actor_name)
  values (t.round_id, _target_id, auth.uid(), _actor);

  return _actor;
end;
$$;

grant execute on function public.request_cine_bonus_hint(uuid) to authenticated;
