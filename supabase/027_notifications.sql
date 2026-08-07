-- 027 — Notifications in-app (sans push ni email)
-- Dépend de : 001 (is_league_member, round_league_id), league_members, rounds,
-- leagues.
--
-- Couvre le backlog point 12 :
--   - alerte T-1h avant l'échéance de la phase en cours d'un round ;
--   - "league lancée" (première séance créée dans la ligue) ;
--   - activité sur les jeux en cours (soumission / vote / tentative reçus).
--
-- Pas de cron : la génération se fait "à la demande", déclenchée par les
-- Server Actions existantes (création de round, soumission, vote, tentative)
-- et par un appel de synchronisation à chaque visite connectée (voir point
-- 13 — même logique que le remplacement du cron par un système à la demande).
--
-- Jamais de contenu sensible dans le message : pas de titre de film pendant
-- la phase anonyme, pas de détail de vote, pas de nom d'auteur — seule la
-- présence d'activité est signalée, comme pour "qui a voté" ailleurs dans
-- l'app (respect du principe de minimisation des données).

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  league_id uuid references public.leagues(id) on delete cascade,
  round_id uuid references public.rounds(id) on delete cascade,
  kind text not null check (kind in ('round_deadline_soon', 'league_launched', 'activity')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Un utilisateur ne voit et ne modifie (marquer comme lu) que ses propres
-- notifications. Pas de policy INSERT/DELETE : uniquement via les fonctions
-- SECURITY DEFINER ci-dessous, qui rejouent leurs propres garde-fous.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --- Alerte T-1h avant l'échéance de la phase en cours (à la demande) ---
-- Appelée depuis le layout connecté à chaque visite : parcourt les rounds
-- des ligues de l'appelant et crée une notification (une seule fois par
-- round) si l'échéance de la phase en cours tombe dans moins d'une heure.
create or replace function public.sync_round_deadline_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  r record;
  _threshold timestamptz;
begin
  if _uid is null then
    return;
  end if;

  for r in
    select ro.id, ro.league_id, ro.theme, ro.status, ro.submission_deadline, ro.ceremony_at
    from public.rounds ro
    join public.league_members lm
      on lm.league_id = ro.league_id and lm.user_id = _uid
    where ro.status in ('submission', 'voting')
  loop
    _threshold := case
      when r.status = 'submission' then r.submission_deadline
      when r.status = 'voting' then r.ceremony_at
      else null
    end;

    if _threshold is not null
      and _threshold > now()
      and _threshold <= now() + interval '1 hour'
      and not exists (
        select 1 from public.notifications n
        where n.user_id = _uid
          and n.round_id = r.id
          and n.kind = 'round_deadline_soon'
      )
    then
      insert into public.notifications (user_id, league_id, round_id, kind, message)
      values (
        _uid,
        r.league_id,
        r.id,
        'round_deadline_soon',
        'Séance « ' || r.theme || ' » : clôture dans moins d''1h'
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.sync_round_deadline_notifications() to authenticated;

-- --- Séance créée : "league lancée" (1ère séance) ou activité (suivantes) ---
-- Appelée par la Server Action de création de round, juste après l'insert.
-- Notifie tous les membres de la ligue sauf le créateur.
create or replace function public.notify_round_created(_round_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _theme text;
  _league_name text;
  _round_count int;
  _kind text;
  _message text;
begin
  select league_id, theme into _league_id, _theme
  from public.rounds where id = _round_id;

  if _league_id is null then
    return;
  end if;

  select count(*) into _round_count from public.rounds where league_id = _league_id;
  select name into _league_name from public.leagues where id = _league_id;

  if _round_count <= 1 then
    _kind := 'league_launched';
    _message := 'La ligue « ' || coalesce(_league_name, '') || ' » a lancé sa première séance : ' || _theme;
  else
    _kind := 'activity';
    _message := 'Nouvelle séance lancée : ' || _theme;
  end if;

  insert into public.notifications (user_id, league_id, round_id, kind, message)
  select lm.user_id, _league_id, _round_id, _kind, _message
  from public.league_members lm
  where lm.league_id = _league_id and lm.user_id <> auth.uid();
end;
$$;

grant execute on function public.notify_round_created(uuid) to authenticated;

-- --- Activité sur un jeu en cours (soumission / vote / tentative) ---
-- Message générique, jamais de titre de film ni de nom d'auteur (anonymat
-- des phases de soumission/vote préservé). Notifie tous les membres de la
-- ligue sauf l'auteur de l'action.
create or replace function public.notify_round_activity(_round_id uuid, _kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _theme text;
  _message text;
begin
  if _kind not in ('submission', 'vote', 'guess') then
    raise exception 'Type d''activité invalide : %', _kind;
  end if;

  select league_id, theme into _league_id, _theme
  from public.rounds where id = _round_id;

  if _league_id is null then
    return;
  end if;

  _message := case
    when _kind = 'submission' then 'Nouvelle soumission reçue pour « ' || _theme || ' »'
    when _kind = 'vote' then 'De nouveaux votes sont arrivés pour « ' || _theme || ' »'
    else 'Nouvelle tentative sur le mystère de « ' || _theme || ' »'
  end;

  insert into public.notifications (user_id, league_id, round_id, kind, message)
  select lm.user_id, _league_id, _round_id, 'activity', _message
  from public.league_members lm
  where lm.league_id = _league_id and lm.user_id <> auth.uid();
end;
$$;

grant execute on function public.notify_round_activity(uuid, text) to authenticated;

-- --- Lecture / marquage pour le badge du header ---
create or replace function public.list_recent_notifications(_limit int default 20)
returns table(
  id uuid,
  league_id uuid,
  round_id uuid,
  kind text,
  message text,
  read_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select n.id, n.league_id, n.round_id, n.kind, n.message, n.read_at, n.created_at
  from public.notifications n
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit _limit;
$$;

grant execute on function public.list_recent_notifications(int) to authenticated;

create or replace function public.mark_all_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set read_at = now()
  where user_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;
