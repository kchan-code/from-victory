/**
 * POST /api/internal/play-auth-check (FV-782)
 *
 * Operator check: can THIS deployment obtain a Google Play access token with
 * the keyless credential (FV-779)? Every other caller of the Play token is
 * gated by GOOGLE_PLAY_CATALOG_ACTIVE, so without this route a working
 * production connection cannot be observed before billing is switched on.
 *
 * What it does: the token exchange only. It makes no Play API call, reads or
 * writes no database row, and does not read or change the billing switch.
 *
 * Security:
 *   - CRON_SECRET Bearer token must match (constant-time compare), the same
 *     gate as the cron routes. Missing secret config rejects (fail closed).
 *   - The answer is pass or fail and nothing else. The token is discarded; no
 *     token, credential, provider name, or library error text is returned or
 *     logged. Log lines are fixed strings.
 *   - NOT scheduled: there is deliberately no vercel.json cron entry. An
 *     operator calls it by hand. POST only, so nothing prefetches or caches it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPlayAccessToken } from "@/lib/subscriptions/google-play-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[play-auth-check] CRON_SECRET is not configured.");
    return NextResponse.json(
      { error: "Not configured." },
      { status: 500, headers: NO_STORE },
    );
  }

  const authBuf = Buffer.from(req.headers.get("authorization") ?? "", "utf8");
  const expectedBuf = Buffer.from(`Bearer ${cronSecret}`, "utf8");
  if (
    authBuf.length !== expectedBuf.length ||
    !timingSafeEqual(authBuf, expectedBuf)
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401, headers: NO_STORE },
    );
  }

  let ok = false;
  try {
    // The token itself is discarded: only whether one was issued matters.
    ok = (await getPlayAccessToken()).length > 0;
  } catch {
    // Deliberately no error detail: see the header.
    ok = false;
  }

  if (!ok) {
    console.error("[play-auth-check] token exchange failed");
    return NextResponse.json({ ok: false }, { status: 503, headers: NO_STORE });
  }
  console.log("[play-auth-check] token exchange ok");
  return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
}
