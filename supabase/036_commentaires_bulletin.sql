-- 036 — Commentaire du directeur sur le bulletin de vote
-- Dépend de : 001 (is_league_member, round_league_id), 010 (colonne comment
-- sur submissions), 011 (round_ballot + poster_path).
--
-- POURQUOI : jusqu'ici le commentaire laissé par le joueur au moment de sa
-- soumission n'était visible qu'une fois la séance close (via
-- round_submission_details). Pendant la phase de vote, le jury choisissait donc
-- sur le seul titre du film. On le remonte maintenant dans le bulletin.
--
-- ANONYMAT : round_ballot n'a jamais exposé user_id ni display_name, et ce
-- n'est pas ce commit qui change ça. Le commentaire est renvoyé NU, sans
-- aucune information sur son auteur — l'attribution reste réservée à la
-- cérémonie (round_submission_details, round 'closed'). Et comme avant, la
-- ligne du votant lui-même est exclue (s.user_id <> auth.uid()).

-- Ajouter une colonne au type de retour change la signature → DROP obligatoire.
drop function if exists public.round_ballot(uuid);
create function public.round_ballot(_round_id uuid)
returns table(
  submission_id uuid,
  film_title text,
  platforms text[],
  poster_path text,
  comment text
)
language sql
security definer
set search_path = public
as $$
  select
    s.id as submission_id,
    s.film_title,
    s.platforms,
    s.poster_path,
    s.comment
  from public.submissions s
  where s.round_id = _round_id
    and s.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id));
$$;

grant execute on function public.round_ballot(uuid) to authenticated;
