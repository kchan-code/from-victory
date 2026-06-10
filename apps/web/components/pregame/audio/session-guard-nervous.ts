// Guard × I'm nervous before the game
//
// Pre-performance arousal, not a mistake: tight handle in warmups, racing
// thoughts, the body wound up before tip. The false story is "what if I cough
// it up first possession" — anxiety pre-living a turnover that hasn't happened.
// The over-grip collapse reflex (FV-29 §4) shows up early here as the urge to
// grip the ball tighter and over-control the warmup. The Guard-specific
// tactical beat is the arousal REFRAME: nerves are readiness, not a warning —
// the same energy that feels like fear is the energy that makes you quick.
// Read for sports-psychologist: this is a standard pre-performance arousal
// reframe (Loehr / IZOF energy-reappraisal), not a clinical anxiety
// intervention — kept to in-the-moment normalization, no pathologizing.
//
// One of the basketball pregame matrix (FV-30, 3 positions × 10 adversities),
// authored under content-curator orchestration from the FV-29 taxonomy and
// mirroring the hockey cell pattern. Faith clips (OPENING/CLOSING) reused.
// Registered in clips.ts CLIP_SCRIPTS under the per-sport registry (FV-30).

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import { CLOSING, OPENING } from "./segments.ts";
import { GUARD_VIZ } from "./segments-basketball.ts";

export const SESSION_GUARD_NERVOUS_SCRIPT: AudioScript = {
  slug: "bb-guard-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    ...OPENING,
    ...GUARD_VIZ,
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.1, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "It's warmups. Your handle feels tight, your thoughts are racing, your heart is already going before the ball's even tipped.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heart pounding in your ears. Fingers buzzing on the ball. What if I cough it up first possession.", speed: 1.1, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.1 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "These nerves are readiness, not a warning. The same energy that feels like fear is the energy that makes you quick. First possession, just get the team into something simple.", speed: 1.1, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The nerves are real. They are not your identity. Reset and go again.", speed: 1.1, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
