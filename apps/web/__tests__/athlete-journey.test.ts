// FV-190 — Journey view data layer unit tests.
//
// Tests the pure core in lib/athlete/journey.ts with a fake Supabase client.
// No live DB, no server runtime. Mirror pattern of daily-progression.test.ts.
//
// Acceptance criteria verified:
//   - AC #2: completed-only filter (completed_at NOT NULL), newest-first order
//   - AC #6: missing catalog row degrades gracefully (content = null, no throw)
//   - loadJourneyEntry: returns null for invalid day, missing session, bad params

import { describe, it, expect } from "vitest";

import {
  loadJourney,
  loadJourneyEntry,
  type JourneyEntry,
} from "@/lib/athlete/journey";

// ---------------------------------------------------------------------------
// Fake Supabase client
// ---------------------------------------------------------------------------

type CatalogRow = {
  day_number: number;
  title: string;
  scripture_ref: string;
  scripture_text: string;
  mental_skill_md: string;
} | null;

type SessionRow = {
  id: string;
  completed_at: string | null;
  training_sessions_catalog: CatalogRow;
};

type FakeOpts = {
  /** Rows returned by the list query. */
  rows?: SessionRow[];
  /** Force the list query to return an error. */
  listError?: { message: string };
  /** Single row returned by the single-entry query. */
  singleRow?: SessionRow | null;
  /** Force the single-entry query to return an error. */
  singleError?: { message: string };
};

function makeFakeSupabase(opts: FakeOpts) {
  // Track query params for assertions.
  const captured: {
    table: string;
    filters: Record<string, unknown>;
    orderBy?: { col: string; ascending: boolean };
    isSingle?: boolean;
  }[] = [];

  function chainFor(table: string) {
    const filters: Record<string, unknown> = {};
    let orderCapture: { col: string; ascending: boolean } | undefined;
    let isSingle = false;

    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return chain;
      },
      not: (col: string, op?: string, val?: unknown) => {
        filters[`${col}:not`] = { op, val };
        return chain;
      },
      order: (col: string, opts2?: { ascending?: boolean }) => {
        orderCapture = { col, ascending: opts2?.ascending ?? true };
        return chain;
      },
      limit: (_n: number) => chain,
      maybeSingle: () => {
        isSingle = true;
        captured.push({ table, filters, orderBy: orderCapture, isSingle });
        if (opts.singleError) {
          return Promise.resolve({ data: null, error: opts.singleError });
        }
        const row =
          opts.singleRow !== undefined ? opts.singleRow : null;
        return Promise.resolve({ data: row, error: null });
      },
      // For the list query: make the chain thenable.
      then: (
        onFulfilled: (v: {
          data: SessionRow[] | null;
          error: { message: string } | null;
        }) => unknown,
      ) => {
        captured.push({ table, filters, orderBy: orderCapture, isSingle });
        if (opts.listError) {
          return Promise.resolve({
            data: null,
            error: opts.listError,
          }).then(onFulfilled);
        }
        return Promise.resolve({
          data: opts.rows ?? [],
          error: null,
        }).then(onFulfilled);
      },
    };

    return chain;
  }

  return {
    captured,
    from: (table: string) => chainFor(table),
  } as unknown as Parameters<typeof loadJourney>[0] & {
    captured: (typeof captured)[number][];
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function sessionRow(
  overrides: Partial<SessionRow> & { id?: string } = {},
): SessionRow {
  return {
    id: overrides.id ?? "session-uuid",
    completed_at: overrides.completed_at ?? "2026-06-01T12:00:00Z",
    training_sessions_catalog: overrides.training_sessions_catalog !== undefined
      ? overrides.training_sessions_catalog
      : {
          day_number: 3,
          title: "Stay Grounded",
          scripture_ref: "Philippians 4:13",
          scripture_text: "I can do all this through him who gives me strength.",
          mental_skill_md: "### Focus\n\nBody text here.",
        },
  };
}

// ---------------------------------------------------------------------------
// loadJourney — list of completed sessions
// ---------------------------------------------------------------------------

describe("loadJourney", () => {
  it("returns an empty array when there are no completed sessions", async () => {
    const supabase = makeFakeSupabase({ rows: [] });
    const entries = await loadJourney(supabase, "athlete-1");
    expect(entries).toHaveLength(0);
  });

  it("filters by athlete_id and requires completed_at NOT NULL", async () => {
    const supabase = makeFakeSupabase({ rows: [sessionRow()] });
    await loadJourney(supabase, "athlete-42");

    const q = supabase.captured.find((c) => c.table === "athlete_sessions");
    expect(q).toBeDefined();
    expect(q?.filters["athlete_id"]).toBe("athlete-42");
    // Verified: .not("completed_at", "is", null) is the completed-only guard.
    expect(q?.filters["completed_at:not"]).toEqual({ op: "is", val: null });
  });

  it("orders results descending by completed_at (newest first)", async () => {
    const supabase = makeFakeSupabase({ rows: [sessionRow()] });
    await loadJourney(supabase, "athlete-1");

    const q = supabase.captured.find((c) => c.table === "athlete_sessions");
    expect(q?.orderBy).toEqual({ col: "completed_at", ascending: false });
  });

  it("maps rows to JourneyEntry shape with content populated", async () => {
    const supabase = makeFakeSupabase({
      rows: [
        sessionRow({
          id: "s-1",
          completed_at: "2026-06-05T09:00:00Z",
          training_sessions_catalog: {
            day_number: 7,
            title: "Eyes On The Prize",
            scripture_ref: "Hebrews 12:1",
            scripture_text: "Run with perseverance...",
            mental_skill_md: "### Focus\n\nText.",
          },
        }),
      ],
    });
    const entries = await loadJourney(supabase, "athlete-1");

    expect(entries).toHaveLength(1);
    const entry = entries[0] as JourneyEntry;
    expect(entry.sessionId).toBe("s-1");
    expect(entry.dayNumber).toBe(7);
    expect(entry.completedAt).toBe("2026-06-05T09:00:00Z");
    expect(entry.content?.title).toBe("Eyes On The Prize");
    expect(entry.content?.scriptureRef).toBe("Hebrews 12:1");
    expect(entry.content?.mentalSkillMd).toBe("### Focus\n\nText.");
  });

  it("degrades gracefully when the catalog row is null (AC #6 — no throw)", async () => {
    // A completed session whose catalog row is missing (sport gap).
    const supabase = makeFakeSupabase({
      rows: [
        sessionRow({
          id: "s-orphan",
          completed_at: "2026-06-03T08:00:00Z",
          training_sessions_catalog: null,
        }),
      ],
    });

    // Must NOT throw.
    const entries = await loadJourney(supabase, "athlete-1");
    expect(entries).toHaveLength(1);
    const entry = entries[0] as JourneyEntry;
    expect(entry.content).toBeNull();
    // dayNumber falls back to 0 when catalog is null.
    expect(entry.dayNumber).toBe(0);
  });

  it("throws a descriptive error when the query itself fails", async () => {
    const supabase = makeFakeSupabase({ listError: { message: "db is down" } });
    await expect(loadJourney(supabase, "athlete-1")).rejects.toThrow(
      /session query failed — db is down/,
    );
  });

  it("returns multiple entries, newest first by ordering contract", async () => {
    // We don't re-sort client-side — we rely on DB ordering. Just verify
    // all entries come back and are mapped correctly.
    const rows: SessionRow[] = [
      sessionRow({ id: "s-3", completed_at: "2026-06-10T10:00:00Z", training_sessions_catalog: { day_number: 3, title: "Day 3", scripture_ref: "John 3:16", scripture_text: "...", mental_skill_md: "" } }),
      sessionRow({ id: "s-2", completed_at: "2026-06-08T10:00:00Z", training_sessions_catalog: { day_number: 2, title: "Day 2", scripture_ref: "Rom 8:28", scripture_text: "...", mental_skill_md: "" } }),
      sessionRow({ id: "s-1", completed_at: "2026-06-06T10:00:00Z", training_sessions_catalog: { day_number: 1, title: "Day 1", scripture_ref: "Heb 12:1", scripture_text: "...", mental_skill_md: "" } }),
    ];
    const supabase = makeFakeSupabase({ rows });
    const entries = await loadJourney(supabase, "athlete-1");
    expect(entries).toHaveLength(3);
    // IDs in the order the DB returned them (fake returns in insertion order).
    expect(entries.map((e) => e.sessionId)).toEqual(["s-3", "s-2", "s-1"]);
  });
});

// ---------------------------------------------------------------------------
// loadJourneyEntry — single entry by day number
// ---------------------------------------------------------------------------

describe("loadJourneyEntry", () => {
  it("returns null for non-integer day (0, -1, NaN, 0.5)", async () => {
    const supabase = makeFakeSupabase({});
    expect(await loadJourneyEntry(supabase, "athlete-1", 0)).toBeNull();
    expect(await loadJourneyEntry(supabase, "athlete-1", -1)).toBeNull();
    expect(await loadJourneyEntry(supabase, "athlete-1", NaN)).toBeNull();
    expect(await loadJourneyEntry(supabase, "athlete-1", 0.5)).toBeNull();
  });

  it("returns null when the DB returns no matching row", async () => {
    const supabase = makeFakeSupabase({ singleRow: null });
    const result = await loadJourneyEntry(supabase, "athlete-1", 5);
    expect(result).toBeNull();
  });

  it("returns null when catalog is null (missing content for completed session)", async () => {
    const supabase = makeFakeSupabase({
      singleRow: sessionRow({ training_sessions_catalog: null }),
    });
    const result = await loadJourneyEntry(supabase, "athlete-1", 3);
    expect(result).toBeNull();
  });

  it("maps a found row to a JourneyEntry with full content", async () => {
    const supabase = makeFakeSupabase({
      singleRow: sessionRow({
        id: "s-7",
        completed_at: "2026-06-07T14:00:00Z",
        training_sessions_catalog: {
          day_number: 7,
          title: "Be Vocal",
          scripture_ref: "Prov 27:17",
          scripture_text: "Iron sharpens iron...",
          mental_skill_md: "### Lead\n\nText.",
        },
      }),
    });

    const entry = await loadJourneyEntry(supabase, "athlete-1", 7);
    expect(entry).not.toBeNull();
    expect(entry?.dayNumber).toBe(7);
    expect(entry?.sessionId).toBe("s-7");
    expect(entry?.content?.title).toBe("Be Vocal");
    expect(entry?.completedAt).toBe("2026-06-07T14:00:00Z");
  });

  it("throws a descriptive error when the query itself fails", async () => {
    const supabase = makeFakeSupabase({ singleError: { message: "timeout" } });
    await expect(loadJourneyEntry(supabase, "athlete-1", 5)).rejects.toThrow(
      /entry query failed for day 5 — timeout/,
    );
  });

  it("returns null when row exists but completed_at is null (incomplete session guard)", async () => {
    // loadJourneyEntry filters completed_at NOT NULL in the query, but we also
    // double-check in code — this tests that code branch.
    const supabase = makeFakeSupabase({
      singleRow: {
        id: "s-incomplete",
        completed_at: null,
        training_sessions_catalog: {
          day_number: 4,
          title: "Incomplete",
          scripture_ref: "Ref",
          scripture_text: "Text",
          mental_skill_md: "",
        },
      },
    });
    const entry = await loadJourneyEntry(supabase, "athlete-1", 4);
    expect(entry).toBeNull();
  });
});
