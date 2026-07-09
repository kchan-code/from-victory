/**
 * Cron route: GET/POST /api/cron/weekly-digest
 *
 * Invoked by Vercel Cron on a weekly schedule (vercel.json). Sends the
 * weekly rhythm digest email to all eligible parents.
 *
 * NOTE: Vercel Cron invokes the path with HTTP GET (with
 * `Authorization: Bearer <CRON_SECRET>` attached automatically when the
 * env var is set) — a POST-only export would 405 every scheduled run
 * (PR #192 review finding 2). GET is the cron entrypoint; POST is kept for
 * manual/ops triggering with the same secret.
 *
 * Security:
 *   - Authorization header must carry `Bearer <CRON_SECRET>` — the same
 *     pattern Vercel uses for cron authentication. Any request without a
 *     valid secret returns 401 immediately.
 *   - CRON_SECRET is a server-side env var; never exposed to the client.
 *
 * waitUntil:
 *   The digest loop may take several seconds for large parent lists.
 *   We respond 202 immediately and run the digest inside waitUntil() so
 *   the work survives the Vercel function freeze after the HTTP response
 *   is sent. This mirrors the FV-189 pattern in the Stripe webhook handler.
 *
 * Middleware:
 *   This route is under /api/cron/ which is NOT excluded from session-
 *   refresh middleware (only /api/webhooks is excluded). Session refresh
 *   is harmless here — it will find no cookie and move on. We do NOT need
 *   to update the middleware matcher for cron routes.
 *
 * Privacy:
 *   No PII is logged from this handler. The digest sender logs opaque
 *   counters (sent, skipped, errors) only.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { runWeeklyDigest } from "@/lib/email/weekly-digest";

async function handleCronRequest(req: NextRequest) {
  // 1. Verify the CRON_SECRET is configured.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[weekly-digest/cron] CRON_SECRET is not configured. " +
        "Set this env var to protect the cron route.",
    );
    return NextResponse.json({ error: "Cron secret not configured." }, { status: 500 });
  }

  // 2. Validate the Authorization header.
  //    Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${cronSecret}`;
  const authBuf = Buffer.from(authHeader ?? "", "utf8");
  const expectedBuf = Buffer.from(expectedToken, "utf8");
  const authorized =
    authBuf.length === expectedBuf.length && timingSafeEqual(authBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 3. Respond 202 immediately; run the digest in the background so we don't
  //    exceed Vercel's 10-second cron HTTP timeout on large parent lists.
  deliverInBackground(
    runWeeklyDigest().then((result) => {
      console.info(
        `[weekly-digest/cron] completed: eligible=${result.eligible} ` +
          `sent=${result.sent} skipped=${result.skipped} errors=${result.errors}`,
      );
    }),
  );

  return NextResponse.json({ accepted: true }, { status: 202 });
}

// Vercel Cron invokes with GET; POST kept for manual ops triggering.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
