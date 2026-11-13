/**
 * Cron route: GET/POST /api/cron/reconcile-subscriptions (FV-709)
 *
 * Access is driven by webhook-written rows, and nothing repaired a row when a
 * webhook was missed. This daily job re-reads provider truth and re-applies it
 * through the same write paths the webhooks use:
 *   - Stripe: every `subscriptions` row with a stripe_subscription_id and a
 *     non-terminal status is retrieved from Stripe; if status / price / period
 *     end / cancel flag differ, the row is updated (watermark semantics are
 *     documented on reconcileStripeRow in lib/subscriptions/reconcile.ts).
 *     A Stripe `resource_missing` is counted and alerted, never guessed.
 *   - Apple: Production rows in a live status (subscribed / in_grace_period /
 *     in_billing_retry) that are expired or expire within 24h are passed to
 *     `reconcileAppleSubscription`. Sandbox rows are never reconciled.
 *
 * Bounded work: at most 100 Stripe rows and 100 Apple rows per run, a 40s
 * wall-clock budget (maxDuration 60), Stripe calls in groups of 4, Apple
 * sequential, per-row try/catch. Rows beyond the cap rotate daily so none is
 * starved; they are reported as `deferred`. Re-running is idempotent.
 *
 * Out of scope (do not add here): athlete-quantity drift vs
 * parent_athlete_links (deferred to FV-284); Google Play (FV-662/663).
 *
 * Security: CRON_SECRET Bearer token, constant-time compare, fail closed when
 * unset — identical to the other cron routes. Service-role client.
 *
 * Privacy: the alert email and JSON response carry COUNTS ONLY — no emails,
 * names, customer ids or athlete data.
 *
 * Schedule: see vercel.json (daily 04:30 UTC).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";
import {
  reconcileApplePass,
  reconcileStripePass,
  TIME_BUDGET_MS,
  type PassCounts,
} from "@/lib/subscriptions/reconcile";

const FAILED_PASS: PassCounts = {
  checked: 0,
  corrected: 0,
  failed: 1,
  missing: 0,
  raced: 0,
  deferred: 0,
};

async function handleCronRequest(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/reconcile-subscriptions] CRON_SECRET is not configured. " +
        "Set this env var to protect the cron route.",
    );
    return NextResponse.json(
      { error: "Cron secret not configured." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${cronSecret}`;
  const authBuf = Buffer.from(authHeader ?? "", "utf8");
  const expectedBuf = Buffer.from(expectedToken, "utf8");
  const authorized =
    authBuf.length === expectedBuf.length && timingSafeEqual(authBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const service = createServiceClient();
  const deadlineMs = Date.now() + TIME_BUDGET_MS;

  // A pass that throws (e.g. row listing failed) must not abort the other.
  let stripe: PassCounts;
  try {
    stripe = await reconcileStripePass(service, deadlineMs);
  } catch {
    console.error("[cron/reconcile-subscriptions] stripe pass failed");
    stripe = FAILED_PASS;
  }
  let apple: PassCounts;
  try {
    apple = await reconcileApplePass(service, deadlineMs);
  } catch {
    console.error("[cron/reconcile-subscriptions] apple pass failed");
    apple = FAILED_PASS;
  }

  const dirty = [stripe, apple].some(
    // `deferred` counts too: rows the run could not reach (cap or time
    // budget) must be visible, or a run that did nothing would look clean.
    (p) => p.corrected > 0 || p.failed > 0 || p.missing > 0 || p.deferred > 0,
  );
  if (dirty) {
    const fmt = (p: PassCounts) =>
      `checked=${p.checked} corrected=${p.corrected} failed=${p.failed} missing=${p.missing} raced=${p.raced} deferred=${p.deferred}`;
    deliverInBackground(
      notifyError(
        "[cron/reconcile-subscriptions] drift or failures found",
        "Subscription reconcile run completed with corrections, failures or unreached rows.",
        { stripe: fmt(stripe), apple: fmt(apple) },
      ),
    );
  }

  console.info(
    `[cron/reconcile-subscriptions] done — stripe(${JSON.stringify(stripe)}) apple(${JSON.stringify(apple)})`,
  );

  return NextResponse.json({ stripe, apple });
}

// Vercel Cron invokes with GET; POST kept for manual ops triggering.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
