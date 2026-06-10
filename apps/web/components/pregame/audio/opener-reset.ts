// Pregame opener — Today's focus: "Reset after mistakes."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Reset after mistakes on the Today's Focus screen.
//
// Verse: Romans 8:1 — no condemnation.
// Why: The cleanest reset verse in the New Testament. The athlete
// going into a game pre-loaded for the next mistake needs to hear
// that the verdict on them was settled at the cross, not at the next
// turnover. Pairs with the canonical From Victory event-vs-identity
// reset.
// Identity truth: "Your mistakes are real. The verdict is not."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_RESET_SCRIPT: AudioScript = {
  slug: "opener-reset",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your hands rest open.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote at the start of Romans 8. He has just spent a whole chapter naming his own failure. Then he opens chapter 8 with this. Therefore, there is now no condemnation for those who are in Christ Jesus.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "No condemnation does not mean no consequences. The puck still goes the other way when you turn it over. It means the verdict on you was already settled at the cross. The mistake you make tonight cannot reopen a case God has already closed.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Your mistakes are real. The verdict is not. Reset and go again.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
