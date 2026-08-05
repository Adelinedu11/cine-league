-- 026_update_round_dates.sql
-- Édition des deux dates d'une séance par un admin de la ligue, sans toucher
-- au statut (submission/voting/closed), qui reste géré par la transition
-- forcée existante. Réservé aux admins : la policy RLS UPDATE de rounds
-- (004_policies.sql) est ouverte à tout membre, donc on passe par une RPC
-- SECURITY DEFINER qui vérifie is_league_admin.

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
begin
  _league_id := public.round_league_id(_round_id);
  if _league_id is null then
    raise exception 'Séance introuvable';
  end if;

  if not public.is_league_admin(_league_id) then
    raise exception 'Seul un admin peut modifier les dates de la séance';
  end if;

  if _ceremony_at <= _submission_deadline then
    raise exception 'La cérémonie doit être postérieure à la date limite de soumission';
  end if;

  update public.rounds
     set submission_deadline = _submission_deadline,
         ceremony_at = _ceremony_at
   where id = _round_id;
end;
$$;

grant execute on function public.update_round_dates(uuid, timestamptz, timestamptz) to authenticated;
