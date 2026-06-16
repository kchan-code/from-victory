// Pregame opener — Today's focus: "Better puck decisions."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Better puck decisions on the Today's Focus screen.
//
// Verse: Proverbs 3:5-6 — trust in the Lord with all your heart.
// Why: The most theologically tricky of the eight needs. The
// prosperity risk: "pray for better decisions and God will give you
// better reads." Proverbs 3 is a wisdom passage about a posture of
// trust, not a transactional shortcut. Handled in context, it reframes
// puck decisions as a Gallwey/Inner Game move — releasing self-trust
// as the foundation lets the trained body (Self 2) play without
// over-controlling.
// Identity truth: "Trust does not mean knowing every play before it
// happens. It means leaning on God instead of leaning on yourself."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_DECISIONS_SCRIPT: AudioScript = {
  slug: "opener-decisions",
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
      text: "This does not mean God promises you the perfect read on every shift. It means you do not have to control the whole game in your own strength.",
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
      text: "Head up. Hands loose. Read the ice. Make the next faithful play.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
