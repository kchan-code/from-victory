-- =============================================================================
-- Migration: 20260708120000_athlete_private_columns_grant_hardening.sql
--
-- Purpose (FV-361, closes the FV-251 gap):
--   "profiles_parent_select_linked_athlete" is a ROW-level policy — it makes
--   an athlete's ENTIRE row visible to a linked parent's JWT. The app's own
--   queries always use column-scoped selects that never ask for the
--   athlete-private columns (position, focus_area, next_game_on, username),
--   but RLS cannot filter columns, only rows: a parent holding a valid
--   Supabase access token could call the PostgREST REST API directly
--   (`GET /profiles?select=position,focus_area,next_game_on,username&id=eq.<athlete_id>`)
--   and read them anyway. That is a raw-data-API leak the app-layer column
--   discipline does not close.
--
-- Column split (verified against every RLS-scoped `.from("profiles")` call
-- site in apps/web/lib and apps/web/app before writing this migration):
--   Parent-visible (unchanged):  id, role, first_name, birthdate, sport,
--                                sport_selected_at, created_at, updated_at,
--                                digest_opt_out, digest_unsubscribe_token
--   Athlete-private (this migration closes the gap): position, focus_area,
--                                next_game_on, username
--   (digest_opt_out / digest_unsubscribe_token are parent-own-row fields —
--   always NULL on athlete rows and reached only via profiles_select_own on
--   the PARENT's own id. They are grouped with the "parent-visible" list
--   above because they are NOT part of the athlete-private four this
--   migration restricts — nothing about them changes here.)
--
--   Full non-private column list granted below (every `public.profiles`
--   column as of this migration, enumerated by walking every
--   `create table profiles` / `alter table profiles add column` in
--   supabase/migrations/, MINUS the four athlete-private columns):
--     id, role, first_name, birthdate, created_at, updated_at, sport,
--     sport_selected_at, digest_opt_out, digest_unsubscribe_token
--
-- Mechanism chosen: reversed table/column GRANT model + SECURITY DEFINER
-- self-read RPC.
--   Postgres RLS is row-only; GRANT/REVOKE is the one primitive Postgres
--   offers for column-level access. BUT column-level privileges are
--   ADDITIVE under a table-level grant, never subtractive: Postgres checks
--   "does the role have table-level SELECT, OR column-level SELECT on this
--   specific column" — so a column-level REVOKE cannot narrow a pre-existing
--   table-level GRANT. profiles already carries a blanket
--   `grant select, insert, update on public.profiles to authenticated`
--   (20260612000000_explicit_table_grants.sql). The FIRST version of this
--   migration issued a column-level REVOKE on top of that blanket grant and
--   was a confirmed no-op — CI's 10_username.sql AC(c2) caught it: a linked
--   parent's direct `SELECT username FROM profiles WHERE id = <athlete>`
--   still succeeded. The only way to actually deny SELECT on specific
--   columns while preserving it on the rest is to:
--     1. REVOKE the blanket table-level SELECT from `authenticated`
--        entirely (INSERT / UPDATE stay table-wide — untouched — this
--        migration is scoped to the SELECT leak only).
--     2. GRANT SELECT on an explicit column ALLOWLIST (every column except
--        the four athlete-private ones) back to `authenticated`. This
--        applies uniformly to EVERY caller authenticated as that Postgres
--        role — the athlete themselves included, which is why step 3 below
--        (the self-read RPC) exists.
--     3. Provide get_own_personalization(), a SECURITY DEFINER function that
--        internally scopes to `id = auth.uid()`, as the athlete's own safe
--        read path for position/focus_area. SECURITY DEFINER functions
--        execute with the function owner's privileges, so they are
--        unaffected by the column allowlist in step 2.
--   next_game_on and username need no equivalent getter: verified (see
--   below) that no RLS-scoped client code ever SELECTs them for self-read
--   today (next_game_on is write-only from the client; username already
--   uses get_own_username()). Only position/focus_area had a live
--   direct-SELECT self-read call site.
--
-- Blast-radius verification (grepped every `.from("profiles")` call site in
-- apps/web before writing this migration):
--   - Exactly ONE call site selects position/focus_area directly:
--     requireAthlete() in apps/web/lib/auth/guards.ts (self-read,
--     `.eq("id", user.id)`). Updated in this PR to call
--     get_own_personalization() instead of selecting the columns.
--   - Every `.eq("username", ...)` filter (pairings.ts, admin.ts) runs
--     through `createServiceClient()` (service role bypasses grants + RLS
--     entirely) — unaffected by this migration.
--   - Every UPDATE of position/focus_area/next_game_on/username
--     (athlete-quiz.ts, next-game.ts, pairings.ts, admin.ts, the game-day
--     cron route) either (a) sets a literal value with no chained
--     `.select()` (Postgres UPDATE needs UPDATE privilege on the column,
--     not SELECT, when there is no RETURNING/representation), or (b) runs
--     via service role. None require the column-level SELECT grant this
--     migration withholds.
--   - No `select("*")` on profiles anywhere in the app.
--   - No parent-facing query (dashboard, athlete-detail-core.ts,
--     admin/metrics.ts) ever asks for these columns — this migration does
--     not change their behaviour, it removes the RAW-API bypass around them.
--
-- Postgres version: 15+
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Section 1: get_own_personalization() — SECURITY DEFINER self-read RPC
--
--   Mirrors get_own_username() (20260624000000). Returns the CALLING
--   athlete's own position + focus_area. The internal `id = auth.uid()`
--   guard means no cross-user data is reachable regardless of caller.
--   `role in ('athlete','adult_athlete')` mirrors requireAthlete()'s role
--   acceptance (FV-325 self-serve 18+ trains on the same surfaces).
--
--   set search_path = '' prevents schema-injection in the function body.
--   stable: no side effects, consistent within a transaction.
-- ---------------------------------------------------------------------------

create or replace function public.get_own_personalization()
returns table (
  "position" text,
  focus_area text
)
language sql
security definer
stable
set search_path = ''
as $$
  select p."position", p.focus_area
    from public.profiles p
   where p.id = auth.uid()
     and p.role in ('athlete', 'adult_athlete')
   limit 1;
$$;

comment on function public.get_own_personalization() is
  'FV-361: returns position + focus_area for the currently authenticated '
  'athlete (or adult_athlete). Security-definer with internal WHERE id = '
  'auth.uid() guard — only the caller''s own values are returned, and only '
  'for athlete/adult_athlete roles. Safe self-read path now that '
  'authenticated''s column-restricted SELECT grant on profiles omits '
  'position / focus_area below. Mirrors get_own_username() (FV-320).';

-- Grant execute to authenticated so athletes can call it via PostgREST RPC.
-- (anon calling this returns zero rows: auth.uid() is NULL for an
-- unauthenticated request, matching no row — same safe-degrade behaviour as
-- get_own_username()'s AC(d).)
grant execute on function public.get_own_personalization() to authenticated;
-- Belt-and-suspenders: this migration predates the function-grant default-deny
-- (FV-363), so the function is created under the old grant-to-all default and
-- Postgres's automatic PUBLIC grant — revoke those explicitly so it is
-- authenticated-only regardless of migration order. (Not a live leak — it is
-- security-definer scoped to auth.uid(), NULL for anon — but keep it tight.)
revoke execute on function public.get_own_personalization() from public, anon;


-- ---------------------------------------------------------------------------
-- Section 2: Reverse the grant model — table-wide GRANT cannot be narrowed
--   by a column-level REVOKE (see header comment for the full explanation
--   and the CI failure that proved it).
--
--   Step 1: REVOKE the blanket table-level SELECT on profiles from
--   `authenticated` (granted in 20260612000000_explicit_table_grants.sql).
--   INSERT / UPDATE are untouched — they stay table-wide, matching
--   pre-existing behaviour; this migration is scoped to closing the SELECT
--   leak only. UPDATE of the athlete-private columns is unaffected by this
--   whole migration — Postgres UPDATE requires the UPDATE privilege on the
--   column being SET (never touched here), not SELECT, unless the column is
--   read back via RETURNING/representation (verified above: none of the
--   app's UPDATEs do).
-- ---------------------------------------------------------------------------

revoke select on public.profiles from authenticated;

-- ---------------------------------------------------------------------------
--   Step 2: GRANT SELECT back on an explicit column allowlist — every
--   `public.profiles` column EXCEPT the four athlete-private ones
--   (position, focus_area, next_game_on, username). This is the mechanism
--   that actually restricts SELECT to a column subset: a role with a
--   column-level GRANT and no table-level GRANT can only read the listed
--   columns; any other column raises insufficient_privilege (SQLSTATE
--   42501) for every caller authenticated as `authenticated`, including a
--   linked parent's JWT reading an athlete's row via
--   profiles_parent_select_linked_athlete.
--
--   Column list derivation: every column ever added to public.profiles
--   across supabase/migrations/ as of this migration (baseline: id, role,
--   first_name, birthdate, created_at, updated_at; FV-27: sport; FV-33:
--   sport_selected_at; FV-226: digest_opt_out, digest_unsubscribe_token),
--   minus the four athlete-private columns closed by this migration.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
--   anon: deliberately receives NO grant here, table-level or column-level.
--   Verified (20260612000000_explicit_table_grants.sql) that anon was never
--   granted table-level SELECT on profiles in the first place — only
--   `authenticated` was. anon therefore already has zero SELECT privilege on
--   every profiles column (private and non-private alike); this migration
--   does not need to open a column-restricted door for anon because there
--   was never a door for anon to narrow. No profiles RLS policy grants an
--   anon-facing row either (profiles_select_own / profiles_parent_select_
--   linked_athlete both key on auth.uid(), which is NULL for anon), so this
--   is consistent with existing behaviour, not a new restriction.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- Section 3: Column comments — close out the FV-251 gap note
-- ---------------------------------------------------------------------------

comment on column public.profiles.position is
  'Athlete self-identified sport position (role), e.g. "Forward", "Guard", "Pitcher". '
  'NULL when the athlete skipped the onboarding quiz or plays a sport with no role picker. '
  'Constrained to the union of all MVP sport roles via CHECK. '
  'Athlete-private: `authenticated` has no table-level SELECT on profiles and '
  'this column is deliberately excluded from its column-restricted SELECT grant '
  '(FV-361, closing the FV-251 gap) — read via get_own_personalization() only. '
  'A linked parent''s JWT can no longer read this column via a raw PostgREST request.';

comment on column public.profiles.focus_area is
  'Athlete self-identified mental training focus from the onboarding quiz. '
  'One of: nerves | bouncing-back | confidence | focus | faith. '
  'NULL when skipped. Used to personalise the Daily hub card subtitle and the '
  'pregame "Today''s Focus" default. '
  'Athlete-private: `authenticated` has no table-level SELECT on profiles and '
  'this column is deliberately excluded from its column-restricted SELECT grant '
  '(FV-361, closing the FV-251 gap) — read via get_own_personalization() only. '
  'A linked parent''s JWT can no longer read this column via a raw PostgREST request.';

comment on column public.profiles.next_game_on is
  'Coarse self-reported next-game date for athlete rows. '
  'Set by the athlete via a one-tap prompt on the daily-session completion surface. '
  'Values: today (tonight), +1 day (tomorrow), next Saturday (this weekend), or NULL '
  '(not sure / cleared). Overwritten on each answer. Cleared opportunistically by '
  'the game-day cron after delivery. '
  'NEVER surfaced on the parent dashboard or any parent-facing query. '
  'Coarse date only — no time, location, opponent, or venue stored. '
  'Athlete-private: `authenticated` has no table-level SELECT on profiles and '
  'this column is deliberately excluded from its column-restricted SELECT grant '
  '(FV-361, closing the FV-251 gap). Nothing in the app reads this column back '
  'via the RLS-scoped client (write-only from the athlete client; the cron route '
  'and due_game_day_reminders() read it via service role / SECURITY DEFINER, '
  'both unaffected by this grant restriction).';

comment on column public.profiles.username is
  'Athlete-only lookup handle for any-device sign-in (FV-320). '
  'Case-insensitive, 3-20 chars, lowercase alphanumeric + underscore only. '
  'NULL for athlete rows that predate this migration (username not yet claimed) '
  'and NULL for parent rows (parent login is email-based). '
  'Normalised to lowercase before storage by validateUsername() in '
  'lib/auth/athlete-username.ts. Set by the claimPairing server action '
  '(service role) at first device claim. '
  'Owner-only readable via client: get_own_username() RPC. `authenticated` has '
  'no table-level SELECT on profiles and this column is deliberately excluded '
  'from its column-restricted SELECT grant (FV-361, closing the FV-251 gap) '
  '— a linked parent''s JWT can no longer read this column via a raw PostgREST '
  'request, and the grant restriction has no effect on get_own_username() '
  '(SECURITY DEFINER executes with the function owner''s privileges).';

commit;
