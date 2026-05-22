-- =============================================================================
-- Migration: 20260522002717_safety_events.sql
--
-- Purpose:
--   Establish the safety-detection event log (PR-06) and harden the
--   journal_entries.content column with a length cap + composite index
--   recommended by kids-privacy-officer on PR #25.
--
-- CLAUDE.md Journal Safety Architecture (Option C):
--   - Athlete writes privately.
--   - Server-side keyword detection runs on submission.
--   - If detected, the athlete sees an inline resource screen
--     (988 + Crisis Text Line + "talk to a trusted adult"). No parent
--     alert. No third party notified.
--   - Every detection event is logged (event only, NEVER content).
--
--   This migration adds the table and constraints. Detection logic and
--   the resource screen ship as TypeScript in the same PR. PR-09 wires
--   the detector into the journal save action.
--
-- Privacy model (for kids-privacy-officer):
--   - safety_events: NO client policies. Service-role only writes (via
--     logSafetyEvent server action) and service-role only reads (no UI
--     surfaces this history to athlete or parent — surfacing it would
--     be shame-inducing per CLAUDE.md gamification rules).
--   - Row content is event-shaped: athlete_id, athlete_session_id,
--     category. The category is an enum-of-categories from
--     safety-keywords.json (e.g. 'crisis', 'self_harm'). No journal
--     content lives here.
--   - Cascading delete chain: profiles -> safety_events (via
--     athlete_id) AND athlete_sessions -> safety_events (via
--     athlete_session_id). Either delete path cleans up.
--   - athlete_id is denormalized from athlete_session_id (same
--     defense-in-depth pattern as journal_entries from PR-05). A
--     trigger enforces consistency.
--
-- Postgres version: 15+
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. safety_events
-- ---------------------------------------------------------------------------

create table public.safety_events (
  id                  uuid        primary key default gen_random_uuid(),
  athlete_id          uuid        not null
                                  references public.profiles(id) on delete cascade,
  athlete_session_id  uuid        not null
                                  references public.athlete_sessions(id) on delete cascade,
  -- Category from packages/content/safety-keywords.json. Free-text rather
  -- than a Postgres enum so the vocabulary can evolve without migrations.
  -- (A check constraint enforcing a fixed set would create migration
  -- coupling that fights the quarterly clinical-advisor review cadence.)
  category            text        not null,
  detected_at         timestamptz not null default now()
);

comment on table public.safety_events is
  'Append-only log of safety-keyword detections on journal entries. '
  'NEVER contains journal content — event metadata only (athlete, '
  'session, category, time). Service-role only: no client policies '
  'because surfacing this history to athlete or parent would be '
  'shame-inducing per CLAUDE.md gamification rules. PR-09 wires the '
  'detector into the journal save server action.';

comment on column public.safety_events.athlete_id is
  'Denormalized from athlete_session_id for log-query performance '
  '(no join needed for "all events for this athlete" forensics). '
  'A trigger enforces consistency with athlete_sessions.athlete_id.';

comment on column public.safety_events.category is
  'Category string from packages/content/safety-keywords.json '
  '(e.g. ''crisis'', ''self_harm''). Free-text not enum so the '
  'vocabulary can evolve with quarterly clinical-advisor review '
  'without schema migrations.';

-- Index for "all events for this athlete" forensic queries.
create index safety_events_athlete_idx on public.safety_events (athlete_id);

-- Index for "events by category over time" product-improvement queries.
create index safety_events_category_detected_idx
  on public.safety_events (category, detected_at desc);

-- Denormalization integrity trigger: safety_events.athlete_id must match
-- athlete_sessions.athlete_id for the linked athlete_session_id. Same
-- defense-in-depth pattern as journal_entries (PR-05).
create or replace function public.check_safety_event_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_athlete uuid;
begin
  select athlete_id into v_session_athlete
    from public.athlete_sessions
   where id = new.athlete_session_id;

  if v_session_athlete is null then
    raise exception
      'safety_events: athlete_session_id (%) does not exist',
      new.athlete_session_id;
  end if;

  if v_session_athlete <> new.athlete_id then
    raise exception
      'safety_events: athlete_id (%) does not match athlete_sessions.athlete_id (%) for athlete_session_id (%)',
      new.athlete_id, v_session_athlete, new.athlete_session_id;
  end if;

  return new;
end;
$$;

comment on function public.check_safety_event_consistency() is
  'Before-insert/update trigger that verifies the denormalized athlete_id '
  'on safety_events matches the athlete_id on the linked athlete_sessions '
  'row. Defense-in-depth so a buggy server action cannot misroute a '
  'safety event to the wrong athlete.';

create trigger safety_events_consistency_check
  before insert or update on public.safety_events
  for each row execute function public.check_safety_event_consistency();


-- ---------------------------------------------------------------------------
-- 2. journal_entries hardening (PR #25 LOWs)
-- ---------------------------------------------------------------------------

-- LOW #1: cap journal content length. 50_000 chars is ~6-7 typical
-- journal pages — generous upper bound that prevents a runaway client
-- (or compromised account) from writing multi-MB entries that would
-- blow up the safety-detection pipeline.
alter table public.journal_entries
  add constraint journal_content_max_length
    check (length(content) <= 50000);

comment on constraint journal_content_max_length on public.journal_entries is
  'Defense against runaway writes. 50_000 chars (~6-7 typical journal '
  'pages) is far above any expected entry but well below sizes that '
  'would slow the safety-detection pipeline.';

-- LOW #2: composite index for safety-scan queries. PR-09's detector
-- will query "recent entries by athlete" in the read-back path; the
-- existing journal_entries_athlete_idx (athlete_id only) would
-- require a sort. Composite avoids it.
create index journal_entries_athlete_created_idx
  on public.journal_entries (athlete_id, created_at desc);


-- ---------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY — service-role only on safety_events.
-- ---------------------------------------------------------------------------

alter table public.safety_events enable row level security;

-- Intentional: no CREATE POLICY statements. Every read and write to
-- safety_events goes through service-role (logSafetyEvent server action
-- writes; future forensic / product queries read). Adding a client
-- policy here would:
--   - athlete read: surface history -> shame mechanic violation
--   - parent read: violate CLAUDE.md "no parent alert" principle
-- Both vetoed by design.
