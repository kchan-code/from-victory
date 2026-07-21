-- =============================================================================
-- Migration: 20260721000000_account_deletion_actor_comment.sql
--
-- Purpose:
--   COMMENT-ONLY. FV-440 widens deleteAccount() (lib/actions/account.ts) from
--   requireParent() to requireSubscriber(), so the caller who initiates an
--   'account_deleted' event may now be an adult_athlete (18+ self-serve payer,
--   FV-325) self-deleting their own account, not only a parent. The column's
--   comment is stale ("The parent who initiated the deletion" /
--   "UUID of the parent who initiated the deletion") and is updated to
--   describe both callers. No column rename, no DDL, no data change — mirrors
--   the payer-semantics comment update on subscriptions.parent_id in
--   20260625000000_adult_athlete_role.sql (lines ~200-207).
--
-- Privacy / Tier: privacy-path (touches supabase/**) + Tier-2 (migration).
--   Comment-only — no new data collected, no access change. Reviewed by
--   kids-privacy-officer + qa-reviewer per standard policy.
--
-- Postgres version: 15+
-- =============================================================================

begin;

comment on column public.account_deletion_events.actor_parent_id is
  'The payer account that initiated deletion: a parent, or an adult_athlete '
  'self-deleting. Plain uuid with no FK — see table comment. For '
  '''account_deleted'' events this account no longer exists in auth.users by '
  'the time the row is written.';

commit;
