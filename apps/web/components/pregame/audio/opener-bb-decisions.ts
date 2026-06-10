// Pregame opener — Today's focus: "Better decisions." (Basketball variant)
//
// Basketball-specific application of Proverbs 3:5-6 — same scripture,
// same identity truth, basketball floor-reading language: releasing the
// death grip on outcome and actually seeing the floor.
//
// Verse: Proverbs 3:5-6 — trust in the Lord with all your heart.
// Identity truth: "Trust does not mean knowing every play before it
// happens. It means leaning on God instead of leaning on yourself."
//
// Youth-pastor APPROVED (FV-115). Audio rendering = FV-116.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_DECISIONS_SCRIPT: AudioScript = {
  slug: "opener-bb-decisions",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Soften your jaw.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Solomon wrote in Proverbs 3. Trust in the Lord with all your heart and lean not on your own understanding. In all your ways submit to him, and he will make your paths straight.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "He will make your paths straight does not mean God promises you the right read on every possession. It means you can stop white-knuckling the game. The athlete who has to control every decision plays tight. The athlete who trusts God can release the death grip on outcome and actually see the floor.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Trust does not mean knowing every play before it happens. It means leaning on God instead of leaning on yourself.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
