-- Adds an out-of-order-event watermark to subscriptions so the Stripe webhook
-- can skip stale (redelivered, older event.created) customer.subscription.*
-- events that would otherwise overwrite newer billing state and grant/revoke
-- access incorrectly. See apps/web/app/api/webhooks/stripe/route.ts (FV-63).

alter table public.subscriptions
  add column if not exists last_stripe_event_at timestamptz;

comment on column public.subscriptions.last_stripe_event_at is
  'event.created (UTC) of the most recent customer.subscription.* event applied '
  'to this row. The webhook handler skips any subscription event whose '
  'event.created is older than this value (Stripe does not guarantee delivery '
  'order). Null until the first subscription.* event lands. Written only by the '
  'service-role webhook handler; billing timestamp, not PII.';
