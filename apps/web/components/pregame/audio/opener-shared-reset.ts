// Pregame opener — Today's focus: "Reset after mistakes."
//
// FV-466: shared sport-neutral variant of opener-reset. Serves every
// sport that falls back to NEED_OPENER_SLUGS (football, golf, basketball
// "Calm", baseball, lacrosse, and future sports). Hockey keeps the
// original opener-reset clip via HOCKEY_OPENER_OVERRIDES in
// audio-mapping.ts — edits here must stay free of ALL sport-specific
// vocabulary (test: a golfer, a swimmer, and a linebacker all nod).
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

export const OPENER_SHARED_RESET_SCRIPT: AudioScript = {
  slug: "opener-shared-reset",
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
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Romans 8:1. Paul has just named the struggle with his own failure. Then he opens chapter 8 with this: Therefore, there is now no condemnation for those who are in Christ Jesus.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "No condemnation does not mean no consequences. If you make the mistake, it still costs you. But it means the verdict on you was already settled at the cross.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The mistake you make tonight cannot reopen a case God has already closed.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So when the mistake happens, do not carry condemnation into the next one. Learn what you need. Drop what you do not.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "You are free to go hard. Do not hold on. Breathe, reset, and go again.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
