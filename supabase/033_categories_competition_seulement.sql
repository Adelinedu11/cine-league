-- 033 — Les catégories ne concernent que la Compétition officielle
-- Dépend de : 032.
--
-- Les catégories de vote n'existent que dans le mode Compétition officielle :
-- Ciné'Files se joue en devinant un film mystère, il n'y a rien à départager
-- par catégorie. La migration 032 posait pourtant une photo sur TOUTE séance
-- créée, et son rattrapage en a distribué à toutes les séances existantes.
--
-- Des lignes inutiles ne cassent rien aujourd'hui — `round_categories` n'est lu
-- que par le bulletin de vote, qui ne s'affiche qu'en compétition. Mais elles
-- mentent sur l'état du système, et c'est ainsi qu'on finit par écrire du code
-- qui s'appuie dessus.
--
-- Idempotent : rejouable sans erreur.

-- =====================================================================
-- 1. Le déclencheur ignore les autres modes
-- =====================================================================

create or replace function public.snapshot_round_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Seule la Compétition officielle vote par catégorie.
  if new.game_mode is distinct from 'competition_officielle' then
    return new;
  end if;

  insert into public.round_categories (round_id, category_id, rang)
  select new.id, lc.category_id, lc.rang
  from public.league_categories lc
  where lc.league_id = new.league_id
  on conflict do nothing;

  return new;
end;
$$;

-- =====================================================================
-- 2. Nettoyage des photos inutiles
-- =====================================================================
-- Prudence : on ne supprime QUE les catégories des séances non compétitives
-- qui n'ont reçu aucun vote. Une séance ayant des votes garde sa photo quoi
-- qu'il arrive — mieux vaut une ligne en trop qu'un palmarès amputé.

delete from public.round_categories rc
using public.rounds r
where rc.round_id = r.id
  and r.game_mode is distinct from 'competition_officielle'
  and not exists (
    select 1 from public.votes v where v.round_id = rc.round_id
  );
