-- =============================================================================
-- Migration: 20260812000000_seed_training_sessions_lacrosse_days_1_30.sql  (FV-407)
--
-- Purpose (lacrosse go-live, KC founder sign-off 2026-08-11):
--   Seed lacrosse's 30 daily training rows into public.training_sessions_catalog
--   so the catalog has (day_number, sport='lacrosse') coverage for days 1-30,
--   matching every other launched/dormant sport.
--
-- Why a mechanical copy, not fresh authoring:
--   Per the FV-430 sport-agnostic model (20260719120000_daily_content_sport_
--   agnostic.sql header, "Future sports = mechanical 30-row copy of any
--   existing sport's rows"), the daily training arc's title / mental_skill_md
--   / journal_prompt are set IDENTICAL across every sport's row for a given
--   day_number — the UPDATE in that migration and the follow-up age-neutral
--   pass (20260721010000_daily_content_age_neutral_lines.sql) both ran with
--   NO sport filter, so hockey's rows are byte-identical to every other
--   sport's rows for the same day_number. scripture_ref / scripture_text were
--   already verbatim-identical 30/30 across all sport sets even before FV-430.
--   That means any source sport is equivalent for this seed — hockey is
--   chosen only because it is the original master row set (first authored,
--   PR-05/PR-07), not because it carries anything lacrosse-specific.
--
--   A future FV-430-family content UPDATE with no sport filter (the
--   established pattern) will continue to cover these newly-seeded lacrosse
--   rows automatically — no separate lacrosse content-maintenance path is
--   needed going forward.
--
-- Column list (verified against 20260522000749_content_schema.sql, the
--   original CREATE TABLE, and grepped for every later
--   `alter table ... training_sessions_catalog` — there are none that add,
--   drop, or rename a column):
--     id              uuid        primary key default gen_random_uuid()
--     day_number      integer     not null check (day_number between 1 and 30)
--     sport           text        not null default 'hockey'
--     title           text        not null
--     mental_skill_md text        not null
--     scripture_ref   text        not null
--     scripture_text  text        not null
--     journal_prompt  text        not null
--     created_at      timestamptz not null default now()
--     updated_at      timestamptz not null default now()
--     unique (day_number, sport)
--   Every NOT NULL column with no usable default (day_number, sport, title,
--   mental_skill_md, scripture_ref, scripture_text, journal_prompt) is
--   included explicitly below. id / created_at / updated_at are left to
--   their defaults, matching every prior seed migration's convention.
--
-- Idempotency:
--   Single INSERT ... SELECT ... ON CONFLICT (day_number, sport) DO NOTHING,
--   keyed on the same unique constraint as every other seed migration —
--   safe to re-run.
--
-- RLS (verified — no sport-scoped policy exists or is needed):
--   training_sessions_catalog RLS is unchanged since 20260522000749
--   (content_schema.sql): `training_sessions_catalog_select_authenticated`
--   is `for select to authenticated using (true)` — every authenticated
--   user (parent or athlete, any sport) can read every catalog row
--   regardless of sport. There is no per-sport read restriction anywhere
--   in the migration history (grepped all migrations touching this table
--   for policy/RLS changes — content_schema.sql is the only one). No RLS
--   change is required or made by this migration. Writes remain service-
--   role-only (no INSERT/UPDATE/DELETE policy exists for any role).
--
-- Safety / risk:
--   Additive only — a pure INSERT of net-new (day_number, sport='lacrosse')
--   rows. Cannot orphan or alter any existing row (no UPDATE/DELETE).
--   Grepped supabase/migrations/**/*.sql for "lacrosse" before writing this:
--   zero prior hits, confirming lacrosse currently has no
--   training_sessions_catalog rows at all — this migration is the first.
--
-- Order (FV-407 go-live PR chain):
--   Merges after FV-406 (dormant lacrosse wiring) and the lacrosse render,
--   and before/with the SUPPORTED_SPORTS flip + this file's companion
--   migration, 20260812010000_lacrosse_db_enablement.sql (which widens
--   sport_valid_values + profiles_position_values). Content seeding here
--   is independent of and does not require that companion migration —
--   sport is unconstrained `text` on this table (no CHECK), so lacrosse
--   rows are insertable regardless of ordering between the two files.
-- =============================================================================

begin;

insert into public.training_sessions_catalog
  (day_number, sport, title, mental_skill_md, scripture_ref, scripture_text, journal_prompt)
select
  day_number, 'lacrosse', title, mental_skill_md, scripture_ref, scripture_text, journal_prompt
from public.training_sessions_catalog
where sport = 'hockey'
on conflict (day_number, sport) do nothing;

commit;
