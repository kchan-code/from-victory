/**
 * GET /api/athlete/access — training-entitlement check for the pregame shell
 * (FV-625).
 *
 * /athlete/pregame is a static, PII-free, offline-tolerant shell (FV-107): it
 * cannot call requireActiveAccess() server-side without breaking the service
 * worker's cached-shell contract (public/sw.js `pregame-shell-network-first`).
 * So PregameClientShell asks this route while online and applies the SAME
 * decision every other training surface gets from requireActiveAccess() —
 * both go through resolveTrainingAccess() in lib/subscriptions/enforce.ts.
 *
 * Response (200): `{ redirect: null, offlineUntil }` when entitled, otherwise
 * `{ redirect: "/athlete/paused" | "/athlete/paused?reason=seats" | "/subscribe",
 *    offlineUntil: null }`.
 *
 * `offlineUntil` (KC policy 2026-11-09): the end of the last verified
 * entitlement period — the subscription's current period end (the trial end
 * while trialing), a dated comp grant's expiry, or the Apple expiry — as an
 * ISO timestamp; null when the entitlement has no end date (a perpetual comp
 * grant), when gating is off, or when blocked. The shell reuses a verified
 * answer offline only until that moment.
 *
 * PRIVACY: a redirect path plus that ONE timestamp cross the wire — never the
 * access level, subscription status, plan, provider, price, grant details or
 * the parent's identity. On the minor-athlete path the timestamp is the
 * family's renewal/trial/grant end date (reviewed by kids-privacy-officer,
 * FV-625). `Cache-Control: no-store` keeps the answer out of every cache;
 * /api/* is also on the service worker's network-only bypass list.
 *
 * 401 — no session. 403 — a signed-in non-athlete (parents have no training).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  resolveOfflineEntitlementUntil,
  resolveTrainingAccess,
} from "@/lib/subscriptions/enforce";
import type { TrainingAccessResponse } from "@/lib/subscriptions/training-redirects";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: NO_STORE });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401, headers: NO_STORE });
  }

  if (profile.role !== "athlete" && profile.role !== "adult_athlete") {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: NO_STORE });
  }

  const decision = await resolveTrainingAccess({ role: profile.role });
  const body: TrainingAccessResponse = decision.allowed
    ? { redirect: null, offlineUntil: await resolveOfflineEntitlementUntil() }
    : { redirect: decision.redirectTo, offlineUntil: null };
  return NextResponse.json(body, { status: 200, headers: NO_STORE });
}
