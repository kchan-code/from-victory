// Pregame opener — Today's focus: "Confidence."
//
// Replaces segment 1 ("Receive identity") of the locked pilot session
// when the athlete selects Confidence on the Today's Focus screen.
// Stitched at runtime: opener-confidence.mp3 + <cell>.mp3.
//
// Verse: Hebrews 12:1-3 — fix your eyes on Jesus.
// Why: Confidence is the need most likely to slide into pump-up
// self-talk. Hebrews 12 reframes confidence as endurance grounded in
// looking AWAY from self (and away from outcome) toward Christ. Robust
// belief (Bandura), not fragile mood.
// Identity truth: "Your confidence is not in what you can do. It is in
// who already loves you."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_CONFIDENCE_SCRIPT: AudioScript = {
  slug: "opener-confidence",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit tall.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what the writer of Hebrews said to a group of believers worn down by hardship. Hebrews 12. Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Fix your eyes on Jesus does not mean think positive thoughts about Jesus while you play. It means your confidence is not built on your last shift or your stat line. It is built on the one who already ran his race for you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Your confidence is not in what you can do. It is in who already loves you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
