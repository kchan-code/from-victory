/**
 * Unit tests for the athlete personalization quiz server-action schema (FV-228)
 * and the quiz-config pure helpers.
 *
 * The actions live in lib/actions/athlete-quiz.ts, which carries "use server"
 * and imports requireAthlete → createClient → next/headers. These are not
 * importable under vitest's node environment, so we reconstruct the Zod
 * schema from the same source-of-truth inputs (FOCUS_AREA_KEYS + the sport
 * registry roles) and verify accept/reject behavior.
 *
 * Pattern: identical to athlete-sport-schema.test.ts — derive the testable
 * artifact from the same inputs the production code uses, so the test stays
 * in lockstep without importing the untestable module.
 *
 * What is tested:
 *   - Valid position values per sport (derived from SPORT_REGISTRY.roles) accepted
 *   - Cross-sport positions rejected by per-sport schema
 *   - Invalid position values rejected with the expected message
 *   - null / undefined position accepted (skippable)
 *   - Valid focus_area values (all FOCUS_AREA_KEYS members) accepted
 *   - Invalid focus_area values rejected with the expected message
 *   - null / undefined focus_area accepted (skippable)
 *   - Empty-string normalisation path (action treats "" as null — schema
 *     validates the server's normalised input, not the raw form field)
 *   - quiz-config helpers: dailyCardSubtitle, isFocusAreaKey
 *   - FOCUS_AREA_TO_NEED: every value is a valid NeedToday key
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

import {
  FOCUS_AREA_KEYS,
  FOCUS_AREA_TO_NEED,
  FOCUS_AREA_LABELS,
  FOCUS_AREA_SUBTITLES,
  dailyCardSubtitle,
  isFocusAreaKey,
  focusAreaLabel,
  pregameNeedDefault,
} from "@/lib/quiz-config";
import {
  SPORT_REGISTRY,
} from "@/components/pregame/sport-registry";
import type { NeedToday } from "@/components/pregame/types";

// ---------------------------------------------------------------------------
// Per-sport schema builder (mirrors lib/actions/athlete-quiz.ts buildQuizSchema)
// ---------------------------------------------------------------------------

function buildTestSchema(sport: keyof typeof SPORT_REGISTRY) {
  const config = SPORT_REGISTRY[sport];
  const sportRoles = config.roles;

  const positionSchema =
    sportRoles && sportRoles.length > 0
      ? z
          .enum(sportRoles as [string, ...string[]], { error: "Invalid position." })
          .nullable()
          .optional()
      : z.null().optional();

  return z.object({
    position: positionSchema,
    focus_area: z
      .enum(FOCUS_AREA_KEYS, { error: "Invalid focus area." })
      .nullable()
      .optional(),
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parse(sport: keyof typeof SPORT_REGISTRY, input: { position?: unknown; focus_area?: unknown }) {
  return buildTestSchema(sport).safeParse(input);
}

// ---------------------------------------------------------------------------
// Cross-sport union of ALL positions — used only for the DB-backstop test
// ---------------------------------------------------------------------------

const ALL_REGISTRY_POSITIONS: string[] = Object.values(SPORT_REGISTRY).flatMap(
  (config) => (config.roles ? [...config.roles] : []),
);

// ---------------------------------------------------------------------------
// Position — valid per-sport inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — per-sport position validation", () => {
  it("accepts all hockey roles for a hockey athlete", () => {
    for (const role of SPORT_REGISTRY.hockey.roles ?? []) {
      const result = parse("hockey", { position: role });
      expect(result.success, `hockey athlete: "${role}" should be valid`).toBe(true);
    }
  });

  it("accepts all basketball roles for a basketball athlete", () => {
    for (const role of SPORT_REGISTRY.basketball.roles ?? []) {
      const result = parse("basketball", { position: role });
      expect(result.success, `basketball athlete: "${role}" should be valid`).toBe(true);
    }
  });

  it("accepts all baseball roles for a baseball athlete", () => {
    for (const role of SPORT_REGISTRY.baseball.roles ?? []) {
      const result = parse("baseball", { position: role });
      expect(result.success, `baseball athlete: "${role}" should be valid`).toBe(true);
    }
  });

  it("rejects a basketball role for a hockey athlete (cross-sport guard)", () => {
    // "Guard" is a valid basketball role but must be rejected for hockey
    const result = parse("hockey", { position: "Guard" });
    expect(result.success).toBe(false);
  });

  it("rejects a hockey role for a basketball athlete (cross-sport forward)", () => {
    // "Forward" is a valid hockey role but must be rejected for basketball
    const result = parse("basketball", { position: "Forward" });
    expect(result.success).toBe(false);
  });

  it("accepts null position for any sport (skipped)", () => {
    for (const sport of Object.keys(SPORT_REGISTRY) as (keyof typeof SPORT_REGISTRY)[]) {
      const result = parse(sport, { position: null });
      expect(result.success, `${sport}: null position should be valid`).toBe(true);
    }
  });

  it("accepts undefined position for any sport (field absent from FormData)", () => {
    for (const sport of Object.keys(SPORT_REGISTRY) as (keyof typeof SPORT_REGISTRY)[]) {
      const result = parse(sport, { position: undefined });
      expect(result.success, `${sport}: undefined position should be valid`).toBe(true);
    }
  });

  it("rejects empty string position (action normalises '' → undefined before schema)", () => {
    // The production action normalises "" → undefined before schema parse.
    // Here we confirm the schema itself rejects "" (not in any sport's enum).
    const result = parse("hockey", { position: "" });
    expect(result.success).toBe(false);
  });

  it("surfaces the expected error message for an invalid position", () => {
    const result = parse("hockey", { position: "Quarterback" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid position.");
    }
  });
});

// ---------------------------------------------------------------------------
// DB-backstop: all registry roles are within the cross-sport union
// (ensures the migration CHECK constraint would accept every registry role)
// ---------------------------------------------------------------------------

describe("Registry roles vs DB CHECK union", () => {
  const DB_CHECK_POSITIONS = [
    // Hockey
    "Forward", "Defense", "Goalie",
    // Basketball
    "Guard", "Wing", "Big",
    // Baseball (v2)
    "Pitcher", "Catcher", "Infield", "Outfield",
  ];

  it("every registry role is in the DB CHECK union", () => {
    for (const role of ALL_REGISTRY_POSITIONS) {
      expect(DB_CHECK_POSITIONS, `"${role}" must be in DB CHECK union`).toContain(role);
    }
  });
});

// ---------------------------------------------------------------------------
// Focus area — valid inputs
// ---------------------------------------------------------------------------

describe("QuizSchema — focus_area valid inputs", () => {
  it("accepts every focus area key for any sport", () => {
    for (const key of FOCUS_AREA_KEYS) {
      const result = parse("hockey", { focus_area: key });
      expect(result.success, `expected focus_area "${key}" to be valid`).toBe(true);
    }
  });

  it("accepts null focus_area (skipped)", () => {
    const result = parse("hockey", { focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts undefined focus_area (field absent from FormData)", () => {
    const result = parse("hockey", { focus_area: undefined });
    expect(result.success).toBe(true);
  });

  it("has at least 5 focus area keys", () => {
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
    const result = parse("hockey", { focus_area: "anxiety" });
    expect(result.success).toBe(false);
  });

  it("rejects a numeric focus area", () => {
    const result = parse("hockey", { focus_area: 3 });
    expect(result.success).toBe(false);
  });

  it("rejects case-mismatched focus area (case-sensitive)", () => {
    const result = parse("hockey", { focus_area: "Nerves" });
    expect(result.success).toBe(false);
  });

  it("surfaces the expected error message for an invalid focus area", () => {
    const result = parse("hockey", { focus_area: "not-a-focus" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Invalid focus area.");
    }
  });
});

// ---------------------------------------------------------------------------
// Skip path — both fields null/undefined simultaneously
// ---------------------------------------------------------------------------

describe("QuizSchema — skip path (both fields null)", () => {
  it("accepts both position and focus_area as null (full skip)", () => {
    const result = parse("hockey", { position: null, focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(null);
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts both fields absent (empty FormData)", () => {
    const result = parse("hockey", {});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Mixed valid combination
// ---------------------------------------------------------------------------

describe("QuizSchema — valid combinations", () => {
  it("accepts a valid hockey position + valid focus_area", () => {
    const result = parse("hockey", { position: "Forward", focus_area: "nerves" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe("Forward");
      expect(result.data.focus_area).toBe("nerves");
    }
  });

  it("accepts a valid basketball position + null focus_area (skipped focus step)", () => {
    const result = parse("basketball", { position: "Guard", focus_area: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe("Guard");
      expect(result.data.focus_area).toBe(null);
    }
  });

  it("accepts null position + valid focus_area (skipped position step)", () => {
    const result = parse("hockey", { position: null, focus_area: "confidence" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.position).toBe(null);
      expect(result.data.focus_area).toBe("confidence");
    }
  });
});

// ---------------------------------------------------------------------------
// quiz-config helpers — dailyCardSubtitle
// ---------------------------------------------------------------------------

describe("dailyCardSubtitle", () => {
  it("returns focus-specific subtitle for each valid key", () => {
    for (const key of FOCUS_AREA_KEYS) {
      const subtitle = dailyCardSubtitle(key);
      expect(subtitle).toBe(FOCUS_AREA_SUBTITLES[key]);
      expect(subtitle.length).toBeGreaterThan(0);
    }
  });

  it("returns the same default string for null, undefined, empty-string, and unknown inputs", () => {
    // Derive the expected default from a known-null call so the test is robust
    // against the exact apostrophe/dash encoding in the source string.
    const DEFAULT = dailyCardSubtitle(null);
    expect(DEFAULT.length).toBeGreaterThan(0);
    expect(dailyCardSubtitle(undefined)).toBe(DEFAULT);
    expect(dailyCardSubtitle("")).toBe(DEFAULT);
    expect(dailyCardSubtitle("unknown-area")).toBe(DEFAULT);
  });

  it("default is not the same as any focus-area subtitle", () => {
    const DEFAULT = dailyCardSubtitle(null);
    for (const key of FOCUS_AREA_KEYS) {
      expect(dailyCardSubtitle(key)).not.toBe(DEFAULT);
    }
  });
});

// ---------------------------------------------------------------------------
// quiz-config helpers — isFocusAreaKey
// ---------------------------------------------------------------------------

describe("isFocusAreaKey", () => {
  it("returns true for every valid FOCUS_AREA_KEYS member", () => {
    for (const key of FOCUS_AREA_KEYS) {
      expect(isFocusAreaKey(key)).toBe(true);
    }
  });

  it("returns false for null", () => {
    expect(isFocusAreaKey(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isFocusAreaKey(undefined)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isFocusAreaKey("")).toBe(false);
  });

  it("returns false for an arbitrary non-member string", () => {
    expect(isFocusAreaKey("anxiety")).toBe(false);
  });

  it("returns false for a case-mismatched member", () => {
    expect(isFocusAreaKey("Nerves")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// quiz-config helpers — focusAreaLabel
// ---------------------------------------------------------------------------

describe("focusAreaLabel", () => {
  it("returns the label from FOCUS_AREA_LABELS for each key", () => {
    for (const key of FOCUS_AREA_KEYS) {
      expect(focusAreaLabel(key)).toBe(FOCUS_AREA_LABELS[key]);
    }
  });

  it("returns a non-empty string for every key", () => {
    for (const key of FOCUS_AREA_KEYS) {
      expect(focusAreaLabel(key).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// FOCUS_AREA_TO_NEED — every mapped value must be a valid NeedToday
//
// This guards against typos. NeedToday is a union type; we assert against the
// NEEDS array from pregame/types.ts (the canonical runtime list). A wrong value
// here would silently produce an invalid pre-selection in the pregame flow (FV-253).
// ---------------------------------------------------------------------------

// Import the canonical runtime NeedToday list so the test derives from truth.
// Note: NEEDS is the hockey-default list; the full NeedToday union also includes
// basketball/baseball variants ("Better decisions with the ball" etc.) that are
// not in NEEDS but ARE valid NeedToday values. We build the exhaustive set from
// all sport configs' needs lists to cover the full union.
const ALL_NEED_TODAY_VALUES = new Set<string>(
  Object.values(SPORT_REGISTRY).flatMap((config) => [...config.needs]),
);

describe("FOCUS_AREA_TO_NEED — all values are valid NeedToday keys", () => {
  it("every FOCUS_AREA_TO_NEED value exists in the NeedToday runtime union", () => {
    for (const [focusKey, needValue] of Object.entries(FOCUS_AREA_TO_NEED)) {
      expect(
        ALL_NEED_TODAY_VALUES.has(needValue),
        `FOCUS_AREA_TO_NEED["${focusKey}"] = "${needValue}" is not a valid NeedToday value`,
      ).toBe(true);
    }
  });

  it("every FOCUS_AREA_KEY has a mapping in FOCUS_AREA_TO_NEED", () => {
    for (const key of FOCUS_AREA_KEYS) {
      expect(
        FOCUS_AREA_TO_NEED[key],
        `FOCUS_AREA_TO_NEED is missing key "${key}"`,
      ).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// pregameNeedDefault
// ---------------------------------------------------------------------------

describe("pregameNeedDefault", () => {
  it("returns a valid NeedToday string for each focus area key", () => {
    for (const key of FOCUS_AREA_KEYS) {
      const result = pregameNeedDefault(key);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(ALL_NEED_TODAY_VALUES.has(result)).toBe(true);
      }
    }
  });

  it("returns null for null input", () => {
    expect(pregameNeedDefault(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(pregameNeedDefault(undefined)).toBeNull();
  });

  it("returns null for an unknown string", () => {
    expect(pregameNeedDefault("unknown")).toBeNull();
  });
});

// Satisfy TypeScript: NeedToday is used only as a type-level check above.
// This line prevents "declared but never read" if the import becomes import-only.
const _needTypeSentinel: NeedToday = "Calm";
void _needTypeSentinel;
