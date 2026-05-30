// Forward × I turn the puck over
//
// Forward turnovers spike the heart rate and shame loop fast — the spiral is 'I gave them that,' and the body's reflex is to chase the puck recklessly or shy away from the next touch.
//
// One of the 30-cell pregame audio matrix (3 positions × 10 adversities).
// Generated 2026-05-27 from the locked Forward + Defense + Goalie pilot
// templates. Segments 1-3 and 8-9 are universal lift; segments 4-6 are
// position-specific lift from the forward pilot; segment 7 is
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
  FORWARD_VIZ,
  OPENING,
} from "./segments.ts";

export const SESSION_FORWARD_TURNOVER_SCRIPT: AudioScript = {
  slug: "session-forward-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...FORWARD_VIZ,

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
      text: "You have the puck at the offensive blue line. You try to force it through a stick. It pops loose and goes the other way. They are on the rush.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I just gave them that.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
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
      text: "Speak the truth. Your mistake is real. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
