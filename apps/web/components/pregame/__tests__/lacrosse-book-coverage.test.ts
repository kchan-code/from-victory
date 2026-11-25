import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLIP_ANC_LAX_TAP_STICK_SCRIPT,
  CLIP_ANC_LAX_GLOVE_TAP_SHAFT_SCRIPT,
  CLIP_ANC_LAX_RESET_AT_X_SCRIPT,
  CLIP_ST_LAX_01_SCRIPT,
} from "../audio/clips.ts";
import { parseBook } from "../../../scripts/apply-scripts.ts";

const scripts = [CLIP_ANC_LAX_TAP_STICK_SCRIPT, CLIP_ANC_LAX_GLOVE_TAP_SHAFT_SCRIPT,
  CLIP_ANC_LAX_RESET_AT_X_SCRIPT, CLIP_ST_LAX_01_SCRIPT];
const book = parseBook(readFileSync(resolve(process.cwd(), "../../docs/scripts/lacrosse.md"), "utf8"));

describe("FV-629 lacrosse personalization book coverage", () => {
  it.each(scripts)("preserves exact speech and ordered pauses for $slug", (script) => {
    const entries = book.clips.filter((clip) => clip.slug === script.slug);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.file).toBe("components/pregame/audio/clips.ts");
    expect(entries[0]!.items).toEqual(script.segments.map((segment) => {
      if (segment.type === "speech") return { type: "speech", text: segment.text };
      if (segment.type === "silence") return { type: "pause", durationSec: segment.durationSec };
      throw new Error("Unexpected non-speech/silence segment in lacrosse transcription source");
    }));
  });
});
