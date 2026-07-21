-- =============================================================================
-- Migration: 20260721010000_daily_content_age_neutral_lines.sql  (FV-447)
--
-- Purpose (KC directive 2026-07-20): neutralize 3 youth-leaning lines in the
--   sport-agnostic daily training arc (FV-430) so the content reads across the
--   full 13+ athlete band without an upper age ceiling implied.
--
--   - Day 14 ("Loved, So I Can Lose"): "the parent in the stands" ->
--     "the crowd in the stands" — removes the parent/youth framing from a line
--     already generalized to coach/scout.
--   - Day 27 ("Don't Coast on Your Age"): "too young or low on the depth
--     chart" -> "too new or too far down the depth chart" — same reset,
--     doesn't presuppose the athlete is young; title + "Paul tells young
--     Timothy" exposition are unchanged (Timothy's youth is the scriptural
--     fact being applied, not the athlete's).
--
-- Both replacements KC-approved verbatim 2026-07-20; youth-pastor confirmed
-- the Day 27 scripture-application widening.
--
-- Method: targeted `replace()` on the existing mental_skill_md text, guarded
-- by a `like` filter, rather than re-seeding the whole body — this survives
-- any other prod edits to these rows since FV-430. Idempotent: safe to re-run
-- (the `like` guard means a second run is a no-op once the substring is gone).
-- Applies across ALL sports' rows for the given day_number, matching the
-- FV-430 sport-agnostic UPDATE idiom (no sport filter).
-- =============================================================================

begin;

update public.training_sessions_catalog
set mental_skill_md = replace(
      mental_skill_md,
      'by the coach, the scout, the parent in the stands.',
      'by the coach, the scout, the crowd in the stands.'
    ),
    updated_at = now()
where day_number = 14
  and mental_skill_md like '%by the coach, the scout, the parent in the stands.%';

update public.training_sessions_catalog
set mental_skill_md = replace(
      mental_skill_md,
      'When you think you''re too young or low on the depth chart to matter, decide otherwise:',
      'When you think you''re too new or too far down the depth chart to matter, decide otherwise:'
    ),
    updated_at = now()
where day_number = 27
  and mental_skill_md like '%When you think you''re too young or low on the depth chart to matter, decide otherwise:%';

commit;
