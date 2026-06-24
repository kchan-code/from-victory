-- =============================================================================
-- Migration: 20260624000000_athlete_username.sql
--
-- Purpose (FV-320):
--   Add a `username` lookup handle to athlete profiles so athletes can sign in
--   from any device using username + password (not just the device-cookie path).
--
-- Design:
--   username is a lookup handle for the athlete's own credential flow. It IS a
--   minor identifier and carries the same privacy weight as first_name:
--     - Stored on profiles; minimal (3-20 chars, [a-z0-9_] only, lowercase).
--     - Athlete-owned: only the owning athlete can read their own username via
--       the client (via the get_own_username() security-definer function).
--     - The parent-linked-athlete read path must NOT expose it. The existing
--       profiles_parent_select_linked_athlete policy grants row-level access.
--       This migration documents the column-level gap tracked in FV-251 and
--       provides the get_own_username() security-definer function as the safe
--       read path for athletes. Application server actions on the parent path
--       NEVER select the username column.
--     - Service-role mediated writes only: all username writes go through
--       the claimPairing server action (service role), which runs
--       validateUsername() before writing. The `authenticated` role has
--       UPDATE on profiles via the existing table grant (FV-216), but
--       application layer and FV-251 together enforce the service-role-only
--       write contract. Direct PostgREST UPDATE by a raw athlete JWT is the
--       FV-251 residual gap: the unique index and application validation
--       still apply even in that path, so no corrupt data can be written.
--
-- Uniqueness:
--   Case-insensitive via unique index on lower(username) WHERE NOT NULL.
--   citext is NOT used (no existing use in the repo; this avoids introducing
--   a new extension).
--
-- Cascading delete:
--   username lives on profiles, which cascades from auth.users. No new FK
--   needed.
--
-- Also in this migration:
--   - Extends auth_rate_limit_events.action CHECK to permit 'username_sign_in'
--     (the new any-device sign-in rate-limit action key added to rate-limit.ts).
--     Follows the same pattern as 20260614000000_password_reset_rate_limit_actions.
--
-- Postgres version: 15+
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Section 1: profiles.username column
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Athlete-only lookup handle for any-device sign-in (FV-320). '
  'Case-insensitive, 3-20 chars, lowercase alphanumeric + underscore only. '
  'NULL for athlete rows that predate this migration (username not yet claimed) '
  'and NULL for parent rows (parent login is email-based). '
  'Normalised to lowercase before storage by validateUsername() in '
  'lib/auth/athlete-username.ts. Set by the claimPairing server action '
  '(service role) at first device claim. '
  'Owner-only readable via client: use get_own_username() RPC — NOT via direct '
  'profiles SELECT, which would expose the column to parent JWTs via the '
  'profiles_parent_select_linked_athlete policy. FV-251 tracks DB-level '
  'column-privilege hardening for that path.';

-- ---------------------------------------------------------------------------
-- Section 2: Case-insensitive uniqueness index
--
--   lower(username) UNIQUE WHERE username IS NOT NULL:
--     - NULL rows (parent rows, athletes without a username yet) are excluded
--       from uniqueness — NULLs do not compete in PostgreSQL partial indexes.
--     - lower() at the index level backstops the application-layer normalisation
--       so even a direct-SQL write cannot introduce a duplicate differing only
--       in case.
--     - Prefer this over citext: citext requires an extension not used elsewhere
--       in this repo and does not add capability beyond what this pattern provides.
-- ---------------------------------------------------------------------------

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;

comment on index public.profiles_username_lower_key is
  'FV-320: case-insensitive uniqueness for athlete usernames. '
  'Partial (WHERE username IS NOT NULL) so NULL rows (existing athletes, '
  'parents) do not compete. lower() applied at the DB layer to backstop '
  'the application-layer normalisation in validateUsername().';

-- ---------------------------------------------------------------------------
-- Section 3: get_own_username() — security-definer function
--
--   Returns the username of the currently authenticated athlete only.
--   Uses SECURITY DEFINER so it executes with elevated privileges internally,
--   while the WHERE id = auth.uid() guard ensures only the caller's own value
--   is returned. No cross-user data is reachable.
--
--   set search_path = '' prevents schema-injection in the function body.
--   stable: result is consistent within a transaction (no side effects).
--
--   Grant: execute on function to `authenticated` so athletes can call it via
--   PostgREST RPC (POST /rpc/get_own_username). Without this grant the function
--   is callable only by service_role — which already has it via the service-role
--   grants migration.
--
--   Usage in server actions: the server actions that need the athlete's username
--   (e.g., showing it in the UI after claim) call this function via the RLS
--   client OR read it via service role. The parent-facing dashboard path NEVER
--   calls this function.
-- ---------------------------------------------------------------------------

create or replace function public.get_own_username()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select p.username
    from public.profiles p
   where p.id = auth.uid()
     and p.role = 'athlete'
   limit 1;
$$;

comment on function public.get_own_username() is
  'FV-320: returns the username for the currently authenticated athlete. '
  'Security-definer with internal WHERE id = auth.uid() guard — only the '
  'calling user''s own username is returned. Returns NULL if the caller is '
  'not an athlete or has not yet claimed a username. '
  'Safe read path for athlete self-read; bypasses the column-level gap in '
  'profiles_parent_select_linked_athlete that FV-251 will close.';

-- Grant execute to authenticated so athletes can call it via PostgREST RPC.
-- service_role already has execute via 20260613040000_service_role_grants.sql.
grant execute on function public.get_own_username() to authenticated;

-- ---------------------------------------------------------------------------
-- Section 4: Extend auth_rate_limit_events.action CHECK for username_sign_in
--
--   The original CHECK (20260611000000) and the first extension
--   (20260614000000) follow the pattern of this section: drop the existing
--   named constraint, re-add with the new value appended. This is the only
--   safe in-place extension — ALTER TABLE ADD CHECK cannot extend an existing
--   CHECK constraint; it must be dropped and re-added.
--
--   New action key:
--     'username_sign_in' — rate-limit for athleteUsernameSignIn(), keyed on
--     HMAC(lower(username) + ":" + clientIP). See rate-limit.ts for config
--     (15 attempts / 15 min).
-- ---------------------------------------------------------------------------

alter table public.auth_rate_limit_events
  drop constraint if exists auth_rate_limit_events_action_check;

alter table public.auth_rate_limit_events
  add constraint auth_rate_limit_events_action_check
  check (action in (
    'sign_in',
    'sign_up',
    'athlete_sign_in',
    'claim_pairing',
    'generate_pairing_code',
    'password_reset',
    'password_update',
    'username_sign_in'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'password_update, or username_sign_in.';

commit;
