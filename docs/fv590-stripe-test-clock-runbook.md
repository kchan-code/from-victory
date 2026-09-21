# FV-590 — Stripe test-clock runbook (D3 real-provider evidence)

Owner: backend-engineer. Purpose: get real Stripe TEST-MODE evidence for
FV-586's D3 decision (KC, 2026-09-17) — the trial-to-family explicit
confirmation in `apps/web/lib/actions/athletes.ts`'s `createAthlete`, which
runs, verbatim:

```ts
await stripe.subscriptions.update(trialConversionState.stripeSubscriptionId, {
  trial_end: "now",
  items: [{ id: item.id, quantity: trialConversionState.currentAthleteCount + 1 }],
  payment_behavior: "error_if_incomplete",
});
```

**before** creating the athlete row. The harness (`apps/web/scripts/stripe-test-clock-d3.ts`)
proves this call's real invoice/payment/subscription outcomes against actual
Stripe TEST MODE using a Stripe test clock — not a mock. Mocks are only used
in the harness's own unit tests
(`apps/web/__tests__/scripts/stripe-test-clock-d3.test.ts`).

## Prerequisites

The **only** thing you need beyond a normal repo checkout:

1. A Stripe **TEST-MODE** secret key (starts `sk_test_`) from the FromVictory
   Stripe account (Dashboard → Developers → API keys, "Test mode" toggle ON).
   Live keys are refused by construction — see Guards below.
2. Create `apps/web/.env.stripe-test` (git-ignored, never commit it):
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
   Nothing else is required. The harness never touches Supabase, never reads
   `NEXT_PUBLIC_SUPABASE_URL` for anything but a safety refusal, and never
   imports a Supabase client.

No live Stripe key may ever be used with this script, on this machine or any
other — it is scoped to TEST MODE only.

## Commands (from `apps/web/`)

```bash
# Preview the plan — no key needed, no network call, exits 0.
npm run stripe:test-clock:d3 -- --dry-run

# Real run against Stripe TEST MODE (requires apps/web/.env.stripe-test).
npm run stripe:test-clock:d3

# Also probe the documented 3DS limitation (Scenario C, informational).
npm run stripe:test-clock:d3 -- --with-3ds
```

## Guards (dormant-safe by construction)

| Condition | Behavior |
|---|---|
| `STRIPE_SECRET_KEY` missing or doesn't start with `sk_test_` | Exit 2, no network call. Message: `Prerequisite: a Stripe TEST-MODE secret key (sk_test_…) in apps/web/.env.stripe-test as STRIPE_SECRET_KEY. Live keys are refused.` |
| `NEXT_PUBLIC_SUPABASE_URL` points at `*.supabase.co` | Exit 2, no network call. The harness never touches Supabase either way — this is a defensive tripwire against running in a production-shaped environment by mistake. |
| `--dry-run` passed | Prints the plan and exits 0. Checked **first**, before either guard above — dry-run makes no network call and reads no secret, so it is safe to run on a machine with no Stripe key configured at all (this is how the script was developed and smoke-tested without ever holding a live or test key). |

## What the real run does

1. Cleans up any stale `fv590-d3-*` test clocks / `FV-590 D3 harness`
   products left over from an interrupted previous run (idempotent rerun).
2. Creates a fresh Stripe test clock frozen at "now".
3. Creates product `FV-590 D3 harness` + one graduated monthly price mirroring
   the approved economics: tier 1 (`up_to: 1`) = $5.00, tier 2 (`up_to: "inf"`)
   = $3.00/seat.
4. **Scenario A (success):** customer on the clock with `pm_card_visa` as the
   default payment method → 7-day-trial subscription at quantity 1 → the
   exact D3 update at quantity 2 → asserts `status: "active"`,
   `trial_end <= now`, `quantity: 2`, `latest_invoice.status: "paid"`,
   `latest_invoice.amount_paid: 800`, `latest_invoice.payment_intent.status:
   "succeeded"`, and exactly one paid invoice of 800 cents for the customer.
5. **Scenario B (decline):** a fresh customer on the **same** clock with
   `pm_card_chargeDeclined` → same trialing subscription → same D3 update →
   asserts the update **throws** a `StripeCardError` (HTTP 402), and that the
   subscription is left untouched (`status: "trialing"`, `quantity: 1`,
   `trial_end` unchanged) with no paid invoice for that customer.
6. **Scenario C (`--with-3ds`, optional):** a fresh customer with
   `pm_card_authenticationRequired` → same D3 update → expects a refusal,
   documenting the known limitation that `payment_behavior:
   "error_if_incomplete"` does not support a 3DS authentication challenge
   (see the module doc in `lib/actions/athletes.ts`). Informational — not a
   regression check on our own code, and not required to pass the overall
   run.
7. **Cleanup, always** (`try`/`finally`, runs even if an assertion fails):
   deletes the test clock (cascades its customers, subscriptions, and
   invoices) and deactivates the price and product.

Evidence is printed as a compact block per scenario: shortened object ids
(first 8 chars + `…`), ISO timestamps, amounts in cents, and a final
PASS/FAIL per scenario plus an overall verdict. The script never logs the
Stripe secret key and never writes to Supabase.

## Manual step — NOT automated here: proving the app's own D3 path end-to-end

The script above proves Stripe's real behavior for the exact D3 API call in
isolation. It does **not** exercise `apps/web/lib/actions/athletes.ts` itself
(that server action re-derives the parent from the session and reads/writes
`public.subscriptions` — wiring it to a synthetic Stripe subscription without
running the actual app UI/DB would not be meaningfully different from the
Vitest-level tests that already exist for it). To see the D3 path exercised
through the real app, run this manually:

1. Run the app locally with `apps/web/.env.stripe-test`'s key as
   `STRIPE_SECRET_KEY` (do **not** point `NEXT_PUBLIC_SUPABASE_URL` at a live
   project — use your local/dev Supabase instance).
2. Seed a parent account whose `public.subscriptions` row has
   `status: "trialing"` and a `stripe_subscription_id` matching a real Stripe
   test-mode trialing subscription (e.g. one created by Scenario A's setup
   code, before its D3 update — you can pause the script with a breakpoint,
   or just create one by hand in the Stripe Dashboard test mode with the
   same one-item structure and a `pm_card_visa` default payment method) and
   `current_athlete_count: 1`.
3. In the app, add a second athlete for that parent. The frontend
   (`components/dashboard/AthleteForm.tsx`) should surface the trial-ending
   confirmation and, once the parent explicitly confirms
   (`trialConversionConfirmed: "true"`), submit. Expect: the Stripe
   subscription converts (as Scenario A proved) and the athlete row is
   created.
4. Repeat with a parent/subscription pointed at a **declined** customer
   (`pm_card_chargeDeclined`, per Scenario B). Expect: `createAthlete`
   returns `{ ok: false, error: "trial_conversion_payment_failed" }`, the
   Stripe subscription is left untouched, and **no** athlete row is created.

This manual pass is the app-integration complement to the script's
provider-level evidence — record its outcome in the FV-590 issue/PR, but it
is not something this script automates.

## What remains impossible without a real key

This machine has no Stripe test-mode key installed, and none may be added
per this task's constraints. Everything above the "Manual step" section
(the actual Scenario A/B/C network calls and their real Stripe evidence) has
**not** been executed here — it is correct by construction and covered by
the harness's own guard/assertion unit tests (mocked Stripe client), but the
real provider evidence itself still needs to be captured by whoever holds
the test-mode key, using the commands in this runbook.
