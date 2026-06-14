/**
 * Cron route: GET/POST /api/cron/reap-pairings (FV-177)
 *
 * Prunes device_pairings rows so spent and stale one-time pairing codes do
 * not accumulate indefinitely. Two classes are reaped:
 *
 *   1. Expired + unconsumed — rows whose expires_at is in the past and that
 *      were never claimed (consumed_at IS NULL). These are dead tokens.
 *   2. Aged consumed — rows that WERE claimed (consumed_at NOT NULL) more
 *      than CONSUMED_RETENTION_HOURS ago. We keep a short consumed window as
 *      a forensic breadcrumb (a successful pairing happened), then drop it.
 *
 *   We do NOT delete unexpired-unconsumed rows — those are live codes a
 *   parent just generated and an athlete may still claim.
 *
 * Why a reaper at all: device_pairings stores only sha256(code) (no raw
 * secret — FV-177), but rows still carry athlete_id/created_by links. Reaping
 * keeps the table small and minimizes retained linkage per the data-
 * minimization posture (CLAUDE.md → Child Safety + Privacy).
 *
 * Security:
 *   - CRON_SECRET Bearer token must match — the same pattern the other cron
 *     routes use. Any request without the valid secret returns 401.
 *   - Service-role client bypasses RLS (intentional — background job, not a
 *     user-initiated action). device_pairings is service-role-only anyway.
 *
 * Privacy contract:
 *   - NEVER log athlete_id, created_by, code, or code_sha256. Only opaque
 *     counts (expiredPruned, consumedPruned) are returned/logged.
 *
 * Middleware:
 *   Under /api/cron/ — NOT excluded from session-refresh middleware (only
 *   /api/webhooks is). Session refresh is harmless here (no cookie present).
 *
 * Schedule: see vercel.json. Hourly alignment is unnecessary; daily is plenty
 * given the 24h TTL. A missed run is harmless — the next run catches up and
 * the rows are inert in the meantime (claim is gated on consumed_at/expires_at
 * regardless of whether the reaper has run).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

// How long to retain a consumed (successfully claimed) pairing row before the
// reaper drops it. Short forensic window only — the row is inert once consumed.
const CONSUMED_RETENTION_HOURS = 72;

async function handleCronRequest(req: NextRequest) {
  // 1. CRON_SECRET must be configured.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/reap-pairings] CRON_SECRET is not configured. " +
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
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const service = createServiceClient();
  const nowIso = new Date().toISOString();
  const consumedCutoffIso = new Date(
    Date.now() - CONSUMED_RETENTION_HOURS * 60 * 60 * 1000,
  ).toISOString();

  let expiredPruned = 0;
  let consumedPruned = 0;

  // 3a. Reap expired + unconsumed rows (dead, never-claimed tokens).
  //     Uses device_pairings_unconsumed_expires_idx.
  {
    const { data, error } = await service
      .from("device_pairings")
      .delete()
      .is("consumed_at", null)
      .lt("expires_at", nowIso)
      .select("code_sha256");

    if (error) {
      console.error(
        "[cron/reap-pairings] expired+unconsumed prune failed:",
        error.message,
      );
    } else {
      expiredPruned = data?.length ?? 0;
    }
  }

  // 3b. Reap aged consumed rows (claimed > CONSUMED_RETENTION_HOURS ago).
  {
    const { data, error } = await service
      .from("device_pairings")
      .delete()
      .not("consumed_at", "is", null)
      .lt("consumed_at", consumedCutoffIso)
      .select("code_sha256");

    if (error) {
      console.error(
        "[cron/reap-pairings] aged-consumed prune failed:",
        error.message,
      );
    } else {
      consumedPruned = data?.length ?? 0;
    }
  }

  console.info(
    `[cron/reap-pairings] done — expiredPruned=${expiredPruned} ` +
      `consumedPruned=${consumedPruned}`,
  );

  return NextResponse.json({ expiredPruned, consumedPruned });
}

// Vercel Cron invokes with GET; POST kept for manual ops triggering.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
