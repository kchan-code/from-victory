-- =============================================================================
-- Migration: 20260612010000_parent_digest_preferences.sql
--
-- Purpose:
--   Adds opt-out preference for the weekly parent digest email (FV-226).
--
--   Two new columns on public.profiles:
--     digest_opt_out       — boolean, NO column default. NULL or false =
--                            opted in (the digest query treats null as
--                            opted-in for parent rows); true = opted out.
--                            Must stay NULL on athlete rows (constraint).
--     digest_unsubscribe_token — random UUID used as a one-click unsubscribe
--                            token embedded in every digest email. Backfilled
--                            here for existing parents; for parents created
--                            after this migration it is generated lazily by
--                            the digest run (service-role) or the settings
--                            toggle. NULL on athlete rows.
--
-- IMPORTANT — why there is NO column default:
--   `ADD COLUMN ... DEFAULT false` applies the default to EXISTING rows
--   (including athletes) and to every future insert that omits the column
--   (athlete-creation inserts do). Either way athlete rows would hold `false`
--   and violate the role-consistency constraint below — the original draft of
--   this migration aborted on constraint validation for exactly that reason
--   (PR #192 review finding 1). Columns are added with no default; parent
--   rows are backfilled explicitly; athlete rows stay NULL.
--
-- Privacy model:
--   - No new table; no new RLS policies needed.
--   - The columns live on profiles. The existing `profiles_update_own` policy
--     already allows a parent to update their own row, which covers the
--     settings toggle (digest_opt_out). The server action that handles the
--     toggle re-derives the user id from the session — no client-trusted id.
--   - digest_unsubscribe_token is readable by the parent via
--     `profiles_select_own` and is NOT exposed on the athlete-facing surface.
--     The cron route reads/writes it via service-role only.
--   - The token is a UUID — not derivable from public data. It is validated
--     by the unsubscribe route before accepting an opt-out change.
--
-- Cascading delete: both columns live on profiles, which already cascades from
--   auth.users. No additional FK work needed.
--
-- RLS: no new enable or policies — the existing profiles policies cover this.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add columns — deliberately WITHOUT defaults (see header).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists digest_opt_out boolean;

comment on column public.profiles.digest_opt_out is
  'Parent rows only (constraint below): true = opted out of the weekly rhythm '
  'digest email; null or false = opted in. No column default so athlete '
  'inserts stay null. Set via the settings toggle or the unsubscribe link.';

alter table public.profiles
  add column if not exists digest_unsubscribe_token uuid;

comment on column public.profiles.digest_unsubscribe_token is
  'One-click unsubscribe UUID embedded in every digest email. Parent rows '
  'only; null on athlete rows. Backfilled for existing parents by this '
  'migration; generated lazily (service-role) for parents created later. '
  'Treated as a secret — never logged, never exposed in client responses.';

-- ---------------------------------------------------------------------------
-- 2. Backfill EXISTING parent rows: opted in + token stamped, so the first
--    cron run after this migration can send immediately. Athlete rows are
--    untouched (stay NULL).
-- ---------------------------------------------------------------------------

update public.profiles
   set digest_opt_out = false,
       digest_unsubscribe_token = gen_random_uuid()
 where role = 'parent';

-- ---------------------------------------------------------------------------
-- 3. Constraint: both columns must be null on athlete rows
--    (extending the existing birthdate_role_consistency pattern).
--    Added AFTER the backfill so validation sees: athletes all-NULL (pass),
--    parents on the unconstrained branch (pass).
-- ---------------------------------------------------------------------------

alter table public.profiles
  add constraint digest_prefs_role_consistency
    check (
      (role = 'athlete' and digest_opt_out is null and digest_unsubscribe_token is null)
      or
      (role = 'parent')
    );

-- ---------------------------------------------------------------------------
-- 4. Unique partial index on the token: closes the duplicate-token case for
--    the unsubscribe lookup (.maybeSingle()) and makes it an index scan.
-- ---------------------------------------------------------------------------

create unique index if not exists profiles_digest_unsubscribe_token_key
  on public.profiles (digest_unsubscribe_token)
  where digest_unsubscribe_token is not null;
