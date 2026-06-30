import "server-only";

// Admin owner-metrics — SERVER DATA LAYER (server-only).
//
// Fetches the raw rows the owner dashboard needs and hands them to the pure
// shaping core in ./metrics-core.ts. Uses the SERVICE-ROLE client because the
// owner dashboard reports cross-user aggregates, which RLS (correctly) forbids
// for any normal session. This module is therefore the trust boundary:
//
//   1. It is `server-only` and only reached through requireAdminParent() — the
//      owner gate. A non-admin can never invoke it.
//   2. It selects the MINIMUM columns needed and never touches journal_entries
//      or any free-text content. (athlete_sessions/safety_events carry no
//      content; journal_entries is never queried here.)
//   3. All per-athlete signals are aggregated to counts/rates inside the core
//      before anything is returned to the page. No athlete-identifying row
//      leaves this layer.
//
// Scale note: v1 fetches rows and aggregates in-process, which is correct for a
// beta cohort (tens–hundreds of athletes). When the data outgrows that, move the
// aggregation into SQL views / RPCs (a follow-up); the page contract stays the
// same because it only consumes the AdminMetrics shape.

import { priceIdToLabel } from "@/lib/subscriptions/plans";
import { createServiceClient } from "@/lib/supabase/service";

import {
  shapeAdminMetrics,
  type AdminMetrics,
  type AuthEventRow,
  type CatalogRow,
  type DeletionRow,
  type PairingRow,
  type ParentLinkRow,
  type ProfileRow,
  type SafetyEventRow,
  type SessionRow,
  type SubscriptionRow,
  type WaitlistRow,
} from "./metrics-core";

export type { AdminMetrics } from "./metrics-core";

export const DEFAULT_RANGE_DAYS = 30;

/**
 * Compute the full owner-metrics model. Caller MUST gate with
 * requireAdminParent() first — this function does no auth of its own.
 */
export async function getAdminMetrics(
  rangeDays: number = DEFAULT_RANGE_DAYS,
): Promise<AdminMetrics> {
  const supabase = createServiceClient();

  const monthlyId = process.env.STRIPE_PRICE_ID_MONTHLY;
  const annualId = process.env.STRIPE_PRICE_ID_ANNUAL;
  const planLabelFor = (priceId: string | null) =>
    priceIdToLabel(priceId, monthlyId, annualId);

  // Fire all reads in parallel. Each falls back to an empty set on error so the
  // dashboard degrades gracefully (a single failing table can't blank the page).
  // The two head-count queries (sport-selected, quiz-complete) count non-null
  // rows WITHOUT pulling the athlete-private values themselves — a privacy
  // control: we never read focus_area/position, only that they are set.
  const [
    profilesRes,
    sessionsRes,
    catalogRes,
    subsRes,
    waitlistRes,
    pushRes,
    safetyRes,
    deletionsRes,
    linksRes,
    pairingsRes,
    authRes,
    sportSelectedRes,
    quizCompleteRes,
  ] = await Promise.all([
    supabase.from("profiles").select("role, created_at, sport"),
    supabase
      .from("athlete_sessions")
      .select("athlete_id, catalog_id, started_at, completed_at"),
    supabase.from("training_sessions_catalog").select("id, day_number, sport"),
    supabase
      .from("subscriptions")
      .select("parent_id, status, price_id, cancel_at_period_end, created_at"),
    supabase.from("waitlist_signups").select("role, sport, created_at"),
    supabase.from("push_subscriptions").select("athlete_id", { count: "exact", head: true }),
    supabase.from("safety_events").select("category, detected_at"),
    supabase.from("account_deletion_events").select("event_type, created_at"),
    supabase.from("parent_athlete_links").select("parent_id"),
    supabase.from("device_pairings").select("consumed_at, expires_at"),
    supabase.from("auth_rate_limit_events").select("action, created_at"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "athlete")
      .not("sport_selected_at", "is", null),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "athlete")
      .not("focus_area", "is", null),
  ]);

  return shapeAdminMetrics({
    now: new Date(),
    rangeDays,
    profiles: (profilesRes.data ?? []) as ProfileRow[],
    sessions: (sessionsRes.data ?? []) as SessionRow[],
    catalog: (catalogRes.data ?? []) as CatalogRow[],
    subscriptions: (subsRes.data ?? []) as SubscriptionRow[],
    waitlist: (waitlistRes.data ?? []) as WaitlistRow[],
    pushOptInCount: pushRes.count ?? 0,
    safetyEvents: (safetyRes.data ?? []) as SafetyEventRow[],
    deletions: (deletionsRes.data ?? []) as DeletionRow[],
    parentLinks: (linksRes.data ?? []) as ParentLinkRow[],
    pairings: (pairingsRes.data ?? []) as PairingRow[],
    authEvents: (authRes.data ?? []) as AuthEventRow[],
    athleteSportSelectedCount: sportSelectedRes.count ?? 0,
    athleteQuizCompleteCount: quizCompleteRes.count ?? 0,
    planLabelFor,
  });
}
