-- 002 — Schéma : crédits de film sur les soumissions
-- À exécuter avant 003 (round_credit_overlaps référence ces colonnes).

alter table public.submissions
  add column if not exists director text,
  add column if not exists cast_names text[];
