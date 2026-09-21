#!/usr/bin/env node
// FV-590 — Stripe TEST-MODE test-clock harness for D3 real-provider evidence.
//
// PURPOSE (KC 2026-09-21): `lib/actions/athletes.ts`'s `createAthlete` runs
// `stripe.subscriptions.update(subId, { trial_end: "now", items: [{ id:
// item.id, quantity: N+1 }], payment_behavior: "error_if_incomplete" })`
// BEFORE creating the athlete row — the FV-586 "D3" trial-to-family explicit
// confirmation. This script proves that call's real behavior against actual
// Stripe TEST MODE (not a mock): a Stripe test clock lets us fast-forward a
// real trialing subscription to "day 7" instantly and exercise the exact
// invoice/payment/subscription outcomes, including a genuine card decline.
// Mocks are appropriate for THIS repo's unit tests (see the companion
// __tests__/scripts/stripe-test-clock-d3.test.ts) — never as a substitute for
// provider evidence in the harness itself.
//
// DORMANT-SAFE BY CONSTRUCTION:
//   - Refuses to run (exit 2, no network call) unless STRIPE_SECRET_KEY
//     starts with "sk_test_" or "rk_test_" (a restricted TEST-MODE key is
//     preferred — least privilege). Any live key is refused outright.
//   - Refuses to run (exit 2, no network call) if NEXT_PUBLIC_SUPABASE_URL
//     points at a live Supabase project (*.supabase.co) — this harness never
//     touches Supabase at all, but fails loudly if the environment looks
//     production-shaped anyway.
//   - `--dry-run` prints the plan below and exits 0 without requiring a key
//     or making any network call at all — safe to run on a machine with no
//     Stripe credentials configured (this is the mode used to develop and
//     smoke-test this script itself).
//   - Never logs the Stripe secret key. Never writes to Supabase (no
//     Supabase client is even imported). Uses no production identifiers —
//     every object it creates is tagged `metadata.fv590 = "1"` and/or named
//     with the `fv590-d3-` prefix, and is deleted/deactivated in a
//     try/finally cleanup block that runs even if an assertion fails.
//
// GUARD ORDERING (deliberate): `--dry-run` is checked FIRST, before either
// env guard, and short-circuits everything else. Dry-run makes zero network
// calls and reads no secret, so there is no safety reason to gate it behind
// the key/Supabase-URL checks — and gating it WOULD prevent verifying this
// script's dry-run path on a machine that (correctly) has no Stripe test key
// configured, which is exactly the situation this script must support. The
// Supabase-URL guard runs before the key guard when not in dry-run mode.
//
// THE SDK + API VERSION PIN: constructs its OWN Stripe client from the test
// key (`createTestClient` below) using the SAME `STRIPE_API_VERSION` pin as
// `lib/stripe/server.ts` — imported from `lib/stripe/api-version.ts` (FV-590
// extracted that one-line constant out of server.ts specifically so it could
// be shared here). It deliberately does NOT import `getStripe()` /
// `lib/stripe/server.ts` itself: that module's first line is
// `import "server-only"`, and the `server-only` package's default export
// unconditionally throws when required/imported outside a bundler's
// `react-server`/browser resolution condition — i.e. it throws immediately
// under plain `node --experimental-strip-types ...`. Importing it here would
// crash this script before `main()` ever runs.
//
// USAGE (from apps/web/):
//   npm run stripe:test-clock:d3 -- --dry-run
//   npm run stripe:test-clock:d3
//   npm run stripe:test-clock:d3 -- --with-3ds
//
// Prerequisite for a REAL run: apps/web/.env.stripe-test containing
//   STRIPE_SECRET_KEY=sk_test_...   (or a restricted rk_test_... key)
// (a Stripe TEST-MODE secret key; live keys are refused). Nothing else is
// required — this harness never touches Supabase. See
// docs/fv590-stripe-test-clock-runbook.md for the full runbook, including
// the manual (not automated here) athlete-creation step against a running
// app.
//
// Exit codes: 0 = dry-run, or a real run where every executed scenario
// passed; 1 = a real run where at least one scenario failed its assertions;
// 2 = a guard failure (missing/live key, live Supabase URL) or usage error.

import { pathToFileURL } from "node:url";

import Stripe from "stripe";

// Relative import with an explicit `.ts` extension — NOT the `@/*`
// tsconfig alias. This file is run directly by `node
// --experimental-strip-types` (see scripts/generate-pregame-audio.ts for the
// established pattern), and plain Node has no idea what `@/` means; only
// Next.js's bundler resolves that alias.
import { STRIPE_API_VERSION } from "../lib/stripe/api-version.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PRODUCT_NAME = "FV-590 D3 harness";
export const TEST_CLOCK_NAME_PREFIX = "fv590-d3-";
export const HARNESS_METADATA = { fv590: "1" } as const;

// Mirrors the approved economics (see lib/stripe/sync-athlete-quantity.ts's
// module doc): first athlete $5.00/mo, each additional athlete $3.00/mo.
export const TIER_ONE_UNIT_AMOUNT_CENTS = 500;
export const TIER_REST_UNIT_AMOUNT_CENTS = 300;

// Stripe's documented TEST-MODE payment-method tokens for exercising fixed
// outcomes without going through Elements/Checkout.
// https://docs.stripe.com/testing#payment-methods
export const PM_VISA_SUCCESS = "pm_card_visa";
export const PM_CHARGE_DECLINED = "pm_card_chargeDeclined";
export const PM_AUTHENTICATION_REQUIRED = "pm_card_authenticationRequired";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export class GuardFailure extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode = 2) {
    super(message);
    this.name = "GuardFailure";
    this.exitCode = exitCode;
  }
}

export const MISSING_OR_LIVE_KEY_MESSAGE =
  "Prerequisite: a Stripe TEST-MODE key (sk_test_… or a restricted rk_test_…) in apps/web/.env.stripe-test as STRIPE_SECRET_KEY. Live keys are refused.";

export const SUPABASE_URL_REFUSAL_MESSAGE =
  "Refusing to run: NEXT_PUBLIC_SUPABASE_URL points at a live Supabase project (*.supabase.co). This harness never touches Supabase, but refuses to run in an environment pointed at a live project. Unset NEXT_PUBLIC_SUPABASE_URL or point it at a placeholder value before running.";

/**
 * Validates STRIPE_SECRET_KEY is present and TEST-MODE (`sk_test_...` or a
 * restricted `rk_test_...` key). Live keys (`sk_live_`/`rk_live_`) are refused.
 * No network call. Throws `GuardFailure` (exit code 2) otherwise; never
 * logs the key value itself, only its presence/shape.
 */
export function assertTestModeStripeKey(secretKey: string | undefined): string {
  if (
    !secretKey ||
    !(secretKey.startsWith("sk_test_") || secretKey.startsWith("rk_test_"))
  ) {
    throw new GuardFailure(MISSING_OR_LIVE_KEY_MESSAGE);
  }
  return secretKey;
}

/**
 * Refuses to run if NEXT_PUBLIC_SUPABASE_URL looks like a live Supabase
 * project host. No network call — this is a defensive tripwire; the harness
 * never imports or calls a Supabase client regardless.
 */
export function assertSupabaseUrlIsNotLive(url: string | undefined): void {
  if (url && /\.supabase\.co(?:[/:]|$)/i.test(url)) {
    throw new GuardFailure(SUPABASE_URL_REFUSAL_MESSAGE);
  }
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

export interface CliArgs {
  dryRun: boolean;
  with3ds: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  return {
    dryRun: argv.includes("--dry-run"),
    with3ds: argv.includes("--with-3ds"),
  };
}

// ---------------------------------------------------------------------------
// Dry-run plan (pure — no env reads beyond what's passed in, no network)
// ---------------------------------------------------------------------------

export function buildPlan(opts: { with3ds: boolean }): string {
  const lines = [
    "FV-590 Stripe test-clock harness — DRY RUN (no network calls, no key required)",
    "",
    "Prerequisites for a REAL run:",
    "  - apps/web/.env.stripe-test containing STRIPE_SECRET_KEY=sk_test_... or rk_test_... (refused if missing or live)",
    "  - NEXT_PUBLIC_SUPABASE_URL must NOT point at *.supabase.co (this harness never touches Supabase)",
    "",
    "Plan:",
    "  1. Delete any stale fv590-d3-* test clocks and deactivate any stale",
    "     \"FV-590 D3 harness\" products from a previous interrupted run.",
    "  2. Create a fresh test clock frozen at 'now'.",
    `  3. Create product "${PRODUCT_NAME}" + one graduated monthly price:`,
    `       tier 1 (up_to 1):   $${(TIER_ONE_UNIT_AMOUNT_CENTS / 100).toFixed(2)} (${TIER_ONE_UNIT_AMOUNT_CENTS} cents)`,
    `       tier 2 (up_to inf): $${(TIER_REST_UNIT_AMOUNT_CENTS / 100).toFixed(2)} (${TIER_REST_UNIT_AMOUNT_CENTS} cents) per additional seat`,
    "  Scenario A (success):",
    "    - customer on the clock, default payment method pm_card_visa",
    "    - subscription: trial_period_days=7, quantity=1 -> assert status=trialing, quantity=1",
    "    - D3 update, copied verbatim from lib/actions/athletes.ts:",
    "        trial_end: \"now\", items: [{ id: item.id, quantity: 2 }], payment_behavior: \"error_if_incomplete\"",
    "    - assert: status=active, trial_end<=now, quantity=2, latest_invoice.status=paid,",
    "      latest_invoice.amount_paid=800, latest_invoice.payment_intent.status=succeeded",
    "    - assert exactly one paid invoice of 800 cents exists for the customer",
    "  Scenario B (decline):",
    "    - fresh customer on the SAME clock, default payment method pm_card_chargeDeclined",
    "    - same trialing subscription, same D3 update -> EXPECT a thrown StripeCardError (402)",
    "    - assert: status=trialing, quantity=1, trial_end unchanged, no paid invoice for the customer",
    opts.with3ds
      ? "  Scenario C (--with-3ds): fresh customer, default payment method pm_card_authenticationRequired\n" +
        "    -> same D3 update, EXPECT a thrown error under error_if_incomplete (documented 3DS limitation;\n" +
        "       error_if_incomplete does not support authentication challenges). Informational, not gating."
      : "  Scenario C: skipped (pass --with-3ds to also probe the known 3DS limitation).",
    "  4. Cleanup (always, via try/finally): delete the test clock (cascades its customers +",
    "     subscriptions + invoices), deactivate the price and product.",
    "",
    "Exit codes: 0 = dry run, or all executed scenarios passed; 1 = a scenario failed its",
    "assertions; 2 = guard failure (missing/live key, live Supabase URL) or usage error.",
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Stripe client construction (separate from the app's getStripe() singleton
// — see the module doc above for why)
// ---------------------------------------------------------------------------

export function createTestClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    appInfo: { name: "From Victory (FV-590 test-clock harness)", version: "0.1.0" },
    telemetry: false,
  });
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export function shortId(id: string): string {
  return id.length <= 8 ? id : `${id.slice(0, 8)}…`;
}

export function toIso(unixSeconds: number | null | undefined): string {
  if (unixSeconds === null || unixSeconds === undefined) return "null";
  return new Date(unixSeconds * 1000).toISOString();
}

export function describeError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { type?: string; code?: string; statusCode?: number; message?: string };
    const parts = [e.type ?? "Error"];
    if (e.code) parts.push(`code=${e.code}`);
    if (e.statusCode !== undefined) parts.push(`statusCode=${e.statusCode}`);
    return `${parts.join(" ")}: ${e.message ?? String(err)}`;
  }
  return String(err);
}

/**
 * Structural check for a Stripe card-decline error (`StripeCardError`,
 * HTTP 402) without importing Stripe's error CLASSES (the SDK exposes them,
 * but a structural check keeps this function trivially testable with a
 * plain thrown object in unit tests, matching this repo's existing
 * mocked-Stripe-client test style).
 */
export function isStripeCardError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { type?: unknown; statusCode?: unknown };
  return e.type === "StripeCardError" && e.statusCode === 402;
}

// stripe@22's compiled types model only the LATEST API version's Invoice
// shape, which replaced the top-level `payment_intent` field with
// `confirmation_secret`. Our pinned STRIPE_API_VERSION (2024-06-20) still
// returns `payment_intent` on the wire when expanded (the same
// "the pin doesn't change the compiled type hints" situation flagged in
// lib/stripe/server.ts's module doc) — read it through this local shape.
type InvoiceWithPaymentIntent = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
};

// ---------------------------------------------------------------------------
// Harness object creation (product/price/customer/subscription/D3 update)
// ---------------------------------------------------------------------------

export async function createHarnessPriceAndProduct(
  stripe: Stripe,
): Promise<{ productId: string; priceId: string }> {
  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    metadata: { ...HARNESS_METADATA },
  });
  const price = await stripe.prices.create({
    currency: "usd",
    recurring: { interval: "month" },
    billing_scheme: "tiered",
    tiers_mode: "graduated",
    tiers: [
      { up_to: 1, unit_amount: TIER_ONE_UNIT_AMOUNT_CENTS },
      { up_to: "inf", unit_amount: TIER_REST_UNIT_AMOUNT_CENTS },
    ],
    product: product.id,
    metadata: { ...HARNESS_METADATA },
  });
  return { productId: product.id, priceId: price.id };
}

export async function createHarnessCustomer(
  stripe: Stripe,
  params: { testClockId: string; paymentMethod: string; label: string },
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    description: `FV-590 harness — ${params.label}`,
    test_clock: params.testClockId,
    payment_method: params.paymentMethod,
    invoice_settings: { default_payment_method: params.paymentMethod },
    metadata: { ...HARNESS_METADATA },
  });
}

export async function createTrialingSubscription(
  stripe: Stripe,
  params: { customerId: string; priceId: string },
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId, quantity: 1 }],
    trial_period_days: 7,
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  });
}

/**
 * The EXACT D3 Stripe update from `lib/actions/athletes.ts`'s
 * `createAthlete` (trial-conversion block) — copied verbatim so this
 * harness proves the real call shape, not an approximation. If that call
 * site's params ever change, update this function to match and re-run.
 */
export async function applyD3Update(
  stripe: Stripe,
  subscriptionId: string,
  itemId: string,
  newQuantity: number,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    trial_end: "now",
    items: [{ id: itemId, quantity: newQuantity }],
    payment_behavior: "error_if_incomplete",
  });
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface ScenarioResult {
  scenario: "A" | "B" | "C";
  label: string;
  passed: boolean;
  failures: string[];
  evidence: Record<string, string | number | boolean>;
}

export async function runScenarioA(
  stripe: Stripe,
  testClockId: string,
  priceId: string,
): Promise<ScenarioResult> {
  const failures: string[] = [];
  const evidence: Record<string, string | number | boolean> = {};

  const customer = await createHarnessCustomer(stripe, {
    testClockId,
    paymentMethod: PM_VISA_SUCCESS,
    label: "scenario-A-success",
  });
  evidence.customerId = shortId(customer.id);

  const sub = await createTrialingSubscription(stripe, {
    customerId: customer.id,
    priceId,
  });
  evidence.subscriptionId = shortId(sub.id);

  if (sub.status !== "trialing") {
    failures.push(`pre-update: expected status "trialing", got "${sub.status}"`);
  }
  const item = sub.items.data[0];
  if (!item) {
    failures.push("pre-update: subscription has no items");
    return { scenario: "A", label: "success", passed: false, failures, evidence };
  }
  if (item.quantity !== 1) {
    failures.push(`pre-update: expected quantity 1, got ${item.quantity}`);
  }

  try {
    await applyD3Update(stripe, sub.id, item.id, 2);
  } catch (err) {
    failures.push(`D3 update threw unexpectedly: ${describeError(err)}`);
    return { scenario: "A", label: "success", passed: false, failures, evidence };
  }

  const refreshed = await stripe.subscriptions.retrieve(sub.id, {
    expand: ["latest_invoice.payment_intent"],
  });

  if (refreshed.status !== "active") {
    failures.push(`post-update: expected status "active", got "${refreshed.status}"`);
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (refreshed.trial_end !== null && refreshed.trial_end > nowSeconds) {
    failures.push(`post-update: expected trial_end <= now, got ${toIso(refreshed.trial_end)}`);
  }
  evidence.trialEnd = toIso(refreshed.trial_end);

  const refreshedItem = refreshed.items.data[0];
  if (!refreshedItem || refreshedItem.quantity !== 2) {
    failures.push(`post-update: expected quantity 2, got ${refreshedItem?.quantity ?? "none"}`);
  }

  const invoice = refreshed.latest_invoice as InvoiceWithPaymentIntent | string | null;
  if (!invoice || typeof invoice === "string") {
    failures.push("post-update: latest_invoice was not expanded");
  } else {
    evidence.invoiceId = shortId(invoice.id ?? "unknown");
    evidence.billingReason = invoice.billing_reason ?? "null";
    if (invoice.status !== "paid") {
      failures.push(`post-update: expected latest_invoice.status "paid", got "${invoice.status}"`);
    }
    if (invoice.amount_paid !== 800) {
      failures.push(`post-update: expected latest_invoice.amount_paid 800, got ${invoice.amount_paid}`);
    }
    evidence.amountPaidCents = invoice.amount_paid;

    const pi = invoice.payment_intent;
    if (!pi || typeof pi === "string") {
      failures.push("post-update: latest_invoice.payment_intent was not expanded");
    } else {
      evidence.paymentIntentStatus = pi.status;
      if (pi.status !== "succeeded") {
        failures.push(`post-update: expected payment_intent.status "succeeded", got "${pi.status}"`);
      }
    }
  }

  const invoices = await stripe.invoices.list({ customer: customer.id, limit: 10 });
  const paidInvoices = invoices.data.filter((inv) => inv.status === "paid");
  evidence.paidInvoiceCount = paidInvoices.length;
  const onlyPaidInvoice = paidInvoices[0];
  if (paidInvoices.length !== 1 || !onlyPaidInvoice) {
    failures.push(`expected exactly 1 paid invoice for the customer, found ${paidInvoices.length}`);
  } else if (onlyPaidInvoice.amount_paid !== 800) {
    failures.push(`the one paid invoice has amount_paid ${onlyPaidInvoice.amount_paid}, expected 800`);
  }

  return { scenario: "A", label: "success", passed: failures.length === 0, failures, evidence };
}

export async function runScenarioB(
  stripe: Stripe,
  testClockId: string,
  priceId: string,
): Promise<ScenarioResult> {
  const failures: string[] = [];
  const evidence: Record<string, string | number | boolean> = {};

  const customer = await createHarnessCustomer(stripe, {
    testClockId,
    paymentMethod: PM_CHARGE_DECLINED,
    label: "scenario-B-decline",
  });
  evidence.customerId = shortId(customer.id);

  const sub = await createTrialingSubscription(stripe, {
    customerId: customer.id,
    priceId,
  });
  evidence.subscriptionId = shortId(sub.id);
  const trialEndBefore = sub.trial_end;

  const item = sub.items.data[0];
  if (!item) {
    failures.push("pre-update: subscription has no items");
    return { scenario: "B", label: "decline", passed: false, failures, evidence };
  }

  let threw: unknown = null;
  try {
    await applyD3Update(stripe, sub.id, item.id, 2);
  } catch (err) {
    threw = err;
  }

  if (threw === null) {
    failures.push("expected the D3 update to throw a StripeCardError (402) but it succeeded");
  } else {
    evidence.updateError = describeError(threw);
    if (!isStripeCardError(threw)) {
      failures.push(`expected a StripeCardError with statusCode 402, got: ${describeError(threw)}`);
    }
  }

  const refreshed = await stripe.subscriptions.retrieve(sub.id);
  if (refreshed.status !== "trialing") {
    failures.push(`post-update: expected status "trialing" (unchanged), got "${refreshed.status}"`);
  }
  const refreshedItem = refreshed.items.data[0];
  if (!refreshedItem || refreshedItem.quantity !== 1) {
    failures.push(`post-update: expected quantity 1 (unchanged), got ${refreshedItem?.quantity ?? "none"}`);
  }
  if (refreshed.trial_end !== trialEndBefore) {
    failures.push(
      `post-update: expected trial_end unchanged (${toIso(trialEndBefore)}), got ${toIso(refreshed.trial_end)}`,
    );
  }
  evidence.trialEnd = toIso(refreshed.trial_end);

  const invoices = await stripe.invoices.list({ customer: customer.id, limit: 10 });
  const paidInvoices = invoices.data.filter((inv) => inv.status === "paid");
  evidence.paidInvoiceCount = paidInvoices.length;
  evidence.openOrDraftInvoiceCount = invoices.data.filter(
    (inv) => inv.status === "open" || inv.status === "draft" || inv.status === "void",
  ).length;
  if (paidInvoices.length !== 0) {
    failures.push(`expected no paid invoices for the customer, found ${paidInvoices.length}`);
  }

  return { scenario: "B", label: "decline", passed: failures.length === 0, failures, evidence };
}

/**
 * Scenario C (`--with-3ds`, optional): documents the known 3DS limitation
 * that `payment_behavior: "error_if_incomplete"` does not support an
 * authentication challenge (see the module doc in lib/actions/athletes.ts).
 * This is informational, not a regression check on our own code — it
 * confirms Stripe still behaves the way the module doc says it does. Any
 * thrown error counts as the expected outcome; the exact error shape is
 * logged for a human to read, not asserted precisely.
 */
export async function runScenarioC(
  stripe: Stripe,
  testClockId: string,
  priceId: string,
): Promise<ScenarioResult> {
  const failures: string[] = [];
  const evidence: Record<string, string | number | boolean> = {};

  const customer = await createHarnessCustomer(stripe, {
    testClockId,
    paymentMethod: PM_AUTHENTICATION_REQUIRED,
    label: "scenario-C-3ds",
  });
  evidence.customerId = shortId(customer.id);

  const sub = await createTrialingSubscription(stripe, {
    customerId: customer.id,
    priceId,
  });
  evidence.subscriptionId = shortId(sub.id);

  const item = sub.items.data[0];
  if (!item) {
    failures.push("pre-update: subscription has no items");
    return { scenario: "C", label: "3ds-limitation", passed: false, failures, evidence };
  }

  let threw: unknown = null;
  try {
    await applyD3Update(stripe, sub.id, item.id, 2);
  } catch (err) {
    threw = err;
  }

  if (threw === null) {
    failures.push(
      "expected the D3 update to be refused under error_if_incomplete for a 3DS-required card, but it succeeded — the documented 3DS limitation may no longer apply",
    );
  } else {
    evidence.updateError = describeError(threw);
  }

  return { scenario: "C", label: "3ds-limitation", passed: failures.length === 0, failures, evidence };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export async function cleanupPriorRuns(stripe: Stripe): Promise<void> {
  try {
    const clocks = await stripe.testHelpers.testClocks.list({ limit: 100 });
    for (const clock of clocks.data) {
      if (clock.name?.startsWith(TEST_CLOCK_NAME_PREFIX)) {
        await stripe.testHelpers.testClocks.del(clock.id);
        console.log(`[cleanup] deleted stale test clock ${shortId(clock.id)} (${clock.name})`);
      }
    }
  } catch (err) {
    console.warn(`[cleanup] could not list/delete stale test clocks: ${describeError(err)}`);
  }

  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    for (const product of products.data) {
      if (product.metadata?.fv590 === "1") {
        await stripe.products.update(product.id, { active: false });
        console.log(`[cleanup] deactivated stale harness product ${shortId(product.id)}`);
      }
    }
  } catch (err) {
    console.warn(`[cleanup] could not list/deactivate stale harness products: ${describeError(err)}`);
  }
}

export async function cleanup(
  stripe: Stripe,
  ids: { testClockId: string; productId: string; priceId: string },
): Promise<void> {
  try {
    await stripe.testHelpers.testClocks.del(ids.testClockId);
    console.log(
      `[cleanup] deleted test clock ${shortId(ids.testClockId)} (cascades its customers + subscriptions + invoices)`,
    );
  } catch (err) {
    console.warn(`[cleanup] failed to delete test clock ${shortId(ids.testClockId)}: ${describeError(err)}`);
  }
  try {
    await stripe.prices.update(ids.priceId, { active: false });
  } catch (err) {
    console.warn(`[cleanup] failed to deactivate price ${shortId(ids.priceId)}: ${describeError(err)}`);
  }
  try {
    await stripe.products.update(ids.productId, { active: false });
  } catch (err) {
    console.warn(`[cleanup] failed to deactivate product ${shortId(ids.productId)}: ${describeError(err)}`);
  }
}

// ---------------------------------------------------------------------------
// Orchestration (the network-calling boundary; kept separate from guards +
// pure helpers above so unit tests can drive it with a mocked Stripe client)
// ---------------------------------------------------------------------------

export async function runScenarios(
  stripe: Stripe,
  opts: { with3ds: boolean },
): Promise<ScenarioResult[]> {
  await cleanupPriorRuns(stripe);

  const testClock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: `${TEST_CLOCK_NAME_PREFIX}${Date.now()}`,
  });

  const { productId, priceId } = await createHarnessPriceAndProduct(stripe);

  const results: ScenarioResult[] = [];
  try {
    results.push(await runScenarioA(stripe, testClock.id, priceId));
    results.push(await runScenarioB(stripe, testClock.id, priceId));
    if (opts.with3ds) {
      results.push(await runScenarioC(stripe, testClock.id, priceId));
    }
  } finally {
    await cleanup(stripe, { testClockId: testClock.id, productId, priceId });
  }

  return results;
}

function printEvidence(results: ScenarioResult[]): void {
  console.log("");
  console.log("=== FV-590 evidence ===");
  for (const result of results) {
    console.log(`\nScenario ${result.scenario} (${result.label}): ${result.passed ? "PASS" : "FAIL"}`);
    for (const [key, value] of Object.entries(result.evidence)) {
      console.log(`  ${key}: ${value}`);
    }
    for (const failure of result.failures) {
      console.log(`  FAILURE: ${failure}`);
    }
  }
  console.log("");
}

// ---------------------------------------------------------------------------
// main()
// ---------------------------------------------------------------------------

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  // --dry-run short-circuits everything else — see the module doc's
  // "GUARD ORDERING" section for why this is deliberately checked first.
  if (args.dryRun) {
    console.log(buildPlan({ with3ds: args.with3ds }));
    return 0;
  }

  let secretKey: string;
  try {
    assertSupabaseUrlIsNotLive(process.env.NEXT_PUBLIC_SUPABASE_URL);
    secretKey = assertTestModeStripeKey(process.env.STRIPE_SECRET_KEY);
  } catch (err) {
    if (err instanceof GuardFailure) {
      console.error(err.message);
      return err.exitCode;
    }
    throw err;
  }

  const stripe = createTestClient(secretKey);
  const results = await runScenarios(stripe, { with3ds: args.with3ds });
  printEvidence(results);

  const allPassed = results.every((r) => r.passed);
  console.log(allPassed ? "OVERALL: PASS" : "OVERALL: FAIL");
  return allPassed ? 0 : 1;
}

// Run only when executed directly (not when imported by the unit tests,
// which would otherwise trigger process.exit on import) — same pattern as
// scripts/check-migration-drift.ts.
const invokedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error("[stripe-test-clock-d3] Unexpected error:", describeError(err));
      process.exit(2);
    });
}
