// Defense × Coach yells
//
// For a D-man, the coach's voice attacks reads, gap, and trust — the false story is 'he doesn't think I can play in my zone.'
//
// One of the 30-cell pregame audio matrix (3 positions × 10 adversities).
// Generated 2026-05-27 from the locked Forward + Defense + Goalie pilot
// templates. Segments 1-3 and 8-9 are universal lift; segments 4-6 are
// position-specific lift from the defense pilot; segment 7 is
// cell-specific.
//
// Instruction blocks now import from the shared ./instructions.ts module.
// Position segments 4-6 are still lifted from the position pilot — a future
// extraction to per-position segment modules.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  CLOSING,
  DEFENSE_VIZ,
  OPENING,
} from "./segments.ts";

export const SESSION_DEFENSE_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "session-defense-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...DEFENSE_VIZ,

    // ── Hard moment (Mentor → Coach) — cell-specific
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You come off the ice. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight jaw. Heat in your chest. He doesn't trust me back there.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale on the bench.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell.
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. The coach is loud. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
