-- =============================================================================
-- Migration: 20260603120000_athlete_sport_selected_at.sql
--
-- Purpose (FV-33 — picker + gate slice):
--   Add a `sport_selected_at` column to public.profiles. This timestamptz
--   column is the first-run signal for the sport-selection gate:
--
--     sport_selected_at IS NULL  ⇒  athlete has never affirmatively chosen a
--                                    sport — show the one-time picker.
--     sport_selected_at IS NOT NULL  ⇒  athlete has chosen; skip the picker.
--
--   The gate only runs on athlete routes. Parent rows will always have
--   sport_selected_at = NULL, which is correct — the gate never fires for a
--   parent session.
--
-- Column design:
--   - Type: timestamptz — records WHEN the selection was made. A single scalar
--     enforces set-once / last-write-wins semantics: the first selection writes
--     it; a later Settings sport-switch overwrites it in place. This is NOT an
--     append-only history — a single column makes that structural, not
--     convention-only. The timestamp is low-sensitivity operational metadata
--     (comparable to birthdate — not content PII).
--   - Nullable, no DEFAULT — NULL = "never chosen" is the intended signal.
--   - No role-consistency CHECK added for this column. Parents will have NULL
--     (same as an un-chosen athlete), which is acceptable because the gate only
--     fires on athlete routes. Adding a CHECK would risk breaking parent inserts
--     (sport_role_consistency in FV-27 already handles the sport column). Keep
--     it minimal.
--   - No backfill. Existing athlete rows remain NULL on purpose. They were
--     defaulted to hockey by FV-27's backfill and never affirmatively chose, so
--     they should see the one-time picker (spec §3). This is intentional
--     product behaviour, not an oversight.
--
-- RLS impact:
--   None — no policy changes required. sport_selected_at rides the existing
--   profiles RLS policies unchanged:
--     - "profiles_select_own": athlete reads own row (includes sport_selected_at).
--     - "profiles_parent_select_linked_athlete": parent reads linked athlete's
--       full profile row (includes sport_selected_at). This is intentional: the
--       parent dashboard may surface whether their athlete has completed first-run
--       setup, and sport_selected_at is low-sensitivity operational metadata, not
--       content PII.
--     - "profiles_insert_own": parent self-inserts their own profile (column will
--       be NULL; no CHECK to violate).
--     - "profiles_update_own": athlete updates own row. The selectSport server
--       action (FV-33) uses the RLS client under the athlete's session — this
--       policy already permits the athlete to write sport + sport_selected_at on
--       their own row. No new policy required.
--   No parent policy allows a parent to write an athlete's row. The selectSport
--   action is athlete-session-scoped: it calls requireAthlete(), then updates
--   under the athlete's own session cookie. A parent session cannot satisfy
--   profiles_update_own for the athlete's row (auth.uid() would not match the
--   athlete's id), so cross-role writes are RLS-blocked by construction.
--   No journal-content exposure is created or widened by this migration.
--
-- Cascading delete: unchanged. sport_selected_at is a column on public.profiles,
--   which cascades from auth.users on delete. No additional FK or cascade rule
--   needed.
--
-- Postgres version: 15+
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Add the column as nullable — NULL is the "never chosen" signal; no DEFAULT
-- so the intent is explicit. Existing rows stay NULL on purpose (see above).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column sport_selected_at timestamptz;

comment on column public.profiles.sport_selected_at is
  'Timestamp of the athlete''s most recent affirmative sport selection (first-run '
  'picker or Settings sport-switch). NULL means the athlete has not yet chosen — '
  'the sport-gate in athlete routes uses this as the first-run signal. Parent rows '
  'are always NULL. Set-once / last-write-wins: written on first selection, '
  'overwritten on a subsequent Settings switch. FV-33 introduced this column.';

commit;
