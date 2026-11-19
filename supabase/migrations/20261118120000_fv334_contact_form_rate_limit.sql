-- FV-334: rate-limit the public /contact form.
--
-- Extends the closed CHECK on auth_rate_limit_events.action with 'contact_form'
-- so submitContact can reuse the existing rateLimitGate store (keyed on an
-- HMAC digest of the request IP; no message, name or email is stored). No new
-- table, column, policy or grant: the table's existing RLS/grants are
-- unchanged. The other 14 actions are carried over verbatim.

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
    'apple_handoff',
    'pregame_selections',
    'contact_form'
  ));

comment on column public.auth_rate_limit_events.action is
  'The server action that generated this event: sign_in, sign_up, '
  'athlete_sign_in, claim_pairing, generate_pairing_code, password_reset, '
  'password_update, username_sign_in, preview_invite, signup_verify, '
  'signup_resend, apple_signin (reserved, FV-673), apple_handoff (reserved, '
  'FV-673), pregame_selections (FV-749 throttle on selection totals) or '
  'contact_form (FV-334 throttle on the public contact form).';
