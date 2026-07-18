// FV-415 part 2 — long-range (year-over-year) usage READ. Pure, no I/O, so
// this runs in the default vitest node env like admin-metrics.test.ts.

import { describe, it, expect } from "vitest";

import {
  buildUsageTrend,
  grainForRangeDays,
  periodRange,
  type RawActivityRow,
  type RollupRow,
} from "@/lib/admin/rollup-read";

const NOW = new Date("2026-07-10T12:00:00Z"); // Friday

describe("grainForRangeDays — fixed mapping (FV-415)", () => {
  it("day for <=90d", () => {
    expect(grainForRangeDays(7)).toBe("day");
    expect(grainForRangeDays(30)).toBe("day");
    expect(grainForRangeDays(90)).toBe("day");
  });

  it("week for >90d up to 730d (the 1y tab)", () => {
    expect(grainForRangeDays(91)).toBe("week");
    expect(grainForRangeDays(365)).toBe("week");
    expect(grainForRangeDays(730)).toBe("week");
  });

  it("month for >730d (the 3y tab)", () => {
    expect(grainForRangeDays(731)).toBe("month");
    expect(grainForRangeDays(1095)).toBe("month");
  });
});

describe("periodRange — contiguous period keys, oldest to newest", () => {
  it("day grain: exactly `rangeDays` contiguous day keys ending today", () => {
    const keys = periodRange("day", NOW, 5);
    expect(keys).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
    ]);
  });

  it("week grain: contiguous Monday-start keys", () => {
    const keys = periodRange("week", NOW, 21); // ceil(21/7) = 3 weeks
    // 2026-07-10 is a Friday; its week starts Monday 2026-07-06.
    expect(keys).toEqual(["2026-06-22", "2026-06-29", "2026-07-06"]);
  });

  it("month grain: contiguous calendar-month-start keys, crossing a year boundary", () => {
    const keys = periodRange("month", new Date("2026-01-15T00:00:00Z"), 90); // ceil(90/30)=3
    expect(keys).toEqual(["2025-11-01", "2025-12-01", "2026-01-01"]);
  });
});

describe("buildUsageTrend — the one-source-per-period blend", () => {
  it("recent (raw-window) periods read the EXACT distinct-athlete count from raw activity_events, never from rollup", () => {
    const activityEvents: RawActivityRow[] = [
      { athlete_id: "A1", occurred_at: "2026-07-10T08:00:00Z" },
      { athlete_id: "A2", occurred_at: "2026-07-10T09:00:00Z" },
      { athlete_id: "A1", occurred_at: "2026-07-10T10:00:00Z" }, // same athlete, second event same day
    ];
    // A rollup row for the SAME period_start that, if wrongly consulted,
    // would give a different (wrong) answer — proves raw wins for this period.
    const rollupRows: RollupRow[] = [
      { grain: "day", period_start: "2026-07-10", event_name: null, active_athletes: 999, event_count: 999 },
    ];
    const trend = buildUsageTrend({ now: NOW, rangeDays: 1, activityEvents, rollupRows });
    expect(trend.grain).toBe("day");
    expect(trend.points).toEqual([{ period: "2026-07-10", activeAthletes: 2, source: "raw" }]);
  });

  it("long-range (>90d) series reads the event_name-IS-NULL row directly — NOT a sum of per-event rows", () => {
    // Old period (>90d back): per-event rows that, if summed, would give 7
    // (3+4), but the true distinct-athlete count for the period is 5 (some
    // athletes triggered both event types). The event_name-NULL row carries
    // the correct exact value; buildUsageTrend must read THAT, not sum the
    // per-event rows below it.
    const oldPeriod = "2025-01-01"; // > 90 days before NOW
    const rollupRows: RollupRow[] = [
      { grain: "month", period_start: oldPeriod, event_name: "app_open", active_athletes: 3, event_count: 10 },
      { grain: "month", period_start: oldPeriod, event_name: "pregame_start", active_athletes: 4, event_count: 6 },
      { grain: "month", period_start: oldPeriod, event_name: null, active_athletes: 5, event_count: 16 },
    ];
    const trend = buildUsageTrend({
      now: NOW,
      rangeDays: 1095, // 3y -> month grain
      activityEvents: [],
      rollupRows,
    });
    const point = trend.points.find((p) => p.period === oldPeriod);
    expect(point).toBeDefined();
    expect(point?.activeAthletes).toBe(5); // the exact NULL-row value
    expect(point?.activeAthletes).not.toBe(3 + 4); // guard: never a sum of per-event rows
    expect(point?.source).toBe("rollup");
  });

  it("defensively ignores per-event (event_name NOT NULL) rows even if they're the only rollup rows present for a period", () => {
    const oldPeriod = "2025-01-01";
    const rollupRows: RollupRow[] = [
      { grain: "month", period_start: oldPeriod, event_name: "app_open", active_athletes: 42, event_count: 100 },
    ];
    const trend = buildUsageTrend({ now: NOW, rangeDays: 1095, activityEvents: [], rollupRows });
    const point = trend.points.find((p) => p.period === oldPeriod);
    // No event_name-NULL row exists for this period -> falls back to 0, never
    // silently reads the per-event row as if it were the headline.
    expect(point?.activeAthletes).toBe(0);
  });

  it("every period is sourced exactly once — no boundary double-count", () => {
    // NOW2 chosen so (NOW2 - 90d) lands exactly on a week's Monday, so the
    // week-grain boundary between raw and rollup sits at a clean period_start.
    const NOW2 = new Date("2026-07-12T12:00:00Z"); // Sunday
    const boundaryWeekStart = "2026-04-13"; // Monday = NOW2 - 90d, exactly
    const priorWeekStart = "2026-04-06"; // one week earlier — entirely pre-cutoff

    // The boundary week: raw events dated ON the cutoff Monday itself. A
    // rollup row for the SAME period_start carries a deliberately wrong value
    // (999) — if it were consulted at all, the test would see 999 or 999+2.
    const activityEvents: RawActivityRow[] = [
      { athlete_id: "X1", occurred_at: `${boundaryWeekStart}T00:00:00Z` },
      { athlete_id: "X2", occurred_at: `${boundaryWeekStart}T01:00:00Z` },
    ];
    const rollupRows: RollupRow[] = [
      { grain: "week", period_start: boundaryWeekStart, event_name: null, active_athletes: 999, event_count: 999 },
      { grain: "week", period_start: priorWeekStart, event_name: null, active_athletes: 7, event_count: 20 },
    ];

    const trend = buildUsageTrend({
      now: NOW2,
      rangeDays: 365, // week grain
      activityEvents,
      rollupRows,
    });

    const boundaryPoint = trend.points.find((p) => p.period === boundaryWeekStart);
    expect(boundaryPoint).toEqual({ period: boundaryWeekStart, activeAthletes: 2, source: "raw" });

    const priorPoint = trend.points.find((p) => p.period === priorWeekStart);
    expect(priorPoint).toEqual({ period: priorWeekStart, activeAthletes: 7, source: "rollup" });
  });

  it("produces one point per period with no gaps across the raw/rollup boundary", () => {
    const trend = buildUsageTrend({
      now: NOW,
      rangeDays: 365,
      activityEvents: [],
      rollupRows: [],
    });
    expect(trend.grain).toBe("week");
    // Exactly ceil(365/7) contiguous weekly points, each period distinct.
    expect(trend.points).toHaveLength(Math.ceil(365 / 7));
    const periods = trend.points.map((p) => p.period);
    expect(new Set(periods).size).toBe(periods.length); // no duplicate periods
    // Every point has a source (raw or rollup) — nothing left unsourced.
    for (const p of trend.points) {
      expect(["raw", "rollup"]).toContain(p.source);
    }
  });
});
