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
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit tall.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Hebrews 12. Written to believers worn down by hardship: Let us run with perseverance the race marked out for us, fixing our eyes on Jesus, the pioneer and perfecter of faith.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hebrews uses athletic language. Jesus is the pioneer — the One who ran before us, opened the way, endured the cross, and finished His race for us.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "That is where your confidence starts. Not in chasing a perfect game, but in Christ — the One who holds you secure as you run yours.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So when the game gets hard, when the trial comes, run with perseverance. Endure the hard possession, and fix your eyes on Him.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Play steady. Go hard. Be bold and fearless. Let it all go, because God already holds the outcome.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
