-- =============================================================================
-- Migration: 20260614030000_index_hygiene.sql
--
-- Purpose:
--   Index hygiene pass (FV-86). Five verified items: two new indexes that
--   back hot queries, two FK indexes that prevent cascade-delete seq scans,
--   and two redundant indexes dropped (each fully superseded by a composite
--   or the table PK). No table/column/RLS changes — indexes only, so this
--   does NOT change generated types (apps/web/lib/supabase/types.ts).
--
--   All statements use CREATE/DROP INDEX (NOT CONCURRENTLY) because this
--   migration runs inside the standard migration transaction. They are made
--   idempotent-friendly with IF EXISTS / IF NOT EXISTS so a partial re-run
--   is safe.
--
-- Each item was verified against the migration that defines the object
-- before this was written (file:line cited per item below).
--
-- Postgres version: 15+
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Item 1 (ADD): partial index on athlete_sessions for the completed-count.
--
--   countCompleted (FV-82) runs, on every daily-session read/write:
--     SELECT count(id) FROM athlete_sessions
--      WHERE athlete_id = $1 AND completed_at IS NOT NULL
--   The existing athlete_sessions_athlete_idx (athlete_id only — defined in
--   20260522000749_content_schema.sql:120) forces a filter on completed_at
--   across all of an athlete's rows.
--
--   A PARTIAL index keyed on athlete_id WHERE completed_at IS NOT NULL is
--   strictly better than a plain composite (athlete_id, completed_at) for
--   THIS query: its predicate exactly matches the query's filter, so the
--   planner satisfies the count as an index-only scan over just the
--   completed rows; and it is smaller because in-progress rows (completed_at
--   IS NULL) are excluded entirely. We do not order by / range-scan
--   completed_at here, so the extra trailing column a composite would add
--   buys nothing.
-- ---------------------------------------------------------------------------
create index if not exists athlete_sessions_athlete_completed_idx
  on public.athlete_sessions (athlete_id)
  where completed_at is not null;

comment on index public.athlete_sessions_athlete_completed_idx is
  'FV-86: partial index backing countCompleted (FV-82): '
  'count(*) where athlete_id = $1 and completed_at is not null. Partial '
  'predicate matches the query filter -> index-only scan over completed '
  'rows only; smaller than a full composite (athlete_id, completed_at).';


-- ---------------------------------------------------------------------------
-- Item 2 (DROP): journal_entries_athlete_idx — redundant.
--
--   Defined in 20260522000749_content_schema.sql:203 as
--     create index journal_entries_athlete_idx
--       on public.journal_entries (athlete_id);
--   Fully superseded by the composite
--     journal_entries_athlete_created_idx (athlete_id, created_at desc)
--   defined in 20260522002717_safety_events.sql:148-149 — VERIFIED present
--   above. A leading-column lookup on athlete_id (the RLS predicate and the
--   "give me my entries" query) is served by the composite, so the
--   single-column index is dead weight on every journal write.
-- ---------------------------------------------------------------------------
drop index if exists public.journal_entries_athlete_idx;


-- ---------------------------------------------------------------------------
-- Item 3 (DROP): parent_athlete_links_parent_idx — redundant.
--
--   Defined in 20260520200000_baseline_profiles_links_subscriptions.sql:149
--   as create index parent_athlete_links_parent_idx
--        on public.parent_athlete_links (parent_id);
--   The table PRIMARY KEY is (parent_id, athlete_id)
--   (same baseline migration:128). A b-tree PK index already serves
--   leading-column lookups on parent_id ("all athletes for this parent"),
--   so the standalone parent_id index is redundant.
--
--   NOTE: the sibling parent_athlete_links_athlete_idx (baseline:151) is
--   NOT redundant — athlete_id is the PK's trailing column, so it has no
--   usable leading-column index without it. It is intentionally kept.
-- ---------------------------------------------------------------------------
drop index if exists public.parent_athlete_links_parent_idx;


-- ---------------------------------------------------------------------------
-- Item 4 (ADD): FK index on safety_events.athlete_session_id.
--
--   safety_events.athlete_session_id references athlete_sessions(id)
--   ON DELETE CASCADE (20260522002717_safety_events.sql:48-49). Postgres
--   does NOT auto-create an index for the referencing side of a FK, so a
--   delete/update of the parent athlete_sessions row seq-scans safety_events
--   to find children. (safety_events_athlete_idx covers athlete_id, not
--   athlete_session_id.) Index the FK column to make the cascade an index
--   scan.
-- ---------------------------------------------------------------------------
create index if not exists safety_events_athlete_session_idx
  on public.safety_events (athlete_session_id);

comment on index public.safety_events_athlete_session_idx is
  'FV-86: FK index for safety_events.athlete_session_id -> '
  'athlete_sessions(id) ON DELETE CASCADE. Avoids a seq scan of '
  'safety_events when a parent athlete_sessions row is deleted.';


-- ---------------------------------------------------------------------------
-- Item 5 (ADD): FK index on device_pairings.created_by.
--
--   device_pairings.created_by references profiles(id) ON DELETE CASCADE
--   (20260521200232_device_pairings.sql:37). Same missing-FK-index pattern
--   as item 4: deleting a parent profile seq-scans device_pairings to
--   cascade. (device_pairings_athlete_idx covers athlete_id, not
--   created_by.) Index the FK column.
--
--   Scope note (FV-86 vs FV-177): this migration ONLY adds the created_by
--   FK index on device_pairings. The pairing `code` column and the
--   expired-code reaper are owned by FV-177 and intentionally untouched
--   here.
-- ---------------------------------------------------------------------------
create index if not exists device_pairings_created_by_idx
  on public.device_pairings (created_by);

comment on index public.device_pairings_created_by_idx is
  'FV-86: FK index for device_pairings.created_by -> profiles(id) '
  'ON DELETE CASCADE. Avoids a seq scan of device_pairings when a '
  'parent profile is deleted.';


-- ---------------------------------------------------------------------------
-- DEFERRED (FV-86 AC): integration coverage asserting completeDailySession
-- stamps completed_at exactly once is NOT included here. It requires a
-- seeded DB + E2E harness not available in this environment. Tracked as a
-- follow-up.
-- ---------------------------------------------------------------------------
