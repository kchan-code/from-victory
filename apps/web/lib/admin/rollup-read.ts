// Admin owner-metrics — long-range (year-over-year) usage READ (FV-415 part 2).
//
// Pure, no I/O, no server imports — takes already-fetched rows and shapes a
// per-period usage series. The server entry point that supplies a
// service-role client lives in ./metrics.ts (same split as metrics-core.ts).
//
// WHY THIS FILE EXISTS SEPARATELY FROM metrics-core.ts:
//   metrics-core.ts shapes the "current window" dashboard (7/30/90d, always
//   sourced from raw tables). This module shapes a MUCH longer window (1y/3y)
//   by blending raw activity_events (still exists for the last 90d) with the
//   pre-aggregated activity_rollup table (the only place a distinct-athlete
//   count survives the FV-382 90-day raw prune). It has its own day/week/month
//   bucketing helpers rather than reusing metrics-core's (which only handles
//   day/week) — deliberately decoupled so the long-range read can evolve
//   without touching the current-window core.
//
// THE BLEND — read this before changing anything here:
//   1. ONE SOURCE PER PERIOD, NEVER BOTH.
//        - period_start >= (now - 90d)  → EXACT from raw activity_events
//          (that period's raw rows still exist; count(distinct athlete_id)
//          computed here is the identical calculation the rollup function
//          itself would run).
//        - period_start <  (now - 90d)  → EXACT from activity_rollup's
//          event_name-IS-NULL row for (grain, period_start). That row is a
//          GROUPING SETS super-aggregate computed BEFORE the prune — a true
//          count(distinct athlete_id) over ALL events, not a per-event value.
//      The two windows are disjoint by period_start, so a period is sourced
//      exactly once — never summed, never double-counted at the boundary.
//   2. NEVER SUM DISTINCT COUNTS ACROSS PERIODS. Each point in the series
//      stands alone (this period's exact distinct-athlete count). Nothing
//      here adds two periods' active_athletes together.
//   3. NEVER READ event_name IS NOT NULL ROWS FOR THE HEADLINE. Per-event rows
//      (event_name set) carry per-event volume/active — summing THOSE would
//      overcount the all-events distinct (one athlete can trigger multiple
//      event types). rowsForGrain() below defensively filters to
//      event_name === null before indexing, so a caller that accidentally
//      passes mixed rows can't silently corrupt the headline.
//   4. NO K-ANONYMITY SUPPRESSION. Unlike metrics-core's SMALL_N gate (which
//      exists because narrow per-category/per-week safety buckets could
//      re-identify a minor), this shape carries NO per-minor dimension at
//      all — only the all-events headline and, optionally, per-event-type
//      volume. There is nothing narrow enough to suppress.
//
// GRAIN PER RANGE (FV-415 spec, not a product judgment call — fixed mapping):
//   rangeDays > 730 (3y tab)  → month
//   rangeDays > 90  (1y tab)  → week
//   rangeDays <= 90           → day (this module is only invoked for >90d
//     ranges by metrics.ts; day-grain support here is for completeness/tests)

const DAY_MS = 24 * 60 * 60 * 1000;

export type RollupGrain = "day" | "week" | "month";

/** Fixed grain-per-range mapping (FV-415): >730d → month, >90d → week, else day. */
export function grainForRangeDays(rangeDays: number): RollupGrain {
  if (rangeDays > 730) return "month";
  if (rangeDays > 90) return "week";
  return "day";
}

/**
 * A row from `activity_rollup`. `event_name === null` marks the all-events
 * super-aggregate (the exact DAU/WAU/MAU headline for that period) — the ONLY
 * row shape this module reads for the headline series. Non-null rows (kept in
 * the type for completeness / the optional volume trend) must never be summed
 * into the headline.
 */
export type RollupRow = {
  grain: RollupGrain;
  period_start: string; // YYYY-MM-DD
  event_name: string | null;
  active_athletes: number;
  event_count: number;
};

/** Minimal raw activity_events shape this module needs (no PII beyond athlete_id). */
export type RawActivityRow = {
  athlete_id: string;
  occurred_at: string;
};

export type UsageSource = "raw" | "rollup";

export type UsagePoint = {
  /** The period's start key — YYYY-MM-DD (day), the ISO-week Monday, or the 1st of the month. */
  period: string;
  /** Exact count(distinct athlete_id) for this period, across ALL events. Never summed. */
  activeAthletes: number;
  /** Which table this point's number came from — surfaced so the UI can render the two visually distinct. */
  source: UsageSource;
};

export type UsageTrend = {
  grain: RollupGrain;
  points: UsagePoint[];
};

// ---------------------------------------------------------------------------
// Date bucketing (UTC, self-contained — see file header for why this doesn't
// reuse metrics-core's day/week helpers).
// ---------------------------------------------------------------------------

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function dayKey(d: Date): string {
  return utcMidnight(d).toISOString().slice(0, 10);
}

/** UTC Monday that starts the ISO week containing `d`, as YYYY-MM-DD. */
function weekStartKey(d: Date): string {
  const u = utcMidnight(d);
  const dow = (u.getUTCDay() + 6) % 7; // 0 = Monday
  return dayKey(new Date(u.getTime() - dow * DAY_MS));
}

/** UTC 1st of the month containing `d`, as YYYY-MM-DD. */
function monthStartKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

function periodKeyOf(grain: RollupGrain, iso: string): string {
  const d = new Date(iso);
  if (grain === "day") return dayKey(d);
  if (grain === "week") return weekStartKey(d);
  return monthStartKey(d);
}

/** Subtract `n` calendar months from a UTC (year, 0-indexed month), returning the same shape. */
function subMonths(year: number, month0: number, n: number): { year: number; month0: number } {
  let y = year;
  let m = month0 - n;
  while (m < 0) {
    m += 12;
    y -= 1;
  }
  return { year: y, month0: m };
}

/** Contiguous day keys for the last `days` days (oldest → newest), ending "today" (UTC). */
function dayRangeKeys(now: Date, days: number): string[] {
  const end = utcMidnight(now);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(end.getTime() - i * DAY_MS)));
  }
  return keys;
}

/** Contiguous week-start keys for the last `weeks` weeks (oldest → newest). */
function weekRangeKeys(now: Date, weeks: number): string[] {
  const thisWeek = weekStartKey(now);
  const start = new Date(`${thisWeek}T00:00:00Z`).getTime();
  const keys: string[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    keys.push(dayKey(new Date(start - i * 7 * DAY_MS)));
  }
  return keys;
}

/** Contiguous month-start keys for the last `months` months (oldest → newest). */
function monthRangeKeys(now: Date, months: number): string[] {
  const cur = { year: now.getUTCFullYear(), month0: now.getUTCMonth() };
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const { year, month0 } = subMonths(cur.year, cur.month0, i);
    keys.push(`${year}-${String(month0 + 1).padStart(2, "0")}-01`);
  }
  return keys;
}

/** Contiguous period keys, oldest → newest, covering `rangeDays` at the given grain. */
export function periodRange(grain: RollupGrain, now: Date, rangeDays: number): string[] {
  if (grain === "day") return dayRangeKeys(now, Math.max(1, rangeDays));
  if (grain === "week") return weekRangeKeys(now, Math.max(1, Math.ceil(rangeDays / 7)));
  return monthRangeKeys(now, Math.max(1, Math.ceil(rangeDays / 30)));
}

// ---------------------------------------------------------------------------
// The blend
// ---------------------------------------------------------------------------

const RAW_RETENTION_DAYS = 90;

/**
 * Build the long-range (year-over-year) all-events active-athletes series.
 *
 * `activityEvents` should be the raw activity_events rows already fetched by
 * metrics.ts (capped to the last ~90 days, matching the FV-382 prune window —
 * the same rows the current-window dashboard already reads, no extra fetch).
 * `rollupRows` should be activity_rollup rows filtered to the chosen grain
 * (metrics.ts selects by grainForRangeDays(rangeDays) before calling this).
 *
 * See file header for the full one-source-per-period contract.
 */
export function buildUsageTrend(input: {
  now: Date;
  rangeDays: number;
  activityEvents: RawActivityRow[];
  rollupRows: RollupRow[];
}): UsageTrend {
  const { now, rangeDays } = input;
  const grain = grainForRangeDays(rangeDays);
  const periods = periodRange(grain, now, rangeDays);

  // The raw/rollup boundary is a plain calendar-date cutoff (not grain-
  // dependent) — a period is raw-sourced iff its period_start falls on or
  // after that date.
  const cutoffKey = dayKey(new Date(now.getTime() - RAW_RETENTION_DAYS * DAY_MS));

  // Index raw rows into distinct-athlete sets per period, ONE PASS. Every
  // event counts toward the period's all-events distinct, regardless of
  // event_name — this mirrors the rollup function's own all-events grouping
  // set (which has no event_name filter either).
  const rawAthletesByPeriod = new Map<string, Set<string>>();
  for (const e of input.activityEvents) {
    const key = periodKeyOf(grain, e.occurred_at);
    let set = rawAthletesByPeriod.get(key);
    if (!set) {
      set = new Set();
      rawAthletesByPeriod.set(key, set);
    }
    set.add(e.athlete_id);
  }

  // Index rollup rows: STRICTLY the event_name-IS-NULL, matching-grain rows.
  // This is the defensive guard against rule #3 above — a per-event row
  // (event_name set) is never allowed into this map, so it can never be read
  // as if it were the all-events headline.
  const rollupActiveByPeriod = new Map<string, number>();
  for (const r of input.rollupRows) {
    if (r.grain !== grain) continue;
    if (r.event_name !== null) continue;
    rollupActiveByPeriod.set(r.period_start, r.active_athletes);
  }

  const points: UsagePoint[] = periods.map((period) => {
    if (period >= cutoffKey) {
      return {
        period,
        activeAthletes: rawAthletesByPeriod.get(period)?.size ?? 0,
        source: "raw",
      };
    }
    return {
      period,
      activeAthletes: rollupActiveByPeriod.get(period) ?? 0,
      source: "rollup",
    };
  });

  return { grain, points };
}

// ---------------------------------------------------------------------------
// Optional: per-event volume (event_count on event_name-NOT-NULL rows). Kept
// deliberately minimal — the headline is the all-events active_athletes
// above. event_count is a plain count(*), so (unlike active_athletes) it IS
// safe to read directly per period without any distinct-count caveat.
// ---------------------------------------------------------------------------
export function buildEventVolumeTrend(input: {
  now: Date;
  rangeDays: number;
  eventName: string;
  activityEvents: (RawActivityRow & { event_name: string })[];
  rollupRows: RollupRow[];
}): { grain: RollupGrain; points: { period: string; eventCount: number; source: UsageSource }[] } {
  const { now, rangeDays, eventName } = input;
  const grain = grainForRangeDays(rangeDays);
  const periods = periodRange(grain, now, rangeDays);
  const cutoffKey = dayKey(new Date(now.getTime() - RAW_RETENTION_DAYS * DAY_MS));

  const rawCountByPeriod = new Map<string, number>();
  for (const e of input.activityEvents) {
    if (e.event_name !== eventName) continue;
    const key = periodKeyOf(grain, e.occurred_at);
    rawCountByPeriod.set(key, (rawCountByPeriod.get(key) ?? 0) + 1);
  }

  const rollupCountByPeriod = new Map<string, number>();
  for (const r of input.rollupRows) {
    if (r.grain !== grain) continue;
    if (r.event_name !== eventName) continue;
    rollupCountByPeriod.set(r.period_start, r.event_count);
  }

  const points = periods.map((period) => {
    if (period >= cutoffKey) {
      return { period, eventCount: rawCountByPeriod.get(period) ?? 0, source: "raw" as const };
    }
    return { period, eventCount: rollupCountByPeriod.get(period) ?? 0, source: "rollup" as const };
  });

  return { grain, points };
}
