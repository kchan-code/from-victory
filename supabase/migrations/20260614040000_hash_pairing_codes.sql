-- =============================================================================
-- Migration: 20260614040000_hash_pairing_codes.sql
--
-- Purpose (FV-177):
--   Harden the athlete device-pairing flow. A pairing code is a
--   password-reset-class bearer token — claiming one sets the athlete's
--   password (apps/web/lib/actions/pairings.ts → claimPairing). Until now
--   device_pairings stored that bearer secret UNHASHED in the primary-key
--   `code` column (migration 20260521200232_device_pairings.sql), so anyone
--   with read access to the row (a leaked backup, a mis-scoped query, a
--   Studio session) could replay a live code.
--
--   This migration stores only sha256(code) at rest. The plaintext code is
--   shown to the parent exactly once at generation time and is never written
--   to the database. Lookup/consume now matches on the hash.
--
-- What changes:
--   1. New lookup key `code_sha256 text` = hex sha256 of the raw code,
--      computed in application code (Node crypto.createHash('sha256')).
--      It becomes the PRIMARY KEY (single index seek at /pair, same as before).
--   2. The old plaintext `code` column is DROPPED. There is no longer any
--      column that holds the raw bearer secret.
--
-- Cutover behavior (AC5 — in-flight plaintext codes):
--   Existing rows hold ONLY the plaintext code (no hash), and we cannot
--   re-hash them without the raw value, so every pre-existing row is DELETED
--   as part of this migration. Combined with the 24h TTL this is acceptable:
--   the blast radius is at most the pairing codes generated in the last 24h
--   that have not yet been claimed. Affected athletes simply ask their parent
--   to generate a fresh link (the same recovery path as an expired code).
--   This is an EXPIRE-ON-CUTOVER, not data loss of any durable record —
--   device_pairings holds only ephemeral one-time tokens.
--
-- Preserved semantics:
--   - athlete_id / created_by FKs, on delete cascade, role-check trigger,
--     expires_after_creation check, consumed_at single-use marker — all kept.
--   - Service-role-only access (RLS enabled, NO client policies) — kept.
--   - Atomic single-use claim (conditional UPDATE) — unchanged in app code,
--     now keyed on code_sha256 instead of code.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Drop the old plaintext-keyed rows and the plaintext column.
--
--    Order matters: we drop the primary key constraint via column drop, then
--    add the new hashed PK. Clearing the table first guarantees no NULL/dup
--    collisions when code_sha256 becomes NOT NULL + PRIMARY KEY.
-- ---------------------------------------------------------------------------

-- Expire every in-flight plaintext code (see "Cutover behavior" above).
delete from public.device_pairings;

-- Drop the plaintext primary-key column. This also drops the implicit
-- device_pairings_pkey constraint that was on (code).
alter table public.device_pairings
  drop column code;

-- ---------------------------------------------------------------------------
-- 2. Add the hashed lookup column as the new primary key.
--    Hex sha256 of the raw code is always 64 chars; we don't constrain length
--    here (the app is the sole writer) but document the shape.
-- ---------------------------------------------------------------------------

alter table public.device_pairings
  add column code_sha256 text not null;

alter table public.device_pairings
  add constraint device_pairings_pkey primary key (code_sha256);

comment on column public.device_pairings.code_sha256 is
  'Hex sha256(raw pairing code), computed in application code via '
  'crypto.createHash(''sha256'').update(code).digest(''hex''). The raw code is '
  'shown to the parent ONCE at generation and is NEVER stored. Lookup at '
  '/pair?code=… hashes the inbound code and matches on this column. Primary '
  'key so the lookup is a single index seek. (FV-177)';

-- Refresh the stale table comment that still described the plaintext model.
comment on table public.device_pairings is
  'One-time codes that let an athlete claim a device and set their password. '
  'Stores only sha256(code) — the raw bearer token is never persisted '
  '(FV-177). Service-role only — no client RLS policies. Writes happen in '
  'apps/web/lib/actions/pairings.ts.';

-- ---------------------------------------------------------------------------
-- 3. Notes on indexes (intentionally NOT changed here)
--    - device_pairings_athlete_idx (athlete_id) is unchanged and is what the
--      "void prior unused codes for this athlete" delete in generatePairingCode
--      uses, plus the per-athlete reaper scan.
--    - device_pairings_unconsumed_expires_idx (expires_at) WHERE consumed_at
--      IS NULL is unchanged and serves the reaper's expired-unconsumed scan.
--    No new indexes are added by FV-177. (Index work on created_by is owned by
--    a separate issue and is intentionally out of scope here.)
-- ---------------------------------------------------------------------------
