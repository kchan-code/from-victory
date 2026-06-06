// Pregame opener — Today's focus: "Confidence." (Basketball variant)
//
// Basketball-specific application of Hebrews 12:1-3 — same scripture,
// same identity truth, basketball language: possessions, stat line.
// Clone of opener-confidence.ts with basketball-specific seg-3 application.
//
// Verse: Hebrews 12:1-3 — fix your eyes on Jesus.
// Identity truth: "Your confidence is not in what you can do. It is in
// who already loves you."
//
// Youth-pastor APPROVED (FV-120). Audio rendering = FV-120.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_CONFIDENCE_SCRIPT: AudioScript = {
  slug: "opener-bb-confidence",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit tall.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what the writer of Hebrews said to a group of believers worn down by hardship. Hebrews 12. Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Fix your eyes on Jesus does not mean think positive thoughts about Jesus while you play. It means your confidence is not built on your last possession or your stat line. It is built on the one who already ran his race for you.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Your confidence is not in what you can do. It is in who already loves you.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
