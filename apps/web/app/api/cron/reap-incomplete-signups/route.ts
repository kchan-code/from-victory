/**
 * Cron route: GET/POST /api/cron/reap-incomplete-signups (FV-674, SSO A5)
 *
 * Cleanup reaper for accounts that signed up but never completed onboarding
 * (spec docs/fv-569-apple-google-signin-spec.md §5.7). The work lives in
 * lib/auth/reaper.ts; this file is the authenticated HTTP shell.
 *
 * ROLLOUT SAFETY: this repo auto-deploys main to production, so the cron in
 * vercel.json only starts running after a merge KC controls. It also defaults
 * to DRY RUN: unless REAPER_DRY_RUN is explicitly the string "false" it
 * computes and logs counts only and writes nothing. Going live is a deliberate
 * env change (see docs/fv-569-apple-key-operations.md).
 *
 * NOT gated by SSO_* flags: the reaper, the handoff purge and every deletion
 * path keep running when sign-in entry points are off (spec §13 rollback).
 *
 * Security: CRON_SECRET Bearer token, timingSafeEqual (same as reap-pairings).
 * Logging: counts only. No ids, emails, provider data or tokens.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Revoke calls to Apple are sequential; give a full batch room.
export const maxDuration = 60;

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isReaperDryRun, runReaper } from "@/lib/auth/reaper";

async function handleCronRequest(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/reap-incomplete-signups] CRON_SECRET is not configured. " +
        "Set this env var to protect the cron route.",
    );
    return NextResponse.json({ error: "Cron secret not configured." }, { status: 500 });
  }

  const authBuf = Buffer.from(req.headers.get("authorization") ?? "", "utf8");
  const expectedBuf = Buffer.from(`Bearer ${cronSecret}`, "utf8");
  const authorized =
    authBuf.length === expectedBuf.length && timingSafeEqual(authBuf, expectedBuf);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await runReaper(isReaperDryRun());

  console.info(
    `[cron/reap-incomplete-signups] done — dryRun=${summary.dryRun} ` +
      `candidates=${summary.candidates} tombstoned=${summary.tombstoned} ` +
      `wouldMark=${summary.wouldMark} marked=${summary.marked} ` +
      `skippedNotPending=${summary.skippedNotPending} deleted=${summary.deleted} ` +
      `finalizeNoop=${summary.finalizeNoop} revokeFailed=${summary.revokeFailed} ` +
      `forced=${summary.forced} errors=${summary.errors} ` +
      `purged=${summary.purge?.purged ?? 0} purgeKept=${summary.purge?.kept ?? 0} ` +
      `purgeForced=${summary.purge?.forced ?? 0}`,
  );

  return NextResponse.json(summary);
}

// Vercel Cron invokes with GET; POST kept for manual ops triggering.
export async function GET(req: NextRequest) {
  return handleCronRequest(req);
}

export async function POST(req: NextRequest) {
  return handleCronRequest(req);
}
