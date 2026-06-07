// FV-85 — dashboard rhythm metadata: pure shaping core + data fetch.
//
// Imports from lib/dashboard/rhythm-core (no server-only, no createClient)
// so these tests run cleanly in the vitest node environment.
// The thin server wrapper (rhythm.ts) is not tested here — it only wires
// createClient(), which is tested via integration.

import { describe, it, expect } from "vitest";

import {
  shapeAthleteRhythm,
  loadAthleteMetadataMap,
  ZERO_RHYTHM,
} from "@/lib/dashboard/rhythm-core";
import { TOTAL_TRAINING_DAYS } from "@/lib/daily/progression";

// ---------------------------------------------------------------------------
// shapeAthleteRhythm — pure function; no DB dependency
// ---------------------------------------------------------------------------

describe("shapeAthleteRhythm", () => {
  it("null inputs (no row) → 0% + encouraging 'rhythm starts today' label", () => {
    const result = shapeAthleteRhythm({
      sessions_completed: null,
      sessions_started: null,
      last_completed_at: null,
    });

    expect(result.sessionsCompleted).toBe(0);
    expect(result.sessionsStarted).toBe(0);
    expect(result.progressPct).toBe(0);
    expect(result.ringLabel).toBe("rhythm starts today");
    expect(result.lastCompletedAt).toBeNull();
  });

  it("1 completed → singular 'session complete' label", () => {
    const result = shapeAthleteRhythm({
      sessions_completed: 1,
      sessions_started: 1,
      last_completed_at: "2026-06-01T10:00:00Z",
    });

    expect(result.sessionsCompleted).toBe(1);
    expect(result.ringLabel).toBe("1 session complete");
    expect(result.progressPct).toBe(Math.round((1 / TOTAL_TRAINING_DAYS) * 100));
    expect(result.lastCompletedAt).toBe("2026-06-01T10:00:00Z");
  });

  it("multiple completed → plural label", () => {
    const result = shapeAthleteRhythm({
      sessions_completed: 5,
      sessions_started: 6,
      last_completed_at: "2026-06-05T08:00:00Z",
    });

    expect(result.sessionsCompleted).toBe(5);
    expect(result.sessionsStarted).toBe(6);
    expect(result.ringLabel).toBe("5 sessions complete");
    expect(result.progressPct).toBe(Math.round((5 / TOTAL_TRAINING_DAYS) * 100));
  });

  it("progressPct matches the athlete-side formula exactly: round(N / TOTAL_TRAINING_DAYS * 100)", () => {
    expect(
      shapeAthleteRhythm({ sessions_completed: 0, sessions_started: 0, last_completed_at: null }).progressPct,
    ).toBe(0);
    expect(
      shapeAthleteRhythm({ sessions_completed: 15, sessions_started: 15, last_completed_at: null }).progressPct,
    ).toBe(50);
    expect(
      shapeAthleteRhythm({ sessions_completed: 30, sessions_started: 30, last_completed_at: null }).progressPct,
    ).toBe(100);
    // Non-round values
    expect(
      shapeAthleteRhythm({ sessions_completed: 10, sessions_started: 10, last_completed_at: null }).progressPct,
    ).toBe(33);
    expect(
      shapeAthleteRhythm({ sessions_completed: 7, sessions_started: 7, last_completed_at: null }).progressPct,
    ).toBe(23);
  });

  it("all 30 days complete → 100% ring, plural label, lastCompletedAt preserved", () => {
    const ts = "2026-07-01T20:00:00Z";
    const result = shapeAthleteRhythm({
      sessions_completed: 30,
      sessions_started: 30,
      last_completed_at: ts,
    });
    expect(result.progressPct).toBe(100);
    expect(result.ringLabel).toBe("30 sessions complete");
    expect(result.lastCompletedAt).toBe(ts);
  });
});

// ---------------------------------------------------------------------------
// ZERO_RHYTHM constant
// ---------------------------------------------------------------------------

describe("ZERO_RHYTHM", () => {
  it("is equivalent to shapeAthleteRhythm with all-null inputs", () => {
    const manual = shapeAthleteRhythm({
      sessions_completed: null,
      sessions_started: null,
      last_completed_at: null,
    });
    expect(ZERO_RHYTHM).toEqual(manual);
  });

  it("has progressPct=0 and ringLabel='rhythm starts today'", () => {
    expect(ZERO_RHYTHM.progressPct).toBe(0);
    expect(ZERO_RHYTHM.ringLabel).toBe("rhythm starts today");
  });
});

// ---------------------------------------------------------------------------
// Fake Supabase client for loadAthleteMetadataMap (injection pattern)
// ---------------------------------------------------------------------------

type FakeRow = {
  athlete_id: string | null;
  sessions_started: number | null;
  sessions_completed: number | null;
  last_completed_at: string | null;
};

type FakeOpts = {
  rows?: FakeRow[];
  error?: { message: string };
};

function makeFakeDashboardClient(opts: FakeOpts) {
  const capturedSelects: string[] = [];

  const chain = {
    select: (cols: string) => {
      capturedSelects.push(cols);
      // Make the chain thenable (awaited directly, no .single())
      return {
        then: (onFulfilled: (v: unknown) => unknown) => {
          return Promise.resolve({
            data: opts.rows ?? [],
            error: opts.error ?? null,
          }).then(onFulfilled);
        },
      };
    },
  };

  const client = {
    from: (_table: string) => chain,
    _capturedSelects: capturedSelects,
  };

  return client as unknown as Parameters<typeof loadAthleteMetadataMap>[0] & {
    _capturedSelects: string[];
  };
}

// ---------------------------------------------------------------------------
// loadAthleteMetadataMap
// ---------------------------------------------------------------------------

describe("loadAthleteMetadataMap", () => {
  it("returns a map keyed by athlete_id with shaped rhythm for each row", async () => {
    const fakeClient = makeFakeDashboardClient({
      rows: [
        {
          athlete_id: "athlete-a",
          sessions_started: 3,
          sessions_completed: 2,
          last_completed_at: "2026-06-01T09:00:00Z",
        },
        {
          athlete_id: "athlete-b",
          sessions_started: 10,
          sessions_completed: 10,
          last_completed_at: "2026-06-05T12:00:00Z",
        },
      ],
    });

    const map = await loadAthleteMetadataMap(fakeClient);

    expect(map.size).toBe(2);

    const a = map.get("athlete-a");
    expect(a).toBeDefined();
    expect(a?.sessionsCompleted).toBe(2);
    expect(a?.sessionsStarted).toBe(3);
    expect(a?.progressPct).toBe(Math.round((2 / TOTAL_TRAINING_DAYS) * 100));

    const b = map.get("athlete-b");
    expect(b?.progressPct).toBe(Math.round((10 / TOTAL_TRAINING_DAYS) * 100));
    expect(b?.ringLabel).toBe("10 sessions complete");
  });

  it("athlete with no metadata row is absent → caller falls back to ZERO_RHYTHM", async () => {
    const fakeClient = makeFakeDashboardClient({ rows: [] });
    const map = await loadAthleteMetadataMap(fakeClient);
    expect(map.size).toBe(0);
    // The caller pattern: rhythmMap.get(id) ?? ZERO_RHYTHM
    const fallback = map.get("unknown-athlete") ?? ZERO_RHYTHM;
    expect(fallback.progressPct).toBe(0);
    expect(fallback.ringLabel).toBe("rhythm starts today");
  });

  it("skips rows where athlete_id is null (view column is nullable)", async () => {
    const fakeClient = makeFakeDashboardClient({
      rows: [
        // null athlete_id — must be skipped
        {
          athlete_id: null,
          sessions_started: 5,
          sessions_completed: 5,
          last_completed_at: null,
        },
        {
          athlete_id: "athlete-c",
          sessions_started: 1,
          sessions_completed: 1,
          last_completed_at: null,
        },
      ],
    });

    const map = await loadAthleteMetadataMap(fakeClient);
    expect(map.size).toBe(1);
    expect(map.has("athlete-c")).toBe(true);
  });

  it("on DB error returns an empty map (non-fatal degraded view)", async () => {
    const fakeClient = makeFakeDashboardClient({
      error: { message: "permission denied" },
    });
    const map = await loadAthleteMetadataMap(fakeClient);
    expect(map.size).toBe(0);
  });

  it("selects ONLY the four required view columns — no content or journal fields", async () => {
    const fakeClient = makeFakeDashboardClient({ rows: [] });
    await loadAthleteMetadataMap(fakeClient);

    const selectStr = fakeClient._capturedSelects[0] ?? "";
    expect(selectStr).toContain("athlete_id");
    expect(selectStr).toContain("sessions_started");
    expect(selectStr).toContain("sessions_completed");
    expect(selectStr).toContain("last_completed_at");
    // Hard privacy check: no content or journal column names
    expect(selectStr).not.toContain("content");
    expect(selectStr).not.toContain("journal");
    expect(selectStr).not.toContain("mental_skill");
    expect(selectStr).not.toContain("scripture");
  });

  it("merge-by-athlete_id correctness: second row for same id overwrites the first", async () => {
    // In practice the view won't return duplicates, but the Map.set semantics
    // are deterministic — last write wins, never loses data silently.
    const fakeClient = makeFakeDashboardClient({
      rows: [
        { athlete_id: "athlete-d", sessions_started: 1, sessions_completed: 1, last_completed_at: null },
        { athlete_id: "athlete-d", sessions_started: 2, sessions_completed: 2, last_completed_at: null },
      ],
    });
    const map = await loadAthleteMetadataMap(fakeClient);
    // Only one entry in the map; the last write (2 completed) wins.
    expect(map.size).toBe(1);
    expect(map.get("athlete-d")?.sessionsCompleted).toBe(2);
  });
});
