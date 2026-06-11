// FV-229 — unit tests for the cue-word verse registry (pure data + resolver).
// Mirrors the style of positive-plays.test.ts: no manifest/filesystem access,
// no React. These assertions pin:
//   1. Completeness — every CUE_WORDS entry has a mapped verse.
//   2. Verbatim text — spot-check two entries against the source doc.
//   3. Custom-word fallback — returns the Hebrews 12:2 default.
//   4. Case-insensitivity — "STEADY" and "steady" resolve identically.

import { describe, it, expect } from "vitest";

import { CUE_WORDS } from "../types";
import {
  CUE_WORD_VERSE_MAP,
  DEFAULT_VERSE,
  verseForCueWord,
} from "../cue-word-verses";

describe("CUE_WORD_VERSE_MAP completeness", () => {
  it("has an entry for every CUE_WORDS item", () => {
    for (const word of CUE_WORDS) {
      expect(
        CUE_WORD_VERSE_MAP[word.toLowerCase()],
        `missing verse for cue word "${word}"`,
      ).toBeDefined();
    }
  });

  it("every entry has a non-empty reference and text", () => {
    for (const [key, verse] of Object.entries(CUE_WORD_VERSE_MAP)) {
      expect(verse.reference.trim().length, `empty reference for "${key}"`).toBeGreaterThan(0);
      expect(verse.text.trim().length, `empty text for "${key}"`).toBeGreaterThan(0);
    }
  });

  it("has exactly 10 entries (one per supported cue word)", () => {
    expect(Object.keys(CUE_WORD_VERSE_MAP)).toHaveLength(10);
  });
});

describe("verseForCueWord — verbatim text assertions (FV-229 source doc)", () => {
  it("Faithful → 1 Thessalonians 5:24, verbatim NIV", () => {
    const v = verseForCueWord("Faithful");
    expect(v.reference).toBe("1 Thessalonians 5:24");
    expect(v.text).toBe("The one who calls you is faithful, and he will do it.");
  });

  it("Courage → Joshua 1:9, verbatim NIV", () => {
    const v = verseForCueWord("Courage");
    expect(v.reference).toBe("Joshua 1:9");
    expect(v.text).toBe(
      "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.",
    );
  });

  it("Next → Lamentations 3:22-23, verbatim NIV", () => {
    const v = verseForCueWord("Next");
    expect(v.reference).toBe("Lamentations 3:22-23");
    expect(v.text).toBe(
      "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    );
  });

  it("Compete → Colossians 3:23 (ends with trailing comma per source doc)", () => {
    const v = verseForCueWord("Compete");
    expect(v.reference).toBe("Colossians 3:23");
    // Source doc includes a trailing comma (partial verse as published).
    expect(v.text).toBe(
      "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters,",
    );
  });
});

describe("verseForCueWord — custom-word fallback", () => {
  it("returns the Hebrews 12:2 default for a word not in the map", () => {
    const v = verseForCueWord("Focus");
    expect(v.reference).toBe(DEFAULT_VERSE.reference);
    expect(v.reference).toBe("Hebrews 12:2");
    expect(v.text).toBe("…fixing our eyes on Jesus, the pioneer and perfecter of faith.");
  });

  it("returns the default for an empty string", () => {
    const v = verseForCueWord("");
    expect(v.reference).toBe("Hebrews 12:2");
  });

  it("returns the default for a whitespace-only input", () => {
    const v = verseForCueWord("   ");
    expect(v.reference).toBe("Hebrews 12:2");
  });
});

describe("verseForCueWord — case-insensitivity", () => {
  it("resolves uppercase input (STEADY) identically to mixed-case (Steady)", () => {
    const lower = verseForCueWord("Steady");
    const upper = verseForCueWord("STEADY");
    const allLower = verseForCueWord("steady");
    expect(upper).toEqual(lower);
    expect(allLower).toEqual(lower);
  });

  it("resolves FAITHFUL, Faithful, and faithful to the same verse", () => {
    const a = verseForCueWord("FAITHFUL");
    const b = verseForCueWord("Faithful");
    const c = verseForCueWord("faithful");
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });
});
