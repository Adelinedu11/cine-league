-- 010 — Commentaires de soumission et de vote
-- Dépend de : 001 (is_league_member, round_league_id), 006 (submit_votes),
-- 007 (round_submission_details).

-- =====================================================================
-- 1. COMMENTAIRE DE SOUMISSION
-- =====================================================================

-- Colonne libre facultative sur la soumission.
alter table public.submissions
  add column if not exists comment text;

-- round_submission_details renvoie désormais aussi comment. Le round doit être
-- 'closed' (garde-fou existant) : pas de fuite d'anonymat. Ajouter une colonne
-- au type de retour change la signature → DROP avant recréation.
drop function if exists public.round_submission_details(uuid);
create function public.round_submission_details(p_round_id uuid)
returns table(
  submission_id uuid,
  film_title text,
  display_name text,
  comment text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as submission_id,
    s.film_title,
    lm.display_name,
    s.comment
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

-- =====================================================================
-- 2. COMMENTAIRE DE VOTE
-- =====================================================================

-- Colonne libre facultative sur le vote.
alter table public.votes
  add column if not exists comment text;

-- submit_votes accepte et enregistre un champ comment optionnel par ligne.
-- Signature inchangée (jsonb -> void) : create or replace suffit.
-- Le commentaire est normalisé (trim, chaîne vide -> NULL).
create or replace function public.submit_votes(_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into votes (round_id, category_id, submission_id, voter_id, comment)
  select
    (r->>'round_id')::uuid,
    (r->>'category_id')::uuid,
    (r->>'submission_id')::uuid,
    auth.uid(),                          -- voter_id forcé, jamais celui du JSON
    nullif(btrim(r->>'comment'), '')     -- commentaire optionnel, vide -> NULL
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
  do update set
    submission_id = excluded.submission_id,
    comment = excluded.comment;
end;
$$;

grant execute on function public.submit_votes(jsonb) to authenticated;

-- round_vote_comments : pour chaque (category_id, submission_id), les
-- commentaires de vote non vides, SANS jamais exposer voter_id (anonymat).
-- GARDE-FOUS : round 'closed' + appelant membre de la ligue.
create or replace function public.round_vote_comments(_round_id uuid)
returns table(category_id uuid, submission_id uuid, comment text)
language sql
security definer
set search_path = public
as $$
  select v.category_id, v.submission_id, v.comment
  from public.votes v
  where v.round_id = _round_id
    and v.comment is not null
    and length(btrim(v.comment)) > 0
    and public.is_league_member(public.round_league_id(_round_id))
    and exists (
      select 1 from public.rounds ro
      where ro.id = _round_id and ro.status = 'closed'
    );
$$;

grant execute on function public.round_vote_comments(uuid) to authenticated;
