/**
 * Cron route: GET/POST /api/cron/prune-activity-events (FV-382)
 *
 * `activity_events` (20260630120000_activity_events.sql) is append-only —
 * one row per app_open / daily_start / pregame_complete / etc — and grows
 * unbounded with no TTL. That migration explicitly deferred the pruning
 * policy to a kc-gated follow-up:
 *
 *   "RETENTION: this table is append-only with no TTL. A pruning policy
 *    (e.g. a pg_cron job deleting rows older than ~90 days, sufficient for
 *    DAU/WAU/MAU and retention cohorts) is a kc-gated follow-up..."
 *
 * This repo does not use pg_cron anywhere (checked: no migration schedules a
 * cron.* job). Scheduled DB maintenance is done via a Vercel cron route that
 * calls the service client — the exact pattern `reap-pairings` established
 * for device_pairings. This route mirrors that structure so the two
 * background-prune jobs stay easy to reason about together.
 *
 * Retention window: ACTIVITY_EVENTS_RETENTION_DAYS = 90 days.
 *   - lib/admin/metrics.ts already floors its activity_events query window at
 *     `Math.max(rangeDays, 90)` — and the admin dashboard's range selector
 *     (RANGES = [7, 30, 90] in app/dashboard/admin/metrics/page.tsx) never
 *     exceeds 90 — so DAU/WAU/MAU (<=30d) and the 8-week pregame trend
 *     (<=56d) are always well inside the retained window. Pruning here can
 *     only ever lag a query's cutoff by the run-to-run cron gap (<=24h),
 *     never precede it, so this job cannot corrupt a metric that's already
 *     being computed today.
 *   - 90 days is also comfortably inside AADC-style purpose-limited retention
 *     guidance for minor (13-17) activity data. Confirm with counsel before
 *     changing the window (same caveat the migration already carries).
 *
 * Security:
 *   - CRON_SECRET Bearer token must match (constant-time compare), the same
 *     pattern as the other cron routes (reap-pairings, send-reminders,
 *     weekly-digest). Any request without the valid secret returns 401.
 *   - Service-role client bypasses RLS (intentional — background job, not a
 *     user-initiated action). activity_events is service-role-only anyway
 *     (RLS enabled, no client policies).
 *
 * Privacy contract:
 *   - activity_events is EVENT-ONLY (no content) already; this job doesn't
 *     change that. It never logs athlete_id or meta — only an opaque count.
 *
 * Middleware:
 *   Under /api/cron/ — NOT excluded from session-refresh middleware (only
 *   /api/webhooks is, per apps/web/middleware.ts). Session refresh is
 *   harmless here (Vercel Cron sends no session cookie).
 *
 * Schedule: see vercel.json. Daily is plenty for a 90-day window; a missed
 * run is harmless — the next run catches up and the extra rows are inert
 * (over-retention for a day or two, never under-retention of a live query).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

// Single source of truth for the retention window. Keep in sync with the
// commentary in supabase/migrations/20260630120000_activity_events.sql and
// the Math.max(rangeDays, 90) floor in lib/admin/metrics.ts — if this number
// changes, that floor must move with it (or the dashboard's widest range
// selection could outrun what's retained).
const ACTIVITY_EVENTS_RETENTION_DAYS = 90;

async function handleCronRequest(req: NextRequest) {
  // 1. CRON_SECRET must be configured.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/prune-activity-events] CRON_SECRET is not configured. " +
        "Set this env var to protect the cron route.",
    );
    return NextResponse.json(
      { error: "Cron secret not configured." },
      { status: 500 },
    );
  }

  // 2. Validate the Authorization header. Vercel Cron sends
  //    `Authorization: Bearer <CRON_SECRET>`.
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
  const cutoffIso = new Date(
    Date.now() - ACTIVITY_EVENTS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  let pruned = 0;

  // Delete rows strictly older than the retention window. `.select("id")`
  // returns only the surrogate key of each deleted row — never athlete_id or
  // meta — so the count can never leak event content into logs.
  const { data, error } = await service
    .from("activity_events")
    .delete()
    .lt("occurred_at", cutoffIso)
    .select("id");

  if (error) {
    console.error("[cron/prune-activity-events] prune failed:", error.message);
    return NextResponse.json({ error: "Prune failed." }, { status: 500 });
  }

  pruned = data?.length ?? 0;

  console.info(`[cron/prune-activity-events] done — pruned=${pruned}`);

  return NextResponse.json({ pruned });
}

// Vercel Cron invokes with GET; POST kept for manual ops triggering.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
