-- =============================================================================
-- Google Play "App access" reviewer test account — comp-grant SQL companion
--
-- Companion to apps/web/scripts/provision-play-review-account.ts, which is the
-- PRIMARY provisioning path (it must own the auth.users writes — see that
-- script's header for why raw SQL cannot safely create/delete Supabase Auth
-- users). This file is for the two operations that ARE pure public.* table
-- writes and don't need the Admin API: re-checking / revoking the comp grant
-- after the script has already run once.
--
-- Run in the Supabase SQL editor (Studio) against the LINKED project, which
-- executes as `postgres` and can read auth.users directly (PostgREST/RLS
-- clients cannot). Mirrors the pattern in docs/stripe-enforcement-comp.sql.
--
-- DO NOT `delete from auth.users` here. Deleting a Supabase Auth user must go
-- through the Admin API (auth.admin.deleteUser) so GoTrue's identities /
-- refresh_token / session rows are cleaned up consistently. Use:
--   node --experimental-strip-types scripts/provision-play-review-account.ts --teardown
-- for full removal of both accounts.
-- =============================================================================

-- ── 1. VERIFY — does the reviewer parent have an active comp grant right now? (read-only) ──
select
  ag.id,
  ag.reason,
  ag.expires_at,
  ag.revoked_at,
  ag.created_at
from public.access_grants ag
join public.profiles p on p.id = ag.parent_id
join auth.users u on u.id = p.id
where u.email = 'play-review@fromvictoryapp.com'
  and p.role = 'parent'
order by ag.created_at desc;

-- ── 2. REVOKE — turn off entitlement WITHOUT deleting either account (reversible; re-run the
--      provisioning script, or block 3 below, to re-grant). Expect 1 row updated. ──
update public.access_grants ag
set revoked_at = now()
from public.profiles p
join auth.users u on u.id = p.id
where ag.parent_id = p.id
  and p.role = 'parent'
  and u.email = 'play-review@fromvictoryapp.com'
  and ag.revoked_at is null;

-- ── 3. RE-GRANT — restore full access after a revoke (perpetual; matches the script's default). ──
insert into public.access_grants (parent_id, granted_by, reason)
select p.id, null, 'Google Play Console reviewer account (App access form) — re-granted via SQL'
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'play-review@fromvictoryapp.com'
  and p.role = 'parent'
  and not exists (
    select 1 from public.access_grants ag
    where ag.parent_id = p.id
      and ag.revoked_at is null
      and (ag.expires_at is null or ag.expires_at > now())
  );
