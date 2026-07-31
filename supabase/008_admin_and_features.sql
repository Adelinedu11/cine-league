-- 008 — Rôle admin, plateformes au vote, historique des victoires
-- Dépend de : 001 (is_league_member, round_league_id), get_round_results
-- (créée directement dans Supabase) et create_league (idem).
--
-- ⚠️ create_league n'ayant jamais été versionnée, la version ci-dessous est une
--    RECONSTRUCTION à partir de sa signature (uuid create_league(text, text))
--    et de son usage. Compare-la à la définition réelle en base
--    (Supabase → Database → Functions) avant de l'exécuter, pour ne pas perdre
--    une éventuelle logique existante (génération d'invite_code, etc.).

-- =====================================================================
-- 1. RÔLE ADMIN
-- =====================================================================

-- 1.a Colonne role sur league_members. Défaut 'member' ; 'admin' possible.
alter table public.league_members
  add column if not exists role text not null default 'member';

-- Contrainte de domaine (idempotente : on droppe avant de recréer).
alter table public.league_members
  drop constraint if exists league_members_role_check;
alter table public.league_members
  add constraint league_members_role_check check (role in ('member', 'admin'));

-- 1.b create_league : le créateur est inséré en 'admin' (au lieu du défaut).
create or replace function public.create_league(_name text, _display_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
begin
  insert into public.leagues (name)
  values (_name)
  returning id into _league_id;

  insert into public.league_members (league_id, user_id, display_name, role)
  values (_league_id, auth.uid(), _display_name, 'admin');

  return _league_id;
end;
$$;

grant execute on function public.create_league(text, text) to authenticated;

-- 1.c is_league_admin : vrai si l'utilisateur courant est admin de la ligue.
--     Même principe que is_league_member (SECURITY DEFINER, contourne la RLS).
create or replace function public.is_league_admin(_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = _league_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_league_admin(uuid) to authenticated;

-- 1.d Policy DELETE sur rounds : réservée aux admins de la ligue.
--     (rounds a déjà la RLS activée — cf. 004.)
drop policy if exists "admin supprime un round" on public.rounds;
create policy "admin supprime un round"
on public.rounds for delete
using ( public.is_league_admin(league_id) );

-- 1.e Policy DELETE sur league_members : un admin exclut un membre, mais jamais
--     lui-même (pas d'auto-exclusion).
--
-- ⚠️ Les migrations 001-007 n'activent PAS la RLS sur league_members. Cette
--    policy n'est APPLIQUÉE que si la RLS est active sur la table. Si tu
--    l'actives, il faut AUSSI des policies SELECT/INSERT, sinon l'app casse
--    (elle lit et insère la ligne du membre courant). Le bloc commenté plus bas
--    fournit un jeu minimal cohérent avec l'app (accès à sa propre ligne). À
--    n'activer qu'après avoir vérifié l'état RLS réel en base.
drop policy if exists "admin exclut un membre" on public.league_members;
create policy "admin exclut un membre"
on public.league_members for delete
using (
  public.is_league_admin(league_id)
  and user_id <> auth.uid()
);

-- -- À décommenter si la RLS de league_members n'est pas déjà configurée en base :
-- alter table public.league_members enable row level security;
--
-- drop policy if exists "voit sa propre appartenance" on public.league_members;
-- create policy "voit sa propre appartenance"
-- on public.league_members for select
-- using ( user_id = auth.uid() );
--
-- drop policy if exists "rejoint une ligue" on public.league_members;
-- create policy "rejoint une ligue"
-- on public.league_members for insert
-- with check ( user_id = auth.uid() );

-- =====================================================================
-- 2. PLATEFORMES VISIBLES PENDANT LE VOTE
-- =====================================================================
-- round_ballot renvoie désormais aussi platforms (en plus de submission_id et
-- film_title). Ajouter une colonne au type de retour change la signature :
-- Postgres impose un DROP de la fonction avant sa recréation.
drop function if exists public.round_ballot(uuid);
create function public.round_ballot(_round_id uuid)
returns table(submission_id uuid, film_title text, platforms text[])
language sql
security definer
set search_path = public
as $$
  select s.id as submission_id, s.film_title, s.platforms
  from public.submissions s
  where s.round_id = _round_id
    and s.user_id <> auth.uid()
    and public.is_league_member(public.round_league_id(_round_id));
$$;

grant execute on function public.round_ballot(uuid) to authenticated;

-- =====================================================================
-- 3. HISTORIQUE DES VICTOIRES
-- =====================================================================
-- Pour tous les rounds 'closed' de la ligue, compte les catégories gagnées par
-- chaque membre. « Gagnant » d'une catégorie = la (ou les, en cas d'ex-aequo)
-- soumission(s) au plus grand nombre de votes (via get_round_results). On
-- rattache la soumission gagnante à son auteur (submissions.user_id) puis au
-- membre (league_members). Trié par nombre de victoires décroissant.
-- Réservé aux membres de la ligue.
create or replace function public.league_win_history(_league_id uuid)
returns table(display_name text, wins_count bigint)
language sql
security definer
set search_path = public
as $$
  with results as (
    select
      gr.submission_id,
      gr.vote_count,
      max(gr.vote_count) over (partition by r.id, gr.category_id) as top_votes
    from public.rounds r
    cross join lateral public.get_round_results(r.id) gr
    where r.league_id = _league_id
      and r.status = 'closed'
      and public.is_league_member(_league_id)
  )
  select lm.display_name, count(*) as wins_count
  from results w
  join public.submissions s on s.id = w.submission_id
  join public.league_members lm
    on lm.league_id = _league_id and lm.user_id = s.user_id
  where w.vote_count = w.top_votes
    and w.top_votes > 0
  group by lm.display_name
  order by wins_count desc;
$$;

grant execute on function public.league_win_history(uuid) to authenticated;
