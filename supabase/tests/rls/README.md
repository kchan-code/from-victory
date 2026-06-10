# RLS verification harness (FV-166)

Machine-verifies the From Victory minor-data privacy boundaries **against a
real Postgres** with Row Level Security enabled. This is the test that makes
CLAUDE.md's #1 non-negotiable — _"journal entries are athlete-only readable,
RLS enforced at the DB level"_ — fail CI instead of shipping silently.

## What it asserts

Run as role-scoped clients against a freshly-migrated local Supabase:

| AC  | Boundary |
|-----|----------|
| (a) | athlete A cannot SELECT athlete B's `journal_entries` rows |
| (b) | parent (and anon) cannot SELECT `journal_entries` at all |
| (c) | `athlete_session_metadata` returns aggregates only — column set is pinned, and parents see only linked athletes' aggregates, never content |
| (d) | client roles cannot INSERT or UPDATE `subscriptions` (and athletes can't read them) |
| (e) | `device_pairings` not readable by any client role (cross-user or own) |
| (f) | `safety_events` unreadable by both athlete and parent roles |

## Why plain SQL (not supabase-js / pgTAP)

The harness sets two pieces of session state per check:

```sql
set local request.jwt.claims to '{"sub":"<user-uuid>","role":"authenticated"}';
set local role authenticated;   -- or `anon`
```

This is **exactly the session state PostgREST establishes after it verifies a
JWT** — `auth.uid()` reads `request.jwt.claims->>'sub'`, and the `authenticated`
/ `anon` DB role carries the same table grants. So RLS and column/table grants
are exercised identically to the production request path, with **no
JWT-signing, no supabase-js version coupling, and no node/app build** in the
job. It is the simplest thing to maintain that still tests the real policy
layer.

What it intentionally does **not** cover: PostgREST HTTP behaviour (resource
embedding, RPC, the `Accept` profile). Those are not RLS and are out of scope
for this harness.

`pgTAP` was considered; its in-transaction role-reset semantics fight the
per-role transaction structure here, and it adds an extension dependency for no
extra coverage.

## Layout

```
supabase/tests/rls/
├── fixtures.sql           # deterministic seed graph (parent P, athletes A & B, …)
├── assertions/
│   ├── 01_journal_entries.sql   # AC a, b
│   ├── 02_metadata_view.sql     # AC c
│   ├── 03_subscriptions.sql     # AC d
│   ├── 04_device_pairings.sql   # AC e
│   └── 05_safety_events.sql     # AC f
├── run.sh                 # seeds fixtures, then runs every assertions/*.sql
└── README.md
```

`run.sh` runs each file under `psql -v ON_ERROR_STOP=1`, so the first failed
`assert` (SQLSTATE `P0004`) exits non-zero and turns the job red.

## Extending (FV-171 column-restriction assertions)

Drop a new `assertions/NN_*.sql` file in — `run.sh` globs the directory in
sorted order, so no wiring is needed. Column-level checks have a ready seam in
`02_metadata_view.sql` (the structural `information_schema.columns` pin).

## Running it

**In CI:** the `rls` job in `.github/workflows/ci.yml` runs `supabase start` →
`supabase db push --local` → `run.sh "$DB_URL"`. It is a **separate job** from
the Playwright E2E suite so a flaky browser test can never mask an RLS failure.

**Locally** (needs Docker + the Supabase CLI):

```bash
supabase start
supabase db push --local
supabase/tests/rls/run.sh    # uses the default local DB_URL
```

## Negative control

The harness is only meaningful if it has been seen red. To re-verify it can
fail, deliberately break a policy — e.g. add a parent SELECT policy to
`journal_entries` — and confirm AC(b) fails the job, then revert. The original
red run for this harness is linked in the FV-166 PR.
