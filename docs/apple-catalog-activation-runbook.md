# Apple catalog activation runbook (FV-597)

Before setting `APPLE_CATALOG_ACTIVE=1` in production, run this checklist.

## Why this matters

FV-596 made every Apple decision accessor (`getAppleAccessLevelForPayer`,
`getActiveAppleProductIdResult` / `getActiveAppleProductId`, and the
`getDisplayedAppleProductIdResult` alias) honor the `apple_sandbox_testers`
allowlist consistently — a Sandbox `apple_subscriptions` row now grants real
access (entitlement, capacity ceiling, seat state, subscribe-button guard,
trial-conversion, status display) for any allowlisted payer, not just at the
entitlement gate. That is correct behavior for App Review and internal QA
against the production backend (record §4.9).

The flip side: `apple_sandbox_testers` is a flat, hand-maintained allowlist
with no expiry and no automatic reconciliation against real billing state. A
stale entry — a QA payer who has since become (or already is) a real paying
family — would let a Sandbox row feed real decision surfaces for that payer,
including the athlete-capacity ceiling and the FV-585 seat-pause mechanics.
Concretely: a stale allowlist row on a real paying family's `payer_id` could
let a leftover test Sandbox subscription silently override or interact with
their genuine Stripe or Production-Apple entitlement in the capacity/seat
math. Before activating the Apple catalog for real customers, verify the
allowlist contains only rows that are still supposed to be there.

## Checklist

1. **List `apple_sandbox_testers`.**

   ```sql
   select payer_id, note, added_at
   from apple_sandbox_testers
   order by added_at;
   ```

2. **Confirm no allowlisted `payer_id` also holds a Production
   `apple_subscriptions` row (any status) or an active Stripe subscription.**
   See the read-only check query below — it should return zero rows. Any row
   it does return means that payer is both allowlisted for Sandbox AND has
   real billing state, which needs manual reconciliation (probably: remove
   the allowlist entry) before activation.

3. **Remove QA entries no longer needed.** Any row whose `note` documents an
   internal QA payer or a one-off test flow that's finished its purpose gets
   deleted.

4. **Keep only the App Review account(s) for the review window, and remove
   them after approval.** Apple's reviewer needs Sandbox access for the
   review pass; that allowlist entry should not remain indefinitely once the
   build is approved.

## Read-only check — allowlisted payer with real billing state

Table/column names are sourced from `supabase/migrations/`:
- `apple_sandbox_testers` (`payer_id`, `note`, `added_at`) —
  `20260911120000_apple_provider_access.sql`
- `apple_subscriptions` (`payer_id`, `environment`, `status`) — same
  migration; `environment` is `'Sandbox' | 'Production'`
- `subscriptions` (Stripe mirror; `parent_id`, `status`) —
  `20260520200000_baseline_profiles_links_subscriptions.sql`; active statuses
  are `'active'` and `'trialing'` (see that table's comment / CLAUDE.md)

Run with a service-role connection (this reads through RLS-protected tables
that have no client SELECT policy for `apple_sandbox_testers` /
`apple_subscriptions` other-payer rows):

```sql
select
  t.payer_id,
  t.note,
  bool_or(aps.environment = 'Production') as has_production_apple_row,
  bool_or(s.status in ('active', 'trialing')) as has_active_stripe_row
from apple_sandbox_testers t
left join apple_subscriptions aps
  on aps.payer_id = t.payer_id and aps.environment = 'Production'
left join subscriptions s
  on s.parent_id = t.payer_id and s.status in ('active', 'trialing')
group by t.payer_id, t.note
having bool_or(aps.environment = 'Production')
    or bool_or(s.status in ('active', 'trialing'));
```

**Expected result: zero rows.** Any row returned identifies an allowlisted
payer whose Sandbox membership needs review before activation.

Verified executable (read-only, local dev DB, 2026-09-25):

```
$ psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -Atc "<query above>"
(no rows)
```

Both current local allowlist entries (a KC TestFlight QA payer and a D3
trial-eligible test payer, per `20260911120000_apple_provider_access.sql`'s
seeding-free design — these were added operationally, not via migration) hold
only Sandbox `apple_subscriptions` rows and no Stripe subscription, so the
check correctly returns nothing today.

## Prepared production allowlist changes — REVIEW ONLY, NOT APPLIED

**Production currently has no `apple_sandbox_testers` table at all** —
migration `20260911120000_apple_provider_access.sql` is not yet on `main`
(FV-570 is a local/beta-only foundation slice as of this writing). The SQL
below is prepared for reference and is **not applied by this document**. It
only makes sense to run after the FV-210 migrations (including
`20260911120000_apple_provider_access.sql`) have landed on `main` and been
pushed to production, and should run immediately before flipping
`APPLE_CATALOG_ACTIVE=1`.

```sql
-- 1. Remove QA rows no longer needed for production activation.
--    Replace the payer_id list with the actual QA rows to retire.
delete from apple_sandbox_testers
where payer_id in (
  '<qa_payer_id_1>',
  '<qa_payer_id_2>'
);

-- 2. Insert the App Review account for the review window only.
--    Remove this row again once the build is approved (step 4 above).
insert into apple_sandbox_testers (payer_id, note)
values (
  '<app_review_payer_id>',
  'App Review account — review window only, remove after approval'
)
on conflict (payer_id) do update
  set note = excluded.note;
```

Do not run either statement against production until: (a) the FV-210
migrations are live on `main`/production, and (b) the read-only check above
has been re-run against production and returns zero rows (or every returned
row has been manually reconciled).
