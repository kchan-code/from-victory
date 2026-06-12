/**
 * Tests for lib/email/weekly-digest-core.ts (FV-226).
 *
 * Covers:
 *   1. countSessionsInWindow — pure helper (no DB)
 *   2. rhythmSummaryLine — pure copy generator (parent voice, no shame)
 *   3. buildParentDigestPayload — pure assembly (no DB)
 *   4. loadAthleteDataForParents — injected-client fake
 *      - HARD PRIVACY ASSERTION: columns selected never include journal content,
 *        mental_skill_md, scripture, or any content field.
 *   5. loadEligibleParents — injected-client fake
 *      - Opt-out filtering verified.
 */

import { describe, it, expect } from "vitest";

import {
  countSessionsInWindow,
  rhythmSummaryLine,
  buildParentDigestPayload,
  loadAthleteDataForParents,
  loadEligibleParents,
  type AthleteDigestData,
} from "@/lib/email/weekly-digest-core";

// ---------------------------------------------------------------------------
// countSessionsInWindow
// ---------------------------------------------------------------------------

describe("countSessionsInWindow", () => {
  // The PREVIOUS full week: Mon 00:00 UTC → next Mon 00:00 UTC (exclusive).
  const windowStart = new Date("2026-06-09T00:00:00Z"); // Mon week start
  const windowEnd = new Date("2026-06-16T00:00:00Z"); // next Mon (exclusive)

  it("counts only sessions for the given athlete within the window", () => {
    const rows = [
      { athlete_id: "a1", completed_at: "2026-06-10T08:00:00Z" }, // in window
      { athlete_id: "a1", completed_at: "2026-06-11T10:00:00Z" }, // in window
      { athlete_id: "a1", completed_at: "2026-06-07T08:00:00Z" }, // before window
      { athlete_id: "a2", completed_at: "2026-06-10T08:00:00Z" }, // different athlete
    ];
    expect(countSessionsInWindow(rows, "a1", windowStart, windowEnd)).toBe(2);
  });

  it("returns 0 when no sessions in window", () => {
    const rows = [
      { athlete_id: "a1", completed_at: "2026-06-07T08:00:00Z" },
    ];
    expect(countSessionsInWindow(rows, "a1", windowStart, windowEnd)).toBe(0);
  });

  it("returns 0 when athlete has no rows", () => {
    expect(countSessionsInWindow([], "a1", windowStart, windowEnd)).toBe(0);
  });

  it("skips rows with null completed_at", () => {
    const rows = [
      { athlete_id: "a1", completed_at: null },
      { athlete_id: "a1", completed_at: "2026-06-10T08:00:00Z" },
    ];
    expect(countSessionsInWindow(rows, "a1", windowStart, windowEnd)).toBe(1);
  });

  it("treats the start boundary as inclusive", () => {
    const rows = [
      { athlete_id: "a1", completed_at: "2026-06-09T00:00:00Z" }, // exactly at start
    ];
    expect(countSessionsInWindow(rows, "a1", windowStart, windowEnd)).toBe(1);
  });

  it("treats the end boundary as EXCLUSIVE (a Monday-morning session belongs to the next digest)", () => {
    const rows = [
      { athlete_id: "a1", completed_at: "2026-06-16T00:00:00Z" }, // exactly at end
      { athlete_id: "a1", completed_at: "2026-06-15T23:59:59Z" }, // last second in window
    ];
    expect(countSessionsInWindow(rows, "a1", windowStart, windowEnd)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// rhythmSummaryLine — parent voice rules
// ---------------------------------------------------------------------------

describe("rhythmSummaryLine", () => {
  function make(overrides: Partial<AthleteDigestData>): AthleteDigestData {
    return {
      firstName: "Alex",
      sessionsCompleted: 0,
      sessionsThisWeek: 0,
      dayPosition: 0,
      ...overrides,
    };
  }

  it("zero sessions → encouraging copy with no shame or 'streak' language", () => {
    const line = rhythmSummaryLine(make({ sessionsCompleted: 0 }));
    expect(line).not.toMatch(/streak/i);
    expect(line).not.toMatch(/kid/i);
    expect(line).toMatch(/ready/i); // encouragement
  });

  it("0 sessions this week but some overall → no shame, 'rhythm continues'", () => {
    const line = rhythmSummaryLine(
      make({ sessionsCompleted: 5, sessionsThisWeek: 0, dayPosition: 5 }),
    );
    expect(line).toMatch(/rhythm continues/i);
    expect(line).not.toMatch(/shame/i);
    expect(line).not.toMatch(/missed/i);
    expect(line).toMatch(/day 5 of 30/i);
  });

  it("1 session this week → singular 'session' copy + day position", () => {
    const line = rhythmSummaryLine(
      make({ sessionsCompleted: 10, sessionsThisWeek: 1, dayPosition: 10 }),
    );
    expect(line).toMatch(/1 session/i);
    expect(line).not.toMatch(/sessions/); // singular
    expect(line).toMatch(/day 10 of 30/i);
  });

  it("multiple sessions this week → plural 'sessions' copy", () => {
    const line = rhythmSummaryLine(
      make({ sessionsCompleted: 15, sessionsThisWeek: 3, dayPosition: 15 }),
    );
    expect(line).toMatch(/3 sessions/i);
    expect(line).toMatch(/day 15 of 30/i);
  });

  it("never uses 'kid' in parent-facing copy", () => {
    const cases = [
      make({ sessionsCompleted: 0 }),
      make({ sessionsCompleted: 5, sessionsThisWeek: 0, dayPosition: 5 }),
      make({ sessionsCompleted: 10, sessionsThisWeek: 2, dayPosition: 10 }),
    ];
    for (const c of cases) {
      expect(rhythmSummaryLine(c)).not.toMatch(/\bkid\b/i);
    }
  });
});

// ---------------------------------------------------------------------------
// buildParentDigestPayload — pure assembly
// ---------------------------------------------------------------------------

describe("buildParentDigestPayload", () => {
  const windowStart = new Date("2026-06-09T00:00:00Z");
  const windowEnd = new Date("2026-06-16T00:00:00Z");

  const parent = {
    id: "p1",
    first_name: "Jordan",
    digest_opt_out: false,
    digest_unsubscribe_token: "token-uuid-1234",
  };

  it("assembles payload with correct athlete data", () => {
    const parentLinks = new Map([["p1", ["a1", "a2"]]]);
    const athleteMeta = new Map([
      [
        "a1",
        {
          athlete_id: "a1",
          sessions_completed: 10,
          sessions_started: 11,
          last_completed_at: "2026-06-10T08:00:00Z",
        },
      ],
      [
        "a2",
        {
          athlete_id: "a2",
          sessions_completed: 0,
          sessions_started: 0,
          last_completed_at: null,
        },
      ],
    ]);
    const weeklyRows = [
      { athlete_id: "a1", completed_at: "2026-06-10T08:00:00Z" },
      { athlete_id: "a1", completed_at: "2026-06-11T09:00:00Z" },
    ];
    const athleteNames = new Map([
      ["a1", "Alex"],
      ["a2", "Sam"],
    ]);

    const payload = buildParentDigestPayload({
      parent,
      email: "parent@example.com",
      parentLinks,
      athleteMeta,
      weeklyRows,
      athleteNames,
      windowStart,
      windowEnd,
    });

    expect(payload.parentId).toBe("p1");
    expect(payload.email).toBe("parent@example.com");
    expect(payload.firstName).toBe("Jordan");
    expect(payload.unsubscribeToken).toBe("token-uuid-1234");

    expect(payload.athletes).toHaveLength(2);

    // Canonical day rule (lib/daily/progression.ts): completed + 1, capped
    // at 30 — the email must agree with the athlete's home ring.
    const a1 = payload.athletes.find((a) => a.firstName === "Alex");
    expect(a1).toBeDefined();
    expect(a1?.sessionsCompleted).toBe(10);
    expect(a1?.sessionsThisWeek).toBe(2);
    expect(a1?.dayPosition).toBe(11);

    const a2 = payload.athletes.find((a) => a.firstName === "Sam");
    expect(a2?.sessionsCompleted).toBe(0);
    expect(a2?.sessionsThisWeek).toBe(0);
    expect(a2?.dayPosition).toBe(1);
  });

  it("dayPosition is capped at 30", () => {
    const parentLinks = new Map([["p1", ["a1"]]]);
    const athleteMeta = new Map([
      [
        "a1",
        {
          athlete_id: "a1",
          sessions_completed: 35, // over 30
          sessions_started: 35,
          last_completed_at: null,
        },
      ],
    ]);
    const payload = buildParentDigestPayload({
      parent,
      email: "parent@example.com",
      parentLinks,
      athleteMeta,
      weeklyRows: [],
      athleteNames: new Map([["a1", "Alex"]]),
      windowStart,
      windowEnd,
    });
    expect(payload.athletes[0]?.dayPosition).toBe(30);
  });

  it("parent with no linked athletes → empty athletes array", () => {
    const payload = buildParentDigestPayload({
      parent,
      email: "parent@example.com",
      parentLinks: new Map(), // no links
      athleteMeta: new Map(),
      weeklyRows: [],
      athleteNames: new Map(),
      windowStart,
      windowEnd,
    });
    expect(payload.athletes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Fake Supabase client helpers
// ---------------------------------------------------------------------------

type ChainResult = { data: unknown[] | null; error: { message: string } | null };

type QueryOpts = {
  table: string;
  selectCols?: string;
  result?: ChainResult;
};

/** Minimal fake that records what columns were selected for privacy assertion. */
function makeFakeServiceClient(tableResults: Map<string, ChainResult>) {
  const capturedSelects = new Map<string, string>();

  function makeChain(table: string) {
    let selectCols = "";

    const chain: Record<string, unknown> = {
      select: (cols: string) => {
        selectCols = cols;
        capturedSelects.set(table, cols);
        return chain;
      },
      eq: (_col: string, _val: unknown) => chain,
      in: (_col: string, _vals: unknown[]) => chain,
      not: (_col: string, _op: string, _val: unknown) => chain,
      or: (_filters: string) => chain,
      gte: (_col: string, _val: unknown) => chain,
      lt: (_col: string, _val: unknown) => chain,
      then: (onFulfilled: (v: ChainResult) => unknown) => {
        const result = tableResults.get(table) ?? { data: [], error: null };
        return Promise.resolve(result).then(onFulfilled);
      },
    };
    return chain;
  }

  const client = {
    from: (table: string) => makeChain(table),
    _capturedSelects: capturedSelects,
  };

  return client as unknown as Parameters<typeof loadAthleteDataForParents>[0] & {
    _capturedSelects: Map<string, string>;
  };
}

// ---------------------------------------------------------------------------
// loadAthleteDataForParents — HARD PRIVACY ASSERTION
// ---------------------------------------------------------------------------

describe("loadAthleteDataForParents", () => {
  const windowStart = new Date("2026-06-09T00:00:00Z");
  const windowEnd = new Date("2026-06-16T00:00:00Z");

  it("HARD PRIVACY: selected columns never include journal content, mental_skill_md, scripture, pregame selections", async () => {
    const tableResults = new Map<string, ChainResult>([
      [
        "parent_athlete_links",
        {
          data: [{ parent_id: "p1", athlete_id: "a1" }],
          error: null,
        },
      ],
      [
        "profiles",
        {
          data: [{ id: "a1", first_name: "Alex" }],
          error: null,
        },
      ],
      [
        "athlete_session_metadata",
        {
          data: [
            {
              athlete_id: "a1",
              sessions_completed: 5,
              sessions_started: 5,
              last_completed_at: null,
            },
          ],
          error: null,
        },
      ],
      [
        "athlete_sessions",
        {
          data: [],
          error: null,
        },
      ],
    ]);

    const fakeClient = makeFakeServiceClient(tableResults);
    await loadAthleteDataForParents(fakeClient, ["p1"], windowStart, windowEnd);

    // Check every captured SELECT for forbidden fields.
    const forbidden = [
      "content",
      "journal",
      "mental_skill_md",
      "scripture_ref",
      "scripture_text",
      "journal_prompt",
      "pregame",
      "positive_plays",
    ];

    for (const [table, cols] of fakeClient._capturedSelects.entries()) {
      for (const field of forbidden) {
        expect(
          cols,
          `Table "${table}" must not select forbidden field "${field}"`,
        ).not.toContain(field);
      }
    }
  });

  it("selects first_name from profiles (needed for email rendering)", async () => {
    const tableResults = new Map<string, ChainResult>([
      [
        "parent_athlete_links",
        { data: [{ parent_id: "p1", athlete_id: "a1" }], error: null },
      ],
      ["profiles", { data: [{ id: "a1", first_name: "Alex" }], error: null }],
      ["athlete_session_metadata", { data: [], error: null }],
      ["athlete_sessions", { data: [], error: null }],
    ]);

    const fakeClient = makeFakeServiceClient(tableResults);
    await loadAthleteDataForParents(fakeClient, ["p1"], windowStart, windowEnd);

    const profileSelect = fakeClient._capturedSelects.get("profiles") ?? "";
    expect(profileSelect).toContain("first_name");
    // Must NOT select birthdate, sport, journal fields.
    expect(profileSelect).not.toContain("birthdate");
    expect(profileSelect).not.toContain("sport_selected_at");
  });

  it("selects only athlete_id and completed_at from athlete_sessions (no content joins)", async () => {
    const tableResults = new Map<string, ChainResult>([
      [
        "parent_athlete_links",
        { data: [{ parent_id: "p1", athlete_id: "a1" }], error: null },
      ],
      ["profiles", { data: [{ id: "a1", first_name: "Alex" }], error: null }],
      ["athlete_session_metadata", { data: [], error: null }],
      ["athlete_sessions", { data: [], error: null }],
    ]);

    const fakeClient = makeFakeServiceClient(tableResults);
    await loadAthleteDataForParents(fakeClient, ["p1"], windowStart, windowEnd);

    const sessionSelect = fakeClient._capturedSelects.get("athlete_sessions") ?? "";
    expect(sessionSelect).toContain("athlete_id");
    expect(sessionSelect).toContain("completed_at");
    // Must NOT select catalog_id join fields or content.
    expect(sessionSelect).not.toContain("catalog_id");
    expect(sessionSelect).not.toContain("content");
  });

  it("returns empty maps when parentIds is empty (no DB calls needed)", async () => {
    const fakeClient = makeFakeServiceClient(new Map());
    const result = await loadAthleteDataForParents(fakeClient, [], windowStart, windowEnd);
    expect(result.athleteMeta.size).toBe(0);
    expect(result.weeklyRows).toHaveLength(0);
    expect(result.athleteNames.size).toBe(0);
    expect(result.parentLinks.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// loadEligibleParents — opt-out gate
// ---------------------------------------------------------------------------

describe("loadEligibleParents", () => {
  it("includes null-opt-out parents (opted in by default) and does NOT filter on token", async () => {
    // PR #192 review findings: null digest_opt_out = opted IN (post-migration
    // signups), and token-less parents must NOT be excluded here — the caller
    // lazily stamps tokens before sending.
    const capturedFilters: string[] = [];

    const chain: Record<string, unknown> = {
      select: (_cols: string) => chain,
      eq: (col: string, val: unknown) => {
        capturedFilters.push(`eq:${col}=${String(val)}`);
        return chain;
      },
      or: (filters: string) => {
        capturedFilters.push(`or:${filters}`);
        return chain;
      },
      not: (col: string, op: string, val: unknown) => {
        capturedFilters.push(`not:${col}:${op}=${String(val)}`);
        return chain;
      },
      then: (onFulfilled: (v: ChainResult) => unknown) => {
        return Promise.resolve({ data: [], error: null }).then(onFulfilled);
      },
    };

    const fakeClient = {
      from: (_table: string) => chain,
    } as unknown as Parameters<typeof loadEligibleParents>[0];

    await loadEligibleParents(fakeClient);

    expect(capturedFilters).toContain("eq:role=parent");
    // Opt-out filter: null OR false both count as opted in.
    const optOutFilter = capturedFilters.find((f) => f.startsWith("or:"));
    expect(optOutFilter).toBeDefined();
    expect(optOutFilter).toContain("digest_opt_out.is.null");
    expect(optOutFilter).toContain("digest_opt_out.eq.false");
    // No token filter — token-less parents stay in (lazy stamping).
    const hasTokenFilter = capturedFilters.some((f) =>
      f.includes("digest_unsubscribe_token"),
    );
    expect(hasTokenFilter).toBe(false);
  });

  it("returns empty array on DB error (non-fatal)", async () => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      or: () => chain,
      not: () => chain,
      then: (onFulfilled: (v: ChainResult) => unknown) => {
        return Promise.resolve({ data: null, error: { message: "permission denied" } }).then(onFulfilled);
      },
    };

    const fakeClient = {
      from: (_table: string) => chain,
    } as unknown as Parameters<typeof loadEligibleParents>[0];

    const result = await loadEligibleParents(fakeClient);
    expect(result).toEqual([]);
  });
});
