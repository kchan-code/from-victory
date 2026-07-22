// Pregame opener — Today's focus: "Calm."
//
// FV-466: shared sport-neutral variant of opener-calm. Serves every
// sport that falls back to NEED_OPENER_SLUGS (football, golf, basketball
// "Calm", baseball, lacrosse, and future sports). Hockey keeps the
// original opener-calm clip via HOCKEY_OPENER_OVERRIDES in
// audio-mapping.ts — edits here must stay free of ALL sport-specific
// vocabulary (test: a golfer, a swimmer, and a linebacker all nod).
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

export const OPENER_SHARED_CALM_SCRIPT: AudioScript = {
  slug: "opener-shared-calm",
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
      text: "When the pressure comes, you do not have to carry it alone. Give it all to God — the nerves, the outcome, the mistakes, the moments you cannot control.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Then compete free. Free from anxiety. Free from fear. Free to take the next moment with a clear mind and a steady heart.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Come back to your breath. Come back to right now. This breath. This moment. This effort.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
