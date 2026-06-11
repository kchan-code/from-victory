-- =============================================================================
-- Migration: 20260612000001_audit_table_anon_grants.sql
--
-- Purpose: FV-218 — add anon SELECT on auth_rate_limit_events and
--   account_deletion_events so the RLS harness can verify the RLS boundary
--   (0 rows returned) rather than the grant boundary (permission denied).
--
-- Design: consistent with the door=grant / lock=RLS model in FV-216. Both
--   tables have RLS enabled with no anon-facing policies, so granting SELECT
--   to anon results in 0 rows visible — the grant opens the door; RLS (deny
--   by default with no matching policy) is the lock. The harness assertion
--   06_audit_tables.sql verifies 0 rows for both authenticated and anon.
--
--   Applying a GRANT that already exists is idempotent in PostgreSQL.
-- =============================================================================

grant select on public.auth_rate_limit_events  to anon;
grant select on public.account_deletion_events to anon;
