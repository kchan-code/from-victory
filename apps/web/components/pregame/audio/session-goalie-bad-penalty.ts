// Goalie × I take a bad penalty
//
// A goalie penalty (slash, delay of game) is rare and especially heavy because it puts your team on the PK without your help. The false story is 'I just made it worse.'
//
// One of the 30-cell pregame audio matrix (3 positions × 10 adversities).
// Generated 2026-05-27 from the locked Forward + Defense + Goalie pilot
// templates. Segments 1-3 and 8-9 are universal lift; segments 4-6 are
// position-specific lift from the goalie pilot; segment 7 is
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
  GOALIE_VIZ,
  OPENING,
} from "./segments.ts";

export const SESSION_GOALIE_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "session-goalie-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...GOALIE_VIZ,

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
      text: "The puck is in your feet. You flip it over the glass. The whistle blows. The ref points at you. Two minutes for delay of game.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your face. Tight in your chest. I just hurt my team.",
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
    // Cell-specific tactical wisdom.
    {
      type: "speech",
      text: "Don't play tight on the PK. Trust your reads.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You took the penalty. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
