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
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your shoulders drop.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Philippians 4. Paul wrote it from prison, not comfort: Do not be anxious about anything, but in every situation, bring your requests to God. And the peace of God, which transcends all understanding, will guard your heart and your mind in Christ Jesus.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "That peace does not mean you stop feeling nerves. It means Christ can hold you steady while the pressure is still real.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "When the pressure comes, you do not have to carry it alone. Give the game to God — the nerves, the outcome, the mistakes, the moments you cannot control.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Then play free. Free from anxiety. Free from fear. Free to take the next shift with a clear mind and a steady heart.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Come back to your breath. Come back to your next play. One read. One puck. One shift.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
