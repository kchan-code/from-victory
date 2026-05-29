// Pregame opener — Today's focus: "Calm."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Calm on the Today's Focus screen.
//
// Verse: Philippians 4:6-7 — peace beyond understanding.
// Why: The canonical anxiety/peace passage, written by Paul from a
// Roman prison. Honest about pressure (do not be anxious about
// anything), specific about the move (prayer + thanksgiving), and
// names the result (peace that guards the heart). Aligns with
// Wiersma's "regulate, do not suppress" — peace is not the absence of
// pressure.
// Identity truth: "Peace is not the absence of pressure. It is the
// presence of Christ when pressure comes."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_CALM_SCRIPT: AudioScript = {
  slug: "opener-calm",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your shoulders drop.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote in Philippians 4. Not from a quiet life. From a Roman prison. Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Peace that transcends understanding does not mean you stop feeling nerves. It means a peace that does not match what is in front of you can guard you while you compete. The pressure is still real. So is the One holding you steady inside it.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Peace is not the absence of pressure. It is the presence of Christ when pressure comes.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
