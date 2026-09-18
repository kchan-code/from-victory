-- =============================================================================
-- Migration: 20260918090000_seat_selection.sql
--
-- Purpose: FV-585 — KC decision D2 (2026-09-17): on a plan downgrade with NO
--   athlete selection, PAUSE athlete access AT RENEWAL until the parent
--   selects who remains active. Preserve ALL profiles + history. NO automatic
--   deletion. NO automatic selection.
--
--   This migration adds the ONE piece of new per-athlete state that decision
--   requires: `seat_active` on `parent_athlete_links`. Everything else (the
--   capacity ceiling, "at renewal" timing, the selection-required derivation)
--   is application logic in `apps/web/lib/subscriptions/seat-state.ts` — see
--   that file's module doc for the full design.
--
-- Default = true ("no selection made yet"): every EXISTING link starts
--   active, which is correct — a family under capacity today has every
--   athlete active regardless of this column's value (capacity gating reads
--   `seat_active` only once athleteCount > capacity). A family that becomes
--   over-capacity after a downgrade, with every link still at the default
--   `true`, is exactly the "no selection made" case the D2 decision names —
--   `deriveSeatState` (seat-state.ts) treats "all true but count > capacity"
--   as `selection_required` (pause ALL until the parent picks), not as an
--   implicit first-N-wins selection. No migration backfill is needed to
--   express "no selection yet" — the default IS that state.
--
-- Grants: `authenticated` already has table-wide SELECT on
--   `parent_athlete_links` (20260520200000_baseline_profiles_links_
--   subscriptions.sql / 20260612000000_explicit_table_grants.sql) and NO
--   INSERT/UPDATE/DELETE grant at all — so the new column is automatically
--   readable by both participants (parent + athlete, per the existing
--   `parent_athlete_links_select_participant` policy) and NOT writable by any
--   client role. No grant/policy changes are needed in this migration; writes
--   to `seat_active` happen exclusively via
--   `lib/actions/seat-selection.ts::setActiveSeats` (service role).
-- =============================================================================

alter table public.parent_athlete_links
  add column seat_active boolean not null default true;

comment on column public.parent_athlete_links.seat_active is
  'FV-585 (KC decision D2): whether this athlete counts as an ACTIVE seat '
  'when the payer''s athlete count exceeds their plan''s capacity ceiling '
  '(Apple-tier only — see apple-capacity.ts''s "Stripe families are never '
  'capped" invariant, which this column does not change). Default true = '
  '"no selection made yet"; when a family is at or under capacity this '
  'column is not consulted at all (everyone is active). On a downgrade that '
  'puts a family over capacity with no explicit parent selection, EVERY '
  'link remains at the default true, which apps/web/lib/subscriptions/'
  'seat-state.ts''s deriveSeatState() reads as "selection_required" and '
  'pauses ALL athletes at access time — never an automatic pick. The parent '
  'sets this column (server-role only, via setActiveSeats()) to choose which '
  'athletes stay active; the rest are set false. No row is ever deleted for '
  'this reason — this column never drives profile or link deletion, only '
  'the ATHLETE access-gate read in lib/subscriptions/enforce.ts.';
