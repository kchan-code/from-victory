-- =============================================================================
-- Migration: 20260522000749_content_schema.sql
--
-- Purpose:
--   Content rails for PR-05. Establishes the three tables that drive the
--   athlete training loop:
--     1. training_sessions_catalog — the 30 authored daily sessions
--        (mental skill + scripture + journal prompt). Sport-agnostic
--        structure, defaulting to 'hockey' for MVP. Read by all
--        authenticated users; written only by service-role (PR-07 seeds).
--     2. athlete_sessions — one row per (athlete, catalog_session). Tracks
--        start/complete timestamps. Athlete owns own rows; parent reads
--        linked athletes' rows (metadata only — content lives on the
--        catalog row, not here).
--     3. journal_entries — athlete-private reflection text, 1:1 with
--        athlete_sessions. **Parent has NO read policy on this table.**
--        Safety detection (PR-06) reads via service-role server actions.
--
--   Also creates the parent-dashboard metadata VIEW (security_invoker so
--   RLS on the underlying table applies).
--
-- Structure ordering (lesson from PR-03 hotfix):
--   - Section 0: helper functions (none new — reusing set_updated_at from
--     baseline + adding role-check + denormalized-id-integrity triggers)
--   - Sections 1-3: all CREATE TABLE + indexes + triggers
--   - Section 4: VIEW for parent metadata
--   - Section 5: ENABLE RLS on all three tables
--   - Section 6: CREATE POLICY statements, grouped by table
--
-- Privacy model summary (to be reviewed by kids-privacy-officer):
--   - journal_entries: athlete-only read AND write. No parent policy.
--     A parent's anon-key client returns zero rows on any SELECT.
--     The athlete_id column is denormalized from athlete_sessions for
--     RLS performance and is enforced consistent by trigger.
--   - athlete_sessions: athlete reads own; parent reads linked athletes'
--     rows. Rows carry timestamps + a catalog_id FK — NO journal content.
--   - training_sessions_catalog: read by every authenticated user
--     (the catalog is shared, not personalised).
--   - Cascading delete chain: auth.users -> profiles -> athlete_sessions
--     -> journal_entries. A parent-initiated "delete my athlete" call
--     propagates automatically.
--
-- Postgres version: 15+ (security_invoker on views requires 15+).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. training_sessions_catalog
--    The 30 authored daily sessions. Static after PR-07 seeds them.
-- ---------------------------------------------------------------------------

create table public.training_sessions_catalog (
  id              uuid        primary key default gen_random_uuid(),
  day_number      integer     not null
                              check (day_number between 1 and 30),
  sport           text        not null default 'hockey',
  title           text        not null,
  mental_skill_md text        not null,
  scripture_ref   text        not null,
  scripture_text  text        not null,
  journal_prompt  text        not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (day_number, sport)
);

comment on table public.training_sessions_catalog is
  'The 30 authored daily training sessions. Sport-agnostic structure; '
  'MVP launches with sport=''hockey''. Read by every authenticated user '
  '(shared catalog). Writes are service-role only — PR-07 will seed.';

comment on column public.training_sessions_catalog.day_number is
  '1..30. Athlete starts at day 1 when they begin and progresses '
  'sequentially. Day numbering is intentionally NOT calendar-date to '
  'avoid shame on missed days — see CLAUDE.md gamification rules.';

comment on column public.training_sessions_catalog.mental_skill_md is
  'Markdown body for the day''s mental-skill teaching. Sport-agnostic '
  'in structure; examples inside may reference hockey for MVP.';

comment on column public.training_sessions_catalog.scripture_ref is
  'NIV reference, e.g. "Romans 8:37". Always cited as required by '
  'CLAUDE.md content voice rules.';

create trigger training_sessions_catalog_set_updated_at
  before update on public.training_sessions_catalog
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. athlete_sessions
--    Per-athlete progress against catalog sessions. One row per
--    (athlete_id, catalog_id). Created when an athlete opens a session;
--    completed_at stamped when they finish.
-- ---------------------------------------------------------------------------

create table public.athlete_sessions (
  id           uuid        primary key default gen_random_uuid(),
  athlete_id   uuid        not null references public.profiles(id) on delete cascade,
  catalog_id   uuid        not null references public.training_sessions_catalog(id) on delete restrict,
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (athlete_id, catalog_id)
);

comment on table public.athlete_sessions is
  'Per-athlete progress against the training catalog. One row per '
  '(athlete, catalog session). Rows carry timestamps and a foreign key '
  'to the catalog row — NO journal content. Athlete reads own rows; '
  'parent reads linked athletes'' rows (metadata-only access by content).';

comment on column public.athlete_sessions.completed_at is
  'Stamped when athlete finishes the session. Null while in progress. '
  'Drives the rhythm visualization (PR-10) and parent-dashboard count.';

-- Index for "give me all sessions for this athlete" (athlete dashboard, RLS).
create index athlete_sessions_athlete_idx on public.athlete_sessions (athlete_id);

-- Index for catalog joins.
create index athlete_sessions_catalog_idx on public.athlete_sessions (catalog_id);

create trigger athlete_sessions_set_updated_at
  before update on public.athlete_sessions
  for each row execute function public.set_updated_at();

-- Role-enforcement trigger: athlete_id must reference a profile with
-- role='athlete'. Same pattern as parent_athlete_links_role_check from
-- the baseline migration.
create or replace function public.check_athlete_session_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role
    from public.profiles
   where id = new.athlete_id;

  if v_role is distinct from 'athlete' then
    raise exception
      'athlete_sessions: athlete_id (%) must reference a profile with role = ''athlete''',
      new.athlete_id;
  end if;

  return new;
end;
$$;

comment on function public.check_athlete_session_role() is
  'Before-insert/update trigger that verifies athlete_id references a '
  'profile with role=athlete. Backstop against a buggy server action.';

create trigger athlete_sessions_role_check
  before insert or update on public.athlete_sessions
  for each row execute function public.check_athlete_session_role();


-- ---------------------------------------------------------------------------
-- 3. journal_entries
--    Athlete-private reflection text, 1:1 with athlete_sessions.
--    **Parent has NO read policy on this table.** This is the hard
--    privacy boundary called out in CLAUDE.md.
--
--    The athlete_id column is DENORMALIZED from athlete_sessions for
--    two reasons: (a) RLS policy performance — single-column index lookup
--    avoids a join; (b) defense-in-depth so a future bug that misroutes
--    a journal entry to the wrong session row can't silently leak content
--    cross-athlete (the trigger below enforces consistency).
-- ---------------------------------------------------------------------------

create table public.journal_entries (
  id                 uuid        primary key default gen_random_uuid(),
  athlete_session_id uuid        not null unique
                                 references public.athlete_sessions(id) on delete cascade,
  athlete_id         uuid        not null
                                 references public.profiles(id) on delete cascade,
  content            text        not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.journal_entries is
  'Athlete-private reflection text, 1:1 with athlete_sessions. **Parent '
  'has NO read policy.** Anon-key clients owned by parents return zero '
  'rows on any SELECT. Safety keyword detection (PR-06) reads via '
  'service-role server actions only. athlete_id is denormalized from '
  'athlete_sessions for RLS performance + defense-in-depth (trigger '
  'enforces consistency).';

comment on column public.journal_entries.content is
  'Free-text reflection. Subject to safety keyword detection at write '
  'time (PR-06). Never surfaced to parent or any third party. Event '
  'logged on detection (event only, never content) per CLAUDE.md '
  'Journal Safety Architecture (Option C).';

-- Index for RLS (athlete_id is the predicate) + "give me my entries".
create index journal_entries_athlete_idx on public.journal_entries (athlete_id);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- Denormalization integrity trigger: journal_entries.athlete_id must
-- match athlete_sessions.athlete_id for the same athlete_session_id.
-- Without this trigger, a buggy insert could write athlete_id=X with
-- athlete_session_id=Y where Y belongs to a different athlete, and
-- the RLS policy on athlete_id would silently misroute the row.
create or replace function public.check_journal_entry_consistency()
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
      'journal_entries: athlete_session_id (%) does not exist',
      new.athlete_session_id;
  end if;

  if v_session_athlete <> new.athlete_id then
    raise exception
      'journal_entries: athlete_id (%) does not match athlete_sessions.athlete_id (%) for athlete_session_id (%)',
      new.athlete_id, v_session_athlete, new.athlete_session_id;
  end if;

  return new;
end;
$$;

comment on function public.check_journal_entry_consistency() is
  'Before-insert/update trigger that verifies the denormalized athlete_id '
  'on journal_entries matches the athlete_id on the linked athlete_sessions '
  'row. Defense-in-depth so a buggy server action cannot misroute a '
  'journal entry to the wrong athlete.';

create trigger journal_entries_consistency_check
  before insert or update on public.journal_entries
  for each row execute function public.check_journal_entry_consistency();


-- ---------------------------------------------------------------------------
-- 4. athlete_session_metadata VIEW
--    Aggregate-only view for the parent dashboard. Returns
--    (athlete_id, sessions_started, sessions_completed, last_completed_at).
--    NEVER returns content.
--
--    security_invoker = true means the view runs with the caller's
--    permissions, so RLS on athlete_sessions applies. A parent calling
--    this view sees only their linked athletes' aggregates because of
--    the parent-linked SELECT policy on athlete_sessions below.
-- ---------------------------------------------------------------------------

create view public.athlete_session_metadata
  with (security_invoker = true)
  as
  select
    athlete_id,
    count(*) as sessions_started,
    count(*) filter (where completed_at is not null) as sessions_completed,
    max(completed_at) as last_completed_at
  from public.athlete_sessions
  group by athlete_id;

comment on view public.athlete_session_metadata is
  'Aggregate-only view for parent dashboard. Returns counts and '
  'last-completed timestamp per athlete. NEVER returns content. '
  'security_invoker=true so RLS on athlete_sessions applies — parents '
  'see only their linked athletes; athletes see only themselves.';


-- ===========================================================================
-- 5. ROW LEVEL SECURITY — enable on all three tables.
--    (Views inherit RLS from underlying tables when security_invoker=true.)
-- ===========================================================================

alter table public.training_sessions_catalog enable row level security;
alter table public.athlete_sessions          enable row level security;
alter table public.journal_entries           enable row level security;


-- ===========================================================================
-- 6. POLICIES — grouped by table.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 6a. training_sessions_catalog
--    Catalog is shared content — every authenticated user can read.
--    No client writes.
-- ---------------------------------------------------------------------------

create policy "training_sessions_catalog_select_authenticated"
  on public.training_sessions_catalog
  for select
  to authenticated
  using (true);

-- No INSERT / UPDATE / DELETE policies. Service role bypasses RLS and is
-- the only writer (PR-07 will seed the 30 rows).


-- ---------------------------------------------------------------------------
-- 6b. athlete_sessions
--    - Athlete reads + writes own rows.
--    - Parent reads linked athletes' rows (metadata only — see view).
--    - No client DELETE; cascade via profile delete handles cleanup.
-- ---------------------------------------------------------------------------

-- Own-row read: athlete sees own progress.
create policy "athlete_sessions_select_own"
  on public.athlete_sessions
  for select
  to authenticated
  using (athlete_id = auth.uid());

-- Parent-linked read: parent sees linked athletes' progress rows.
-- This is the policy that makes athlete_session_metadata work for parents.
-- Rows expose timestamps + catalog_id only — never journal content
-- (journal_entries has no parent policy).
create policy "athlete_sessions_select_linked_parent"
  on public.athlete_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.parent_athlete_links pal
      where pal.athlete_id = athlete_sessions.athlete_id
        and pal.parent_id  = auth.uid()
    )
  );

-- Own-row insert: athlete creates their own progress rows.
create policy "athlete_sessions_insert_own"
  on public.athlete_sessions
  for insert
  to authenticated
  with check (athlete_id = auth.uid());

-- Own-row update: athlete can mark their own row complete (or update
-- other future fields). Parent cannot write.
create policy "athlete_sessions_update_own"
  on public.athlete_sessions
  for update
  to authenticated
  using  (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

-- No client DELETE policy.


-- ---------------------------------------------------------------------------
-- 6c. journal_entries
--    Athlete-only. No parent policy. No public catalog read.
--    This is the hardest privacy boundary in the schema.
-- ---------------------------------------------------------------------------

-- Own-row read: ONLY the athlete. Parents cannot read journal content.
create policy "journal_entries_select_own"
  on public.journal_entries
  for select
  to authenticated
  using (athlete_id = auth.uid());

-- Own-row insert: ONLY the athlete writes their own entries.
create policy "journal_entries_insert_own"
  on public.journal_entries
  for insert
  to authenticated
  with check (athlete_id = auth.uid());

-- Own-row update: athletes can edit their own entries (timestamps update
-- via trigger). No parent or other-athlete write.
create policy "journal_entries_update_own"
  on public.journal_entries
  for update
  to authenticated
  using  (athlete_id = auth.uid())
  with check (athlete_id = auth.uid());

-- No client DELETE policy. Cascade via athlete_sessions / profile delete.
-- No parent policy. No service-role-bypass policy needed (service role
-- bypasses RLS entirely). Safety detection (PR-06) is service-role.
