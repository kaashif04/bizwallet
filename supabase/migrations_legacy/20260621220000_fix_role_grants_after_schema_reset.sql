-- =============================================================================
-- Fix: "permission denied for table ..." after a manual schema reset.
--
-- On a brand-new Supabase PROJECT, the platform pre-wires ALTER DEFAULT
-- PRIVILEGES so anon/authenticated/service_role automatically get table
-- grants in the public schema. That wiring is bound to the schema's object
-- id, not its name — so `drop schema public cascade; create schema public;`
-- (the standard "wipe and start over" reset) produces a schema that is a
-- different object despite sharing the name "public", and the platform's
-- default grants no longer apply to it. RLS policies still get created fine,
-- but they never even get evaluated, because Postgres checks the coarser
-- table-level GRANT first and rejects the query before RLS runs at all.
--
-- This re-establishes those grants explicitly so the app isn't relying on
-- the platform's project-creation-time wiring. Safe to re-run any time.
-- =============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Covers tables/sequences/functions created by future migrations too, so
-- this doesn't need to be repeated after every later setup.sql change.
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
