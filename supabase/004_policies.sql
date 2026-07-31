-- 004 — Policies RLS
-- Dépend de 001 (is_league_member, round_league_id).
-- Idempotent : les 'drop policy if exists' permettent de rejouer sans erreur.

-- =====================================================================
-- Table : categories
-- Données de référence, lisibles par tout utilisateur authentifié.
-- Aucune écriture côté client (gérée en admin / service_role).
-- =====================================================================
alter table public.categories enable row level security;

-- 'drop if exists' sur les deux noms : l'ancien (au cas où déjà joué) et le
-- nouveau, pour rejouer sans erreur de doublon.
drop policy if exists "lecture des catégories" on public.categories;
drop policy if exists "categories_select_all" on public.categories;

create policy "categories_select_all"
on public.categories for select
using ( auth.role() = 'authenticated' );

-- =====================================================================
-- Table : rounds
-- Règle métier : tout membre de la ligue peut lire, créer et faire avancer
-- (update) les rounds de cette ligue.
-- =====================================================================
alter table public.rounds enable row level security;

drop policy if exists "membre lit les rounds"      on public.rounds;
drop policy if exists "membre crée un round"       on public.rounds;
drop policy if exists "membre met à jour un round" on public.rounds;

create policy "membre lit les rounds"
on public.rounds for select
using ( public.is_league_member(league_id) );

create policy "membre crée un round"
on public.rounds for insert
with check ( public.is_league_member(league_id) );

create policy "membre met à jour un round"
on public.rounds for update
using ( public.is_league_member(league_id) )
with check ( public.is_league_member(league_id) );

-- =====================================================================
-- Table : submissions
-- Règle métier : chaque membre gère SA propre soumission (une par round,
-- contrainte unique round_id + user_id). Un membre ne voit que ses propres
-- soumissions — jamais celles des autres (les comparaisons passent par les
-- fonctions SECURITY DEFINER de 003).
-- =====================================================================
alter table public.submissions enable row level security;

drop policy if exists "voir sa soumission"     on public.submissions;
drop policy if exists "créer sa soumission"    on public.submissions;
drop policy if exists "modifier sa soumission" on public.submissions;

create policy "voir sa soumission"
on public.submissions for select
using ( user_id = auth.uid() );

create policy "créer sa soumission"
on public.submissions for insert
with check (
  user_id = auth.uid()
  and public.is_league_member(public.round_league_id(round_id))
);

create policy "modifier sa soumission"
on public.submissions for update
using ( user_id = auth.uid() )
with check (
  user_id = auth.uid()
  and public.is_league_member(public.round_league_id(round_id))
);
