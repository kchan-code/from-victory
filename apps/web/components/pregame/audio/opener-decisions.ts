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
      text: "He will make your paths straight does not mean God promises you the right read on every shift. It means you can stop white-knuckling the game. The athlete who has to control every decision plays tight. The athlete who trusts God can release the death grip on outcome and actually see the ice.",
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
