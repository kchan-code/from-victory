-- =============================================================================
-- Migration: 20261112100000_fv671_pending_accounts.sql
--
-- Purpose: FV-671 (SSO A1) — verified email signup + the pending-account lock
--   (docs/fv-569-apple-google-signin-spec.md §4, §5.1, §5.2).
--
--   Email confirmation goes ON permanently (config + dashboard), so a new
--   password signup has NO session until the owner proves the inbox with a
--   6-digit code. Profile creation therefore moves out of the signup action and
--   into a locked database transaction (`complete_pending_profile`) that runs
--   after the code is verified. The same lock serializes cancellation and the
--   future reaper, so a destructive path can NEVER delete an account that has
--   become established.
--
-- ADDITIVE ONLY. No existing object is altered except the rate-limit action
-- CHECK (dropped + re-added with a superset, same pattern as 20261106120000).
--
-- Objects
--   private                                  schema, NOT exposed to PostgREST
--                                            (config.toml api.schemas), usage
--                                            revoked from every client role.
--   private.pending_account_deletions        tombstone: "this unestablished
--                                            account is being closed; refuse
--                                            profile creation". RLS on, no
--                                            policies, no client grants.
--   private.is_unestablished(uid)            THE deletability predicate (§5.1).
--   public.complete_pending_profile(...)     authenticated; acts on auth.uid().
--   public.cancel_my_pending_account()       authenticated; NO parameters.
--   public.reaper_mark(uid)                  service_role only.
--   public.finalize_pending_deletion(uid)    service_role only; the ONLY delete
--                                            path, re-checks under the lock.
--   public.block_profile_when_pending_deletion()  BEFORE INSERT trigger on
--                                            profiles (defense in depth: a
--                                            tombstone blocks profile creation
--                                            even via a direct client insert).
--
--   Callable RPCs live in `public` (the only schema PostgREST exposes besides
--   graphql_public); every table and the predicate live in `private`.
--
-- Rate-limit buckets: signup_verify, signup_resend (this PR) plus apple_signin
--   and apple_handoff (reserved for FV-673 so it never has to touch the CHECK).
--
-- 13+ floor / PII: no new PII. The tombstone holds user_id, a reason enum, a
--   timestamp and a counter. The birthdate is read as a parameter and only ever
--   compared; it is never stored by this migration for a rejected account.
--
-- Cascade: tombstone.user_id -> auth.users ON DELETE CASCADE, so
--   `delete from auth.users` (finalize, or auth.admin.deleteUser) removes it.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. private schema — no client access of any kind
-- ---------------------------------------------------------------------------
create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Tombstone table
-- ---------------------------------------------------------------------------
create table if not exists private.pending_account_deletions (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  reason     text        not null check (reason in ('underage', 'cancel', 'reaper')),
  created_at timestamptz not null default now(),
  attempts   integer     not null default 0 check (attempts >= 0)
);

comment on table private.pending_account_deletions is
  'FV-671 §5.2 tombstone. A row means "this unestablished account is being '
  'closed": complete_pending_profile refuses (account_closing) and a profile '
  'insert is blocked by trigger. Only finalize_pending_deletion deletes the '
  'user. No policies, no client grants: reachable only through the SECURITY '
  'DEFINER functions below.';
comment on column private.pending_account_deletions.reason is
  'underage (adult path, birthdate < 18, written only inside '
  'complete_pending_profile) | cancel (cancel_my_pending_account) | reaper '
  '(reaper_mark). Fixed by the writing function — callers cannot choose it.';
comment on column private.pending_account_deletions.attempts is
  'Failed revoke/finalize runs, bumped by the reaper (A5).';

alter table private.pending_account_deletions enable row level security;
-- Intentionally NO policies: deny-all for every non-owner role. (RLS is on in
-- addition to the revoked grants so a stray future GRANT still reads zero rows.)

revoke all on table private.pending_account_deletions
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. private.is_unestablished(uid) — the single deletability predicate (§5.1)
--
-- TRUE only when the auth user exists, is not a synthetic athlete account, has
-- NO profile and NO established-account data. Every column below is a payer /
-- owner reference to profiles; they cannot hold a row without a profile today
-- (FK), so this is defense in depth that stays correct if a future table or
-- path ever breaks that assumption. The FK-coverage assertion
-- (tests/rls/assertions/24_fk_coverage.sql) fails when a new table referencing
-- auth.users / profiles is neither listed here nor on its documented allowlist.
--
-- Schema-qualified table names on purpose: the harness matches them in the
-- function source.
-- ---------------------------------------------------------------------------
create or replace function private.is_unestablished(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select
        exists (select 1 from auth.users u
                 where u.id = p_user_id
                   -- synthetic athlete accounts (created already confirmed, profile
                   -- inserted immediately after) are never deletable by these paths
                   and lower(coalesce(u.email, '')) not like '%@athletes.fromvictory.app')
    and not exists (select 1 from public.profiles               where id        = p_user_id)
    and not exists (select 1 from public.subscriptions          where parent_id = p_user_id)
    and not exists (select 1 from public.apple_subscriptions    where payer_id  = p_user_id)
    and not exists (select 1 from public.apple_purchase_tokens  where payer_id  = p_user_id)
    and not exists (select 1 from public.apple_sandbox_testers  where payer_id  = p_user_id)
    -- Google Play mirror tables (FV-660, PR #597). Required by the FV-569/FV-620
    -- shared-surface rule: a Play payer must never look deletable.
    and not exists (select 1 from public.google_subscriptions     where payer_id = p_user_id)
    and not exists (select 1 from public.google_purchase_bindings where payer_id = p_user_id)
    and not exists (select 1 from public.google_license_testers   where payer_id = p_user_id)
    and not exists (select 1 from public.access_grants          where parent_id = p_user_id)
    and not exists (select 1 from public.parent_athlete_links
                     where parent_id = p_user_id or athlete_id = p_user_id)
$$;

comment on function private.is_unestablished(uuid) is
  'FV-671 §5.1: true when the user exists, is not a synthetic athlete, has no '
  'profile and no payer/comp/athlete data. Used inside the locked transaction '
  'of every destructive path.';

revoke all on function private.is_unestablished(uuid)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. complete_pending_profile — authenticated, acts only on auth.uid()
--
-- Returns: 'created' | 'already_complete' | 'reject_underage'
-- Raises:  account_closing (tombstone), account_unverified, account_established,
--          invalid_input, not_authenticated. DB CHECK constraints
--          (birthdate_role_consistency, sport_role_consistency,
--          adult_athlete_min_age_18, sport_valid_values) are the backstop for
--          anything not validated here.
-- ---------------------------------------------------------------------------
create or replace function public.complete_pending_profile(
  p_role       text,
  p_first_name text,
  p_birthdate  date default null,
  p_sport      text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_first text := btrim(coalesce(p_first_name, ''));
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  -- 1. a tombstone refuses completion
  if exists (select 1 from private.pending_account_deletions where user_id = v_uid) then
    raise exception 'account_closing' using errcode = 'P0001';
  end if;

  -- 2. a profile exists: the two-tab case. Insert nothing, delete nothing —
  --    whatever was resubmitted (including an under-18 birthdate) is ignored.
  if exists (select 1 from public.profiles where id = v_uid) then
    return 'already_complete';
  end if;

  -- The caller must hold a verified identity (§5.1 `pending`): a confirmed
  -- email, or an apple/google provider. (An unverified signup has no session
  -- at all while Confirm email is ON; this is the database-side backstop.)
  if not exists (
    select 1
      from auth.users u
     where u.id = v_uid
       and (u.email_confirmed_at is not null
            or coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ?| array['apple', 'google'])
  ) then
    raise exception 'account_unverified' using errcode = 'P0001';
  end if;

  -- 3. role-specific validation (self-service roles only; athletes are created
  --    by a parent through the service role, never through this function)
  if p_role is null or p_role not in ('parent', 'adult_athlete') then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if char_length(v_first) < 1 or char_length(v_first) > 50 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if p_role = 'parent' and (p_birthdate is not null or p_sport is not null) then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if p_role = 'adult_athlete' and (p_birthdate is null or p_sport is null) then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  -- 4. adult under 18 AND pending -> tombstone (underage). Mirrors the
  --    adult_athlete_min_age_18 CHECK (birthdate <= current_date - 18 years).
  if p_role = 'adult_athlete' and not (p_birthdate <= (current_date - interval '18 years')) then
    if not private.is_unestablished(v_uid) then
      raise exception 'account_established' using errcode = 'P0001';
    end if;
    insert into private.pending_account_deletions (user_id, reason)
    values (v_uid, 'underage')
    on conflict (user_id) do nothing;
    return 'reject_underage';
  end if;

  -- 5. create
  insert into public.profiles (id, role, first_name, birthdate, sport, sport_selected_at)
  values (
    v_uid,
    p_role,
    v_first,
    case when p_role = 'adult_athlete' then p_birthdate end,
    case when p_role = 'adult_athlete' then p_sport end,
    case when p_role = 'adult_athlete' then now() end
  );
  return 'created';
end;
$$;

comment on function public.complete_pending_profile(text, text, date, text) is
  'FV-671 §5.2: locked profile creation for the calling user after email/SSO '
  'verification. created | already_complete | reject_underage; raises '
  'account_closing when a tombstone exists.';

-- ---------------------------------------------------------------------------
-- 5. cancel_my_pending_account — authenticated, NO parameters (cannot target
--    another user), reason fixed to 'cancel'.
--    Returns 'marked' | 'not_pending'.
-- ---------------------------------------------------------------------------
create or replace function public.cancel_my_pending_account()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  -- Idempotent: an existing tombstone (any reason) stays as written.
  if exists (select 1 from private.pending_account_deletions where user_id = v_uid) then
    return 'marked';
  end if;

  if not private.is_unestablished(v_uid) then
    return 'not_pending';
  end if;

  insert into private.pending_account_deletions (user_id, reason)
  values (v_uid, 'cancel');
  return 'marked';
end;
$$;

comment on function public.cancel_my_pending_account() is
  'FV-671 §5.2: the caller closes THEIR OWN unestablished account. Takes no '
  'parameters. marked | not_pending.';

-- ---------------------------------------------------------------------------
-- 6. reaper_mark — service_role only, reason fixed to 'reaper'.
--    Returns 'marked' | 'not_pending'.
-- ---------------------------------------------------------------------------
create or replace function public.reaper_mark(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (select 1 from private.pending_account_deletions where user_id = p_user_id) then
    return 'marked';
  end if;

  if not private.is_unestablished(p_user_id) then
    return 'not_pending';
  end if;

  insert into private.pending_account_deletions (user_id, reason)
  values (p_user_id, 'reaper');
  return 'marked';
end;
$$;

comment on function public.reaper_mark(uuid) is
  'FV-671 §5.2: service-role marker for the cleanup reaper (A5). marked | '
  'not_pending. Never deletes.';

-- ---------------------------------------------------------------------------
-- 7. finalize_pending_deletion — service_role only. The ONLY delete path.
--    Returns 'no_tombstone' | 'not_pending' | 'deleted'.
--    The re-check and the delete are one transaction under the user lock.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_pending_deletion(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if not exists (select 1 from private.pending_account_deletions where user_id = p_user_id) then
    return 'no_tombstone';
  end if;

  if not private.is_unestablished(p_user_id) then
    -- It became established (or never was deletable): drop the tombstone so
    -- completion works again, delete nothing.
    delete from private.pending_account_deletions where user_id = p_user_id;
    return 'not_pending';
  end if;

  -- Cascades identities, sessions, refresh tokens, Apple token rows (A4) and
  -- the tombstone itself.
  delete from auth.users where id = p_user_id;
  return 'deleted';
end;
$$;

comment on function public.finalize_pending_deletion(uuid) is
  'FV-671 §5.2: re-checks is_unestablished under the per-user lock, then '
  'deletes the auth user in SQL (atomic with the check). no_tombstone | '
  'not_pending | deleted.';

-- ---------------------------------------------------------------------------
-- 8. Defense in depth: a tombstone blocks profile creation by ANY path
--    (including a direct client insert permitted by profiles_insert_own), and
--    the insert serializes behind finalize via the same per-user lock.
-- ---------------------------------------------------------------------------
create or replace function public.block_profile_when_pending_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.id::text, 0));
  if exists (select 1 from private.pending_account_deletions where user_id = new.id) then
    raise exception 'account_closing' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_pending_deletion on public.profiles;
create trigger profiles_block_pending_deletion
  before insert on public.profiles
  for each row execute function public.block_profile_when_pending_deletion();

-- ---------------------------------------------------------------------------
-- 9. Function grants — default-deny, then explicit.
--    (Postgres grants PUBLIC EXECUTE on new functions and Supabase's default
--    privileges add anon/authenticated/service_role; revoke all, then re-grant.)
-- ---------------------------------------------------------------------------
revoke all on function public.complete_pending_profile(text, text, date, text)
  from public, anon, authenticated, service_role;
revoke all on function public.cancel_my_pending_account()
  from public, anon, authenticated, service_role;
revoke all on function public.reaper_mark(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.finalize_pending_deletion(uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.block_profile_when_pending_deletion()
  from public, anon, authenticated, service_role;

grant execute on function public.complete_pending_profile(text, text, date, text)
  to authenticated;
grant execute on function public.cancel_my_pending_account()
  to authenticated;
grant execute on function public.reaper_mark(uuid)
  to service_role;
grant execute on function public.finalize_pending_deletion(uuid)
  to service_role;

-- ---------------------------------------------------------------------------
-- 10. Rate-limit buckets. signup_verify / signup_resend are used by FV-671;
--     apple_signin / apple_handoff are reserved for FV-673 so it does not have
--     to touch this CHECK. Same drop-and-re-add pattern as 20261106120000.
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
    'username_sign_in',
    'preview_invite',
    'signup_verify',
    'signup_resend',
    'apple_signin',
    'apple_handoff'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'password_update, username_sign_in, preview_invite, signup_verify, '
  'signup_resend, apple_signin (reserved, FV-673) or apple_handoff (reserved, '
  'FV-673).';
