-- 006 — RPC d'enregistrement des votes (version durcie)
-- Dépend de 001 (is_league_member, round_league_id).
--
-- Contourne le piège RLS + upsert PostgREST : un upsert via PostgREST a besoin
-- d'un droit SELECT pour résoudre le ON CONFLICT, or on n'accorde AUCUN SELECT
-- sur votes (anonymat). Cette fonction SECURITY DEFINER fait l'insert/upsert
-- directement en base.
--
-- SÉCURITÉ : bien que SECURITY DEFINER (donc hors RLS), la fonction rejoue
-- elle-même les garde-fous des policies, pour rester sûre même appelée
-- directement (EXECUTE est ouvert à 'authenticated') :
--   1. voter_id est FORCÉ à auth.uid() — le voter_id du JSON est ignoré
--      (impossible de voter à la place d'un autre) ;
--   2. le round doit être en statut 'voting' ;
--   3. le votant doit être membre de la ligue du round ;
--   4. interdiction de voter pour sa propre soumission.
-- Les lignes qui ne satisfont pas ces conditions sont silencieusement ignorées
-- (non insérées), plutôt que de faire échouer tout le lot.

create or replace function public.submit_votes(_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into votes (round_id, category_id, submission_id, voter_id)
  select
    (r->>'round_id')::uuid,
    (r->>'category_id')::uuid,
    (r->>'submission_id')::uuid,
    auth.uid()                          -- voter_id forcé, jamais celui du JSON
  from jsonb_array_elements(_rows) as r
  where
    -- round en phase de vote
    exists (
      select 1 from rounds ro
      where ro.id = (r->>'round_id')::uuid
        and ro.status = 'voting'
    )
    -- votant membre de la ligue du round
    and public.is_league_member(public.round_league_id((r->>'round_id')::uuid))
    -- pas de vote pour sa propre soumission
    and not exists (
      select 1 from submissions s
      where s.id = (r->>'submission_id')::uuid
        and s.user_id = auth.uid()
    )
  on conflict (round_id, category_id, voter_id)
  do update set submission_id = excluded.submission_id;
end;
$$;

grant execute on function public.submit_votes(jsonb) to authenticated;
