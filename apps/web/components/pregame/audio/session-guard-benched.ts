// Guard × I get benched  ⚠ CLINICAL-GATE CELL (FV-29 §6 removal cell)
//
// The guard's identity fuses to control / running the team, so being pulled
// hits the "I'm not trusted / I lost the keys" story hardest. Per the FV-29
// clinical gate: that identity story appears ONLY as a false story being
// rejected (named once in the narration, answered in the truth block, never
// left standing). The reframe is held to the 13-15 register — no perfectionism,
// no worth-on-performance. ROUTE TO sports-psychologist (and the credentialed
// advisor when seated) before voice-lock.
//
// One of the basketball pregame matrix (FV-30); authored from the FV-29
// taxonomy, mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING)
// reused. Registered in clips.ts CLIP_SCRIPTS under the per-sport registry (FV-30).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_BENCHED_SCRIPT: AudioScript = {
  slug: "bb-guard-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,

    // ── Hard moment (Mentor → Coach) — GUARD × BENCHED  ⚠ CLINICAL GATE
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "After a turnover, coach calls your number. You come out, and the backup brings the ball up. You watch the offense run without you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your chest. Tight in your throat. And the thought lands. They don't trust me to run it.",
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
      text: "A sub is a sub. Stay in the game from the bench. Talk, watch their guard, be ready to check back in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Coming out is a stretch of the game, not a verdict on you. You did not lose who you are. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
