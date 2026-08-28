-- 034 — Les catégories se choisissent à la création d'une séance
-- Dépend de : 032, 033.
--
-- Correction de conception. La 032 plaçait le choix des catégories dans un
-- écran de configuration de la ligue ; il appartient en réalité à celui qui
-- OUVRE une séance, au moment où il choisit le mode Compétition officielle.
-- C'est là que la question se pose naturellement, et deux endroits pour régler
-- la même chose est une source de confusion garantie.
--
-- `league_categories` ne disparaît pas pour autant : elle devient la MÉMOIRE du
-- dernier choix, qui pré-remplit le formulaire de la séance suivante. Personne
-- ne la modifie directement — elle est mise à jour comme effet de bord de
-- `set_round_categories`.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Choisir les catégories d'une séance
-- =====================================================================

create or replace function public.set_round_categories(
  _round_id uuid,
  _category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _mode text;
  _status text;
begin
  select r.league_id, r.game_mode, r.status
    into _league_id, _mode, _status
  from public.rounds r where r.id = _round_id;

  if _league_id is null then
    raise exception 'Séance introuvable';
  end if;

  if not public.is_league_member(_league_id) then
    raise exception 'Réservé aux membres de la ligue';
  end if;

  if _mode is distinct from 'competition_officielle' then
    raise exception 'Seule la Compétition officielle utilise des catégories';
  end if;

  -- Après l'ouverture des votes, la photo est gravée : changer les catégories
  -- d'une séance où des gens ont déjà voté invaliderait leurs bulletins.
  if _status is distinct from 'submission' then
    raise exception 'Les catégories ne se changent plus une fois les votes ouverts';
  end if;

  if array_length(_category_ids, 1) is null or array_length(_category_ids, 1) = 0 then
    raise exception 'Il faut au moins une catégorie';
  end if;

  if array_length(_category_ids, 1) > 5 then
    raise exception 'Cinq catégories au maximum';
  end if;

  -- Catalogue commun ou catégorie de CETTE ligue : sinon on pourrait
  -- s'approprier celle des voisins en connaissant son identifiant.
  if exists (
    select 1 from unnest(_category_ids) as cid
    where not exists (
      select 1 from public.categories c
      where c.id = cid and (c.league_id is null or c.league_id = _league_id)
    )
  ) then
    raise exception 'Catégorie inconnue ou appartenant à une autre ligue';
  end if;

  delete from public.round_categories where round_id = _round_id;

  insert into public.round_categories (round_id, category_id, rang)
  select _round_id, cid, ord
  from unnest(_category_ids) with ordinality as t(cid, ord);

  -- Mémoire du dernier choix, pour pré-remplir la prochaine séance.
  delete from public.league_categories where league_id = _league_id;

  insert into public.league_categories (league_id, category_id, rang)
  select _league_id, cid, ord
  from unnest(_category_ids) with ordinality as t(cid, ord);
end;
$$;

grant execute on function public.set_round_categories(uuid, uuid[]) to authenticated;

-- =====================================================================
-- 2. Écrire une catégorie à soi : membre suffit
-- =====================================================================
-- Le choix des catégories n'est plus un privilège d'admin puisqu'il se fait à
-- l'ouverture d'une séance, que tout membre peut créer. Exiger le rôle admin
-- pour inventer un intitulé serait incohérent.

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
  if not public.is_league_member(_league_id) then
    raise exception 'Réservé aux membres de la ligue';
  end if;

  if btrim(coalesce(_name, '')) = '' then
    raise exception 'Le nom ne peut pas être vide';
  end if;

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
-- 3. Retrait de l'écran de configuration de ligue
-- =====================================================================
-- `set_league_categories` n'a plus de point d'entrée dans l'application : le
-- choix passe désormais exclusivement par `set_round_categories`. On la retire
-- pour qu'il ne subsiste pas un second chemin, invisible mais appelable.

drop function if exists public.set_league_categories(uuid, uuid[]);
