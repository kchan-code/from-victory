-- =============================================================================
-- Migration: 20261113130000_scrub_activity_event_selection_meta.sql
--
-- Purpose (FV-724 / FV-749 item 5):
--   Until PR #643, every completed pregame wrote the athlete's own selections
--   into `activity_events.meta`, keyed to `athlete_id`: `position`, `adversity`
--   (the hard moment chosen to rehearse), `anchor`, `prayer_style`, and the
--   allow-listed (never emitted) `cue_word_category`. Nothing ever read them.
--   PR #643 stopped the client sending them and removed them from the server
--   allow-list; selections are now kept only as aggregate monthly totals in
--   `pregame_selection_counts`.
--
--   The Privacy Policy (section 1i) says a usage record "does not contain what
--   the athlete selected or was shown inside a session". Rows written before
--   PR #643 still do, and would until the 90-day prune removed them. This
--   migration removes those keys from existing rows now, so the statement is
--   true for every row, and adds a CHECK so it stays true whatever the
--   application code does.
--
-- What it does:
--   1. Removes the six keys from `meta` on every row that has any of them.
--      `focus_area` was never allow-listed and should not be present; it is
--      included so the constraint below can be added without a failing row.
--      A `meta` left empty becomes NULL. No row is deleted and no other
--      column changes, so DAU/WAU/MAU and the rollup are unaffected (neither
--      reads `meta`).
--   2. Adds a CHECK constraint refusing those keys from now on.
--
-- Irreversible by design: the removed values are not kept anywhere.
-- No grant, policy or RLS change.
-- =============================================================================

update public.activity_events
set meta = nullif(
  meta - array[
    'position', 'adversity', 'anchor', 'prayer_style',
    'cue_word_category', 'focus_area'
  ],
  '{}'::jsonb
)
where meta ?| array[
  'position', 'adversity', 'anchor', 'prayer_style',
  'cue_word_category', 'focus_area'
];

alter table public.activity_events
  add constraint activity_events_meta_no_selections
  check (
    meta is null
    or not (meta ?| array[
      'position', 'adversity', 'anchor', 'prayer_style',
      'cue_word_category', 'focus_area'
    ])
  );

comment on constraint activity_events_meta_no_selections on public.activity_events is
  'FV-724: a usage event never stores what an athlete selected (position, '
  'hard moment, anchor, prayer style, cue word category, focus area). '
  'Selections are kept only as aggregate totals in pregame_selection_counts. '
  'Changing this requires changing Privacy Policy section 1i first.';
