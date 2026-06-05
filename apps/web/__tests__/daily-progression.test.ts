// FV-82 — daily-session data layer: progression + sport-keyed fetch.
//
// The progression core (lib/daily/progression.ts) takes an injected Supabase
// client, so it is unit-testable without a live DB. We test the pure
// progression math exhaustively and use a minimal fake client to assert the
// catalog fetch is keyed on (current day, athlete's sport) for BOTH sports.

import { describe, it, expect } from "vitest";

import {
  TOTAL_TRAINING_DAYS,
  currentDayNumber,
  loadDailySession,
  resolveCurrentCatalogId,
} from "@/lib/daily/progression";

// ---------------------------------------------------------------------------
// Pure progression: day = completedCount + 1, capped at TOTAL_TRAINING_DAYS
// ---------------------------------------------------------------------------

describe("currentDayNumber", () => {
  it("0 completed → day 1 (a fresh athlete starts at day 1)", () => {
    expect(currentDayNumber(0)).toBe(1);
  });

  it("advances sequentially: N completed → day N+1", () => {
    expect(currentDayNumber(1)).toBe(2);
    expect(currentDayNumber(14)).toBe(15);
    expect(currentDayNumber(28)).toBe(29);
  });

  it("caps at the last day", () => {
    expect(currentDayNumber(29)).toBe(TOTAL_TRAINING_DAYS); // 30
    expect(currentDayNumber(30)).toBe(TOTAL_TRAINING_DAYS); // stays on 30
    expect(currentDayNumber(100)).toBe(TOTAL_TRAINING_DAYS);
  });

  it("clamps garbage input to day 1 (never below)", () => {
    expect(currentDayNumber(-5)).toBe(1);
    expect(currentDayNumber(Number.NaN)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Fake Supabase client — records the filters each query applies.
// ---------------------------------------------------------------------------

type FakeOpts = {
  completedCount: number;
  catalogRow?: Record<string, unknown> | null;
};

function makeFakeSupabase(opts: FakeOpts) {
  const captured: Array<{ table: string; filters: Record<string, unknown> }> =
    [];

  function chainFor(table: string) {
    const filters: Record<string, unknown> = {};
    const chain = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        filters[col] = val;
        return chain;
      },
      not: (col: string) => {
        filters[`${col}:not-null`] = true;
        return chain;
      },
      is: (col: string, val: unknown) => {
        filters[`${col}:is`] = val;
        return chain;
      },
      // The catalog query ends in .single().
      single: () => {
        captured.push({ table, filters });
        const row = opts.catalogRow ?? null;
        return Promise.resolve({
          data: row,
          error: row ? null : { message: "no rows" },
        });
      },
      // The count query is awaited directly (no .single()) — make the chain
      // thenable so `await ...` resolves to { count, error }.
      then: (onFulfilled: (v: unknown) => unknown) => {
        captured.push({ table, filters });
        return Promise.resolve({
          count: opts.completedCount,
          error: null,
        }).then(onFulfilled);
      },
    };
    return chain;
  }

  const client = {
    captured,
    from: (table: string) => chainFor(table),
  };
  // The progression fns only use .from(...).select/.eq/.not/.is/.single — cast.
  return client as unknown as Parameters<typeof loadDailySession>[0] & {
    captured: typeof captured;
  };
}

function catalogRowFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "catalog-uuid",
    day_number: 1,
    sport: "hockey",
    title: "Day 1",
    mental_skill_md: "### The truth\n\nbody",
    scripture_ref: "Romans 8:37",
    scripture_text: "...",
    journal_prompt: "What happened?",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// loadDailySession — sport-keyed fetch for BOTH sports (FV-82 AC)
// ---------------------------------------------------------------------------

describe("loadDailySession — sport-keyed fetch", () => {
  it("hockey athlete with 4 completed fetches day 5, sport=hockey", async () => {
    const supabase = makeFakeSupabase({
      completedCount: 4,
      catalogRow: catalogRowFixture({ day_number: 5, sport: "hockey" }),
    });

    const view = await loadDailySession(supabase, "athlete-1", "hockey");

    expect(view.dayNumber).toBe(5);
    expect(view.completedCount).toBe(4);
    expect(view.allComplete).toBe(false);
    expect(view.session.sport).toBe("hockey");

    const catalogQuery = supabase.captured.find(
      (c) => c.table === "training_sessions_catalog",
    );
    expect(catalogQuery?.filters.day_number).toBe(5);
    expect(catalogQuery?.filters.sport).toBe("hockey");
  });

  it("basketball athlete with 0 completed fetches day 1, sport=basketball", async () => {
    const supabase = makeFakeSupabase({
      completedCount: 0,
      catalogRow: catalogRowFixture({ day_number: 1, sport: "basketball" }),
    });

    const view = await loadDailySession(supabase, "athlete-2", "basketball");

    expect(view.dayNumber).toBe(1);
    const catalogQuery = supabase.captured.find(
      (c) => c.table === "training_sessions_catalog",
    );
    // The fetch is keyed on the ATHLETE'S sport — never hardcoded hockey.
    expect(catalogQuery?.filters.sport).toBe("basketball");
    expect(catalogQuery?.filters.day_number).toBe(1);
  });

  it("flags allComplete once all days are done (stays on the last day)", async () => {
    const supabase = makeFakeSupabase({
      completedCount: 30,
      catalogRow: catalogRowFixture({ day_number: 30, sport: "hockey" }),
    });

    const view = await loadDailySession(supabase, "athlete-3", "hockey");
    expect(view.dayNumber).toBe(TOTAL_TRAINING_DAYS);
    expect(view.allComplete).toBe(true);
  });

  it("throws a clear error when no catalog row exists for (day, sport)", async () => {
    const supabase = makeFakeSupabase({ completedCount: 0, catalogRow: null });
    await expect(
      loadDailySession(supabase, "athlete-4", "basketball"),
    ).rejects.toThrow(/no catalog row for day 1 sport "basketball"/);
  });
});

// ---------------------------------------------------------------------------
// resolveCurrentCatalogId — used by the start/complete writes
// ---------------------------------------------------------------------------

describe("resolveCurrentCatalogId", () => {
  it("returns the current day's catalog id, sport-keyed", async () => {
    const supabase = makeFakeSupabase({
      completedCount: 2,
      catalogRow: catalogRowFixture({ id: "cat-day3-bb", day_number: 3 }),
    });

    const { catalogId, dayNumber } = await resolveCurrentCatalogId(
      supabase,
      "athlete-5",
      "basketball",
    );

    expect(catalogId).toBe("cat-day3-bb");
    expect(dayNumber).toBe(3);
    const catalogQuery = supabase.captured.find(
      (c) => c.table === "training_sessions_catalog",
    );
    expect(catalogQuery?.filters.sport).toBe("basketball");
    expect(catalogQuery?.filters.day_number).toBe(3);
  });
});
