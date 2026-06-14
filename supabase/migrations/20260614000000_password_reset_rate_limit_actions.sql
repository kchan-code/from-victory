-- =============================================================================
-- Migration: 20260614000000_password_reset_rate_limit_actions.sql
--
-- Purpose:
--   Extend the auth_rate_limit_events.action CHECK constraint to permit the two
--   new rate-limited actions added in FV-185:
--     - 'password_reset'  (requestPasswordReset — keyed on normalized email)
--     - 'password_update' (updatePassword — keyed on request IP)
--
--   Companion to lib/actions/rate-limit.ts (RATE_LIMIT_ACTIONS + config) and
--   lib/actions/auth.ts (the gated server actions). All other invariants of the
--   table (content-free HMAC bucket, service-role-only RLS, inline TTL) are
--   unchanged — this migration only widens the allowed action labels.
--
--   FV-13 deliberately scoped the original CHECK to its five actions so any new
--   rate-limited action requires an explicit migration. This is that migration.
--
-- Postgres version: 15+
-- =============================================================================

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
    'password_update'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'or password_update.';
