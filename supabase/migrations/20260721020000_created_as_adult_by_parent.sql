-- =============================================================================
-- Migration: 20260721020000_created_as_adult_by_parent.sql
--
-- Purpose (FV-448, 13-25 expansion arc — see project_13-25-expansion-discovery
--   memory D5):
--   The 13-25 arc removes the upper age bound on parent-created athlete
--   accounts (D1: 13+ with no max age). A parent can now create an athlete
--   profile for someone who is already 18+ at creation time. Per D5, the
--   turn-18 / parent-to-adult transition is DEFERRED ENTIRELY for this arc:
--   a parent-created 18+ athlete stays silently on the minor-schema
--   `role = 'athlete'` shape (parent link, no self-serve billing, no UI
--   change) rather than being routed onto `role = 'adult_athlete'`.
--
--   kids-privacy-officer's condition for allowing that deferral: the DB must
--   at least mark which `athlete` rows were ALREADY 18+ at parent-creation
--   time, so a future flow (FV-450: turn-18 consent/takeover — offering the
--   now-adult athlete a self-serve/self-owned path) has a population to act
--   on. This migration adds that marker column only. It does not build the
--   FV-450 flow itself, does not change any RLS policy, and does not expose
--   the column to any client role.
--
-- Column semantics:
--   `created_as_adult_by_parent` (boolean, not null, default false) is set
--   true at INSERT time by the parent-facing create-athlete server actions
--   (apps/web/lib/actions/athletes.ts createAthlete,
--   apps/web/lib/actions/admin.ts createAthleteDirect) whenever the
--   supplied birthdate computes to age >= 18 at creation. It is a point-in-
--   time fact about the CREATION event, not a live "is this athlete 18+
--   today" check — that is always computable from `birthdate` directly and
--   does not need a stored column. Nothing in the app ever flips this value
--   after insert; it is written once, at creation, by service-role code.
--
-- Backfill (existing rows):
--   Age-at-creation is unknowable retroactively — no historical creation-age
--   was recorded before this migration existed. As a best-effort proxy, we
--   backfill existing `role = 'athlete'` rows to `true` where the athlete is
--   18+ by CURRENT age (`birthdate <= now() - 18 years`) at migration-apply
--   time. This is deliberately a CURRENT-age backfill, not a true
--   creation-age backfill — some backfilled `true` rows may have been under
--   18 at the time their parent actually created the account and only aged
--   into 18 afterward. That is an accepted, documented approximation for the
--   FV-450 population seed; it is not used for any access-control decision,
--   only to identify candidates for the future consent/takeover flow.
--
-- Access control (grant/RLS analysis — no RLS or policy changes in this
--   migration):
--   profiles RLS is unchanged: profiles_select_own / profiles_parent_select_
--   linked_athlete / profiles_insert_own / profiles_update_own all continue
--   to apply row-level, unaffected by adding a column.
--   Column-level SELECT grants ARE relevant here: 20260708120000
--   (athlete_private_columns_grant_hardening) reversed the grant model for
--   `authenticated` on public.profiles — it REVOKEd the blanket table-level
--   SELECT and replaced it with an explicit column ALLOWLIST (id, role,
--   first_name, birthdate, created_at, updated_at, sport, sport_selected_at,
--   digest_opt_out, digest_unsubscribe_token). Postgres column-level GRANTs
--   are an explicit enumerated list — a newly added column is NOT
--   automatically included just because the table has other granted
--   columns, and this migration deliberately does NOT add
--   `created_as_adult_by_parent` to that allowlist. Net effect: `authenticated`
--   (parent or athlete JWT alike) gets `permission denied for column
--   created_as_adult_by_parent` on any direct SELECT of it via PostgREST —
--   the same "closed by omission" posture FV-361 established for
--   position/focus_area/next_game_on/username. `anon` already has zero
--   SELECT grant on profiles (per 20260708120000's own note) and is
--   therefore unaffected. Only `service_role` (via createServiceClient(),
--   server-only, FV-448's own write path) can read or write this column.
--   This satisfies the issue's requirement: "not exposed in any UI, not
--   parent-readable beyond existing profile visibility."
--   INSERT / UPDATE on public.profiles remain table-wide (not column-scoped)
--   for `authenticated` per 20260708120000 (that migration narrowed SELECT
--   only) — identical pre-existing exposure shape to every other profiles
--   column (e.g. first_name, sport): a signed-in owner of a row could
--   self-UPDATE this column via a direct PostgREST call, same as any other
--   column, gated only by the existing row-level `profiles_update_own`
--   policy (id = auth.uid()). This is not a new gap introduced by this
--   migration and is out of scope for FV-448 to close.
--   RLS harness fixtures (supabase/migrations tests / CI's RLS Harness job):
--   verified this is an additive column with a default — no existing insert
--   fixture supplies every column by name (all use partial inserts relying
--   on defaults for unlisted columns), so no fixture needs updating for this
--   migration to apply cleanly.
--
-- Postgres version: 15+
-- =============================================================================

begin;

alter table public.profiles
  add column created_as_adult_by_parent boolean not null default false;

comment on column public.profiles.created_as_adult_by_parent is
  'FV-448 (13-25 expansion arc, D5 turn-18 deferral mitigation). True when a '
  'parent-created role=''athlete'' row belonged to someone who was already '
  '18+ (by birthdate) at the moment the parent created the account. Written '
  'once, at INSERT, by the service-role create-athlete actions '
  '(apps/web/lib/actions/athletes.ts createAthlete, '
  'apps/web/lib/actions/admin.ts createAthleteDirect) — never updated '
  'afterward. Exists solely to seed the future FV-450 turn-18 consent/'
  'takeover flow with a population of already-adult, parent-managed '
  'accounts; it does not itself change any access, billing, or UI behavior. '
  'Not exposed to any client role: `authenticated`''s column-restricted '
  'SELECT grant on profiles (20260708120000) deliberately omits this column, '
  'so it is unreadable via PostgREST by any parent or athlete JWT and is '
  'readable only via service_role. Not surfaced in any UI. '
  'Backfill note: existing rows were backfilled by CURRENT age '
  '(birthdate <= now() - 18 years) at migration-apply time, not true '
  'age-at-creation (unknowable retroactively) — an accepted approximation '
  'for the FV-450 population seed only, never used for access control.';

-- Backfill existing rows: best-effort proxy using CURRENT age (see header
-- comment). Scoped to role = ''athlete''; adult_athlete and parent rows are
-- untouched (they default to false, which is correct — adult_athlete rows
-- were never parent-created, and parent rows have no birthdate at all).
update public.profiles
   set created_as_adult_by_parent = true
 where role = 'athlete'
   and birthdate is not null
   and birthdate <= (now() - interval '18 years')::date;

commit;
