-- 035 — Avancement automatique des séances (pg_cron)
-- Dépend de : 001 (round_league_id, is_league_admin via 008), rounds,
-- league_members, notifications (027), update_round_dates (026).
--
-- CHANGEMENT DE PARTI PRIS. Jusqu'ici le projet n'avait aucun cron : le
-- passage submission → voting → closed était déclenché à la main par un
-- membre, et le bouton n'était actif qu'une fois l'échéance dépassée (backlog
-- point 13, « tic-tac-boom »). Problème : si personne ne cliquait, la séance
-- restait bloquée — un compte à rebours qui n'expire pas ne sert à rien.
--
-- Désormais :
--   - `advance_due_rounds()` fait basculer toute séance dont l'échéance de la
--     phase en cours est dépassée. C'est la SEULE façon de changer de phase ;
--     le bouton « faire avancer » a été retiré de l'interface.
--   - un job pg_cron l'appelle chaque minute ;
--   - la même fonction est aussi appelée à chaque visite connectée (voir
--     src/app/leagues/layout.tsx) : filet de sécurité si pg_cron ne tourne
--     pas — typiquement un projet Supabase mis en pause après 7 jours
--     d'inactivité, pendant lesquels aucun job planifié n'est exécuté.
--   - l'admin de la ligue ne pilote plus que les DATES (rallonger, raccourcir)
--     via `update_round_dates` ; raccourcir à une date passée revient à
--     clôturer la phase, le cron ramasse dans la minute.

-- --- Nouveau type de notification : changement de phase ---
-- Comme plus personne ne clique, plus personne n'est prévenu : sans ça, les
-- membres ne savent pas que les votes sont ouverts. Le CHECK d'origine
-- (027) est remplacé plutôt que complété (Postgres ne sait pas étendre un
-- CHECK existant). `NotificationsBell` traite `kind` comme un texte libre,
-- rien à changer côté interface.
-- On ne se fie pas au nom auto-généré (`notifications_kind_check`) : si le
-- CHECK d'origine portait un autre nom, un `drop constraint if exists` ne
-- ferait rien du tout et l'ancienne contrainte continuerait de refuser
-- 'phase_changed', en silence. On cible donc les contraintes par leur
-- DÉFINITION.
do $$
declare
  c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.notifications'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%round_deadline_soon%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;
end
$$;

alter table public.notifications
  add constraint notifications_kind_check
  check (kind in ('round_deadline_soon', 'league_launched', 'activity', 'phase_changed'));

-- --- Avancement des séances dont l'échéance est dépassée ---
-- SECURITY DEFINER : appelée soit par pg_cron (hors session utilisateur,
-- auth.uid() est alors null), soit par un membre connecté au chargement d'une
-- page. Elle balaie TOUTES les ligues dans les deux cas — sans risque de
-- fuite : elle ne renvoie qu'un décompte, et la clause WHERE garantit qu'une
-- séance ne peut avancer que si son échéance est réellement passée. Aucun
-- appelant ne peut donc précipiter une phase.
--
-- `for update skip locked` : le cron et une visite de page peuvent tomber sur
-- la même séance en même temps ; le second passe son tour au lieu de faire
-- basculer la phase deux fois.
create or replace function public.advance_due_rounds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  _next text;
  _message text;
  _count int := 0;
begin
  for r in
    select id, league_id, theme, status, game_mode
      from public.rounds
     where (status = 'submission' and submission_deadline <= now())
        or (status = 'voting' and ceremony_at <= now())
     order by id
       for update skip locked
  loop
    -- Réplique exacte de nextRoundStatus() (src/lib/rounds.ts) : Ciné'Files
    -- n'a que 2 phases (submission → closed, on saute voting) ; la
    -- Compétition officielle fait le cycle complet.
    if r.game_mode = 'cine_files' then
      _next := case when r.status = 'submission' then 'closed' end;
    else
      _next := case r.status
                 when 'submission' then 'voting'
                 when 'voting' then 'closed'
               end;
    end if;

    if _next is null then
      continue;
    end if;

    update public.rounds set status = _next where id = r.id;
    _count := _count + 1;

    -- Pas de garde anti-doublon : l'insert est dans la même transaction que
    -- l'UPDATE ci-dessus, et la clause WHERE de la boucle ne sélectionne que
    -- des séances qui n'ont pas encore basculé. Une séance ne peut donc
    -- notifier qu'une fois par transition.
    _message := case _next
      when 'voting' then 'Les votes sont ouverts pour « ' || r.theme || ' »'
      else 'La séance « ' || r.theme || ' » est clôturée : les résultats sont là'
    end;

    -- Tous les membres, sans exception : contrairement à
    -- notify_round_created / notify_round_activity qui excluent l'auteur de
    -- l'action, ici il n'y a pas d'auteur — c'est le temps qui a agi.
    insert into public.notifications (user_id, league_id, round_id, kind, message)
    select lm.user_id, r.league_id, r.id, 'phase_changed', _message
      from public.league_members lm
     where lm.league_id = r.league_id;
  end loop;

  return _count;
end;
$$;

grant execute on function public.advance_due_rounds() to authenticated;

-- --- Édition des dates : seul levier restant de l'admin ---
-- Remplace la version de 026. Deux différences :
--   1. une date PASSÉE est explicitement acceptée — c'est ainsi qu'un admin
--      clôture une phase en avance (le cron ramasse dans la minute) ;
--   2. quand la séance est déjà en phase de vote (ou clôturée),
--      `submission_deadline` est ignorée : la modifier n'aurait aucun effet
--      et afficherait une date incohérente avec la phase réellement en cours.
create or replace function public.update_round_dates(
  _round_id uuid,
  _submission_deadline timestamptz,
  _ceremony_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _status text;
  _deadline_actuelle timestamptz;
begin
  _league_id := public.round_league_id(_round_id);
  if _league_id is null then
    raise exception 'Séance introuvable';
  end if;

  if not public.is_league_admin(_league_id) then
    raise exception 'Seul un admin peut modifier les dates de la séance';
  end if;

  select status, submission_deadline
    into _status, _deadline_actuelle
    from public.rounds
   where id = _round_id;

  if _status = 'closed' then
    raise exception 'Séance déjà clôturée : ses dates ne sont plus modifiables';
  end if;

  -- Phase de vote en cours : la date limite de soumission est derrière nous,
  -- on garde celle enregistrée.
  if _status <> 'submission' then
    _submission_deadline := _deadline_actuelle;
  end if;

  if _ceremony_at <= _submission_deadline then
    raise exception 'La cérémonie doit être postérieure à la date limite de soumission';
  end if;

  update public.rounds
     set submission_deadline = _submission_deadline,
         ceremony_at = _ceremony_at
   where id = _round_id;

  -- Si la nouvelle date est déjà dépassée, on fait basculer tout de suite
  -- plutôt que de laisser l'admin attendre le prochain tour de cron. Le
  -- `skip locked` de advance_due_rounds() ne saute pas la ligne qu'on vient de
  -- verrouiller ici : SKIP LOCKED n'écarte que les verrous détenus par
  -- d'AUTRES transactions.
  perform public.advance_due_rounds();
end;
$$;

grant execute on function public.update_round_dates(uuid, timestamptz, timestamptz) to authenticated;

-- --- Le job planifié ---
-- pg_cron est la première extension activée sur ce projet. Le passage par le
-- dashboard (Database → Extensions → pg_cron) est la voie recommandée par
-- Supabase ; le `create extension` ci-dessous est là pour que ce fichier
-- reste rejouable tel quel. Les jobs tournent dans la base `postgres`, donc
-- ici même.
create extension if not exists pg_cron;

-- Rejouable : on retire le job avant de le reposer (cron.unschedule lève une
-- exception si le job n'existe pas, d'où le WHERE EXISTS).
select cron.unschedule('avancer-rounds')
 where exists (select 1 from cron.job where jobname = 'avancer-rounds');

select cron.schedule(
  'avancer-rounds',
  '* * * * *',
  $$select public.advance_due_rounds();$$
);

-- Vérification (à lancer à la main dans le SQL Editor) :
--   select jobid, jobname, schedule, active from cron.job;
--   select jobid, status, return_message, start_time
--     from cron.job_run_details
--    order by start_time desc limit 10;
