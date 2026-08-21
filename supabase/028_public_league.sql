-- 028 — League publique officielle + fermeture réelle des leagues privées
-- Dépend de : 001 (is_league_member), 008 (role, is_league_admin),
--             013 (find_league_by_invite_code), 019 (profiles).
--
-- Contexte. Jusqu'ici la policy `league_members_insert_own` autorisait
-- l'insertion sur le seul critère `user_id = auth.uid()` : elle vérifiait QUI
-- s'inscrit, jamais DANS QUELLE league. Le code d'invitation n'était donc
-- contrôlé que par le code applicatif, et un utilisateur connaissant l'UUID
-- d'une league pouvait s'y ajouter directement via l'API. Cette migration
-- déplace ce contrôle dans la base, où il est réellement opposable.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Colonne is_public + unicité de la league publique
-- =====================================================================

alter table public.leagues
  add column if not exists is_public boolean not null default false;

-- Index unique PARTIEL : il ne s'applique qu'aux lignes où is_public est vrai.
-- Conséquence, une seule league publique peut exister — la règle métier est
-- tenue par la base, pas par la discipline de l'admin.
create unique index if not exists leagues_single_public
  on public.leagues ((true)) where is_public;

-- Création de la league officielle, une seule fois.
insert into public.leagues (name, is_public)
select 'Ciné League Officielle', true
where not exists (select 1 from public.leagues where is_public);

-- Raccourci de lecture, en SECURITY DEFINER : utilisable dans les policies
-- sans provoquer de récursion RLS sur `leagues`.
create or replace function public.public_league_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.leagues where is_public limit 1;
$$;

grant execute on function public.public_league_id() to authenticated;

-- =====================================================================
-- 2. Lecture de la league publique par tout utilisateur connecté
-- =====================================================================
-- Les policies SELECT s'additionnent (OR) : celle-ci ouvre la seule league
-- publique sans élargir d'un pouce `leagues_select_members`, qui continue de
-- protéger les leagues privées.

drop policy if exists "leagues_select_public" on public.leagues;
create policy "leagues_select_public"
on public.leagues for select
using ( is_public and auth.role() = 'authenticated' );

-- =====================================================================
-- 3. Adhésion : la league publique en libre accès, les privées sous condition
-- =====================================================================
-- L'ancienne policy est remplacée. Insertion directe désormais permise
-- UNIQUEMENT vers la league publique. Pour une league privée, il faut passer
-- par join_league_by_code() (point 4), qui vérifie le code côté base.

drop policy if exists "league_members_insert_own" on public.league_members;
create policy "league_members_insert_public_only"
on public.league_members for insert
with check (
  user_id = auth.uid()
  and league_id = public.public_league_id()
);

-- Lecture : un membre voit les autres membres de ses leagues (inchangé), et
-- tout inscrit voit les membres de la league publique — sans quoi les
-- classements publics seraient vides.
drop policy if exists "league_members_select_same_league" on public.league_members;
create policy "league_members_select_same_league"
on public.league_members for select
using (
  public.is_league_member(league_id)
  or (league_id = public.public_league_id() and auth.role() = 'authenticated')
);

-- =====================================================================
-- 4. Rejoindre une league privée : contrôle du code EN BASE
-- =====================================================================
-- SECURITY DEFINER : la fonction insère malgré la policy restrictive du
-- point 3, mais seulement après avoir vérifié le code. C'est le seul chemin
-- d'entrée vers une league privée.
--
-- Retourne l'id de la league rejointe, ou null si le code est inconnu.
-- Volontairement discrète : elle ne dit pas si le code existe mais est plein,
-- ni ne distingue « inconnu » de « déjà membre ».

create or replace function public.join_league_by_code(
  _code text,
  _display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  -- btrim + lower : les codes circulent par SMS et messagerie, souvent
  -- recopiés avec une majuscule ou une espace parasite.
  select id into _league_id
  from public.leagues
  where lower(invite_code) = lower(btrim(_code));

  if _league_id is null then
    return null;
  end if;

  -- Déjà membre : on renvoie la league sans réinsérer (idempotent).
  if exists (
    select 1 from public.league_members
    where league_id = _league_id and user_id = auth.uid()
  ) then
    return _league_id;
  end if;

  insert into public.league_members (league_id, user_id, display_name)
  values (_league_id, auth.uid(), _display_name);

  return _league_id;
end;
$$;

grant execute on function public.join_league_by_code(text, text) to authenticated;

-- find_league_by_invite_code (013) n'est plus appelée par l'app : elle
-- exposait la résolution code → UUID sans rien contrôler ensuite. On la retire
-- pour ne pas laisser un contournement de la nouvelle règle.
drop function if exists public.find_league_by_invite_code(text);

-- =====================================================================
-- 5. Adhésion automatique à l'inscription
-- =====================================================================
-- display_name est NOT NULL et le pseudo n'existe pas encore à cet instant
-- (le client l'écrit dans `profiles` juste après le signUp). On pose donc la
-- partie gauche de l'e-mail comme valeur de repli ; le coalesce(pseudo,
-- display_name) déjà présent dans toutes les fonctions de nommage prendra le
-- relais dès que le pseudo arrive.

create or replace function public.join_public_league_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
begin
  select id into _league_id from public.leagues where is_public limit 1;

  if _league_id is null then
    return new; -- pas de league publique : on n'empêche pas l'inscription
  end if;

  insert into public.league_members (league_id, user_id, display_name)
  values (
    _league_id,
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Joueur')
  )
  on conflict do nothing;

  return new;
exception
  -- Un trigger qui échoue sur auth.users ferait échouer l'inscription
  -- elle-même. Une adhésion ratée est un incident mineur ; un compte
  -- impossible à créer est un incident majeur. On avale donc l'erreur.
  when others then
    raise warning 'Adhésion à la league publique échouée pour % : %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_join_public on auth.users;
create trigger on_auth_user_created_join_public
  after insert on auth.users
  for each row execute function public.join_public_league_on_signup();

-- =====================================================================
-- 6. Rattrapage des comptes existants
-- =====================================================================
-- Les comptes créés avant cette migration n'ont pas été vus par le trigger.

insert into public.league_members (league_id, user_id, display_name)
select
  (select id from public.leagues where is_public limit 1),
  u.id,
  coalesce(nullif(split_part(u.email, '@', 1), ''), 'Joueur')
from auth.users u
where exists (select 1 from public.leagues where is_public)
  and not exists (
    select 1 from public.league_members lm
    where lm.user_id = u.id
      and lm.league_id = (select id from public.leagues where is_public limit 1)
  );

-- =====================================================================
-- 7. Administration de la league publique
-- =====================================================================
-- Un seul admin : le compte ci-dessous. Adapte l'adresse si besoin.
-- Sans cette étape, la league publique n'aurait aucun admin et personne ne
-- pourrait y ouvrir de séance.

update public.league_members
set role = 'admin'
where league_id = (select id from public.leagues where is_public limit 1)
  and user_id = (
    select id from auth.users where lower(email) = lower('aboulard@mediawan.com')
  );
