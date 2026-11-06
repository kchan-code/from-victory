-- =============================================================================
-- Migration: 20261106120000_athlete_invitations.sql
--
-- Purpose (FV-630): app-native athlete invitations + separate recovery.
--
--   The parent → athlete hand-off moves from a long one-time "pairing link"
--   to a readable, single-use, expiring INVITE CODE that opens the iOS app
--   via a universal link (or is typed into the app / browser). An account
--   that is already set up gets a separate RECOVERY code instead: it resets
--   the password and never touches the username.
--
--   This migration reuses public.device_pairings (same service-role-only,
--   hash-at-rest model from FV-177) and adds:
--
--     1. device_pairings.purpose  — 'invite' | 'recovery' (audit + UI copy).
--     2. A partial UNIQUE index   — at most ONE live (unconsumed) code per
--                                   athlete. Replacement is a hard invariant,
--                                   not a best-effort delete.
--     3. issue_athlete_invite()   — atomic replace-and-issue (service role).
--     4. claim_athlete_invite()   — atomic claim: lock, validate, set username
--                                   (invites only), consume (service role).
--     5. release_athlete_invite() — compensating undo when the password
--                                   write fails after a claim: clears the
--                                   username that claim set and revives the
--                                   code (service role).
--     6. get_athlete_invite_statuses() — parent dashboard status for the
--                                   CALLER's linked athletes only: state +
--                                   expiry. Never returns a code, a hash, or
--                                   the athlete's username (authenticated).
--     7. auth_rate_limit_events.action CHECK gains 'preview_invite'.
--
-- Privacy model (unchanged invariants):
--   - device_pairings stays RLS-enabled with NO client policies. The client
--     grant layer is untouched (SELECT pinned by 20260910133456 and fully
--     masked by RLS — no row is ever visible to anon/authenticated).
--   - Raw codes are never stored: only sha256(normalized code) hex.
--   - No new athlete PII. purpose is an enum label; no free text.
--
-- Legacy compatibility:
--   - Existing rows (legacy /pair?code= links, 192-bit base64url codes) get
--     purpose = 'invite' by default and keep working until they expire.
--     Their hash namespace cannot collide with the new readable codes
--     (different length/alphabet before hashing).
--   - The role-check trigger (check_device_pairing_roles) still fires on
--     every insert, including the one inside issue_athlete_invite().
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. purpose column
-- ---------------------------------------------------------------------------

alter table public.device_pairings
  add column if not exists purpose text not null default 'invite';

alter table public.device_pairings
  drop constraint if exists device_pairings_purpose_check;

alter table public.device_pairings
  add constraint device_pairings_purpose_check
  check (purpose in ('invite', 'recovery'));

comment on column public.device_pairings.purpose is
  'FV-630: invite = first account setup (athlete chooses username + password); '
  'recovery = password reset for an account that already has a username '
  '(username is preserved, never changed). Set by issue_athlete_invite() '
  'from the athlete''s state at issue time.';

-- ---------------------------------------------------------------------------
-- 2. At most one live code per athlete.
--
--    Before creating the index, collapse any pre-existing duplicates (a past
--    best-effort void that failed could have left more than one unconsumed
--    row). Keep only the NEWEST unconsumed row per athlete — that is the
--    code the parent most recently sent.
-- ---------------------------------------------------------------------------

delete from public.device_pairings d
 using public.device_pairings newer
 where d.consumed_at is null
   and newer.consumed_at is null
   and newer.athlete_id = d.athlete_id
   and (newer.created_at, newer.code_sha256) > (d.created_at, d.code_sha256);

create unique index if not exists device_pairings_one_live_per_athlete
  on public.device_pairings (athlete_id)
  where consumed_at is null;

comment on index public.device_pairings_one_live_per_athlete is
  'FV-630: at most one unconsumed code per athlete. Creating a new invite or '
  'recovery code REPLACES (revokes) the prior one — enforced here, not only '
  'in application code.';

-- ---------------------------------------------------------------------------
-- 3. issue_athlete_invite() — atomic replace-and-issue.
--
--    Called by the createAthleteInvite server action (service role) AFTER it
--    has verified the parent session and rate-limited the request. The
--    function re-verifies the parent ↔ athlete link itself (defence in
--    depth; the insert trigger is a third check).
--
--    Locks the athlete's profile row FOR UPDATE so two concurrent issues for
--    the same athlete serialize: the second waits, then deletes the first's
--    fresh row and inserts its own. Exactly one live code survives.
--
--    Purpose is derived HERE, from the locked profile, never from the client:
--      username is null  → 'invite'
--      username not null → 'recovery'
--
--    The caller supplies both candidate expiries (invite: longer, so the
--    athlete can install the app first; recovery: shorter) and the function
--    applies the one matching the derived purpose. Returns (purpose,
--    expires_at) so the caller can render the right copy.
-- ---------------------------------------------------------------------------

create or replace function public.issue_athlete_invite(
  p_parent_id            uuid,
  p_athlete_id           uuid,
  p_code_sha256          text,
  p_invite_expires_at    timestamptz,
  p_recovery_expires_at  timestamptz
)
returns table (
  purpose    text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username   text;
  v_role       text;
  v_purpose    text;
  v_expires_at timestamptz;
begin
  if p_code_sha256 is null or p_code_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'issue_athlete_invite: code hash must be 64 lowercase hex chars'
      using errcode = '22023';
  end if;

  if p_invite_expires_at is null or p_invite_expires_at <= now()
     or p_recovery_expires_at is null or p_recovery_expires_at <= now() then
    raise exception 'issue_athlete_invite: expiries must be in the future'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
      from public.parent_athlete_links pal
     where pal.parent_id  = p_parent_id
       and pal.athlete_id = p_athlete_id
  ) then
    raise exception 'issue_athlete_invite: parent is not linked to athlete'
      using errcode = '42501';
  end if;

  select pr.username, pr.role
    into v_username, v_role
    from public.profiles pr
   where pr.id = p_athlete_id
   for update;

  if v_role is distinct from 'athlete' then
    raise exception 'issue_athlete_invite: target is not an athlete profile'
      using errcode = '42501';
  end if;

  if v_username is null then
    v_purpose    := 'invite';
    v_expires_at := p_invite_expires_at;
  else
    v_purpose    := 'recovery';
    v_expires_at := p_recovery_expires_at;
  end if;

  -- Revoke every prior unconsumed code for this athlete (invite OR recovery,
  -- live OR expired). Consumed rows are audit trail; the reaper ages them.
  delete from public.device_pairings dp
   where dp.athlete_id = p_athlete_id
     and dp.consumed_at is null;

  insert into public.device_pairings
    (code_sha256, athlete_id, created_by, expires_at, purpose)
  values
    (p_code_sha256, p_athlete_id, p_parent_id, v_expires_at, v_purpose);

  purpose    := v_purpose;
  expires_at := v_expires_at;
  return next;
end;
$$;

comment on function public.issue_athlete_invite(uuid, uuid, text, timestamptz, timestamptz) is
  'FV-630: atomically revoke any prior unconsumed code for the athlete and '
  'issue a new one. Purpose (invite/recovery) is derived from whether the '
  'athlete already has a username. Service-role only.';

-- ---------------------------------------------------------------------------
-- 4. claim_athlete_invite() — atomic claim.
--
--    Single transaction:
--      a. Lock the live, unexpired row for this hash (FOR UPDATE). No row →
--         return zero rows (invalid / expired / used / revoked — one answer,
--         no enumeration).
--      b. Lock the athlete profile.
--      c. If the athlete has NO username yet: p_username is required and is
--         written now. A uniqueness collision raises 23505 and the WHOLE
--         transaction rolls back — the code is NOT burned, so the athlete
--         can pick another username.
--         If the athlete ALREADY has a username (recovery, or a legacy link
--         for a set-up account): the username is preserved, p_username is
--         ignored.
--      d. Mark the row consumed.
--
--    Returns (athlete_id, purpose, username, consumed_at). The caller then
--    sets the password via the Auth admin API (cannot run inside this
--    transaction); if that fails it calls release_athlete_invite() with the
--    returned consumed_at so the athlete can retry with the same code.
-- ---------------------------------------------------------------------------

create or replace function public.claim_athlete_invite(
  p_code_sha256 text,
  p_username    text
)
returns table (
  athlete_id  uuid,
  purpose     text,
  username    text,
  consumed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_athlete_id uuid;
  v_purpose    text;
  v_username   text;
  v_now        timestamptz := clock_timestamp();
begin
  if p_code_sha256 is null or p_code_sha256 !~ '^[0-9a-f]{64}$' then
    return;
  end if;

  -- Lock order matches issue_athlete_invite(): PROFILE first, then the
  -- code row — so a concurrent claim and re-issue for the same athlete
  -- serialize instead of deadlocking. The unlocked read below only finds
  -- which athlete to lock; the locked re-read is the real check.
  select dp.athlete_id
    into v_athlete_id
    from public.device_pairings dp
   where dp.code_sha256 = p_code_sha256;

  if v_athlete_id is null then
    return;
  end if;

  select pr.username
    into v_username
    from public.profiles pr
   where pr.id = v_athlete_id
     and pr.role = 'athlete'
   for update;

  if not found then
    return;
  end if;

  select dp.purpose
    into v_purpose
    from public.device_pairings dp
   where dp.code_sha256 = p_code_sha256
     and dp.athlete_id = v_athlete_id
     and dp.consumed_at is null
     and dp.expires_at > v_now
   for update;

  if not found then
    return;
  end if;

  if v_username is null then
    if p_username is null or p_username !~ '^[a-z0-9_]{3,20}$' then
      raise exception 'claim_athlete_invite: username required'
        using errcode = '22023';
    end if;

    update public.profiles
       set username = p_username
     where id = v_athlete_id;

    v_username := p_username;
    v_purpose  := 'invite';
  else
    -- Username already set: preserved. This is recovery, whatever the row
    -- was issued as (covers legacy links for already-set-up accounts).
    v_purpose := 'recovery';
  end if;

  update public.device_pairings dp
     set consumed_at = v_now
   where dp.code_sha256 = p_code_sha256;

  athlete_id  := v_athlete_id;
  purpose     := v_purpose;
  username    := v_username;
  consumed_at := v_now;
  return next;
end;
$$;

comment on function public.claim_athlete_invite(text, text) is
  'FV-630: atomically claim a live invite/recovery code. Sets the username '
  'only when the athlete has none (a collision rolls back without burning the '
  'code); otherwise preserves it. Returns zero rows for any unusable code. '
  'Service-role only.';

-- ---------------------------------------------------------------------------
-- 5. release_athlete_invite() — compensating undo of a claim.
--
--    Called when the password write after a claim fails. It undoes exactly
--    that claim (matching consumed_at to the microsecond):
--      - p_clear_username = true (the claim returned purpose 'invite', i.e. it
--        SET the username) → the username is cleared again, so the athlete
--        is back to "not set up": a retry can pick any username, and the
--        parent dashboard does not show "account ready" for an account that
--        never got a password.
--      - the code is revived only while unexpired and only if no replacement
--        was issued meanwhile (one-live-code invariant).
--    Returns true when the code was revived.
-- ---------------------------------------------------------------------------

create or replace function public.release_athlete_invite(
  p_code_sha256    text,
  p_consumed_at    timestamptz,
  p_clear_username boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_athlete_id uuid;
  v_count      int;
begin
  select dp.athlete_id
    into v_athlete_id
    from public.device_pairings dp
   where dp.code_sha256 = p_code_sha256
     and dp.consumed_at = p_consumed_at;

  if v_athlete_id is null then
    return false;
  end if;

  -- Same lock order as issue/claim: profile first.
  perform 1 from public.profiles pr where pr.id = v_athlete_id for update;

  if p_clear_username then
    update public.profiles pr
       set username = null
     where pr.id = v_athlete_id
       and pr.role = 'athlete';
  end if;

  update public.device_pairings dp
     set consumed_at = null
   where dp.code_sha256 = p_code_sha256
     and dp.consumed_at = p_consumed_at
     and dp.expires_at > now()
     and not exists (
       select 1
         from public.device_pairings other
        where other.athlete_id = dp.athlete_id
          and other.consumed_at is null
     );
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

comment on function public.release_athlete_invite(text, timestamptz, boolean) is
  'FV-630: undo a claim whose follow-up password write failed: clears the '
  'username the claim set (when told to) and revives the code so the athlete '
  'can retry. Exact-match on consumed_at; never revives an expired or '
  'replaced code. Service-role only.';

-- ---------------------------------------------------------------------------
-- 6. get_athlete_invite_statuses() — parent dashboard read.
--
--    Scoped to auth.uid(): returns one row per athlete linked to the CALLER.
--    A non-parent caller (athlete, unrelated parent) gets only the athletes
--    linked to them — i.e. none. Returns state metadata only:
--      account_ready      — athlete has finished setup (has a username)
--      signed_in_before   — the account has signed in at least once (true for
--                           athletes paired before usernames existed, FV-320,
--                           who train on a device but have no username yet)
--      pending_purpose    — purpose of the live, unexpired code, or null
--      pending_expires_at — its expiry, or null
--    It NEVER returns a code, a hash, the username, or a timestamp of
--    activity (signed_in_before is a boolean on purpose).
-- ---------------------------------------------------------------------------

create or replace function public.get_athlete_invite_statuses()
returns table (
  athlete_id         uuid,
  account_ready      boolean,
  signed_in_before   boolean,
  pending_purpose    text,
  pending_expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pal.athlete_id,
    (pr.username is not null)  as account_ready,
    exists (
      select 1
        from auth.users u
       where u.id = pr.id
         and u.last_sign_in_at is not null
    )                          as signed_in_before,
    live.purpose               as pending_purpose,
    live.expires_at            as pending_expires_at
  from public.parent_athlete_links pal
  join public.profiles pr
    on pr.id = pal.athlete_id
   and pr.role = 'athlete'
  left join public.device_pairings live
    on live.athlete_id = pal.athlete_id
   and live.consumed_at is null
   and live.expires_at > now()
  where pal.parent_id = auth.uid();
$$;

comment on function public.get_athlete_invite_statuses() is
  'FV-630: invite/account state for the calling parent''s linked athletes. '
  'Metadata only — never a code, hash, username, or activity timestamp. '
  'Authenticated only.';

-- ---------------------------------------------------------------------------
-- 7. Function grants — default-deny, then explicit.
--    (Postgres grants PUBLIC EXECUTE on new functions and Supabase's default
--    privileges add anon/authenticated; revoke all three explicitly.)
-- ---------------------------------------------------------------------------

revoke all on function public.issue_athlete_invite(uuid, uuid, text, timestamptz, timestamptz)
  from public, anon, authenticated;
revoke all on function public.claim_athlete_invite(text, text)
  from public, anon, authenticated;
revoke all on function public.release_athlete_invite(text, timestamptz, boolean)
  from public, anon, authenticated;
revoke all on function public.get_athlete_invite_statuses()
  from public, anon, authenticated;

grant execute on function public.issue_athlete_invite(uuid, uuid, text, timestamptz, timestamptz)
  to service_role;
grant execute on function public.claim_athlete_invite(text, text)
  to service_role;
grant execute on function public.release_athlete_invite(text, timestamptz, boolean)
  to service_role;
grant execute on function public.get_athlete_invite_statuses()
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Rate-limit action label for the code check (lookup) step.
--    Same drop-and-re-add pattern as 20260624000000 section 4.
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
    'preview_invite'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'password_update, username_sign_in, or preview_invite.';
