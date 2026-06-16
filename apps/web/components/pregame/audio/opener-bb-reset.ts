// Pregame opener — Today's focus: "Reset after mistakes." (Basketball variant)
//
// Basketball-specific application of Romans 8:1 — same scripture,
// same identity truth, basketball language: turnovers, the ball going
// the other way.
// Clone of opener-reset.ts with basketball-specific seg-3 application.
//
// Verse: Romans 8:1 — no condemnation.
// Identity truth: "Your mistakes are real. The verdict is not."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_RESET_SCRIPT: AudioScript = {
  slug: "opener-bb-reset",
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
      text: "No condemnation does not mean no consequences. If you turn it over, the ball still goes the other way. But it means the verdict on you was already settled at the cross.",
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
      text: "So when the bad play happens, do not carry condemnation into the next possession. Learn what you need. Drop what you do not.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "You are free to go hard. Do not hold on. Breathe, reset, and play the next one.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
