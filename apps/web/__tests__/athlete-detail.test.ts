// FV-191 — athlete-detail pure core: shapeAthleteDetail + loadAthleteDetail.
//
// Imports from lib/dashboard/athlete-detail (no server-only, no createClient).
// Tests run in vitest node environment — no jsdom needed.
//
// Privacy contract tests (the ones that would catch a future regression):
//   1. Return shape contains ONLY dates/counts/day-numbers — no content fields.
//   2. loadAthleteDetail select string NEVER includes content, journal,
//      mental_skill, scripture, or prompt columns.

import { describe, it, expect } from "vitest";

import {
  shapeAthleteDetail,
  loadAthleteDetail,
  type AthleteDetailData,
} from "@/lib/dashboard/athlete-detail-core";

// ---------------------------------------------------------------------------
// shapeAthleteDetail — pure function; no DB dependency
// ---------------------------------------------------------------------------

describe("shapeAthleteDetail", () => {
  it("empty rows → zero sessions, empty completedDays, null lastActiveAt", () => {
    const result = shapeAthleteDetail(
      "athlete-uuid",
      "Alex",
      "2009-03-15",
      "hockey",
      [],
    );

    expect(result.athleteId).toBe("athlete-uuid");
    expect(result.firstName).toBe("Alex");
    expect(result.birthdate).toBe("2009-03-15");
    expect(result.sport).toBe("hockey");
    expect(result.sessionsStarted).toBe(0);
    expect(result.sessionsCompleted).toBe(0);
    expect(result.completedDays).toHaveLength(0);
    expect(result.lastActiveAt).toBeNull();
  });

  it("rows with null completed_at do not appear in completedDays", () => {
    const rows = [
      { completed_at: null, training_sessions_catalog: { day_number: 1 } },
      { completed_at: null, training_sessions_catalog: { day_number: 2 } },
    ];
    const result = shapeAthleteDetail("id", "Sam", null, "basketball", rows);

    expect(result.sessionsStarted).toBe(2);
    expect(result.sessionsCompleted).toBe(0);
    expect(result.completedDays).toHaveLength(0);
    expect(result.lastActiveAt).toBeNull();
  });

  it("completed rows appear in completedDays sorted ascending by completedAt", () => {
    const rows = [
      {
        completed_at: "2026-06-05T10:00:00Z",
        training_sessions_catalog: { day_number: 3 },
      },
      {
        completed_at: "2026-06-01T08:00:00Z",
        training_sessions_catalog: { day_number: 1 },
      },
      {
        completed_at: "2026-06-03T09:00:00Z",
        training_sessions_catalog: { day_number: 2 },
      },
    ];
    const result = shapeAthleteDetail("id", "Jordan", "2008-07-20", "hockey", rows);

    expect(result.sessionsStarted).toBe(3);
    expect(result.sessionsCompleted).toBe(3);
    expect(result.completedDays).toHaveLength(3);
    // Sorted ascending
    expect(result.completedDays[0]?.completedAt).toBe("2026-06-01T08:00:00Z");
    expect(result.completedDays[0]?.dayNumber).toBe(1);
    expect(result.completedDays[1]?.completedAt).toBe("2026-06-03T09:00:00Z");
    expect(result.completedDays[1]?.dayNumber).toBe(2);
    expect(result.completedDays[2]?.completedAt).toBe("2026-06-05T10:00:00Z");
    expect(result.completedDays[2]?.dayNumber).toBe(3);

    // lastActiveAt is the last completed timestamp
    expect(result.lastActiveAt).toBe("2026-06-05T10:00:00Z");
  });

  it("mixed completed/incomplete rows: sessionsStarted counts all, sessionsCompleted only completed", () => {
    const rows = [
      {
        completed_at: "2026-06-01T08:00:00Z",
        training_sessions_catalog: { day_number: 1 },
      },
      {
        completed_at: null,
        training_sessions_catalog: { day_number: 2 },
      },
      {
        completed_at: "2026-06-04T10:00:00Z",
        training_sessions_catalog: { day_number: 3 },
      },
    ];
    const result = shapeAthleteDetail("id", "Casey", "2007-11-01", "hockey", rows);

    expect(result.sessionsStarted).toBe(3);
    expect(result.sessionsCompleted).toBe(2);
    expect(result.completedDays).toHaveLength(2);
    expect(result.lastActiveAt).toBe("2026-06-04T10:00:00Z");
  });

  it("null training_sessions_catalog join result is excluded from completedDays", () => {
    // Should not happen in practice (catalog_id is a required FK), but the
    // Supabase join type is nullable — guard tested here.
    const rows = [
      {
        completed_at: "2026-06-01T08:00:00Z",
        training_sessions_catalog: null,
      },
    ];
    const result = shapeAthleteDetail("id", "Riley", null, null, rows);
    expect(result.sessionsCompleted).toBe(1); // counted as completed
    expect(result.completedDays).toHaveLength(0); // excluded from calendar (no day_number)
  });

  it("null sport and null birthdate are passed through cleanly", () => {
    const result = shapeAthleteDetail("id", "Morgan", null, null, []);
    expect(result.birthdate).toBeNull();
    expect(result.sport).toBeNull();
  });

  // -------------------------------------------------------------------------
  // PRIVACY CONTRACT: return shape contains only dates/counts/day-numbers.
  // This test would fail if someone added a content, journal, or scripture
  // field to AthleteDetailData — catching the regression before merge.
  // -------------------------------------------------------------------------
  it("PRIVACY: return shape contains only metadata fields — no content, journal, or scripture", () => {
    const result: AthleteDetailData = shapeAthleteDetail(
      "id",
      "Name",
      null,
      "hockey",
      [],
    );

    const keys = Object.keys(result);
    const allowedKeys = new Set([
      "athleteId",
      "firstName",
      "birthdate",
      "sport",
      "completedDays",
      "sessionsCompleted",
      "sessionsStarted",
      "lastActiveAt",
    ]);

    for (const k of keys) {
      expect(allowedKeys.has(k), `unexpected key on AthleteDetailData: "${k}"`).toBe(true);
    }

    // Ensure no content-ish key is present
    expect(keys).not.toContain("content");
    expect(keys).not.toContain("journal");
    expect(keys).not.toContain("mentalSkill");
    expect(keys).not.toContain("mental_skill_md");
    expect(keys).not.toContain("scriptureText");
    expect(keys).not.toContain("scripture_text");
    expect(keys).not.toContain("journalPrompt");
    expect(keys).not.toContain("journal_prompt");

    // Same check on each completedDay record
    const dayWithData: AthleteDetailData = shapeAthleteDetail(
      "id",
      "Name",
      null,
      "hockey",
      [
        {
          completed_at: "2026-06-01T08:00:00Z",
          training_sessions_catalog: { day_number: 1 },
        },
      ],
    );
    for (const day of dayWithData.completedDays) {
      const dayKeys = Object.keys(day);
      expect(dayKeys).toContain("completedAt");
      expect(dayKeys).toContain("dayNumber");
      expect(dayKeys).not.toContain("content");
      expect(dayKeys).not.toContain("journal");
      expect(dayKeys.length).toBe(2); // ONLY completedAt + dayNumber — nothing else
    }
  });
});

// ---------------------------------------------------------------------------
// Fake Supabase client for loadAthleteDetail (injection pattern)
// Mirrors the approach in dashboard-rhythm.test.ts.
// ---------------------------------------------------------------------------

type FakeProfileRow = {
  id: string;
  first_name: string;
  birthdate: string | null;
  sport: string | null;
};

type FakeSessionRow = {
  completed_at: string | null;
  training_sessions_catalog: { day_number: number } | null;
};

type FakeDbOpts = {
  profileRow?: FakeProfileRow | null;
  profileError?: { message: string };
  sessionRows?: FakeSessionRow[];
  sessionError?: { message: string };
};

/**
 * Builds a fake Supabase client that captures select strings for privacy checks.
 * Chains: .from(table).select(cols).eq(...).maybeSingle() for profiles
 *         .from(table).select(cols).eq(...)              for sessions
 */
function makeFakeDetailClient(opts: FakeDbOpts) {
  const capturedProfileSelect: string[] = [];
  const capturedSessionSelect: string[] = [];

  const client = {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: (cols: string) => {
            capturedProfileSelect.push(cols);
            return {
              eq: (_col: string, _val: string) => ({
                eq: (_col2: string, _val2: string) => ({
                  maybeSingle: () =>
                    Promise.resolve({
                      data: opts.profileRow ?? null,
                      error: opts.profileError ?? null,
                    }),
                }),
              }),
            };
          },
        };
      }
      // athlete_sessions
      return {
        select: (cols: string) => {
          capturedSessionSelect.push(cols);
          return {
            eq: (_col: string, _val: string) =>
              Promise.resolve({
                data: opts.sessionRows ?? [],
                error: opts.sessionError ?? null,
              }),
          };
        },
      };
    },
    _capturedProfileSelect: capturedProfileSelect,
    _capturedSessionSelect: capturedSessionSelect,
  };

  return client as unknown as Parameters<typeof loadAthleteDetail>[0] & {
    _capturedProfileSelect: string[];
    _capturedSessionSelect: string[];
  };
}

// ---------------------------------------------------------------------------
// loadAthleteDetail tests
// ---------------------------------------------------------------------------

describe("loadAthleteDetail", () => {
  it("returns null when profile is not found (unlinked or wrong id)", async () => {
    const client = makeFakeDetailClient({ profileRow: null });
    const result = await loadAthleteDetail(client, "bad-id");
    expect(result).toBeNull();
  });

  it("throws when profile fetch errors (DB failure is not a 404)", async () => {
    const client = makeFakeDetailClient({
      profileError: { message: "permission denied" },
    });
    await expect(loadAthleteDetail(client, "any-id")).rejects.toThrow(
      "profile fetch failed",
    );
  });

  it("returns shaped detail with empty sessions on session-fetch error (non-fatal)", async () => {
    const client = makeFakeDetailClient({
      profileRow: {
        id: "athlete-1",
        first_name: "Alex",
        birthdate: "2009-01-01",
        sport: "hockey",
      },
      sessionError: { message: "timeout" },
    });
    const result = await loadAthleteDetail(client, "athlete-1");
    expect(result).not.toBeNull();
    expect(result?.sessionsCompleted).toBe(0);
    expect(result?.completedDays).toHaveLength(0);
    expect(result?.firstName).toBe("Alex");
  });

  it("happy path: maps profile + sessions correctly", async () => {
    const client = makeFakeDetailClient({
      profileRow: {
        id: "athlete-2",
        first_name: "Jordan",
        birthdate: "2008-05-10",
        sport: "basketball",
      },
      sessionRows: [
        {
          completed_at: "2026-06-01T10:00:00Z",
          training_sessions_catalog: { day_number: 1 },
        },
        {
          completed_at: null,
          training_sessions_catalog: { day_number: 2 },
        },
      ],
    });

    const result = await loadAthleteDetail(client, "athlete-2");
    expect(result?.athleteId).toBe("athlete-2");
    expect(result?.firstName).toBe("Jordan");
    expect(result?.sport).toBe("basketball");
    expect(result?.sessionsStarted).toBe(2);
    expect(result?.sessionsCompleted).toBe(1);
    expect(result?.completedDays).toHaveLength(1);
    expect(result?.completedDays[0]?.dayNumber).toBe(1);
    expect(result?.lastActiveAt).toBe("2026-06-01T10:00:00Z");
  });

  // -------------------------------------------------------------------------
  // PRIVACY CONTRACT: select strings must never include forbidden columns.
  // -------------------------------------------------------------------------
  it("PRIVACY: profiles select does not include content, journal, or forbidden columns", async () => {
    const client = makeFakeDetailClient({ profileRow: null });
    await loadAthleteDetail(client, "x");

    const selectStr = client._capturedProfileSelect[0] ?? "";
    // Must select only the profile metadata columns
    expect(selectStr).toContain("id");
    expect(selectStr).toContain("first_name");
    expect(selectStr).not.toContain("content");
    expect(selectStr).not.toContain("journal");
    expect(selectStr).not.toContain("mental_skill");
    expect(selectStr).not.toContain("scripture");
    expect(selectStr).not.toContain("*");
  });

  it("PRIVACY: sessions select does not include content, journal, or title columns", async () => {
    const client = makeFakeDetailClient({
      profileRow: {
        id: "a",
        first_name: "Sam",
        birthdate: "2010-01-01",
        sport: "hockey",
      },
      sessionRows: [],
    });
    await loadAthleteDetail(client, "a");

    const selectStr = client._capturedSessionSelect[0] ?? "";
    // Must select only completed_at + day_number via join
    expect(selectStr).toContain("completed_at");
    expect(selectStr).toContain("day_number");
    expect(selectStr).not.toContain("content");
    expect(selectStr).not.toContain("journal");
    expect(selectStr).not.toContain("mental_skill");
    expect(selectStr).not.toContain("scripture");
    expect(selectStr).not.toContain("title");
    expect(selectStr).not.toContain("*");
  });
});
