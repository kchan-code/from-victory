-- =============================================================================
-- RLS harness fixtures (FV-166)
--
-- Seeds a minimal, deterministic fixture graph used by the role-scoped RLS
-- assertions in ./assertions/*.sql. Runs as the local superuser login role
-- (`postgres`), which BYPASSES RLS — so this file does NOT exercise any
-- policy; it only establishes the data the assertions then read back as
-- the `authenticated` / `anon` roles.
--
-- Fixture graph
-- -------------
--   PARENT         P  — role=parent, owns a subscription, linked to athlete A only
--   ATHLETE        A  — role=athlete, 1 completed session + 1 journal entry + 1 safety_event
--   ATHLETE        B  — role=athlete, 1 started session + 1 journal entry (NOT linked to P)
--   ADULT_ATHLETE AA  — role=adult_athlete (FV-325/18+ self-serve), 18+, own subscription
--                       row (payer = self), NO parent_athlete_links row on either side
--                       (an adult_athlete is never a parent's linked athlete and never
--                       links to anyone as a parent). Added FV-443 for the RLS harness's
--                       adult_athlete-vs-athlete boundary assertions
--                       (assertions/18_adult_athlete_boundary.sql).
--
-- The "P linked to A but NOT B" shape lets the assertions prove the
-- parent-linked read path (athlete_sessions / metadata view) without ever
-- granting the parent reach into journal content.
--
-- Idempotent: every insert is guarded with ON CONFLICT DO NOTHING so the
-- harness can be re-run against a persistent local stack.
--
-- Fixed UUIDs (documented so assertions/*.sql can reference them by sight):
--   PARENT         10000000-0000-4000-8000-000000000001
--   ATHLETE_A      20000000-0000-4000-8000-00000000000a
--   ATHLETE_B      20000000-0000-4000-8000-00000000000b
--   ASESS_A        40000000-0000-4000-8000-00000000000a
--   ASESS_B        40000000-0000-4000-8000-00000000000b
--   JOURNAL_A      50000000-0000-4000-8000-00000000000a
--   JOURNAL_B      50000000-0000-4000-8000-00000000000b
--   SAFETY_A       60000000-0000-4000-8000-00000000000a
--   ADULT_ATHLETE  70000000-0000-4000-8000-000000000001
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- auth.users — required because public.profiles.id references auth.users(id).
-- Minimal column set; tokens/metadata default to '' / '{}' in the local
-- GoTrue schema. We never sign in as these users — the assertions inject
-- `request.jwt.claims` directly — so password/identity columns are inert.
-- ---------------------------------------------------------------------------
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'parent@rls.test',   '{}', '{}', now(), now()),
  ('20000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'athlete-a@rls.test', '{}', '{}', now(), now()),
  ('20000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'athlete-b@rls.test', '{}', '{}', now(), now()),
  ('70000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'adult-athlete@rls.test', '{}', '{}', now(), now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- A later migration (20260602000000_athlete_sport) requires athlete rows to
-- carry a sport in ('hockey','basketball') and parent rows to have sport NULL
-- (sport_role_consistency + sport_valid_values). A and B use different sports
-- so the harness exercises both launch sports.
-- ADULT_ATHLETE (AA) is role='adult_athlete' (FV-325, 18+ self-serve): payer
-- AND trainee on one account, birthdate satisfies adult_athlete_min_age_18
-- (>= 18 years before today), sport required (sport_role_consistency).
insert into public.profiles (id, role, first_name, birthdate, sport)
values
  ('10000000-0000-4000-8000-000000000001', 'parent',        'Parent', null,                null),
  ('20000000-0000-4000-8000-00000000000a', 'athlete',       'Ava',    date '2010-01-01',   'hockey'),
  ('20000000-0000-4000-8000-00000000000b', 'athlete',       'Ben',    date '2010-02-02',   'basketball'),
  ('70000000-0000-4000-8000-000000000001', 'adult_athlete', 'Alex',   date '2000-03-15',   'golf')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- parent_athlete_links — P is linked to A ONLY (deliberately not to B, and
-- deliberately never to ADULT_ATHLETE — check_parent_athlete_link_roles()
-- would reject any row referencing AA on either side; see FV-443
-- assertions/18_adult_athlete_boundary.sql, which asserts that rejection
-- directly rather than seeding it here).
-- ---------------------------------------------------------------------------
insert into public.parent_athlete_links (parent_id, athlete_id)
values
  ('10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-00000000000a')
on conflict (parent_id, athlete_id) do nothing;

-- ---------------------------------------------------------------------------
-- athlete_sessions — A completed, B started (drives metadata aggregates).
--
-- We do NOT insert our own training_sessions_catalog row: the catalog is
-- already seeded by the day-1..30 seed migrations, and day_number is
-- constrained to 1..30 with a unique(day_number, sport) — so any literal we
-- pick would collide. Instead both sessions reference an existing seeded
-- catalog row via subquery (the lowest day, deterministic). The catalog
-- sport need not match the athlete's sport — no constraint links them, and
-- the RLS boundaries under test are sport-agnostic.
-- ---------------------------------------------------------------------------
insert into public.athlete_sessions (id, athlete_id, catalog_id, started_at, completed_at)
values
  ('40000000-0000-4000-8000-00000000000a', '20000000-0000-4000-8000-00000000000a',
   (select id from public.training_sessions_catalog order by day_number, sport limit 1), now(), now()),
  ('40000000-0000-4000-8000-00000000000b', '20000000-0000-4000-8000-00000000000b',
   (select id from public.training_sessions_catalog order by day_number, sport limit 1), now(), null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- journal_entries — the hard privacy boundary. One per athlete; content is
-- a recognisable sentinel so an assertion can prove a leak by value, not
-- just by row count.
-- ---------------------------------------------------------------------------
insert into public.journal_entries (id, athlete_session_id, athlete_id, content)
values
  ('50000000-0000-4000-8000-00000000000a', '40000000-0000-4000-8000-00000000000a',
   '20000000-0000-4000-8000-00000000000a', 'ATHLETE_A_PRIVATE_JOURNAL'),
  ('50000000-0000-4000-8000-00000000000b', '40000000-0000-4000-8000-00000000000b',
   '20000000-0000-4000-8000-00000000000b', 'ATHLETE_B_PRIVATE_JOURNAL')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- subscriptions — P's billing row (status active).
--
-- ADULT_ATHLETE (AA) also gets its OWN subscriptions row: post-FV-325,
-- subscriptions.parent_id means "the payer account" (parent OR adult_athlete
-- profile id) — an adult_athlete is its own payer. Used by
-- assertions/18_adult_athlete_boundary.sql to prove AA can read its own row
-- but not P's, and vice versa.
-- ---------------------------------------------------------------------------
insert into public.subscriptions
  (parent_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end)
values
  ('10000000-0000-4000-8000-000000000001', 'cus_rls_test', 'sub_rls_test',
   'active', 'price_monthly_899', now() + interval '30 days'),
  ('70000000-0000-4000-8000-000000000001', 'cus_rls_test_adult', 'sub_rls_test_adult',
   'active', 'price_monthly_899', now() + interval '30 days')
on conflict (parent_id) do nothing;

-- ---------------------------------------------------------------------------
-- device_pairings — service-role-only table. Hashed code for A, issued by P.
-- (Trigger enforces P=parent, A=athlete, and the P→A link exists.)
-- FV-177: device_pairings stores sha256(code) hex in code_sha256, not plaintext.
-- ---------------------------------------------------------------------------
insert into public.device_pairings (code_sha256, athlete_id, created_by, expires_at)
values
  (encode(sha256('RLS_TEST_CODE_A'::bytea), 'hex'),
   '20000000-0000-4000-8000-00000000000a',
   '10000000-0000-4000-8000-000000000001', now() + interval '1 day')
on conflict (code_sha256) do nothing;

-- ---------------------------------------------------------------------------
-- safety_events — service-role-only table. One event for A.
-- ---------------------------------------------------------------------------
insert into public.safety_events (id, athlete_id, athlete_session_id, category)
values
  ('60000000-0000-4000-8000-00000000000a', '20000000-0000-4000-8000-00000000000a',
   '40000000-0000-4000-8000-00000000000a', 'crisis')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- activity_events — service-role-only table. One event for A (id is
-- generated-always identity, so it is not specified here).
-- ---------------------------------------------------------------------------
-- Identity PK has no natural conflict key, so guard re-runs with NOT EXISTS
-- (keeps the file idempotent against a persistent local stack, like the others).
insert into public.activity_events (athlete_id, event_name, surface, sport)
select '20000000-0000-4000-8000-00000000000a', 'app_open', 'hub', 'hockey'
where not exists (
  select 1 from public.activity_events
  where athlete_id = '20000000-0000-4000-8000-00000000000a'
    and event_name = 'app_open'
);

-- ---------------------------------------------------------------------------
-- activity_rollup — service-role-only AGGREGATE table (FV-415). No athlete_id,
-- no PII: only grain / period_start / event_name / counts. Seeds BOTH row
-- shapes the rollup produces so assertions/reads exercise each:
--   - one all-events row (event_name IS NULL) = the exact DAU/WAU/MAU headline;
--   - one per-event row  (event_name = 'app_open') = per-event volume/active.
-- NULLS-NOT-DISTINCT unique key on (grain, period_start, event_name); the
-- explicit conflict target keeps this idempotent against a persistent stack
-- (a bare `on conflict do nothing` cannot infer a NULLS-NOT-DISTINCT arbiter
-- for the NULL-event_name row).
-- ---------------------------------------------------------------------------
insert into public.activity_rollup
  (grain, period_start, event_name, active_athletes, event_count)
values
  ('day', current_date - 1, null,       1, 3),  -- all-events (DAU) headline
  ('day', current_date - 1, 'app_open', 1, 3)   -- per-event volume/active
on conflict (grain, period_start, event_name) do nothing;

commit;

\echo 'RLS fixtures seeded.'
