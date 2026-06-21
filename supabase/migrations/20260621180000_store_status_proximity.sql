-- =============================================================================
-- Live Store Status & Proximity: lat/long for client-side distance
-- calculations, and a manual "is_accepting_orders" kill switch the POS can
-- flip if the kitchen needs to go offline regardless of configured hours.
-- Safe to run on an existing database (delta migration).
-- =============================================================================

alter table public.outlets
  add column if not exists latitude  numeric(9,6) check (latitude between -90 and 90),
  add column if not exists longitude numeric(9,6) check (longitude between -180 and 180),
  add column if not exists is_accepting_orders boolean not null default true;
