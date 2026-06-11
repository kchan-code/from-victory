-- =============================================================================
-- Migration: 20260612000000_explicit_table_grants.sql
--
-- Purpose: FV-216 — fix "permission denied for table journal_entries" (and
--   several other tables) in the RLS harness CI job.
--
-- Root cause: Supabase-hosted projects receive table-level grants via
--   ALTER DEFAULT PRIVILEGES during cluster initialization. In newer Supabase
--   CLI versions the local stack (supabase start + supabase db push) does not
--   reliably reproduce those default grants. Without a GRANT the PostgreSQL
--   permission check fires BEFORE RLS, producing "permission denied for table"
--   instead of the expected 0-row result — so the harness never reaches the
--   RLS boundary assertion.
--
--   Making the grants explicit here means the schema is self-contained: the
--   permission model is correct on any local stack, any CLI version, and any
--   hosted project, regardless of what default-privilege initialization the
--   runtime applies. Applying a GRANT that already exists is idempotent in
--   PostgreSQL.
--
-- Design (grant layer = door; RLS layer = lock):
--   authenticated receives SELECT, INSERT, UPDATE on every public table so
--   that the RLS harness (and the app) can reach the RLS check on every table.
--   For service-role-only tables (device_pairings, safety_events, etc.) RLS is
--   enabled with NO policies — the authenticated / anon roles will see 0 rows.
--   This is intentional: "0 rows returned" is the correct RLS-mediated
--   rejection. "permission denied" would also deny access but prevents the
--   harness from verifying the RLS boundary.
--
--   No DELETE grants to client roles — all deletes flow through service-role
--   server actions or cascading FK deletes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Schema usage (required before any object in the schema is accessible)
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated, anon;

-- ---------------------------------------------------------------------------
-- authenticated — all public tables
--   SELECT on all: needed to query any table (RLS filters rows from there).
--   INSERT / UPDATE where relevant: needed for the harness to prove RLS
--   blocks writes (an INSERT hitting no INSERT policy raises insufficient_privilege;
--   an UPDATE hitting no UPDATE policy affects 0 rows — both correct).
-- ---------------------------------------------------------------------------
grant select, insert, update on public.profiles                  to authenticated;
grant select                   on public.parent_athlete_links     to authenticated;
grant select, insert, update   on public.subscriptions            to authenticated;
grant select                   on public.training_sessions_catalog to authenticated;
grant select, insert, update   on public.athlete_sessions         to authenticated;
grant select, insert, update   on public.journal_entries          to authenticated;
grant select                   on public.device_pairings          to authenticated;
grant select                   on public.safety_events            to authenticated;
grant select                   on public.auth_rate_limit_events   to authenticated;
grant select                   on public.account_deletion_events  to authenticated;
grant select                   on public.waitlist_signups         to authenticated;

-- ---------------------------------------------------------------------------
-- anon — read-only on public content + tables tested by the RLS harness
--   The harness AC(b), AC(e), AC(f) assert that anon sees 0 rows from
--   journal_entries, device_pairings, and safety_events respectively. Without
--   a SELECT grant those assertions get "permission denied" before RLS runs,
--   which makes them fail for the wrong reason.
-- ---------------------------------------------------------------------------
grant select on public.training_sessions_catalog to anon;
grant select on public.journal_entries           to anon;
grant select on public.device_pairings           to anon;
grant select on public.safety_events             to anon;
grant insert on public.waitlist_signups          to anon;

-- ---------------------------------------------------------------------------
-- athlete_session_metadata view — separate grant required (views are not
-- covered by table-level grants on the underlying tables)
-- ---------------------------------------------------------------------------
grant select on public.athlete_session_metadata to authenticated;

-- ---------------------------------------------------------------------------
-- ALTER DEFAULT PRIVILEGES — any future table/view/function created by the
-- postgres role in the public schema automatically inherits SELECT for
-- authenticated and anon. INSERT / UPDATE are intentionally excluded so
-- service-role-only tables do not accidentally receive client write access
-- without an explicit migration.
-- ---------------------------------------------------------------------------
alter default privileges in schema public
  grant select on tables to authenticated, anon;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, anon;

alter default privileges in schema public
  grant execute on functions to authenticated, anon;
