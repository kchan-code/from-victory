-- =============================================================================
-- FV-602: apple_subscriptions.auto_renew_product_id
--
-- Adds a single nullable column to the existing apple_subscriptions table
-- (migration 20260911120000_apple_provider_access.sql) to distinguish a
-- SCHEDULED renewal-product change (Apple's DID_CHANGE_RENEWAL_PREF
-- notification, subtype DOWNGRADE) from an EFFECTIVE entitlement change.
--
-- Background: an in-group same-tier UPGRADE takes effect immediately
-- (Apple applies it to the current transaction right away — handled through
-- the existing full-snapshot apply path, exactly like SUBSCRIBED/DID_RENEW).
-- A DOWNGRADE, by contrast, is only scheduled — it takes effect at the NEXT
-- renewal (DID_RENEW), not now. Persisting the scheduled target product
-- separately from `product_id` lets read paths surface "you're changing to
-- X at your next renewal" without touching current entitlement, capacity, or
-- access-level determination in the meantime (FV-210 record's `expires_at`/
-- `status` columns remain the sole entitlement-determining columns; this
-- column is informational only).
--
-- No RLS or grant change: apple_subscriptions already has RLS enabled with a
-- single payer-own SELECT policy (`apple_subscriptions_select_own_payer`)
-- and a table-level `grant select ... to authenticated` (migration
-- 20260911120000, Sections 5a/6) — both apply to every column on the table,
-- including this new one, with no additional migration statements required.
-- Writes remain service-role-only (no client INSERT/UPDATE/DELETE grant or
-- policy exists, and this migration adds none).
--
-- No new PII: this column stores an Apple product/price identifier (App
-- Store Connect config), the same category of data as the existing
-- `product_id` column it sits beside — not personal data, and it cascades
-- with the rest of the row via the existing `payer_id ... on delete cascade`
-- FK (record Section 4.7).
--
-- Postgres version: 15+
-- =============================================================================

alter table public.apple_subscriptions
  add column auto_renew_product_id text null;

comment on column public.apple_subscriptions.auto_renew_product_id is
  'The Apple product/price identifier this subscription will renew INTO at '
  'its next renewal, sourced from renewalInfo.autoRenewProductId. Null means '
  '"same as product_id" (no scheduled change, or a scheduled DOWNGRADE has '
  'been cancelled). Populated (SCHEDULED, not yet effective) on a '
  'DID_CHANGE_RENEWAL_PREF notification with subtype DOWNGRADE; cleared to '
  'null on subtype UPGRADE (an upgrade takes effect immediately, so nothing '
  'remains scheduled) and on the DID_RENEW that makes a scheduled downgrade '
  'effective (FV-602). This column is informational only — it must never be '
  'read as, or substituted for, the current entitlement: `status` and '
  '`expires_at` remain the sole columns access-level and capacity '
  'determinations are made from.';
