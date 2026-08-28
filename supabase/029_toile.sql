-- 029 — La Toile : moteur du jeu quotidien
-- Dépend de : rien (autonome).
--
-- Deviner une personnalité du cinéma en proposant des films ou des noms. Voir
-- docs/la-toile.md pour les règles et le raisonnement qui les a produites.
--
-- ⚠️ RÈGLE ABSOLUE DE CE FICHIER : la cible ne doit JAMAIS pouvoir sortir de la
-- base. Ni par une policy, ni par une fonction, ni par déduction. Si le
-- navigateur connaissait la réponse pour afficher les indices, n'importe qui
-- l'ouvrirait dans les outils de développement en dix secondes. C'est pour ça
-- que `toile_targets` n'a aucune policy de lecture et que tout passe par des
-- fonctions SECURITY DEFINER qui ne renvoient que le résultat de la comparaison.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Les cibles et leur réseau
-- =====================================================================

create table if not exists public.toile_targets (
  id uuid primary key default gen_random_uuid(),
  tmdb_person_id integer not null unique,
  nom text not null,
  metier text,
  -- Amorce : un film qui ne contient pas la cible et ne partage avec elle
  -- qu'UNE SEULE personne, laquelle doit être une collaboratrice récurrente.
  -- Sans elle, le joueur affronte un écran vide devant un million de films.
  amorce_tmdb_id integer not null,
  amorce_titre text not null,
  amorce_annee text,
  -- null = dans la réserve mais pas encore programmée.
  play_date date unique,
  created_at timestamptz not null default now()
);

-- Le réseau de la cible : qui a travaillé avec elle, et sur combien de films.
-- C'est ce nombre qui fait le thermomètre du jeu — un acteur fétiche à 3 films
-- vaut infiniment plus qu'une apparition unique.
create table if not exists public.toile_collaborators (
  target_id uuid not null references public.toile_targets(id) on delete cascade,
  tmdb_person_id integer not null,
  nom text not null,
  films integer not null,
  primary key (target_id, tmdb_person_id)
);

-- =====================================================================
-- 2. Cache des génériques
-- =====================================================================
-- Le générique d'un film ne change pas. On le stocke à la première proposition
-- et on ne redemande plus rien à TMDB : au bout d'une semaine, les films que
-- les gens proposent sont tous en base.
--
-- ⚠️ L'écriture dans ce cache ne passe PAS par le joueur. Si le navigateur
-- pouvait y insérer un générique, il suffirait d'inventer un film contenant
-- toutes les personnalités du monde pour retrouver la cible en un coup. Le
-- remplissage se fait côté serveur Next.js, avec la clé de service.

create table if not exists public.toile_films (
  tmdb_movie_id integer primary key,
  titre text not null,
  annee text,
  fetched_at timestamptz not null default now()
);

create table if not exists public.toile_film_people (
  tmdb_movie_id integer not null
    references public.toile_films(tmdb_movie_id) on delete cascade,
  tmdb_person_id integer not null,
  nom text not null,
  primary key (tmdb_movie_id, tmdb_person_id)
);

create index if not exists toile_film_people_person
  on public.toile_film_people (tmdb_person_id);

-- =====================================================================
-- 3. RLS : tout est fermé
-- =====================================================================
-- Aucune policy de SELECT sur les cibles ni sur leurs collaborateurs. Avec la
-- RLS active et zéro policy, la table est inaccessible depuis le client, quoi
-- qu'il tente. Les seuls chemins de lecture sont les fonctions du point 4.

alter table public.toile_targets enable row level security;
alter table public.toile_collaborators enable row level security;
alter table public.toile_films enable row level security;
alter table public.toile_film_people enable row level security;

-- =====================================================================
-- 4. Le jeu
-- =====================================================================

-- 4.a La partie du jour. Ne renvoie QUE ce que le joueur a le droit de voir :
--     le numéro du jour, le métier de la cible, et le film d'amorce.
create or replace function public.toile_du_jour(_jour date default current_date)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'jour', t.play_date,
    -- Numéro affiché au partage (« La Toile n° 42 ») : le rang de la journée
    -- dans la série, pas un identifiant de base.
    'numero', (
      select count(*) from public.toile_targets p
      where p.play_date is not null and p.play_date <= t.play_date
    ),
    'metier', t.metier,
    'amorce', jsonb_build_object(
      'tmdb_id', t.amorce_tmdb_id,
      'titre', t.amorce_titre,
      'annee', t.amorce_annee
    )
  )
  from public.toile_targets t
  where t.play_date = _jour;
$$;

grant execute on function public.toile_du_jour(date) to anon, authenticated;

-- 4.b Essai sur un FILM — le « filet large ».
--     Renvoie les personnes du générique qui ont travaillé avec la cible, avec
--     le nombre de films partagés. Plus « brûlant » si la cible elle-même y
--     figure : c'est le plus fort indice du jeu, mais il ne fait pas gagner.
--
--     Le générique est lu EN BASE (toile_film_people), jamais transmis par le
--     client : sinon il suffirait d'annoncer un faux casting pour sonder toute
--     la réserve d'un coup.
create or replace function public.toile_essai_film(
  _jour date,
  _movie_id integer
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _target_id uuid;
  _target_person integer;
  _connu boolean;
begin
  select id, tmdb_person_id into _target_id, _target_person
  from public.toile_targets where play_date = _jour;

  if _target_id is null then
    return jsonb_build_object('erreur', 'aucune partie ce jour-là');
  end if;

  select exists (
    select 1 from public.toile_films where tmdb_movie_id = _movie_id
  ) into _connu;

  -- Générique absent du cache : c'est au serveur applicatif de le remplir puis
  -- de rappeler. On ne devine pas, on le dit.
  if not _connu then
    return jsonb_build_object('erreur', 'generique_absent');
  end if;

  return jsonb_build_object(
    'cible_presente', exists (
      select 1 from public.toile_film_people fp
      where fp.tmdb_movie_id = _movie_id
        and fp.tmdb_person_id = _target_person
    ),
    'personnes', coalesce((
      select jsonb_agg(
               jsonb_build_object('nom', c.nom, 'films', c.films)
               order by c.films desc, c.nom
             )
      from public.toile_film_people fp
      join public.toile_collaborators c
        on c.target_id = _target_id
       and c.tmdb_person_id = fp.tmdb_person_id
      where fp.tmdb_movie_id = _movie_id
        -- La cible n'est pas sa propre collaboratrice, mais par prudence on
        -- l'exclut aussi ici : son nom ne doit jamais transiter.
        and fp.tmdb_person_id <> _target_person
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.toile_essai_film(date, integer) to anon, authenticated;

-- 4.c Essai sur une PERSONNE — la « sonde précise ».
--     Zéro film raye une piste, et c'est un échec choisi : bien plus
--     satisfaisant qu'un froid subi sur un film pris au hasard.
--     C'est ici, et seulement ici, qu'on peut gagner.
create or replace function public.toile_essai_personne(
  _jour date,
  _person_id integer
)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _target_id uuid;
  _target_person integer;
  _films integer;
begin
  select id, tmdb_person_id into _target_id, _target_person
  from public.toile_targets where play_date = _jour;

  if _target_id is null then
    return jsonb_build_object('erreur', 'aucune partie ce jour-là');
  end if;

  if _person_id = _target_person then
    return jsonb_build_object('trouve', true);
  end if;

  select c.films into _films
  from public.toile_collaborators c
  where c.target_id = _target_id and c.tmdb_person_id = _person_id;

  return jsonb_build_object('trouve', false, 'films', coalesce(_films, 0));
end;
$$;

grant execute on function public.toile_essai_personne(date, integer) to anon, authenticated;

-- 4.d Révélation, pour l'écran de fin et pour l'abandon.
--     Appelée par le serveur applicatif uniquement APRÈS victoire ou abandon —
--     ce contrôle-là ne peut pas vivre en base, qui ne sait pas où en est le
--     joueur. Ouverte à `anon` puisqu'on peut jouer sans compte.
create or replace function public.toile_reveler(_jour date)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'nom', t.nom,
    'tmdb_id', t.tmdb_person_id,
    'metier', t.metier
  )
  from public.toile_targets t
  where t.play_date = _jour;
$$;

grant execute on function public.toile_reveler(date) to anon, authenticated;

-- =====================================================================
-- 5. Programmation des journées
-- =====================================================================
-- Volontairement PAS de cron. « La partie du jour » n'est qu'un
-- `where play_date = current_date` : rien n'a besoin de tourner. Cette fonction
-- sert à distribuer les dates sur la réserve, à la main, quand on l'alimente.
-- Elle n'est pas exposée au client.

create or replace function public.toile_programmer(_depuis date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _n integer := 0;
  _cible record;
begin
  for _cible in
    select id from public.toile_targets
    where play_date is null
    order by random()
  loop
    update public.toile_targets
    set play_date = _depuis + _n
    where id = _cible.id;
    _n := _n + 1;
  end loop;
  return _n;
end;
$$;
