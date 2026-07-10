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
  buildUsageTrend,
  grainForRangeDays,
  type RollupRow,
} from "@/lib/admin/rollup-read";

import {
  shapeAdminMetrics,
  type ActivityRow,
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

// Page size for the paginated lifetime-table fetches below (athlete_sessions,
// activity_events). PostgREST/Supabase silently caps `.select()` at its default
// row limit, so a naive `.limit(MAX_FETCH)` just moves the silent cap to a
// bigger (still silent) number. fetchAllRows() below pages through the full
// table via `.range()` instead, so nothing is dropped without saying so.
const PAGE_SIZE = 1000;

// Circuit-breaker: v1 aggregates in-process, which is correct for a beta
// cohort. If a table ever grows past this many rows, stop paginating rather
// than hammering the DB or hanging the dashboard request — log loudly and
// return what we have with `truncated: true`. The real scale fix past this
// point is SQL-side aggregation (documented follow-up: a view/RPC).
const SAFETY_CEILING = 500_000;

// `data` is deliberately typed `unknown` here (not `T[] | null`) so this helper
// doesn't have to fight Supabase's generated per-select-string row type — the
// caller casts to the metrics-core Row type on the way out, matching the
// `(res.data ?? []) as XRow[]` pattern already used for every other query in
// this file.
type RangeResult = { data: unknown; error: { message: string } | null };

/**
 * Fetch every row of a query by paging through `.range(from, to)` in
 * PAGE_SIZE chunks, instead of relying on a single `.limit()` that silently
 * truncates. Stops (with `truncated: true`) if:
 *   - a page errors mid-pagination (partial data already fetched is kept), or
 *   - the SAFETY_CEILING is exceeded.
 * Both cases console.error loudly with the table label + offset so a runaway
 * table shows up in logs instead of silently under-reporting metrics.
 */
async function fetchAllRows<T>(
  label: string,
  build: (from: number, to: number) => PromiseLike<RangeResult>,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await build(from, to);

    if (error) {
      console.error(
        `[admin-metrics] fetchAllRows(${label}) failed at offset ${from}: ${error.message}`,
      );
      return { rows, truncated: true };
    }

    const page = (data ?? []) as T[];
    rows.push(...page);

    if (page.length < PAGE_SIZE) {
      return { rows, truncated: false };
    }

    from += PAGE_SIZE;

    if (from >= SAFETY_CEILING) {
      console.error(
        `[admin-metrics] fetchAllRows(${label}) hit SAFETY_CEILING=${SAFETY_CEILING} at offset ${from}; truncating`,
      );
      return { rows, truncated: true };
    }
  }
}

/**
 * Compute the full owner-metrics model. Caller MUST gate with
 * requireAdminParent() first — this function does no auth of its own.
 */
export async function getAdminMetrics(
  requestedRangeDays: number = DEFAULT_RANGE_DAYS,
): Promise<AdminMetrics> {
  const supabase = createServiceClient();

  const monthlyId = process.env.STRIPE_PRICE_ID_MONTHLY;
  const annualId = process.env.STRIPE_PRICE_ID_ANNUAL;
  const planLabelFor = (priceId: string | null) =>
    priceIdToLabel(priceId, monthlyId, annualId);

  // FV-415 part 2: the >90d tabs (365/1095) add a long-range activity_rollup
  // panel (below) but do NOT extend every other section to that window — the
  // "raw sections" (everything shapeAdminMetrics computes from raw tables)
  // stay capped at min(rangeDays, 90) so the 7/30/90 tabs are byte-identical
  // to before this change, and the 365/1095 tabs render identically to the
  // 90d tab PLUS the new longRange series. `rangeDays` below is therefore
  // always <= 90; `requestedRangeDays` (the true selection) only feeds the
  // rollup query + buildUsageTrend.
  const rangeDays = Math.min(requestedRangeDays, 90);

  // The append-heavy log tables (safety/deletions/auth) are only ever consumed
  // within the selected range, so floor them at the query to bound the scan.
  const rangeCutoffIso = new Date(
    Date.now() - rangeDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  // activity_events feeds DAU/WAU/MAU (≤30d) and 8-week pregame trends (≤56d)
  // regardless of the selected range, so floor it at the WIDER of the two.
  const activityCutoffIso = new Date(
    Date.now() - Math.max(rangeDays, 90) * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Fire all reads in parallel. Each falls back to an empty set on error so the
  // dashboard degrades gracefully (a single failing table can't blank the page).
  // The two head-count queries (sport-selected, quiz-complete) count non-null
  // rows WITHOUT pulling the athlete-private values themselves — a privacy
  // control: we never read focus_area/position, only that they are set.
  const [
    profilesRes,
    sessionsResult,
    catalogRes,
    subsRes,
    waitlistRes,
    pushRes,
    safetyRes,
    deletionsRes,
    linksRes,
    pairingsRes,
    authRes,
    activityResult,
    sportSelectedRes,
    quizCompleteRes,
  ] = await Promise.all([
    supabase.from("profiles").select("role, created_at, sport"),
    fetchAllRows<SessionRow>("athlete_sessions", (from, to) =>
      supabase
        .from("athlete_sessions")
        .select("athlete_id, catalog_id, started_at, completed_at")
        .range(from, to),
    ),
    supabase.from("training_sessions_catalog").select("id, day_number, sport"),
    supabase
      .from("subscriptions")
      .select("parent_id, status, price_id, cancel_at_period_end, created_at"),
    supabase.from("waitlist_signups").select("role, sport, created_at"),
    supabase.from("push_subscriptions").select("athlete_id", { count: "exact", head: true }),
    supabase.from("safety_events").select("category, detected_at").gte("detected_at", rangeCutoffIso),
    supabase
      .from("account_deletion_events")
      .select("event_type, created_at")
      .gte("created_at", rangeCutoffIso),
    supabase.from("parent_athlete_links").select("parent_id"),
    supabase.from("device_pairings").select("consumed_at, expires_at"),
    supabase
      .from("auth_rate_limit_events")
      .select("action, created_at")
      .gte("created_at", rangeCutoffIso),
    fetchAllRows<ActivityRow>("activity_events", (from, to) =>
      supabase
        .from("activity_events")
        .select("athlete_id, event_name, occurred_at")
        .gte("occurred_at", activityCutoffIso)
        .range(from, to),
    ),
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

  // fetchAllRows() already console.errors loudly on truncation (table + offset);
  // this just gives the aggregate outcome one more visible line in server logs.
  if (sessionsResult.truncated || activityResult.truncated) {
    console.error(
      `[admin-metrics] getAdminMetrics returning TRUNCATED data — athlete_sessions truncated=${sessionsResult.truncated}, activity_events truncated=${activityResult.truncated}`,
    );
  }

  const now = new Date();

  const metrics = shapeAdminMetrics({
    now,
    rangeDays,
    profiles: (profilesRes.data ?? []) as ProfileRow[],
    sessions: sessionsResult.rows,
    catalog: (catalogRes.data ?? []) as CatalogRow[],
    subscriptions: (subsRes.data ?? []) as SubscriptionRow[],
    waitlist: (waitlistRes.data ?? []) as WaitlistRow[],
    pushOptInCount: pushRes.count ?? 0,
    safetyEvents: (safetyRes.data ?? []) as SafetyEventRow[],
    deletions: (deletionsRes.data ?? []) as DeletionRow[],
    parentLinks: (linksRes.data ?? []) as ParentLinkRow[],
    pairings: (pairingsRes.data ?? []) as PairingRow[],
    authEvents: (authRes.data ?? []) as AuthEventRow[],
    activityEvents: activityResult.rows,
    athleteSportSelectedCount: sportSelectedRes.count ?? 0,
    athleteQuizCompleteCount: quizCompleteRes.count ?? 0,
    planLabelFor,
  });

  // FV-415 part 2: only the >90d tabs (365/1095) read activity_rollup. The
  // raw activityResult.rows fetched above already cover the last 90 days
  // (activityCutoffIso is floored at 90 regardless of rangeDays) — the exact
  // same rows buildUsageTrend uses for its "period_start >= now-90d" raw
  // path, so no second raw fetch is needed here.
  if (requestedRangeDays > 90) {
    const grain = grainForRangeDays(requestedRangeDays);
    const rollupCutoffIso = new Date(
      Date.now() - requestedRangeDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const rollupRes = await supabase
      .from("activity_rollup")
      .select("grain, period_start, event_name, active_athletes, event_count")
      .eq("grain", grain)
      .gte("period_start", rollupCutoffIso.slice(0, 10));

    if (rollupRes.error) {
      // Graceful degrade: no longRange panel rather than a broken page.
      console.error(
        `[admin-metrics] activity_rollup read failed for grain=${grain}: ${rollupRes.error.message}`,
      );
    } else {
      metrics.longRange = buildUsageTrend({
        now,
        rangeDays: requestedRangeDays,
        activityEvents: activityResult.rows,
        rollupRows: (rollupRes.data ?? []) as RollupRow[],
      });
    }
  }

  return metrics;
}
