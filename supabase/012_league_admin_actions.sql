-- 012 — Actions admin sur la ligue : renommer et supprimer
-- Dépend de : 008 (is_league_admin).
--
-- ⚠️ Ces policies ne s'appliquent que si la RLS est ACTIVE sur public.leagues.
--    Les migrations 001-011 ne l'activent pas explicitement ; si elle a été
--    configurée directement dans Supabase (l'app lit déjà `leagues`), rien à
--    faire. Sinon, il faut l'activer AVEC une policy SELECT (lecture par code
--    d'invitation + par les membres), sinon la liste des ligues et l'accès à
--    /leagues/[id] cassent. La suppression s'appuie sur les ON DELETE CASCADE
--    des tables liées (rounds, league_members, …).

-- Renommer la ligue : réservé aux admins.
drop policy if exists "admin renomme la ligue" on public.leagues;
create policy "admin renomme la ligue"
on public.leagues for update
using ( public.is_league_admin(id) )
with check ( public.is_league_admin(id) );

-- Supprimer la ligue : réservé aux admins (cascade sur les tables liées).
drop policy if exists "admin supprime la ligue" on public.leagues;
create policy "admin supprime la ligue"
on public.leagues for delete
using ( public.is_league_admin(id) );
