-- =============================================================================
-- Migration: 20260613100000_v2_dormant_sport_positions.sql
--
-- Purpose (v2 dormant tracks — football / swimming / track & field):
--   One additive CHECK-constraint widening on public.profiles so the player
--   roles / event specialties / event groups of the three new v2 sports are
--   storable:
--     profiles_position_values += football positions, swimming specialties,
--                                 track & field event groups
--
--   These three sports are DORMANT — content authored, NOT athlete-selectable.
--   Their sport slugs are intentionally NOT added to sport_valid_values
--   (sport stays gated; they go live behind a future go-live migration + the
--   audio render + clinical sign-off). This mirrors the baseball precedent:
--   position validity is independent of the sport allowlist, and a harmless
--   defensive over-inclusion of positions keeps the registry ⊆ DB CHECK
--   backstop (apps/web/__tests__/athlete-quiz-schema.test.ts) holding.
--
--   New positions added (registry roles for the three v2 sports; Sprinter +
--   Distance are shared between swimming and track & field, listed once):
--     Football  — QB, Running Back, Receiver, Offensive Line, Defensive Line,
--                 Linebacker, Defensive Back
--     Swimming  — Sprinter, Distance, Stroke, IM   (event specialties)
--     Track&Fld — Sprinter, Distance, Hurdler, Jumper, Thrower  (event groups)
--
-- Safety / risk:
--   Additive — only WIDENS the allowed set, so no existing row can violate the
--   new constraint (Postgres re-validates on ADD CONSTRAINT; every current value
--   is a strict subset of the new set, so the scan passes). Backward-compatible,
--   no data migration, no RLS change. sport_role_consistency is untouched.
--
-- Ordering:
--   Dated after 20260613020000_golf_db_enablement.sql (which last set
--   profiles_position_values) so the DROP ... IF EXISTS / re-ADD runs against
--   the existing constraint.
--
-- Types:
--   No Supabase type regeneration needed — a CHECK constraint is not reflected
--   in generated TypeScript types (position remains `string | null`).
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- profiles_position_values += football / swimming / track & field roles
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_position_values;

alter table public.profiles
  add constraint profiles_position_values
    check (
      position is null
      or position in (
        -- Hockey
        'Forward', 'Defense', 'Goalie',
        -- Basketball
        'Guard', 'Wing', 'Big',
        -- Baseball (v2 — dormant)
        'Pitcher', 'Catcher', 'Infield', 'Outfield',
        -- Golf (v2 — live; non-positional, player profiles)
        'Bomber', 'Ball-Striker', 'Scrambler',
        -- Football (v2 — dormant; position groups)
        'QB', 'Running Back', 'Receiver', 'Offensive Line',
        'Defensive Line', 'Linebacker', 'Defensive Back',
        -- Swimming (v2 — dormant; event specialties)
        'Sprinter', 'Distance', 'Stroke', 'IM',
        -- Track & Field (v2 — dormant; event groups; Sprinter + Distance shared
        -- with swimming, listed once above)
        'Hurdler', 'Jumper', 'Thrower'
      )
    );

commit;
