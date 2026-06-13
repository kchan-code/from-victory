-- =============================================================================
-- Migration: 20260613040000_service_role_grants.sql
--
-- Purpose: FV-287 — grant service_role its standard baseline on the local
--   Supabase stack so the E2E global-setup seed does not fail with
--   "permission denied for table profiles".
--
-- Root cause: hosted Supabase grants service_role ALL via cluster
--   initialization. The local CLI stack (supabase start + supabase db push)
--   does not reliably reproduce those defaults, causing every table access by
--   the service-role client to fail at the PostgreSQL GRANT check — before RLS
--   even runs. The E2E global-setup.ts seeds test users with service_role;
--   without this grant the suite aborts in global-setup before any test runs.
--
--   This is the same root cause documented in FV-216
--   (20260612000000_explicit_table_grants.sql), which restored explicit grants
--   for authenticated/anon but did not cover service_role (the suite never ran
--   so the gap was invisible).
--
-- Design: grant service_role ALL on all existing public tables/sequences/
--   routines, and set ALTER DEFAULT PRIVILEGES so future objects also inherit
--   the grant. service_role already bypasses RLS by design — these grants give
--   it the PostgreSQL object-level access that matches its semantic privilege.
--
--   Applying a GRANT that already exists is idempotent in PostgreSQL, so this
--   migration is a safe no-op on hosted Supabase (where the grant is already
--   present from cluster initialization).
-- =============================================================================

grant usage on schema public to service_role;

grant all on all tables     in schema public to service_role;
grant all on all sequences  in schema public to service_role;
grant all on all routines   in schema public to service_role;

alter default privileges in schema public
  grant all on tables    to service_role;

alter default privileges in schema public
  grant all on sequences to service_role;

alter default privileges in schema public
  grant all on functions to service_role;
