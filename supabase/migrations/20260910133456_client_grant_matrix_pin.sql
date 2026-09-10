-- =============================================================================
-- Migration: 20260910133456_client_grant_matrix_pin.sql
--
-- Purpose: FV-568 — pin the client-role GRANT matrix for EVERY `public`
--   relation, the one client-visible sequence, and the trigger/cron/RPC
--   functions, so the RLS harness passes deterministically on the current
--   Supabase CI Postgres image (and on hosted). This is the sibling-and-
--   completion migration to FV-507's `20260909000000_subscriptions_client_
--   write_revoke.sql`, which fixed exactly this class of bug for
--   `subscriptions` alone — this migration closes the same gap everywhere
--   else in one self-contained pass.
--
-- Root cause (same class as FV-507, now confirmed platform-documented):
--   Supabase's current docs ("Securing your API -> Default privileges for
--   new tables and functions") state: "By default on existing projects,
--   tables and functions you create in `public` are automatically granted
--   SELECT, INSERT, UPDATE, DELETE (or EXECUTE for functions) to anon,
--   authenticated, and service_role" — and separately, "Supabase is moving
--   the platform default to revoke these automatic grants" (changelog:
--   github.com/orgs/supabase/discussions/45329). The CI Postgres image
--   (17.6.1.159 -> .165 -> .167) now reproduces that hosted default-grant
--   behaviour locally. Every migration in this repo that creates a table only
--   ever ADDED grants on top of whatever the platform default handed the
--   object at CREATE TIME (20260612000000_explicit_table_grants.sql,
--   20260708120000_athlete_private_columns_grant_hardening.sql, etc.) — none
--   of them REVOKED first, so on the hosted-default model every `public`
--   table still carries the platform's automatic `anon=arwdDxt
--   authenticated=arwdDxt`, `profiles` carries `anon=arwdDxt
--   authenticated=awdDxt` underneath its column-restricted SELECT allowlist,
--   the seven trigger functions plus three RPC/cron functions carry
--   `anon=X authenticated=X` EXECUTE, and `activity_events_id_seq` carries
--   `rwU` (read/write/update) for both client roles. RLS still held
--   everywhere — this was never a live data-exposure bug — but the harness
--   asserts the GRANT layer directly in several files (09, 13 AC(b), 14
--   AC(f), 15, 16 AC(e)) and those assertions fail on this stack because the
--   grant layer under test does not match the two-layer denial model the
--   schema's own design comments (20260520200000, 20260612000000) declare as
--   intentional.
--
-- Fix: the documented Supabase opt-out, applied exhaustively.
--   Postgres privileges are purely additive — there is no "deny" ACL entry,
--   only the presence or absence of a GRANT — so the only way to pin a
--   privilege set regardless of what a given stack's default-privilege
--   inheritance handed an object at creation time is an explicit REVOKE
--   followed by the exact GRANT intended. For every EXISTING relation below:
--   `revoke all privileges on table ... from public, anon, authenticated;`
--   then grant back precisely what the app's client roles use (mapped from
--   every `.from()` / `.rpc()` call site in apps/web before writing this
--   migration — see the per-relation comments). For FUTURE relations: the
--   `alter default privileges for role postgres in schema public ...`
--   statements at the bottom apply the Supabase-documented opt-out so a
--   table/sequence/function created by a later migration never silently
--   re-acquires a client write/execute grant the way `subscriptions` did.
--   `revoke all ... on table` also strips any COLUMN-level grants on that
--   table (column ACLs live in the same catalog entry the table-level REVOKE
--   clears), which is why `profiles`' FV-361 column allowlist is re-issued
--   explicitly below in the same statement group, not left to survive the
--   REVOKE — it would not.
--
-- Design notes on the two relations that keep TABLE-level (not column- or
-- row-scoped) write grants, because the app genuinely writes/reads that way:
--   - `profiles` UPDATE stays table-level (not narrowed further) because the
--     athlete-quiz write path (apps/web/lib/actions/athlete-quiz.ts), the
--     next-game one-tap prompt (lib/actions/next-game.ts), and the sport
--     switch flow all issue a plain `UPDATE profiles SET position = ...`
--     (or focus_area / next_game_on / sport) with no `.select()` /
--     `RETURNING` chained — Postgres UPDATE requires the UPDATE privilege on
--     the SET columns, not SELECT, so this is unaffected by (and does not
--     need to be narrower than) the SELECT column allowlist FV-361 already
--     pinned. INSERT stays table-level too — the athlete-account-creation
--     service action and the self-serve 18+ signup path both write full
--     profiles rows (service-role for the former; `authenticated` briefly
--     during the 18+ self-serve flow per FV-325).
--   - `training_sessions_catalog` SELECT stays table-level because the
--     content-catalog read call site uses `.select("*")` — a column
--     allowlist would have to be kept in lockstep with every future content
--     column and buys no privacy benefit (this table holds zero PII; it is
--     the shared training-content library).
--
-- Idempotency / scope / no-ops:
--   - No data change. No RLS policy change — every `enable row level
--     security` and every `create policy` in this schema is untouched; this
--     migration only touches the GRANT layer, which sits in front of RLS.
--   - `service_role` is never named in any REVOKE below. It keeps ALL on
--     every relation via 20260613040000_service_role_grants.sql (existing
--     objects) and its own `alter default privileges ... grant all ... to
--     service_role` (future objects, untouched here) — the Stripe webhook
--     handler, cron routes, and every `createServiceClient()` server action
--     are unaffected.
--   - REVOKE of a privilege not held, and GRANT of a privilege already held,
--     are both no-ops in PostgreSQL — safe to re-run, safe on a stack that
--     already matches the legacy (non-hosted-default) grant model.
--   - Safe on the hosted project via the `db-migrate` workflow: migrations
--     run as `postgres`, which owns every relation touched here (all
--     created by prior `postgres`-run migrations), so `REVOKE ALL ... FROM
--     public, anon, authenticated` reaches every ACL entry on the object
--     regardless of whether that entry came from an explicit GRANT or from
--     `ALTER DEFAULT PRIVILEGES` inheritance at creation time.
--
-- Companion changes in this same PR (not in this file):
--   supabase/tests/rls/assertions/19_client_grant_matrix.sql — new file,
--     full matrix pin with CI-log diagnostics + effect probes.
--   09_access_grants.sql (f)/(g), 13_waitlist_signups.sql AC(b),
--     14_parent_digest_preferences.sql AC(f) — row_count / grant-layer
--     diagnosis, same pattern FV-507 established in 03_subscriptions.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. TABLES + VIEW — revoke all, then grant back exactly the target matrix.
--    Grouped alphabetically for auditability. authenticated / anon only;
--    service_role is never named (see header).
-- ---------------------------------------------------------------------------

-- access_grants — parent-own SELECT policy only; all writes service-role
-- (KC comp/free-access tool). anon SELECT grant is "door open, lock
-- engaged": RLS denies every row (09_access_grants.sql AC d).
revoke all privileges on table public.access_grants from public, anon, authenticated;
grant select on table public.access_grants to authenticated, anon;

-- account_deletion_events — forensic audit log, service-role-only writer.
-- No client policy exists; anon/authenticated SELECT grant is the same
-- door-open/lock-engaged pattern (06_audit_tables.sql).
revoke all privileges on table public.account_deletion_events from public, anon, authenticated;
grant select on table public.account_deletion_events to authenticated, anon;

-- activity_events — raw product-analytics events, service-role-only writer
-- (apps/web/lib/activity/log.ts calls createServiceClient()). No client
-- policy; same door-open/lock-engaged pattern (12_activity_events.sql).
revoke all privileges on table public.activity_events from public, anon, authenticated;
grant select on table public.activity_events to authenticated, anon;

-- activity_rollup — aggregate-only (no athlete_id, no PII), service-role-only
-- writer (rollup_activity_events() cron). Same door-open/lock-engaged
-- pattern (17_activity_rollup.sql).
revoke all privileges on table public.activity_rollup from public, anon, authenticated;
grant select on table public.activity_rollup to authenticated, anon;

-- athlete_session_metadata — VIEW (security_invoker = true), not a base
-- table; RLS on the underlying athlete_sessions applies. Parent-dashboard
-- aggregate read only (count/dates, never content). No anon grant: the
-- dashboard is an authenticated-only surface and the view has never carried
-- one. `revoke ... on table` also targets views (they are relations in
-- pg_class) — required here because 20260612000000 granted it separately.
revoke all privileges on table public.athlete_session_metadata from public, anon, authenticated;
grant select on table public.athlete_session_metadata to authenticated;

-- athlete_sessions — athlete's own session instances. Client writes: start
-- (INSERT) and complete (UPDATE completed_at) via
-- apps/web/lib/actions/sessions.ts, both RLS-scoped to the athlete's own
-- rows. No anon access (never an anon-facing surface).
revoke all privileges on table public.athlete_sessions from public, anon, authenticated;
grant select, insert, update on table public.athlete_sessions to authenticated;

-- auth_rate_limit_events — HMAC-bucketed rate-limit log, service-role-only
-- writer (lib/actions/rate-limit-store.ts). Same door-open/lock-engaged
-- pattern (06_audit_tables.sql).
revoke all privileges on table public.auth_rate_limit_events from public, anon, authenticated;
grant select on table public.auth_rate_limit_events to authenticated, anon;

-- device_pairings — one-time claim codes, service-role-only writer
-- (lib/actions/pairings.ts). Same door-open/lock-engaged pattern
-- (04_device_pairings.sql).
revoke all privileges on table public.device_pairings from public, anon, authenticated;
grant select on table public.device_pairings to authenticated, anon;

-- journal_entries — athlete-only-readable (CLAUDE.md non-negotiable #1).
-- Client writes: athlete INSERT (save) + UPDATE (edit within the session)
-- via lib/actions/journal.ts, both RLS-scoped to athlete_id = auth.uid().
-- anon SELECT grant is door-open/lock-engaged (01_journal_entries.sql AC b —
-- parents and anon both see 0 rows; NO parent policy exists on this table,
-- full stop, per CLAUDE.md).
revoke all privileges on table public.journal_entries from public, anon, authenticated;
grant select, insert, update on table public.journal_entries to authenticated;
grant select on table public.journal_entries to anon;

-- parent_athlete_links — all writes are service-role (link creation happens
-- inside the athlete-creation server action). authenticated SELECT only,
-- scoped by the parent-own-link / athlete-own-link RLS policies. No anon
-- grant: never an anon-facing surface.
revoke all privileges on table public.parent_athlete_links from public, anon, authenticated;
grant select on table public.parent_athlete_links to authenticated;

-- profiles — FV-361's column-restricted allowlist (see
-- 20260708120000_athlete_private_columns_grant_hardening.sql) reversed the
-- SELECT grant model to avoid a raw-PostgREST-API column leak. `revoke all`
-- also strips that column allowlist (column ACLs live on the same catalog
-- entry), so it is re-issued in full here, unchanged from FV-361: the ten
-- non-athlete-private columns, omitting position / focus_area / next_game_on
-- / username / created_as_adult_by_parent. INSERT / UPDATE stay table-level
-- (see header design note) — no column restriction on writes, matching
-- pre-existing behaviour exactly. No anon grant, table- or column-level:
-- anon has never had SELECT on profiles (verified in 20260708120000's own
-- header note) and no profiles RLS policy ever matches an anon (NULL
-- auth.uid()) caller.
revoke all privileges on table public.profiles from public, anon, authenticated;
grant insert, update on table public.profiles to authenticated;
grant select (
  id,
  role,
  first_name,
  birthdate,
  created_at,
  updated_at,
  sport,
  sport_selected_at,
  digest_opt_out,
  digest_unsubscribe_token
) on public.profiles to authenticated;

-- push_subscriptions — athlete's own Web Push subscription row. Client
-- writes: INSERT (subscribe), UPDATE (re-subscribe / reminder-hour change),
-- DELETE (unsubscribe-own) via lib/actions/push.ts, all RLS-scoped to
-- athlete_id = auth.uid(). anon SELECT is door-open/lock-engaged
-- (07_push_subscriptions.sql).
revoke all privileges on table public.push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select on table public.push_subscriptions to anon;

-- safety_events — Option C detection-event log (event/pattern only, NEVER
-- journal content, per CLAUDE.md). Service-role-only writer. Same
-- door-open/lock-engaged pattern (05_safety_events.sql).
revoke all privileges on table public.safety_events from public, anon, authenticated;
grant select on table public.safety_events to authenticated, anon;

-- subscriptions — re-pinned here idempotently for a single self-contained
-- grant-matrix record; FV-507's 20260909000000 migration already applied
-- this exact REVOKE/GRANT pair. SELECT-only for authenticated (own row via
-- RLS); all writes are service-role (Stripe webhook handler). No anon
-- access at all (not even the door-open pattern — 03_subscriptions.sql
-- AC(d0) pins zero anon privileges).
revoke all privileges on table public.subscriptions from public, anon, authenticated;
grant select on table public.subscriptions to authenticated;

-- training_sessions_catalog — shared content library, zero PII. SELECT
-- table-level for both client roles (see header design note on
-- `select("*")`); all writes are service-role (content-curator seed
-- migrations).
revoke all privileges on table public.training_sessions_catalog from public, anon, authenticated;
grant select on table public.training_sessions_catalog to authenticated, anon;

-- waitlist_signups — public landing-page form. anon INSERT only
-- (`with check (true)`); authenticated SELECT-grant-only /
-- lock-engaged (no SELECT policy — 13_waitlist_signups.sql AC c). No anon
-- SELECT and no authenticated INSERT, both hard grant-layer denials
-- (13_waitlist_signups.sql AC b / AC d).
revoke all privileges on table public.waitlist_signups from public, anon, authenticated;
grant select on table public.waitlist_signups to authenticated;
grant insert on table public.waitlist_signups to anon;

-- ---------------------------------------------------------------------------
-- 2. SEQUENCE — activity_events.id is `bigint generated always as identity`,
--    which Postgres still backs with a real sequence object carrying its own
--    ACL, independent of the table's ACL. USAGE + SELECT (nextval / currval
--    introspection) only — never UPDATE (setval), which would let a client
--    role rewind or skip the identity counter.
-- ---------------------------------------------------------------------------
revoke all on sequence public.activity_events_id_seq from public, anon, authenticated;
grant usage, select on sequence public.activity_events_id_seq to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. FUNCTIONS — revoke EXECUTE from every client role on every function
--    that is not meant to be directly RPC-callable, exhaustively, in one
--    place. Idempotent re-affirmation of prior migrations' revokes
--    (20260709000000_function_grant_default_deny.sql, 20260710000000 /
--    20260711000000_activity_rollup*.sql, 20260708120000) PLUS the fix for
--    the actual FV-568 gap: those prior migrations revoked EXECUTE FROM
--    PUBLIC (which covers anon/authenticated ONLY via PUBLIC membership,
--    with no privilege of their own) for six of the seven trigger functions,
--    but on the hosted-default model each of those functions ALSO received
--    its own EXPLICIT anon/authenticated EXECUTE grant at CREATE FUNCTION
--    time (the platform default is a per-role grant, not merely a PUBLIC
--    grant) — a `revoke ... from public` alone does not touch an explicit
--    per-role grant. Naming anon/authenticated explicitly below closes that.
--
--    TRIGGER FUNCTIONS (never called directly — invoked only by the trigger
--    manager; a `returns trigger` function additionally cannot be called via
--    ordinary SQL/RPC):
-- ---------------------------------------------------------------------------
revoke execute on function public.set_updated_at()                 from public, anon, authenticated;
revoke execute on function public.check_parent_athlete_link_roles() from public, anon, authenticated;
revoke execute on function public.check_device_pairing_roles()      from public, anon, authenticated;
revoke execute on function public.check_athlete_session_role()      from public, anon, authenticated;
revoke execute on function public.check_journal_entry_consistency() from public, anon, authenticated;
revoke execute on function public.check_safety_event_consistency()  from public, anon, authenticated;
revoke execute on function public.enforce_birthdate_immutable()     from public, anon, authenticated;

-- SECURITY DEFINER, service-role/cron-only RPCs — never client-callable.
revoke execute on function public.due_push_reminders()              from public, anon, authenticated;
revoke execute on function public.due_game_day_reminders()           from public, anon, authenticated;
revoke execute on function public.rollup_activity_events(integer)   from public, anon, authenticated;

-- SECURITY DEFINER self-read RPC — authenticated only (no anon; the caller's
-- position/focus_area is athlete-private, not a safe-degrade-to-NULL
-- contract like get_own_username()). Re-affirms
-- 20260708120000_athlete_private_columns_grant_hardening.sql's own revoke.
revoke execute on function public.get_own_personalization() from public, anon;

-- get_own_username() is DELIBERATELY left untouched here: it is INTENTIONALLY
-- anon + authenticated + PUBLIC callable as a safe-degrade (SECURITY DEFINER
-- scoped to auth.uid() -> NULL for anon), a contract pinned by
-- 10_username.sql AC(d) and 15_function_grant_default_deny.sql AC(b). Do not
-- revoke or re-grant it here.

-- ---------------------------------------------------------------------------
-- 4. DEFAULT PRIVILEGES — the documented Supabase opt-out (see header),
--    applied FOR ROLE postgres (the role every migration, including this
--    one, runs as) so a table/sequence/function created by a LATER
--    migration never silently re-acquires a client write/execute grant the
--    way `subscriptions` did. Keeps 20260612000000's original SELECT-by-
--    default intent for future tables/sequences (client roles can always
--    read a new table unless a migration says otherwise) while removing the
--    INSERT/UPDATE/DELETE/EXECUTE half of the platform's automatic grant.
--    service_role is never named — 20260613040000_service_role_grants.sql
--    already set its own `grant all ... to service_role` default-privileges
--    delta, independent of this one, and keeps ALL on every future object.
-- ---------------------------------------------------------------------------
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  grant select on tables to anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
