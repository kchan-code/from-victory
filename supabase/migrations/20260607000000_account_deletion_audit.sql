-- =============================================================================
-- Migration: 20260607000000_account_deletion_audit.sql
--
-- Purpose:
--   Durable, content-free audit table for account and athlete deletion events
--   (FV-14). Companion to the rate-limiting logic in lib/actions/account.ts.
--
-- Design invariants:
--   1. CONTENT-FREE. Stores only opaque UUIDs, an event_type enum, an optional
--      count, and a timestamp. No names, emails, journal text, or free text.
--
--   2. NO FOREIGN KEYS — deliberate. See table comment below. IDs are stored
--      as plain uuid columns with no FK constraint referencing auth.users or
--      public.profiles. This is the critical design decision for an audit log:
--      a FK ON DELETE CASCADE would delete the audit row along with the user
--      (defeating the purpose); ON DELETE SET NULL would erase the actor ID
--      (losing the forensic proof). We want audit rows to survive the cascade
--      hard-delete they record.
--
--   3. SERVICE-ROLE ONLY. RLS is enabled with NO client policies. Only the
--      server-side service role (lib/supabase/service.ts) may read or write
--      this table. There is no user-facing surface for these rows.
--
--   4. RATE-LIMIT INDEX. The composite index on (actor_parent_id, created_at)
--      supports the rolling-window count query performed before every delete
--      action: "how many deletions has this parent performed in the last N
--      minutes?" — answered with an index-only scan.
--
-- Postgres version: 15+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. account_deletion_events
-- ---------------------------------------------------------------------------

create table public.account_deletion_events (
  id                uuid        primary key default gen_random_uuid(),
  event_type        text        not null
                                check (event_type in ('athlete_deleted', 'account_deleted')),
  -- The parent who initiated the deletion. Stored as a plain uuid with NO
  -- foreign key to auth.users or public.profiles — see design invariant #2
  -- in the file header. This ID is the forensic proof of who acted; an FK
  -- CASCADE would erase it along with the parent's row.
  actor_parent_id   uuid        not null,
  -- Set for 'athlete_deleted' rows; null for 'account_deleted' rows.
  -- Plain uuid with NO FK for the same reason as actor_parent_id — the
  -- athlete's auth.users row is deleted before (or concurrently with) this
  -- audit insert, so an FK would fail at insert time.
  target_athlete_id uuid,
  -- Set for 'account_deleted' rows: how many sole-managed athletes were
  -- cascade-deleted as part of this account deletion. Null for
  -- 'athlete_deleted' rows (where the count is always 1, implicitly).
  athletes_deleted  integer,
  created_at        timestamptz not null default now()
);

comment on table public.account_deletion_events is
  'Append-only, content-free audit log of parent-initiated deletion events '
  '(FV-14). Stores only opaque UUIDs, event type, optional count, and '
  'timestamp — NO names, email, journal content, or free text. '
  'NO FOREIGN KEYS BY DESIGN: an FK to profiles/auth.users with ON DELETE '
  'CASCADE would silently delete the audit row with the user (defeating the '
  'purpose); ON DELETE SET NULL would erase the actor UUID (losing forensic '
  'proof). The service-role server action (lib/actions/account.ts) writes '
  'these rows after a successful deleteUser() call. RLS is enabled with NO '
  'client policies — service-role only.';

comment on column public.account_deletion_events.event_type is
  '''athlete_deleted'' = a single athlete removed by their parent. '
  '''account_deleted'' = a parent and all their sole-managed athletes removed.';

comment on column public.account_deletion_events.actor_parent_id is
  'UUID of the parent who initiated the deletion. Plain uuid with no FK — '
  'see table comment. For ''account_deleted'' events this parent no longer '
  'exists in auth.users by the time the row is written.';

comment on column public.account_deletion_events.target_athlete_id is
  'UUID of the athlete removed. Set for ''athlete_deleted'' events; NULL for '
  '''account_deleted'' events (use athletes_deleted count instead). Plain uuid '
  'with no FK — the athlete row is gone by write time.';

comment on column public.account_deletion_events.athletes_deleted is
  'For ''account_deleted'' rows: count of sole-managed athletes that were '
  'hard-deleted as part of this account deletion. NULL for ''athlete_deleted'' '
  'rows (always 1 implicitly). Stored for forensic and operational visibility.';


-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

-- Primary rate-limit lookup: "how many deletions did this parent perform in
-- the last N minutes?" A composite index with created_at descending lets
-- Postgres answer this with a tight index scan rather than a seq scan.
create index account_deletion_events_actor_created_idx
  on public.account_deletion_events (actor_parent_id, created_at desc);


-- ---------------------------------------------------------------------------
-- 3. Row Level Security — service-role only.
-- ---------------------------------------------------------------------------

alter table public.account_deletion_events enable row level security;

-- Intentional: no CREATE POLICY statements.
--
-- Every read and write goes through the service-role client
-- (createServiceClient() in lib/supabase/service.ts), which bypasses RLS
-- entirely. Adding a client SELECT policy would expose deletion history to
-- parents or athletes — there is no designed UI surface for this data.
-- Adding a client INSERT policy would allow a client to forge audit rows,
-- which undermines the forensic purpose of the table.
--
-- If an operational dashboard for deletion events is ever needed, it must
-- go through a server-side service-role query, never a client policy.
