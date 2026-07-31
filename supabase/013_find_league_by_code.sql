-- 013 — Recherche d'une ligue par code d'invitation (avant adhésion)
-- Dépend de : rien (fonction autonome).
--
-- Problème résolu : la policy SELECT sur `leagues` n'autorise la lecture qu'aux
-- membres. Un utilisateur qui rejoint une ligue n'en est pas encore membre : la
-- recherche directe `select id from leagues where invite_code = …` ne renvoie
-- donc rien, d'où le faux « code invalide ». Cette fonction SECURITY DEFINER
-- contourne la RLS pour résoudre un code d'invitation → id de ligue, sans rien
-- exposer d'autre.

create or replace function public.find_league_by_invite_code(_code text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from public.leagues where invite_code = _code;
$$;

grant execute on function public.find_league_by_invite_code(text) to authenticated;
