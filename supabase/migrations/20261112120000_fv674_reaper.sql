-- =============================================================================
-- Migration: 20261112120000_fv674_reaper.sql
--
-- Purpose: FV-674 (SSO A5) — database half of the cleanup reaper
--   (docs/fv-569-apple-google-signin-spec.md §5.2, §5.7).
--
-- ADDITIVE ONLY. Two service_role-only SECURITY DEFINER functions. service_role
-- holds no grant on schema `private`; it reaches the tombstone table ONLY
-- through these functions (same pattern as reaper_mark / finalize).
--
--   public.reaper_find_candidates(p_limit)   ids the reaper should work on:
--       (a) unestablished, no profile, older than 1 hour, either `pending`
--           (apple/google provider or a confirmed email) or `orphan`
--           (email-only, unconfirmed), with NO tombstone; or
--       (b) already tombstoned.
--       Always filtered by private.is_unestablished (so synthetic athletes and
--       anything with payer/comp/athlete data are never returned). Returns
--       only user_id, tombstoned and attempts — no email, no metadata.
--   public.reaper_bump_attempts(p_user_id)   +1 on a tombstone's `attempts`
--       (a failed revoke run). Returns the new count, NULL if no tombstone.
--
-- The finder is advisory: reaper_mark and finalize_pending_deletion re-check
-- is_unestablished under the per-user lock, so a stale finder result can never
-- delete an established account.
--
-- No new tables, so RLS/cascade are unchanged (tombstone already cascades from
-- auth.users). No PII is added or stored.
-- =============================================================================

create or replace function public.reaper_find_candidates(p_limit integer default 100)
returns table (user_id uuid, tombstoned boolean, attempts integer)
language sql
security definer
set search_path = ''
stable
as $$
  with cand as (
    -- (b) already tombstoned
    select t.user_id, true as tombstoned, t.attempts, t.created_at as sort_at
      from private.pending_account_deletions t
    union all
    -- (a) old, profileless, verified-or-orphan, not yet tombstoned
    select u.id, false, 0, u.created_at
      from auth.users u
     where u.created_at < now() - interval '1 hour'
       and not exists (select 1 from public.profiles p where p.id = u.id)
       and not exists (select 1 from private.pending_account_deletions t where t.user_id = u.id)
       and (
             -- pending: verified identity
             u.email_confirmed_at is not null
             or coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) ?| array['apple', 'google']
             -- orphan: email-only, unconfirmed
             or (u.email is not null
                 and u.email_confirmed_at is null
                 and coalesce(u.raw_app_meta_data -> 'providers', '[]'::jsonb) <@ '["email"]'::jsonb)
           )
  )
  select c.user_id, c.tombstoned, c.attempts
    from cand c
   where private.is_unestablished(c.user_id)
   order by c.sort_at
   limit greatest(1, least(coalesce(p_limit, 100), 100))
$$;

comment on function public.reaper_find_candidates(integer) is
  'FV-674 §5.7: ids for the cleanup reaper (unestablished, profileless, >1h old '
  'pending/orphan without a tombstone, or already tombstoned), capped at 100. '
  'Advisory: mark/finalize re-check under the lock. service_role only.';

create or replace function public.reaper_bump_attempts(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if p_user_id is null then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update private.pending_account_deletions
     set attempts = attempts + 1
   where user_id = p_user_id
  returning attempts into v_attempts;

  return v_attempts;
end;
$$;

comment on function public.reaper_bump_attempts(uuid) is
  'FV-674 §5.2: +1 failed-run counter on a tombstone; returns the new count or '
  'NULL when there is no tombstone. service_role only.';

revoke all on function public.reaper_find_candidates(integer)
  from public, anon, authenticated, service_role;
revoke all on function public.reaper_bump_attempts(uuid)
  from public, anon, authenticated, service_role;

grant execute on function public.reaper_find_candidates(integer) to service_role;
grant execute on function public.reaper_bump_attempts(uuid) to service_role;
