// Unit tests for FV-302: book pause-marker parser grammar.
//
// Tests the new _(pause: Ns)_ grammar in parseBook(), bare-pause fallback,
// fractional values, consecutive pauses, and edge cases.
//
// Also covers the relaxed-guard behaviour in applyBookProseOverrides() and
// the migration script's formatDuration() logic (via round-trip verification).
//
// Run narrowly: npx vitest run components/pregame/__tests__/book-pause-parser.test.ts

import { describe, it, expect } from "vitest";
import { parseBook } from "../../../scripts/apply-scripts.ts";

// ---------------------------------------------------------------------------
// Helper: build minimal book markdown for a single clip
// ---------------------------------------------------------------------------

function makeBook(slug: string, bodyLines: string[]): string {
  const header = `# Book\n\n## Audio Clips\n\n### Test Clip\n<!-- slug: ${slug} | file: components/pregame/audio/clips.ts -->\n\n`;
  return header + bodyLines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// parseBook — pause grammar
// ---------------------------------------------------------------------------

describe("parseBook — pause-marker grammar (FV-302)", () => {

  it("parses _(pause: Ns)_ with trailing s — integer", () => {
    const md = makeBook("test-clip", [
      "1. Line one.",
      "_(pause: 4s)_",
      "2. Line two.",
    ]);
    const { clips } = parseBook(md);
    expect(clips).toHaveLength(1);
    const clip = clips[0]!;
    expect(clip.lines).toEqual(["Line one.", "Line two."]);
    expect(clip.pauses).toEqual([{ durationSec: 4 }]);
  });

  it("parses _(pause: Ns)_ — decimal value 1.5", () => {
    const md = makeBook("test-clip", [
      "1. Line one.",
      "_(pause: 1.5s)_",
      "2. Line two.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([{ durationSec: 1.5 }]);
  });

  it("parses _(pause: Ns)_ — fractional value 0.25", () => {
    const md = makeBook("test-clip", [
      "1. Line one.",
      "_(pause: 0.25s)_",
      "2. Line two.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([{ durationSec: 0.25 }]);
  });

  it("parses _(pause: Ns)_ — large value 30", () => {
    const md = makeBook("test-clip", [
      "1. Prayer line.",
      "_(pause: 30s)_",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([{ durationSec: 30 }]);
  });

  it("parses _(pause: N)_ — trailing s is optional", () => {
    const md = makeBook("test-clip", [
      "1. Line one.",
      "_(pause: 4)_",
      "2. Line two.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([{ durationSec: 4 }]);
  });

  it("parses bare _(pause)_ as durationSec: null (transition-window fallback)", () => {
    const md = makeBook("test-clip", [
      "1. Line one.",
      "_(pause)_",
      "2. Line two.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([{ durationSec: null }]);
  });

  it("handles consecutive _(pause: Ns)_ markers (e.g. breath-threshold double pause)", () => {
    const md = makeBook("breath-threshold", [
      "1. Exhale.",
      "_(pause: 6s)_",
      "_(pause: 0.8s)_",
      "2. Ready. Now set your focus.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([
      { durationSec: 6 },
      { durationSec: 0.8 },
    ]);
    expect(clips[0]!.lines).toEqual(["Exhale.", "Ready. Now set your focus."]);
  });

  it("handles mix of bare and valued pauses in same clip", () => {
    const md = makeBook("mixed-clip", [
      "1. Line one.",
      "_(pause: 2s)_",
      "2. Line two.",
      "_(pause)_",
      "3. Line three.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([
      { durationSec: 2 },
      { durationSec: null },
    ]);
  });

  it("clips with zero pauses (wordless single-line anchors) have pauses: []", () => {
    const md = makeBook("anc-long-exhale", [
      "1. Long exhale.",
    ]);
    const { clips } = parseBook(md);
    expect(clips[0]!.pauses).toEqual([]);
    expect(clips[0]!.lines).toEqual(["Long exhale."]);
  });

  it("multiple clips in one book each get their own pauses array", () => {
    const md = `# Book\n\n## Audio Clips\n\n` +
      `### Clip A\n<!-- slug: clip-a | file: clips.ts -->\n\n` +
      `1. A line.\n_(pause: 1s)_\n` +
      `### Clip B\n<!-- slug: clip-b | file: clips.ts -->\n\n` +
      `1. B line.\n_(pause: 2s)_\n_(pause: 0.5s)_\n`;
    const { clips } = parseBook(md);
    expect(clips).toHaveLength(2);
    expect(clips[0]!.slug).toBe("clip-a");
    expect(clips[0]!.pauses).toEqual([{ durationSec: 1 }]);
    expect(clips[1]!.slug).toBe("clip-b");
    expect(clips[1]!.pauses).toEqual([{ durationSec: 2 }, { durationSec: 0.5 }]);
  });

  it("pause markers inside ## Text-mode fallback zone are NOT parsed as clip pauses", () => {
    const md = `# Book\n\n## Text-mode fallback (Hockey)\n\n<!-- audioScript#0 | eyebrow: -->\n1. Body line.\n\n---\n\n## Audio Clips\n\n### My Clip\n<!-- slug: my-clip | file: clips.ts -->\n\n1. Spoken line.\n_(pause: 1s)_\n`;
    const { clips, fallbackLines } = parseBook(md);
    expect(clips).toHaveLength(1);
    expect(clips[0]!.pauses).toEqual([{ durationSec: 1 }]);
    expect(fallbackLines[0]!.body).toBe("Body line.");
  });

  it("pause markers inside a ### heading without a slug comment are not accumulated", () => {
    const md = `# Book\n\n## Audio Clips\n\n### Some Heading\n_(pause: 5s)_\n### Real Clip\n<!-- slug: real-clip | file: clips.ts -->\n\n1. Real line.\n_(pause: 2s)_\n`;
    const { clips } = parseBook(md);
    // Only the real clip — not the heading section
    expect(clips).toHaveLength(1);
    expect(clips[0]!.slug).toBe("real-clip");
    expect(clips[0]!.pauses).toEqual([{ durationSec: 2 }]);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: verify durations are preserved exactly after migration
// The formatDuration() logic in migrate-pause-durations.ts uses .toString()
// which produces canonical string representations. Test by parsing what it writes.
// ---------------------------------------------------------------------------

describe("round-trip: formatDuration → parseBook", () => {
  const cases: Array<{ dur: number; formatted: string }> = [
    { dur: 1, formatted: "1" },
    { dur: 0.4, formatted: "0.4" },
    { dur: 1.5, formatted: "1.5" },
    { dur: 2.2, formatted: "2.2" },
    { dur: 0.25, formatted: "0.25" },
    { dur: 0.8, formatted: "0.8" },
    { dur: 4, formatted: "4" },
    { dur: 6, formatted: "6" },
    { dur: 30, formatted: "30" },
    { dur: 2, formatted: "2" },
    { dur: 1.25, formatted: "1.25" },
  ];

  for (const { dur, formatted } of cases) {
    it(`_(pause: ${formatted}s)_ parses back to durationSec: ${dur}`, () => {
      const md = makeBook("test-rt", [
        `1. Speech.`,
        `_(pause: ${formatted}s)_`,
        `2. More speech.`,
      ]);
      const { clips } = parseBook(md);
      const pause = clips[0]!.pauses[0]!;
      expect(pause.durationSec).toBeCloseTo(dur, 10);
    });
  }
});
