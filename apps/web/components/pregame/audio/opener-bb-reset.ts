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
      text: "No condemnation does not mean no consequences. The ball still goes the other way when you turn it over. It means the verdict on you was already settled at the cross. The mistake you make tonight cannot reopen a case God has already closed.",
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
