// FV-302 — book-defines-structure overrides.
//
// Covers the generator's `applyBookProseOverrides`, which makes the .md book the
// authoritative source of a clip's prose, pause durations, AND line count:
//   - IN-SYNC path: book mirrors TS structure → text/duration substituted by
//     position, TS marks/instructions preserved (byte-identical assembly).
//   - BOOK-DEFINES-STRUCTURE path: book line/pause count differs (an editor
//     changed the line count) → the segment list is REBUILT from the book's
//     interleaved items. A phase mark stays on its anchor line (matched by text,
//     in occurrence order) even when other lines are inserted/removed; new lines
//     carry no mark and inherit the script-level instructions/speed at render.
//
// Also covers parseBook capturing the interleaved `items` order.

import { describe, it, expect } from "vitest";

import { parseBook, type BookEntry, type BookItem } from "../../../scripts/apply-scripts.ts";
import { applyBookProseOverrides } from "../../../scripts/generate-pregame-audio.ts";
import type { AudioScript, Segment } from "../audio/types.ts";

// Build a BookEntry from an interleaved item list (mirrors what parseBook yields).
function bookEntry(items: BookItem[]): BookEntry {
  return {
    lines: items.filter((i): i is Extract<BookItem, { type: "speech" }> => i.type === "speech").map((i) => i.text),
    pauses: items
      .filter((i): i is Extract<BookItem, { type: "pause" }> => i.type === "pause")
      .map((i) => ({ durationSec: i.durationSec })),
    items,
  };
}

function mapOf(slug: string, entry: BookEntry): Map<string, BookEntry> {
  return new Map([[slug, entry]]);
}

// A representative TS script: 3 speech lines (one marked, one with a per-line
// instruction) interleaved with 2 silences.
const BASE_SCRIPT: AudioScript = {
  slug: "test-clip",
  voice: "ash",
  instructions: "SCRIPT_LEVEL_INSTR",
  speed: 1.1,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", instructions: "HM_INSTR", mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "See the play unfold.", instructions: "VIZ_INSTR", mark: { phase: "firstShift" } },
    { type: "silence", durationSec: 2 },
    { type: "speech", text: "Take the next faithful action." },
  ],
};

const speechOnly = (segs: Segment[]) => segs.filter((s) => s.type === "speech");

describe("parseBook — interleaved items (FV-302)", () => {
  it("captures speech + pause markers in book order", () => {
    const book = [
      "<!-- slug: c1 | file: x.ts -->",
      "1. Line one.",
      "_(pause: 0.4s)_",
      "2. Line two.",
      "_(pause: 2s)_",
    ].join("\n");
    const { clips } = parseBook(book);
    expect(clips[0]!.items).toEqual([
      { type: "speech", text: "Line one." },
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "Line two." },
      { type: "pause", durationSec: 2 },
    ]);
  });

  it("preserves consecutive pauses (e.g. breath-threshold double pause)", () => {
    const book = [
      "<!-- slug: c2 | file: x.ts -->",
      "1. Exhale.",
      "_(pause: 6s)_",
      "_(pause: 0.8s)_",
      "2. Ready.",
    ].join("\n");
    const { clips } = parseBook(book);
    expect(clips[0]!.items).toEqual([
      { type: "speech", text: "Exhale." },
      { type: "pause", durationSec: 6 },
      { type: "pause", durationSec: 0.8 },
      { type: "speech", text: "Ready." },
    ]);
  });
});

describe("applyBookProseOverrides — no book entry", () => {
  it("returns the TS segments unchanged when the slug has no book entry", () => {
    const out = applyBookProseOverrides(BASE_SCRIPT, new Map());
    expect(out).toBe(BASE_SCRIPT.segments);
  });
});

describe("applyBookProseOverrides — in-sync path (book mirrors TS)", () => {
  const inSync = bookEntry([
    { type: "speech", text: "Now rehearse the hard moment." },
    { type: "pause", durationSec: 0.4 },
    { type: "speech", text: "See the play unfold." },
    { type: "pause", durationSec: 2 },
    { type: "speech", text: "Take the next faithful action." },
  ]);

  it("preserves marks, instructions, and durations when book == TS", () => {
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", inSync));
    expect(out).toHaveLength(5);
    expect(out[0]).toMatchObject({ type: "speech", text: "Now rehearse the hard moment.", instructions: "HM_INSTR", mark: { phase: "hardMoment" } });
    expect(out[1]).toMatchObject({ type: "silence", durationSec: 0.4 });
    expect(out[2]).toMatchObject({ type: "speech", mark: { phase: "firstShift" }, instructions: "VIZ_INSTR" });
    expect(out[3]).toMatchObject({ type: "silence", durationSec: 2 });
  });

  it("substitutes edited prose but keeps the TS mark/instruction on that line", () => {
    const edited = bookEntry([
      { type: "speech", text: "Now picture the hard moment again." }, // edited line 1
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "See the play unfold." },
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", edited));
    expect(out[0]).toMatchObject({ type: "speech", text: "Now picture the hard moment again.", mark: { phase: "hardMoment" }, instructions: "HM_INSTR" });
  });

  it("applies a migrated pause duration that differs from TS", () => {
    const longerPause = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: 1.2 }, // was 0.4 in TS
      { type: "speech", text: "See the play unfold." },
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", longerPause));
    expect(out[1]).toMatchObject({ type: "silence", durationSec: 1.2 });
  });
});

describe("applyBookProseOverrides — book defines structure (counts differ)", () => {
  it("renders an EXTRA appended line; the new line has no mark and no per-line instructions", () => {
    const withExtra = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "See the play unfold." },
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
      { type: "pause", durationSec: 1.5 },
      { type: "speech", text: "One more breath, then go." }, // NEW line
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", withExtra));
    const sp = speechOnly(out);
    expect(sp).toHaveLength(4);
    expect(sp[3]).toMatchObject({ type: "speech", text: "One more breath, then go." });
    expect(sp[3]!.mark).toBeUndefined();
    expect((sp[3] as Extract<Segment, { type: "speech" }>).instructions).toBeUndefined();
    // The new pause is honored, and the existing anchors keep their marks.
    expect(sp[0]).toMatchObject({ mark: { phase: "hardMoment" }, instructions: "HM_INSTR" });
    expect(sp[1]).toMatchObject({ text: "See the play unfold.", mark: { phase: "firstShift" } });
    expect(out.filter((s) => s.type === "silence").map((s) => (s as Extract<Segment, { type: "silence" }>).durationSec)).toEqual([0.4, 2, 1.5]);
  });

  it("keeps a mark on its anchor line when a line is INSERTED before it", () => {
    const inserted = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "Settle your breath here." }, // NEW line before the firstShift anchor
      { type: "pause", durationSec: 1 },
      { type: "speech", text: "See the play unfold." }, // the firstShift anchor, now shifted later
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", inserted));
    const sp = speechOnly(out);
    expect(sp).toHaveLength(4);
    // The first anchor is untouched by an insertion further down.
    expect(sp[0]).toMatchObject({ text: "Now rehearse the hard moment.", mark: { phase: "hardMoment" } });
    expect(sp[1]).toMatchObject({ text: "Settle your breath here." });
    expect(sp[1]!.mark).toBeUndefined(); // inserted line: no mark
    // firstShift moved to index 2 WITH the anchor text — the mark followed it.
    expect(sp[2]).toMatchObject({ text: "See the play unfold.", mark: { phase: "firstShift" }, instructions: "VIZ_INSTR" });
    // The trailing unmarked line stays unmarked (no spillover).
    expect(sp[3]).toMatchObject({ text: "Take the next faithful action." });
    expect(sp[3]!.mark).toBeUndefined();
  });

  it("renders FEWER lines; surviving anchors keep their marks, the dropped mark does not spill", () => {
    const fewer = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "Take the next faithful action." }, // dropped the middle (firstShift) line
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", fewer));
    const sp = speechOnly(out);
    expect(sp).toHaveLength(2);
    // The dropped middle line took its trailing silence with it.
    expect(out.filter((s) => s.type === "silence")).toHaveLength(1);
    expect(sp[0]).toMatchObject({ mark: { phase: "hardMoment" } });
    expect(sp[1]).toMatchObject({ text: "Take the next faithful action." });
    // The dropped firstShift mark must NOT spill onto the surviving last line.
    expect(sp[1]!.mark).toBeUndefined();
  });

  it("matches duplicate anchor text in occurrence order (inhale/exhale rounds)", () => {
    const breath: AudioScript = {
      slug: "breath",
      voice: "ash",
      instructions: "S",
      segments: [
        { type: "speech", text: "Inhale.", mark: { phase: "inhale", round: 0 } },
        { type: "silence", durationSec: 4 },
        { type: "speech", text: "Inhale.", mark: { phase: "inhale", round: 1 } },
        { type: "silence", durationSec: 4 },
        { type: "speech", text: "Done." },
      ],
    };
    // Add a trailing line → structure differs → rebuild path.
    const entry = bookEntry([
      { type: "speech", text: "Inhale." },
      { type: "pause", durationSec: 4 },
      { type: "speech", text: "Inhale." },
      { type: "pause", durationSec: 4 },
      { type: "speech", text: "Done." },
      { type: "pause", durationSec: 1 },
      { type: "speech", text: "Now go." },
    ]);
    const out = applyBookProseOverrides(breath, mapOf("breath", entry));
    const sp = speechOnly(out);
    expect(sp[0]).toMatchObject({ mark: { phase: "inhale", round: 0 } });
    expect(sp[1]).toMatchObject({ mark: { phase: "inhale", round: 1 } });
    expect(sp[3]).toMatchObject({ text: "Now go." });
    expect(sp[3]!.mark).toBeUndefined();
  });

  it("falls back to the TS silence duration for a bare _(pause)_ on the rebuild path", () => {
    const bare = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: null }, // bare → fall back to TS silence[0] = 0.4
      { type: "speech", text: "See the play unfold." },
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
      { type: "pause", durationSec: 1.5 },
      { type: "speech", text: "New tail line." }, // forces the rebuild path
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", bare));
    const silences = out.filter((s) => s.type === "silence") as Extract<Segment, { type: "silence" }>[];
    expect(silences[0]!.durationSec).toBe(0.4); // recovered from TS, not the null
    expect(silences[1]!.durationSec).toBe(2);
    expect(silences[2]!.durationSec).toBe(1.5);
  });

  it("falls back to the TS script when the book entry has zero prose lines (corrupt/empty)", () => {
    // An empty book entry (slug present, no numbered lines) is never an
    // intentional structure change — the generator must NOT ship a silent clip.
    const empty = bookEntry([]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", empty));
    expect(out).toBe(BASE_SCRIPT.segments); // safe fallback to the TS segments
  });

  it("defaults a trailing bare _(pause)_ beyond the TS silences to 1s", () => {
    const trailingBare = bookEntry([
      { type: "speech", text: "Now rehearse the hard moment." },
      { type: "pause", durationSec: 0.4 },
      { type: "speech", text: "See the play unfold." },
      { type: "pause", durationSec: 2 },
      { type: "speech", text: "Take the next faithful action." },
      { type: "pause", durationSec: null }, // bare pause beyond the 2 TS silences
      { type: "speech", text: "One more line." },
    ]);
    const out = applyBookProseOverrides(BASE_SCRIPT, mapOf("test-clip", trailingBare));
    const silences = out.filter((s) => s.type === "silence") as Extract<Segment, { type: "silence" }>[];
    expect(silences).toHaveLength(3);
    expect(silences[2]!.durationSec).toBe(1); // no TS silence to inherit → 1s default
  });
});
