-- =============================================================================
-- Migration: 20260611000000_auth_rate_limit_events.sql
--
-- Purpose:
--   Content-free, transient rate-limit event log for auth and pairing actions
--   (FV-13). Companion to the rate-limiting logic in:
--     lib/actions/rate-limit.ts       (pure decision function + config)
--     lib/actions/rate-limit-store.ts (I/O helper, server-only)
--
-- Design invariants:
--   1. CONTENT-FREE. Stores only an opaque HMAC-SHA256 digest of
--      "<action>:<identifier>", the action label, and a timestamp.
--      NEVER stores raw IP addresses, email addresses, UUIDs, or any
--      personal data. The digest is non-reversible; rotating
--      RATE_LIMIT_HASH_SECRET instantly resets all in-flight counters
--      with zero user impact. See CLAUDE.md: "NOT allowed: long-term
--      IP-derived data."
--
--   2. TRANSIENT — rows are self-pruned to the rate-limit window. The
--      writing server action deletes expired rows for the same bucket
--      immediately after inserting a new one (inline TTL). This bounds
--      table growth to approximately (limit × active-identifiers) rows
--      at steady state; no cron or pg_cron dependency required.
--
--   3. SERVICE-ROLE ONLY. RLS is enabled with NO client policies. Only
--      the server-side service role (lib/supabase/service.ts) may read
--      or write this table. There is no user-facing surface for these
--      rows — they are an infrastructure control, not user data.
--
--   4. RATE-LIMIT INDEX. The composite index on (bucket, created_at desc)
--      supports the rolling-window count query: "how many events exist for
--      this bucket in the last N minutes?" — answered with an index-only
--      scan on the compact hex-digest values.
--
-- Privacy note (per CLAUDE.md §"Minor Data Protection"):
--   All athletes are 13+; this table records no identifying data about
--   them. The "bucket" column is a keyed HMAC digest — without the
--   RATE_LIMIT_HASH_SECRET it is computationally infeasible to derive
--   the original identifier from the stored value.
--
-- Postgres version: 15+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. auth_rate_limit_events
-- ---------------------------------------------------------------------------

create table public.auth_rate_limit_events (
  id          uuid        primary key default gen_random_uuid(),

  -- Opaque HMAC-SHA256 hex digest of "<action>:<identifier>".
  -- NEVER a raw IP, email, or UUID — only the non-reversible digest.
  -- See lib/actions/rate-limit-store.ts for the derivation.
  bucket      text        not null,

  -- Which server action triggered this event. Constrained to the five
  -- protected actions so any future actions require an explicit migration.
  action      text        not null
                          check (action in (
                            'sign_in',
                            'sign_up',
                            'athlete_sign_in',
                            'claim_pairing',
                            'generate_pairing_code'
                          )),

  created_at  timestamptz not null default now()
);

comment on table public.auth_rate_limit_events is
  'Content-free, transient rate-limit event log for auth and pairing '
  'actions (FV-13). Stores only an opaque HMAC-SHA256 hex digest of the '
  'identifier (never raw IP, email, or UUID), an action label, and a '
  'timestamp. Rows are self-pruned to the rate-limit window by the writing '
  'server action (inline TTL — no cron required). RLS is enabled with NO '
  'client policies — service-role only. See lib/actions/rate-limit-store.ts.';

comment on column public.auth_rate_limit_events.bucket is
  'HMAC-SHA256 hex digest of "<action>:<identifier>" keyed with '
  'RATE_LIMIT_HASH_SECRET. Non-reversible: without the secret, the '
  'original identifier cannot be derived. Domain separation by action '
  'is included in the HMAC input so the same identifier produces '
  'different bucket values across different actions.';

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, or generate_pairing_code.';

comment on column public.auth_rate_limit_events.created_at is
  'Wall-clock insert time. Used for the rolling-window count query. '
  'The writing server action also deletes rows older than the window '
  'for this bucket immediately after inserting — self-pruning TTL.';


-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

-- Primary rate-limit lookup: "how many events exist for this bucket/action
-- in the last N minutes?" A composite index with created_at descending lets
-- Postgres answer this with a tight index scan on the compact digest values
-- rather than a seq scan.
create index auth_rate_limit_events_bucket_created_idx
  on public.auth_rate_limit_events (bucket, created_at desc);


-- ---------------------------------------------------------------------------
-- 3. Row Level Security — service-role only.
-- ---------------------------------------------------------------------------

alter table public.auth_rate_limit_events enable row level security;

-- Intentional: no CREATE POLICY statements.
--
-- Every read and write goes through the service-role client
-- (createServiceClient() in lib/supabase/service.ts), which bypasses RLS
-- entirely. Adding a client SELECT policy would expose rate-limit digests
-- to authenticated users — there is no designed UI surface for this data.
-- Adding a client INSERT policy would allow a client to forge event rows,
-- which would either inflate or deflate the count and defeat the control.
--
-- If an operational dashboard for rate-limit events is ever needed, it
-- must go through a server-side service-role query, never a client policy.
