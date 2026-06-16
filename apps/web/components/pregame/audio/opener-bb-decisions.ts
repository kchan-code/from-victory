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
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Proverbs 3:5–6. Trust in the Lord with all your heart and lean not on your own understanding. In all your ways submit to Him, and He will make your paths straight.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "This does not mean God promises you the perfect read on every possession. It means you do not have to control the whole game in your own strength.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "You have prepared. You have trained. Now give the outcome to God and trust the work.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "When the game speeds up, do not freeze trying to make the perfect play. See it. Trust it. Move.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Eyes up. Hands ready. Hit the first action. Make the defense move.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
