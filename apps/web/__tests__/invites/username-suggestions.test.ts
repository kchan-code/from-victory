/**
 * FV-634 — neutral username suggestions shown after a real collision.
 */
import { describe, expect, it } from "vitest";

import {
  RESERVED_USERNAMES,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  validateUsername,
} from "@/lib/auth/athlete-username";
import {
  SUGGESTION_ADJECTIVES,
  SUGGESTION_COUNT,
  SUGGESTION_NOUNS,
  generateUsernameSuggestions,
  type RandomInt,
} from "@/lib/auth/username-suggestions";

const SHAPE = /^[a-z]+_[a-z]+[1-9][0-9]{2}$/;

/** Deterministic rand that replays a fixed sequence (wrapped into range). */
function seq(values: number[]): RandomInt {
  let i = 0;
  return (max) => (values[i++ % values.length] ?? 0) % max;
}

describe("word lists", () => {
  it("every adjective × noun × {100, 999} candidate is a valid, unreserved handle within bounds", () => {
    for (const adj of SUGGESTION_ADJECTIVES) {
      for (const noun of SUGGESTION_NOUNS) {
        for (const n of [100, 999]) {
          const c = `${adj}_${noun}${n}`;
          const v = validateUsername(c);
          expect(v).toEqual({ ok: true, normalized: c });
          expect(c.length).toBeGreaterThanOrEqual(USERNAME_MIN_LENGTH);
          expect(c.length).toBeLessThanOrEqual(USERNAME_MAX_LENGTH);
          expect(RESERVED_USERNAMES.has(c)).toBe(false);
        }
      }
    }
  });

  it("the longest possible candidate still fits the 20-char limit", () => {
    const longest =
      Math.max(...SUGGESTION_ADJECTIVES.map((w) => w.length)) +
      1 +
      Math.max(...SUGGESTION_NOUNS.map((w) => w.length)) +
      3;
    expect(longest).toBeLessThanOrEqual(USERNAME_MAX_LENGTH);
  });

  it("no list word is reserved, brand, faith, age, or 'kid' language", () => {
    const banned = ["kid", "victory", "faith", "grace", "saint", "boy", "girl", "jr", "goalie", "qb"];
    for (const w of [...SUGGESTION_ADJECTIVES, ...SUGGESTION_NOUNS]) {
      expect(w).toMatch(/^[a-z]+$/);
      expect(RESERVED_USERNAMES.has(w)).toBe(false);
      for (const b of banned) expect(w).not.toContain(b);
    }
    expect(new Set(SUGGESTION_ADJECTIVES).size).toBe(SUGGESTION_ADJECTIVES.length);
    expect(new Set(SUGGESTION_NOUNS).size).toBe(SUGGESTION_NOUNS.length);
  });
});

describe("generateUsernameSuggestions", () => {
  it("returns 3 distinct, valid, word-pair-distinct handles (CSPRNG, many runs)", () => {
    for (let run = 0; run < 300; run++) {
      const out = generateUsernameSuggestions();
      expect(out).toHaveLength(SUGGESTION_COUNT);
      expect(new Set(out).size).toBe(SUGGESTION_COUNT);
      const pairs = out.map((u) => u.replace(/\d+$/, ""));
      expect(new Set(pairs).size).toBe(SUGGESTION_COUNT);
      for (const u of out) {
        expect(u).toMatch(SHAPE);
        expect(validateUsername(u)).toEqual({ ok: true, normalized: u });
      }
    }
  });

  it("the number is always 3 digits, so it never reads as an age or birth year", () => {
    for (let run = 0; run < 300; run++) {
      for (const u of generateUsernameSuggestions()) {
        const n = Number(/(\d+)$/.exec(u)![1]);
        expect(n).toBeGreaterThanOrEqual(100);
        expect(n).toBeLessThanOrEqual(999);
      }
    }
  });

  it("never suggests the excluded (just-rejected) handle, case-insensitively", () => {
    // First draw would be swift_comet100; it is excluded, so it must be skipped.
    const rand = seq([0, 0, 0, 1, 1, 5, 2, 2, 7, 3, 3, 9]);
    const out = generateUsernameSuggestions({ exclude: ["SWIFT_COMET100"], rand });
    expect(out).not.toContain("swift_comet100");
    expect(out).toHaveLength(3);
  });

  it("is not derived from the attempted username", () => {
    for (let run = 0; run < 100; run++) {
      for (const u of generateUsernameSuggestions({ exclude: ["jordan_smith07"] })) {
        expect(u).not.toContain("jordan");
        expect(u).not.toContain("smith");
      }
    }
  });

  it("terminates with fewer than 3 if randomness is degenerate (never loops forever)", () => {
    const out = generateUsernameSuggestions({ rand: () => 0 });
    expect(out).toEqual(["swift_comet100"]);
  });
});
