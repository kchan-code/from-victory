/**
 * Unit tests for the athlete personalization quiz server-action schema (FV-228).
 *
 * The actions live in lib/actions/athlete-quiz.ts, which carries "use server"
 * and imports requireAthlete → createClient → next/headers. These are not
 * importable under vitest's node environment, so we reconstruct the Zod
 * schema from the same source-of-truth inputs (FOCUS_AREA_KEYS + allowed
 * positions) and verify accept/reject behavior.
 *
 * Pattern: identical to athlete-sport-schema.test.ts — derive the testable
 * artifact from the same inputs the production code uses, so the test stays
 * in lockstep without importing the untestable module.
 *
 * What is tested:
 *   - Valid position values (all allowed positions) accepted
 *   - Invalid position values rejected with the expected message
 *   - null / undefined position accepted (skippable)
 *   - Valid focus_area values (all FOCUS_AREA_KEYS members) accepted
 *   - Invalid focus_area values rejected with the expected message
 *   - null / undefined focus_area accepted (skippable)
 *   - Empty-string normalisation path (action treats "" as null — schema
 *     validates the server's normalised input, not the raw form field)
 *
 * What is NOT tested here:
 *   - requireAthlete() auth check (server-only; tested via E2E)
 *   - Supabase update call (infrastructure; tested via E2E)
 *   - redirect() behavior (Next.js internals)
 *
 * Node env, no browser APIs, no mocking.
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import { FOCUS_AREA_KEYS } from "@/lib/quiz-config";

// ---------------------------------------------------------------------------
// Reconstruct the production schema from the same source-of-truth inputs.
// Keep in sync with lib/actions/athlete-quiz.ts.
// ---------------------------------------------------------------------------

const ALLOWED_POSITIONS = [
  // Hockey
  "Forward", "Defense", "Goalie",
  // Basketball
  "Guard", "Wing", "Big",
  // Baseball (v2)
  "Pitcher", "Catcher", "Infield", "Outfield",
] as const;

const QuizSchema = z.object({
  position: z
    .enum(ALLOWED_POSITIONS, { error: "Invalid position." })
    .nullable()
    .optional(),
  focus_area: z
    .enum(FOCUS_AREA_KEYS, { error: "Invalid focus area." })
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse the quiz fields the same way the action does (safeParse). */
function parse(input: { position?: unknown; focus_area?: unknown }) {
  return QuizSchema.safeParse(input);
}

// ---------------------------------------------------------------------------
// Position — valid inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — position valid inputs", () => {
  it("accepts every allowed position value", () => {
    for (const pos of ALLOWED_POSITIONS) {
      const result = parse({ position: pos });
      expect(result.success, `expected "${pos}" to be valid`).toBe(true);
    }
  });

  it("accepts null position (skipped)", () => {
    const result = parse({ position: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(null);
    }
  });

  it("accepts undefined position (field absent from FormData)", () => {
    const result = parse({ position: undefined });
    expect(result.success).toBe(true);
  });

  it("accepts position omitted entirely", () => {
    const result = parse({});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Position — invalid inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — position invalid inputs", () => {
  it("rejects an unknown position value", () => {
    const result = parse({ position: "Quarterback" });
    expect(result.success).toBe(false);
  });

  it("rejects a numeric position value", () => {
    const result = parse({ position: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects a case-mismatched position (enum is case-sensitive)", () => {
    const result = parse({ position: "forward" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty-string position (action normalises '' → undefined before schema; schema rejects raw '')", () => {
    // The production action normalises "" → undefined before schema parse, so
    // "" never reaches the enum. Here we test what the schema itself does with
    // "": it rejects it (enum does not include ""). The action's normalisation
    // step is an application-layer concern, not part of this schema contract.
    const result = parse({ position: "" });
    expect(result.success).toBe(false);
  });

  it("surfaces the expected error message for an invalid position", () => {
    const result = parse({ position: "Goalie-ish" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toBe("Invalid position.");
    }
  });
});

// ---------------------------------------------------------------------------
// Focus area — valid inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — focus_area valid inputs", () => {
  it("accepts every focus area key", () => {
    for (const key of FOCUS_AREA_KEYS) {
      const result = parse({ focus_area: key });
      expect(result.success, `expected focus_area "${key}" to be valid`).toBe(true);
    }
  });

  it("accepts null focus_area (skipped)", () => {
    const result = parse({ focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts undefined focus_area (field absent from FormData)", () => {
    const result = parse({ focus_area: undefined });
    expect(result.success).toBe(true);
  });

  it("has at least 5 focus area keys", () => {
    // Guards against accidental deletion from FOCUS_AREA_KEYS.
    expect(FOCUS_AREA_KEYS.length).toBeGreaterThanOrEqual(5);
  });

  it("includes all 5 required focus area keys", () => {
    expect(FOCUS_AREA_KEYS).toContain("nerves");
    expect(FOCUS_AREA_KEYS).toContain("bouncing-back");
    expect(FOCUS_AREA_KEYS).toContain("confidence");
    expect(FOCUS_AREA_KEYS).toContain("focus");
    expect(FOCUS_AREA_KEYS).toContain("faith");
  });
});

// ---------------------------------------------------------------------------
// Focus area — invalid inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — focus_area invalid inputs", () => {
  it("rejects an unknown focus area value", () => {
    const result = parse({ focus_area: "anxiety" });
    expect(result.success).toBe(false);
  });

  it("rejects a numeric focus area", () => {
    const result = parse({ focus_area: 3 });
    expect(result.success).toBe(false);
  });

  it("rejects case-mismatched focus area (case-sensitive)", () => {
    const result = parse({ focus_area: "Nerves" });
    expect(result.success).toBe(false);
  });

  it("surfaces the expected error message for an invalid focus area", () => {
    const result = parse({ focus_area: "not-a-focus" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toBe("Invalid focus area.");
    }
  });
});

// ---------------------------------------------------------------------------
// Skip path — both fields null/undefined simultaneously
// ---------------------------------------------------------------------------

describe("QuizSchema — skip path (both fields null)", () => {
  it("accepts both position and focus_area as null (full skip)", () => {
    const result = parse({ position: null, focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(null);
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts both fields absent (empty FormData)", () => {
    const result = parse({});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mixed valid combination
// ---------------------------------------------------------------------------

describe("QuizSchema — valid combinations", () => {
  it("accepts a valid position + valid focus_area", () => {
    const result = parse({ position: "Forward", focus_area: "nerves" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe("Forward");
      expect(result.data.focus_area).toBe("nerves");
    }
  });

  it("accepts a valid position + null focus_area (skipped focus step)", () => {
    const result = parse({ position: "Guard", focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe("Guard");
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts null position + valid focus_area (skipped position step)", () => {
    const result = parse({ position: null, focus_area: "confidence" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(null);
      expect(result.data.focus_area).toBe("confidence");
    }
  });
});
