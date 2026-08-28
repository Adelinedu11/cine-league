-- 032 — Catégories choisies par ligue
-- Dépend de : 001 (is_league_member), 008 (is_league_admin, create_league).
--
-- Jusqu'ici les catégories de vote étaient globales et identiques pour tout le
-- monde. L'admin d'une ligue choisit désormais les siennes, cinq au maximum,
-- parmi un catalogue commun ou en écrivant les siennes.
--
-- ⚠️ RÈGLE ABSOLUE : ON NE SUPPRIME JAMAIS UNE LIGNE DE `categories`.
-- `get_round_results` joint les votes à `categories` pour retrouver le nom
-- affiché. Supprimer une catégorie ferait disparaître, par cette jointure,
-- toutes les lignes de palmarès qui l'utilisaient — y compris celles de
-- séances closes il y a des mois. Retirer une catégorie de la sélection d'une
-- ligue signifie donc « ne plus la proposer aux prochaines séances », jamais
-- « l'effacer ».
--
-- ⚠️ ET CHAQUE SÉANCE GARDE UNE PHOTO. Une configuration modifiable ne peut
-- pas être lue directement par les anciennes séances : si l'admin change tout
-- en juin, le bulletin de vote d'une séance de janvier doit rester celui de
-- janvier. `round_categories` fige la sélection au lancement.
--
-- ⚠️ La colonne d'ordre s'appelle `rang`, pas `position` : `position` est un
-- mot réservé de PostgreSQL. Il passe comme nom de colonne dans un CREATE
-- TABLE, mais fait échouer une déclaration `returns table(...)`. Mieux vaut
-- supprimer le piège que le contourner à coups de guillemets.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Catégories privées à une ligue
-- =====================================================================
-- league_id null = catalogue commun, proposé à tout le monde.
-- league_id renseigné = catégorie écrite par cette ligue, invisible ailleurs.

alter table public.categories
  add column if not exists league_id uuid
    references public.leagues(id) on delete cascade;

create index if not exists categories_league on public.categories (league_id);

-- L'enrichissement du catalogue commun est repoussé à la toute fin du fichier
-- (section 8) : le rattrapage des ligues existantes (section 7) doit leur
-- rendre EXACTEMENT les catégories qu'elles utilisaient, et pas les nouvelles.

-- =====================================================================
-- 2. La sélection d'une ligue
-- =====================================================================

create table if not exists public.league_categories (
  league_id uuid not null references public.leagues(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  rang smallint not null default 0,
  primary key (league_id, category_id)
);

-- =====================================================================
-- 3. La photo d'une séance
-- =====================================================================
-- La sélection figée au lancement d'une séance. La référence vers `categories`
-- est sans danger puisque la règle en tête de fichier interdit toute
-- suppression — et elle garantit qu'aucune photo ne pointe vers le vide.

create table if not exists public.round_categories (
  round_id uuid not null references public.rounds(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  rang smallint not null default 0,
  primary key (round_id, category_id)
);

-- =====================================================================
-- 4. RLS
-- =====================================================================

alter table public.league_categories enable row level security;
alter table public.round_categories enable row level security;

-- Lecture réservée aux membres. Écriture uniquement par les fonctions du
-- point 5 : aucune policy d'insertion, donc rien n'est modifiable depuis le
-- navigateur sans passer par les garde-fous.
drop policy if exists "league_categories_select" on public.league_categories;
create policy "league_categories_select"
on public.league_categories for select
using ( public.is_league_member(league_id) );

drop policy if exists "round_categories_select" on public.round_categories;
create policy "round_categories_select"
on public.round_categories for select
using ( public.is_league_member(public.round_league_id(round_id)) );

-- Les catégories du catalogue commun restent lisibles par tous les inscrits ;
-- celles d'une ligue, par ses seuls membres.
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
on public.categories for select
using (
  (league_id is null and auth.role() = 'authenticated')
  or public.is_league_member(league_id)
);

-- =====================================================================
-- 5. Gestion de la sélection
-- =====================================================================

-- Cinq au maximum. Le plafond est vérifié EN BASE et pas seulement dans le
-- formulaire : un contrôle uniquement côté navigateur ne protège rien.
create or replace function public.set_league_categories(
  _league_id uuid,
  _category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_league_admin(_league_id) then
    raise exception 'Seul un admin peut modifier les catégories';
  end if;

  if array_length(_category_ids, 1) is null or array_length(_category_ids, 1) = 0 then
    raise exception 'Il faut au moins une catégorie';
  end if;

  if array_length(_category_ids, 1) > 5 then
    raise exception 'Cinq catégories au maximum';
  end if;

  -- Chaque catégorie doit appartenir au catalogue commun ou à CETTE ligue :
  -- sinon on pourrait s'approprier la catégorie privée d'une autre.
  if exists (
    select 1 from unnest(_category_ids) as id
    where not exists (
      select 1 from public.categories c
      where c.id = id and (c.league_id is null or c.league_id = _league_id)
    )
  ) then
    raise exception 'Catégorie inconnue ou appartenant à une autre ligue';
  end if;

  delete from public.league_categories where league_id = _league_id;

  insert into public.league_categories (league_id, category_id, rang)
  select _league_id, id, ord
  from unnest(_category_ids) with ordinality as t(id, ord);
end;
$$;

grant execute on function public.set_league_categories(uuid, uuid[]) to authenticated;

-- Écrire une catégorie à soi. Elle n'est jamais versée au catalogue commun :
-- une blague interne n'a pas à être proposée aux autres ligues, et ça évite
-- d'avoir à modérer quoi que ce soit.
create or replace function public.create_league_category(
  _league_id uuid,
  _name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _id uuid;
begin
  if not public.is_league_admin(_league_id) then
    raise exception 'Seul un admin peut créer une catégorie';
  end if;

  if btrim(coalesce(_name, '')) = '' then
    raise exception 'Le nom ne peut pas être vide';
  end if;

  -- Déjà écrite : on renvoie l'existante plutôt que d'accumuler des doublons.
  select id into _id from public.categories
  where league_id = _league_id and lower(name) = lower(btrim(_name));

  if _id is not null then
    return _id;
  end if;

  insert into public.categories (name, league_id)
  values (btrim(_name), _league_id)
  returning id into _id;

  return _id;
end;
$$;

grant execute on function public.create_league_category(uuid, text) to authenticated;

-- =====================================================================
-- 6. La photo, prise automatiquement au lancement d'une séance
-- =====================================================================
-- Par déclencheur plutôt que dans l'application : une séance créée par un
-- autre chemin (script, correction manuelle) obtient quand même sa photo.

create or replace function public.snapshot_round_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.round_categories (round_id, category_id, rang)
  select new.id, lc.category_id, lc.rang
  from public.league_categories lc
  where lc.league_id = new.league_id
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_round_created_snapshot_categories on public.rounds;
create trigger on_round_created_snapshot_categories
  after insert on public.rounds
  for each row execute function public.snapshot_round_categories();

-- Les catégories d'une séance, pour le bulletin de vote.
create or replace function public.round_categories_list(_round_id uuid)
returns table(id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select c.id, c.name
  from public.round_categories rc
  join public.categories c on c.id = rc.category_id
  where rc.round_id = _round_id
    and public.is_league_member(public.round_league_id(_round_id))
  order by rc.rang, c.name;
$$;

grant execute on function public.round_categories_list(uuid) to authenticated;

-- Catégories disponibles pour une ligue : le catalogue commun plus les
-- siennes, avec l'indication de celles déjà retenues.
create or replace function public.league_categories_options(_league_id uuid)
returns table(id uuid, name text, propre boolean, choisie boolean, rang smallint)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.id,
    c.name,
    c.league_id is not null as propre,
    lc.category_id is not null as choisie,
    lc.rang
  from public.categories c
  left join public.league_categories lc
    on lc.category_id = c.id and lc.league_id = _league_id
  where public.is_league_member(_league_id)
    and (c.league_id is null or c.league_id = _league_id)
  order by lc.rang nulls last, c.league_id nulls first, c.name;
$$;

grant execute on function public.league_categories_options(uuid) to authenticated;

-- =====================================================================
-- 7. Reprise de l'existant
-- =====================================================================
-- Les ligues et séances déjà créées n'ont ni sélection ni photo. Sans ce
-- rattrapage, une séance en cours se retrouverait avec un bulletin vide.

-- Chaque ligue sans sélection reçoit les catégories communes EXISTANT À CET
-- INSTANT — c'est-à-dire celles qu'elle utilisait déjà, puisque le catalogue
-- n'est enrichi qu'en section 8. Le plafond de cinq ne s'applique pas au
-- rattrapage : mieux vaut une ligue à six catégories héritées qu'une ligue
-- amputée sans prévenir. Elle repassera sous la limite à sa prochaine
-- modification.
insert into public.league_categories (league_id, category_id, rang)
select l.id, c.id, c.rn
from public.leagues l
cross join lateral (
  select id, row_number() over (order by name)::smallint as rn
  from public.categories
  where league_id is null
) c
where not exists (
  select 1 from public.league_categories lc where lc.league_id = l.id
)
on conflict do nothing;

-- Chaque séance sans photo reçoit la sélection de sa ligue. Pour les séances
-- déjà votées, on ajoute AUSSI les catégories réellement utilisées dans leurs
-- votes : c'est la seule façon que leur bulletin corresponde à leur histoire.
insert into public.round_categories (round_id, category_id, rang)
select r.id, lc.category_id, lc.rang
from public.rounds r
join public.league_categories lc on lc.league_id = r.league_id
where not exists (
  select 1 from public.round_categories rc where rc.round_id = r.id
)
on conflict do nothing;

insert into public.round_categories (round_id, category_id, rang)
select distinct v.round_id, v.category_id, 99
from public.votes v
on conflict do nothing;

-- =====================================================================
-- 8. Enrichissement du catalogue commun
-- =====================================================================
-- EN DERNIER, volontairement : si ces catégories existaient avant la section 7,
-- les ligues déjà en place se les verraient attribuer alors qu'elles ne les ont
-- jamais utilisées.
--
-- « Meilleurs acteurs » n'y figure pas : le catalogue distingue déjà « Meilleur
-- acteur » et « Meilleure actrice », deux récompenses séparées. Une troisième
-- entrée au pluriel ferait doublon.
--
-- Insertion par nom, insensible à la casse, et seulement si absente.

insert into public.categories (name)
select v.name
from (values
  ('Meilleure musique'),
  ('Meilleure intro'),
  ('Meilleurs costumes et maquillage'),
  ('Meilleure photo')
) as v(name)
where not exists (
  select 1 from public.categories c
  where c.league_id is null and lower(c.name) = lower(v.name)
);
