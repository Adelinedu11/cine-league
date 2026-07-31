-- 005 — Policies RLS : votes
-- Dépend de 001 (aucune fonction requise ici, mais suit la même convention).
--
-- Anonymat total : AUCUNE policy SELECT sur votes (personne ne peut relire les
-- votes, pas même les siens). Seules les écritures sont autorisées, encadrées.
--
-- Cette policy UPDATE reprend la logique de la policy INSERT existante :
--   1. le votant agit pour lui-même         (voter_id = auth.uid())
--   2. le round est en phase de vote         (rounds.status = 'voting')
--   3. il ne vote pas pour sa propre soumission
-- ⚠️ Vérifie que le WITH CHECK ci-dessous correspond exactement à ta policy
--    INSERT (nom, et notamment la sous-requête « pas ma soumission »).

alter table public.votes enable row level security;

drop policy if exists "membre modifie son vote" on public.votes;

-- Conditions strictement identiques à la policy INSERT "votes_insert_own",
-- reprises en USING (lignes ciblables) et WITH CHECK (ligne après update).
create policy "membre modifie son vote"
on public.votes for update
using (
  voter_id = auth.uid()
  and exists (select 1 from rounds where rounds.id = votes.round_id and rounds.status = 'voting')
  and not exists (
    select 1 from submissions
    where submissions.id = votes.submission_id
    and submissions.user_id = auth.uid()
  )
)
with check (
  voter_id = auth.uid()
  and exists (select 1 from rounds where rounds.id = votes.round_id and rounds.status = 'voting')
  and not exists (
    select 1 from submissions
    where submissions.id = votes.submission_id
    and submissions.user_id = auth.uid()
  )
);
