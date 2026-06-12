// FV-229 — unit tests for the cue-word verse registry (pure data + resolver).
// Mirrors the style of positive-plays.test.ts: no manifest/filesystem access,
// no React. These assertions pin:
//   1. Completeness — every CUE_WORDS entry has a mapped verse.
//   2. Verbatim text — ALL TEN entries pinned character-for-character
//      against the source doc (docs/cue-word-verses-fv229.md), so a
//      one-character scripture drift fails CI.
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

  it("Steady → Psalm 16:8, verbatim NIV", () => {
    const v = verseForCueWord("Steady");
    expect(v.reference).toBe("Psalm 16:8");
    expect(v.text).toBe(
      "I keep my eyes always on the Lord. With him at my right hand, I will not be shaken.",
    );
  });

  it("Simple → Psalm 131:1-2, verbatim NIV (REVISED mapping — not Micah 6:8)", () => {
    const v = verseForCueWord("Simple");
    expect(v.reference).toBe("Psalm 131:1-2");
    expect(v.text).toBe(
      "My heart is not proud, Lord, my eyes are not haughty; I do not concern myself with great matters or things too wonderful for me. But I have calmed and quieted myself, I am like a weaned child with its mother; like a weaned child I am content.",
    );
  });

  it("Attack → 1 Corinthians 16:13, verbatim NIV", () => {
    const v = verseForCueWord("Attack");
    expect(v.reference).toBe("1 Corinthians 16:13");
    expect(v.text).toBe(
      "Be on your guard; stand firm in the faith; be courageous; be strong.",
    );
  });

  it("Serve → Mark 10:45, verbatim NIV", () => {
    const v = verseForCueWord("Serve");
    expect(v.reference).toBe("Mark 10:45");
    expect(v.text).toBe(
      "For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
    );
  });

  it("Free → Galatians 5:1, verbatim NIV", () => {
    const v = verseForCueWord("Free");
    expect(v.reference).toBe("Galatians 5:1");
    expect(v.text).toBe(
      "It is for freedom that Christ has set us free. Stand firm, then, and do not let yourselves be burdened again by a yoke of slavery.",
    );
  });

  it("Relentless → Galatians 6:9, verbatim NIV", () => {
    const v = verseForCueWord("Relentless");
    expect(v.reference).toBe("Galatians 6:9");
    expect(v.text).toBe(
      "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
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
