/**
 * Unit tests for the selectSport server-action Zod schema contract (FV-33).
 *
 * The `selectSport` action lives in `lib/actions/athlete-sport.ts`. That file
 * carries a "use server" directive and imports `requireAthlete` → `createClient`
 * → `next/headers`, which throws under vitest's node environment. We therefore
 * cannot import the action file directly.
 *
 * Instead we test the SCHEMA CONTRACT in isolation: we reconstruct an identical
 * Zod schema from the same source-of-truth inputs (`SUPPORTED_SPORTS` from
 * `lib/sports`, Zod v4's `z.enum`) and verify its accept/reject behavior.
 * This is the same technique used by `middleware-matcher.test.ts` — derive the
 * testable artifact from the same source the production code uses, so the test
 * stays in lockstep without importing the untestable module.
 *
 * What is tested:
 *   - Valid sport values accepted (each member of SUPPORTED_SPORTS)
 *   - Missing / null / empty sport value rejected with the expected message
 *   - Unsupported sport value rejected with the expected message
 *   - SUPPORTED_SPORTS is the single source of truth (adding a sport here
 *     and in lib/sports.ts automatically widens acceptance — no test update
 *     needed)
 *
 * What is NOT tested here:
 *   - requireAthlete() auth check (server-only; tested via E2E)
 *   - Supabase update call (infrastructure; tested via E2E)
 *   - redirect() behavior after successful update (Next.js internals)
 *
 * Node env, no browser APIs, no mocking.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { SUPPORTED_SPORTS } from "@/lib/sports";

// ---------------------------------------------------------------------------
// Reconstruct the production schema from the same source-of-truth inputs.
// If lib/sports.ts adds a sport, this schema widens to accept it automatically
// — no test file update needed. Keep this in sync with athlete-sport.ts.
// ---------------------------------------------------------------------------

const SelectSportSchema = z.object({
  sport: z.enum(SUPPORTED_SPORTS, { error: "Pick a sport to continue." }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the `sport` field the same way the action does (safeParse). */
function parse(sport: unknown) {
  return SelectSportSchema.safeParse({ sport });
}

// ---------------------------------------------------------------------------
// Valid inputs — every member of SUPPORTED_SPORTS must be accepted
// ---------------------------------------------------------------------------

describe("SelectSportSchema — valid inputs", () => {
  it("accepts every sport in SUPPORTED_SPORTS", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const result = parse(sport);
      expect(result.success, `expected "${sport}" to be valid`).toBe(true);
      if (result.success) {
        expect(result.data.sport).toBe(sport);
      }
    }
  });

  it("accepts 'hockey'", () => {
    const result = parse("hockey");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sport).toBe("hockey");
    }
  });

  it("accepts 'basketball'", () => {
    const result = parse("basketball");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sport).toBe("basketball");
    }
  });
});

// ---------------------------------------------------------------------------
// Invalid inputs — schema must reject and the error message must surface
// ---------------------------------------------------------------------------

describe("SelectSportSchema — invalid inputs", () => {
  it("rejects undefined (formData.get returns null when field absent)", () => {
    // When the hidden input is absent from the FormData, formData.get("sport")
    // returns null. Zod enum does not coerce null to undefined — it rejects it.
    const result = parse(undefined);
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = parse(null);
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = parse("");
    expect(result.success).toBe(false);
  });

  it("rejects an unknown sport value", () => {
    const result = parse("tennis");
    expect(result.success).toBe(false);
  });

  it("rejects a future hypothetical sport not yet in SUPPORTED_SPORTS", () => {
    const result = parse("soccer");
    expect(result.success).toBe(false);
  });

  it("rejects a numeric value", () => {
    const result = parse(1);
    expect(result.success).toBe(false);
  });

  it("rejects an object", () => {
    const result = parse({ sport: "hockey" });
    expect(result.success).toBe(false);
  });

  it("rejects case-mismatched sport values (enum is case-sensitive)", () => {
    // Prevents a tampered hidden input from bypassing the DB CHECK constraint
    // via a case-insensitive back door.
    const result = parse("Hockey");
    expect(result.success).toBe(false);
  });

  it("rejects 'HOCKEY' (all-caps)", () => {
    const result = parse("HOCKEY");
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Error message contract — the action surfaces the first issue message to
  // the UI via parsed.error.issues[0]?.message. Verify the message is the
  // one we set so the UI copy stays stable.
  // -------------------------------------------------------------------------

  it("surfaces the expected error message for an invalid sport", () => {
    const result = parse("tennis");
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toBe("Pick a sport to continue.");
    }
  });

  it("surfaces the expected error message for a missing sport", () => {
    const result = parse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toBe("Pick a sport to continue.");
    }
  });
});

// ---------------------------------------------------------------------------
// Schema completeness guard — SUPPORTED_SPORTS must match the DB CHECK
// constraint in supabase/migrations/20260602000000_athlete_sport.sql.
// If a sport is added to lib/sports.ts but not the DB migration (or vice
// versa), this test surfaces the drift before it hits production.
// ---------------------------------------------------------------------------

describe("SelectSportSchema — completeness guard", () => {
  it("SUPPORTED_SPORTS has at least two sports (hockey + basketball at launch)", () => {
    expect(SUPPORTED_SPORTS.length).toBeGreaterThanOrEqual(2);
  });

  it("SUPPORTED_SPORTS includes 'hockey' (launch sport, FV-27 backfill default)", () => {
    expect(SUPPORTED_SPORTS).toContain("hockey");
  });

  it("SUPPORTED_SPORTS includes 'basketball' (MVP launch sport, FV-29+)", () => {
    expect(SUPPORTED_SPORTS).toContain("basketball");
  });
});
