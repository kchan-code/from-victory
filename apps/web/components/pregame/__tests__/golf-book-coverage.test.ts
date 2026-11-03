import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { GOLF_VIZ_CLIP_SCRIPTS } from "../audio/clips-viz-golf.ts";
import { parseBook } from "../../../scripts/apply-scripts.ts";

const book = parseBook(readFileSync(resolve(process.cwd(), "../../docs/scripts/golf.md"), "utf8"));

describe("FV-315 golf canonical book coverage", () => {
  it("covers all 21 shipped positive plays and the golf self-talk clip", () => {
    expect(GOLF_VIZ_CLIP_SCRIPTS).toHaveLength(22);
    expect(GOLF_VIZ_CLIP_SCRIPTS.filter((clip) => clip.slug.startsWith("viz-"))).toHaveLength(21);
    expect(GOLF_VIZ_CLIP_SCRIPTS.some((clip) => clip.slug === "st-glf-02")).toBe(true);
  });

  it.each(GOLF_VIZ_CLIP_SCRIPTS)("preserves the exact speech and ordered pauses for $slug", (script) => {
    const entries = book.clips.filter((clip) => clip.slug === script.slug);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.file).toBe("components/pregame/audio/clips-viz-golf.ts");
    expect(entries[0]!.items).toEqual(script.segments.map((segment) => {
      if (segment.type === "speech") return { type: "speech", text: segment.text };
      if (segment.type === "silence") return { type: "pause", durationSec: segment.durationSec };
      throw new Error("Unexpected non-speech/silence segment in golf transcription source");
    }));
  });
});
