-- 030 — La Toile : échelle d'indices
-- Dépend de : 029.
--
-- Trois paliers, de plus en plus généreux : époque au 10e essai, nombre de
-- films au 15e, pays de naissance au 20e. Comme il n'y a pas de limite
-- d'essais, un indice unique ne sauverait pas quelqu'un encore bloqué au 25e
-- coup ; l'échelle accompagne jusqu'au bout.
--
-- ⚠️ POURQUOI CES INDICES-LÀ, ET PAS DE PLUS FORTS.
-- Le compteur d'essais vit dans le navigateur : on joue sans compte, donc il
-- n'y a rien en base à interroger. Le verrou « à partir du 10e essai » n'est
-- donc qu'une politesse d'interface — quiconque ouvre les outils de
-- développement peut appeler cette fonction au premier coup. Aucun de ces trois
-- indices ne donne la réponse à lui seul, ce qui rend ce contournement sans
-- intérêt : au pire on obtient tôt trois renseignements vagues.
--
-- L'indice vraiment fort dont on a parlé — « dans quel film ce collaborateur
-- a-t-il croisé la cible ? » — révèle un film de la cible, donc la cible. Il
-- attendra que les parties soient enregistrées côté serveur, ce qui viendra
-- avec les comptes et les séries.
--
-- Idempotent : rejouable sans erreur.

alter table public.toile_targets
  add column if not exists indice_epoque text,
  add column if not exists indice_pays text,
  add column if not exists indice_nb_films integer;

-- Un seul indice par appel, désigné par son rang. Renvoyer les trois d'un coup
-- reviendrait à tout livrer au premier palier.
create or replace function public.toile_indice(_jour date, _rang integer)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  _t record;
begin
  select indice_epoque, indice_pays, indice_nb_films
    into _t
  from public.toile_targets
  where play_date = _jour;

  if not found then
    return jsonb_build_object('erreur', 'aucune partie ce jour-là');
  end if;

  return case _rang
    when 1 then jsonb_build_object('rang', 1, 'cle', 'epoque',  'valeur', _t.indice_epoque)
    when 2 then jsonb_build_object('rang', 2, 'cle', 'nbFilms', 'valeur', _t.indice_nb_films::text)
    when 3 then jsonb_build_object('rang', 3, 'cle', 'pays',    'valeur', _t.indice_pays)
    else jsonb_build_object('erreur', 'rang inconnu')
  end;
end;
$$;

grant execute on function public.toile_indice(date, integer) to anon, authenticated;
