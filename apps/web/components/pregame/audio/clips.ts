// Clip AudioScripts for the compositional clip-playlist architecture.
//
// Each entry here maps to one independently-rendered MP3 in
// public/audio/pregame/clips/. The generator writes them via
// `npm run audio:generate -- --mode clips`.
//
// Taxonomy slugs (locked contract — matches ClipManifest in audio-playlist.ts):
//   shared-opening         OPENING from segments.ts
//   viz-forward            FORWARD_VIZ from segments.ts
//   viz-defense            DEFENSE_VIZ from segments.ts
//   viz-goalie             GOALIE_VIZ from segments.ts
//   hm-{position}-{adv}   hardMoment block from session-{position}-{adv}.ts
//   shared-reset-plan      RESET_PLAN_SEGMENTS from segments.ts
//   shared-prayer          PRAYER_SEGMENTS from segments.ts
//   shared-sendoff         SENDOFF_SEGMENTS from segments.ts
//   opener-{need}          leveled loudnorm pass of existing opener MP3s
//
// All TTS clips use voice ash + SCRIPT_INSTRUCTIONS + speed 0.95, matching
// the baked cell scripts so timbre is consistent across seams.
//
// EBU R128 loudnorm (-16 LUFS / -1.5 TP / LRA 11) is applied as postFilter
// on every clip so independently-rendered clips level-match at seams.
// Changing the LUFS target = change the `I=` value in CLIP_LOUDNORM_FILTER.
//
// Bespoke cells with LOCAL instruction overrides (forward-missed-chance,
// defense-beaten-wide, goalie-coach-yells) preserve those overrides on their
// hm clip — the narration and truth instructions are tuned to the specific
// scene and false-story language in each cell.

import type { AudioScript } from "./types";
import {
  HARD_MOMENT_NARRATION_INSTRUCTIONS,
  HARD_MOMENT_TRUTH_INSTRUCTIONS,
  PRAYER_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  DEFENSE_VIZ,
  FORWARD_VIZ,
  GOALIE_VIZ,
  OPENING,
  PRAYER_SEGMENTS,
  RESET_PLAN_SEGMENTS,
  SENDOFF_SEGMENTS,
} from "./segments.ts";

// Basketball pregame VIZ segments (FV-115)
import {
  BIG_VIZ,
  GUARD_VIZ,
  WING_VIZ,
} from "./segments-basketball.ts";

// Basketball pregame hard-moment cells (FV-30)
import { SESSION_GUARD_TURNOVER_SCRIPT } from "./session-guard-turnover.ts";
import { SESSION_GUARD_MISSED_SHOT_SCRIPT } from "./session-guard-missed-shot.ts";
import { SESSION_GUARD_GOT_COOKED_SCRIPT } from "./session-guard-got-cooked.ts";
import { SESSION_GUARD_FOUL_TROUBLE_SCRIPT } from "./session-guard-foul-trouble.ts";
import { SESSION_GUARD_COACH_YELLS_SCRIPT } from "./session-guard-coach-yells.ts";
import { SESSION_GUARD_BENCHED_SCRIPT } from "./session-guard-benched.ts";
import { SESSION_GUARD_NERVOUS_SCRIPT } from "./session-guard-nervous.ts";
import { SESSION_GUARD_MISSED_FTS_SCRIPT } from "./session-guard-missed-fts.ts";
import { SESSION_GUARD_START_SLOW_SCRIPT } from "./session-guard-start-slow.ts";
import { SESSION_GUARD_FALL_BEHIND_EARLY_SCRIPT } from "./session-guard-fall-behind-early.ts";
import { SESSION_WING_TURNOVER_SCRIPT } from "./session-wing-turnover.ts";
import { SESSION_WING_MISSED_SHOT_SCRIPT } from "./session-wing-missed-shot.ts";
import { SESSION_WING_GOT_COOKED_SCRIPT } from "./session-wing-got-cooked.ts";
import { SESSION_WING_FOUL_TROUBLE_SCRIPT } from "./session-wing-foul-trouble.ts";
import { SESSION_WING_COACH_YELLS_SCRIPT } from "./session-wing-coach-yells.ts";
import { SESSION_WING_BENCHED_SCRIPT } from "./session-wing-benched.ts";
import { SESSION_WING_NERVOUS_SCRIPT } from "./session-wing-nervous.ts";
import { SESSION_WING_MISSED_FTS_SCRIPT } from "./session-wing-missed-fts.ts";
import { SESSION_WING_START_SLOW_SCRIPT } from "./session-wing-start-slow.ts";
import { SESSION_WING_FALL_BEHIND_EARLY_SCRIPT } from "./session-wing-fall-behind-early.ts";
import { SESSION_BIG_TURNOVER_SCRIPT } from "./session-big-turnover.ts";
import { SESSION_BIG_MISSED_SHOT_SCRIPT } from "./session-big-missed-shot.ts";
import { SESSION_BIG_GOT_COOKED_SCRIPT } from "./session-big-got-cooked.ts";
import { SESSION_BIG_FOUL_TROUBLE_SCRIPT } from "./session-big-foul-trouble.ts";
import { SESSION_BIG_COACH_YELLS_SCRIPT } from "./session-big-coach-yells.ts";
import { SESSION_BIG_FOULED_OUT_SCRIPT } from "./session-big-fouled-out.ts";
import { SESSION_BIG_NERVOUS_SCRIPT } from "./session-big-nervous.ts";
import { SESSION_BIG_MISSED_FTS_SCRIPT } from "./session-big-missed-fts.ts";
import { SESSION_BIG_START_SLOW_SCRIPT } from "./session-big-start-slow.ts";
import { SESSION_BIG_FALL_BEHIND_EARLY_SCRIPT } from "./session-big-fall-behind-early.ts";

// The EBU R128 loudness normalization filter applied to every clip.
// -16 LUFS integrated / -1.5 dBTP true-peak / LRA 11 LU.
// To re-pass at a different target, change the I= value here and regenerate.
// -14 LUFS = I=-14   (louder, matches streaming platforms)
// -18 LUFS = I=-18   (quieter, headroom for mixing)
export const CLIP_LOUDNORM_FILTER =
  "loudnorm=I=-16:TP=-1.5:LRA=11";

// ── Shared structural clips ──────────────────────────────────────────────────

export const CLIP_SHARED_OPENING_SCRIPT: AudioScript = {
  slug: "shared-opening",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...OPENING],
};

// ── VIZ clips — one per position ─────────────────────────────────────────────

export const CLIP_VIZ_FORWARD_SCRIPT: AudioScript = {
  slug: "viz-forward",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...FORWARD_VIZ],
};

export const CLIP_VIZ_DEFENSE_SCRIPT: AudioScript = {
  slug: "viz-defense",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...DEFENSE_VIZ],
};

export const CLIP_VIZ_GOALIE_SCRIPT: AudioScript = {
  slug: "viz-goalie",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...GOALIE_VIZ],
};

// ── HM clips — Forward (9 cells; hm-forward-nervous already generated in P1) ─

// hardMoment block extracted from session-forward-nervous.ts.
// Spans from the "hardMoment" mark through the end of the cell-specific
// reset, before ...CLOSING. Text is byte-identical to the cell source.
export const CLIP_HM_FORWARD_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-forward-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
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
      text: "You are on the bench before the first shift. Your hands feel light. Your legs feel shaky. Your heart is up in your throat.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Shallow breath. Stomach tight. I am not ready for this.",
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
      text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

// Forward × missed chance — bespoke LOCAL instruction overrides preserved.
// These tuned instructions are specific to the "I should have buried that"
// false-story language in this cell.
const HM_FORWARD_MISSED_CHANCE_NARRATION = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it.

Pronunciation: The false-story sentences ("I should have buried that," "I am letting the team down," "I am not a finisher") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Heat in your face" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story spiral, let the sentences arrive in quicker succession the way they do in the athlete's head, with only the smallest beat between.`;

const HM_FORWARD_MISSED_CHANCE_TRUTH = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "real," "identity," and "information, not a verdict" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "Your mistake is real." / "It is not your identity." / "The chance is information, not a verdict."`;

export const CLIP_HM_FORWARD_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "hm-forward-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are alone in the slot. The pass finds your tape. You shoot. It rings off the post.",
      speed: 1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I should have buried that.",
      speed: 1.2,
      instructions: HM_FORWARD_MISSED_CHANCE_NARRATION,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1,
    },
    { type: "silence", durationSec: 2.0 },
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
      instructions: HM_FORWARD_MISSED_CHANCE_TRUTH,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FORWARD_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-forward-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
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
  ],
};

export const CLIP_HM_FORWARD_BEATEN_WIDE_SCRIPT: AudioScript = {
  slug: "hm-forward-beaten-wide",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are backchecking through the neutral zone. The winger has the puck and a step. You reach. He goes by you on the outside.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Lungs burn. Legs heavy. I am a step slow tonight.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. He had a step. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FORWARD_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-forward-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are chasing the play. You reach with your stick. The whistle blows. The ref points at you. Two minutes.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your face. Stomach drop. I just hurt my team.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't play scared next shift. Compete the same way.",
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
  ],
};

export const CLIP_HM_FORWARD_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-forward-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You come back to the bench. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight jaw. Heat in your chest. He is going to bury me.",
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
  ],
};

export const CLIP_HM_FORWARD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-forward-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Two shifts go by. Then three. The line goes out without you. You sit on the bench. The door does not open.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You are sitting. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FORWARD_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-forward-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are on the wall. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have seen him.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't avoid the next puck battle. Get back to the wall.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You got hit. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FORWARD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-forward-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. You have not touched the puck cleanly. Your legs feel a step behind. Nothing is coming easy.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Loose hands. Simple plays. Let the game come to you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You started slow. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_FORWARD_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-forward-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your chest. Here we go again.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. They scored first. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── HM clips — Defense (10 cells) ────────────────────────────────────────────

// Defense × beaten wide — bespoke LOCAL instruction overrides preserved.
// Tuned to the D-zone "beaten wide" scene — specific false-story phrases
// ("I lost my gap," "He blew by me") and the D-man body-mechanical note.
const HM_DEFENSE_BEATEN_WIDE_VIZ = `Voice Affect: Steady, present mentor walking the athlete through a mental rehearsal. Half a step more active than the meditative breath cues; not preachy, not hyped.

Tone: Confident and grounded. The voice that knows what the athlete is about to do and is calling each beat in advance.

Pacing: Deliberate. Each phrase is its own image — leave space for the athlete to actually see it, feel it, or rehearse it before the next phrase arrives. Pace as if guiding someone through a stretch routine, not reading a paragraph.

Emotion: Quiet confidence. The athlete is being walked through something they can already do; the voice steadies them, doesn't hype them.

Pronunciation: Clear and direct. Each sensory or action cue ("Get to your gap," "Shoulder check," "Hold your line") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

const HM_DEFENSE_BEATEN_WIDE_NARRATION = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it.

Pronunciation: The false-story sentences ("I lost my gap," "He blew by me," "I am a step slow tonight") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Burn in your chest" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story sentence, let it arrive in the natural rhythm of the athlete's own head, with only the smallest beat before it.`;

const HM_DEFENSE_BEATEN_WIDE_TRUTH = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "real," "identity," and "reset and go again" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "Your mistake is real." / "It is not your identity." / "Reset and go again."`;

export const CLIP_HM_DEFENSE_BEATEN_WIDE_SCRIPT: AudioScript = {
  slug: "hm-defense-beaten-wide",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are back in your zone. The puck carrier comes wide. He has speed. You lose the angle. He has a step on you.",
      speed: 1.0,
      instructions: HM_DEFENSE_BEATEN_WIDE_VIZ,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Burn in your chest. I lost my gap.",
      speed: 1.2,
      instructions: HM_DEFENSE_BEATEN_WIDE_NARRATION,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: HM_DEFENSE_BEATEN_WIDE_VIZ,
    },
    { type: "silence", durationSec: 2.0 },
    // Cell-specific tactical addition (KC D-coaching note 2026-05-26).
    {
      type: "speech",
      text: "Stay loose. Don't back up. Hold your gap.",
      speed: 1.0,
      instructions: HM_DEFENSE_BEATEN_WIDE_VIZ,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Your mistake is real. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HM_DEFENSE_BEATEN_WIDE_TRUTH,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-defense-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You retrieve the puck behind your net. You try to make the pass through the slot. It hits a stick. The other team has it in front.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I just put my goalie in a bad spot.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Next breakout, simple and strong. Off the glass if it's there.",
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
  ],
};

export const CLIP_HM_DEFENSE_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "hm-defense-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You walk the blue line. The lane opens. You step in and shoot. It misses the net wide.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I should have hit the net.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You missed the net. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-defense-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck carrier cuts inside. You bring your stick up. The whistle blows. The ref points at you. Two minutes.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your face. Tight in your chest. I just put us down a man.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't ease up next shift. Play your gap the same way.",
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
  ],
};

export const CLIP_HM_DEFENSE_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-defense-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
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
      text: "Now the reset. Return to your anchor.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
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
  ],
};

export const CLIP_HM_DEFENSE_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-defense-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Your partner goes out with someone else. Then again. You sit on the bench. The door does not open.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your chest. Tight in your throat. He doesn't trust me.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You are sitting. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-defense-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are on the bench before the first shift. Your legs feel heavy. Your hands feel light. Your heart is up in your throat.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Shallow breath. Stomach tight. I am going to get exposed out there.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-defense-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are back for the puck. You don't see him coming. He finishes his check. You hit the boards hard. The puck is gone.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Wind out of your lungs. Heat in your shoulder. I should have shoulder checked.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't rim it soft next time. Make the strong play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You got hit. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-defense-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. Your gap has been late. Your passes have been off. Nothing is coming easy.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight grip on the stick. Shoulders up. I am behind out there.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Skate first. Stick on the puck. Simple breakouts.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You started slow. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_DEFENSE_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-defense-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your chest. We couldn't hold them.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Stay loose. Hold your gap. Play the next shift, not the last one.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. They scored first. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── HM clips — Goalie (10 cells) ──────────────────────────────────────────────

// Goalie × coach yells — bespoke LOCAL instruction overrides preserved.
// The SCRIPT_INSTRUCTIONS are the same top-level defaults; the per-segment
// narration and truth instructions are tuned to the goalie coach-yells scene.
const HM_GOALIE_COACH_YELLS_VIZ = `Voice Affect: Steady, present mentor walking the athlete through a mental rehearsal. Half a step more active than the meditative breath cues; not preachy, not hyped.

Tone: Confident and grounded. The voice that knows what the athlete is about to do and is calling each beat in advance.

Pacing: Deliberate. Each phrase is its own image — leave space for the athlete to actually see it, feel it, or rehearse it before the next phrase arrives. Pace as if guiding someone through a stretch routine, not reading a paragraph.

Emotion: Quiet confidence. The athlete is being walked through something they can already do; the voice steadies them, doesn't hype them.

Pronunciation: Clear and direct. Each sensory or action cue ("See the crease," "Set your feet," "Track the puck") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

const HM_GOALIE_COACH_YELLS_NARRATION = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it. Whether the trigger is the athlete's own mistake or an outside voice (coach, parent, crowd), the spiral is named flatly without taking a side on whether it is justified.

Pronunciation: The false-story sentences ("He does not trust me," "He is going to pull me," "I am losing my spot") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive in the crease.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Tight jaw," "Heat in your chest" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story spiral, let the sentences arrive in quicker succession the way they do in the athlete's head, with only the smallest beat between.`;

const HM_GOALIE_COACH_YELLS_TRUTH = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "loud," "identity," and "information, not a verdict" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "The coach is loud." / "It is not your identity." / "His voice is information, not a verdict."`;

export const CLIP_HM_GOALIE_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-goalie-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "A goal goes in. The whistle blows. You hear your coach from the bench. Loud. Sharp. Maybe your name. Maybe not. The whole rink can hear it.",
      speed: 1.0,
      instructions: HM_GOALIE_COACH_YELLS_VIZ,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight jaw. Heat in your chest. He does not trust me.",
      speed: 1.2,
      instructions: HM_GOALIE_COACH_YELLS_NARRATION,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: HM_GOALIE_COACH_YELLS_VIZ,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. The coach is loud. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HM_GOALIE_COACH_YELLS_TRUTH,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-goalie-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are behind the net with the puck. You try to move it up the wall. It hits a forechecker's stick. The other team has it on top of your crease.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I just handed them a goal.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't freeze next time. Play the puck strong or leave it.",
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
  ],
};

export const CLIP_HM_GOALIE_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "hm-goalie-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck carrier comes in alone. You step out for the poke check. Your stick catches nothing. He walks around you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I should have stayed in my net.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You went for it. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_BEATEN_WIDE_SCRIPT: AudioScript = {
  slug: "hm-goalie-beaten-wide",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The pass goes from one side of the crease to the other. You push across. You are late. The puck is in the back of the net before you set.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your chest. I was too slow across.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't cheat the next pass. Stay square. Trust your push.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. He beat you across. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-goalie-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
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
  ],
};

// Special slug: Goalie × "I get benched." → hm-goalie-pulled
// (a goalie isn't "benched," they're "pulled" — matches session-goalie-pulled.ts)
export const CLIP_HM_GOALIE_PULLED_SCRIPT: AudioScript = {
  slug: "hm-goalie-pulled",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The coach taps your backup. You skate to the bench. You sit at the end. The game keeps going without you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your chest. Tight in your throat. He gave up on me.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You got pulled. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-goalie-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are in your crease before the puck drops. Your hands feel light. Your chest feels tight. Your heart is up in your throat.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Shallow breath. Tight shoulders. I am not ready for this.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-goalie-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "There is traffic in your crease. A body comes through. You take the contact. You lose the puck.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Wind out of your lungs. Heat in your chest. I am going to get run again.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't flinch on the next screen. Stay big. Track the puck.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You got hit. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-goalie-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. The puck has felt small. You have been late on a shot or two. Nothing is coming easy.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight in your glove hand. Shoulders up. I am not in this game.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Active feet. Stay big. Track the puck all the way in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. You started slow. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_GOALIE_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-goalie-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck is in the back of your net. The other team celebrates behind you. You fish it out of the mesh. You skate to the top of your crease.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your chest. I should have had that.",
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
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Don't over-commit on the next shot. Stay patient. Let it come to you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. The puck got past you. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Shared CLOSING clips ──────────────────────────────────────────────────────

export const CLIP_SHARED_RESET_PLAN_SCRIPT: AudioScript = {
  slug: "shared-reset-plan",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...RESET_PLAN_SEGMENTS],
};

export const CLIP_SHARED_PRAYER_SCRIPT: AudioScript = {
  slug: "shared-prayer",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...PRAYER_SEGMENTS],
};

export const CLIP_SHARED_SENDOFF_SCRIPT: AudioScript = {
  slug: "shared-sendoff",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...SENDOFF_SEGMENTS],
};

// ── Phase 3b personalization clips ───────────────────────────────────────────
//
// 32 short clips rendered for anchor, self-talk, and cue word personalization.
// Template sentinels {{anchor}}, {{selfTalk}}, {{cueReset}}, {{cueSendoff}}
// in the p3 manifest point to these slugs at resolve time.
//
// Approved delivery instructions (Phase 3b candidate A, KC ear-approved):
//   - Anchors: bare, grounded, single-line action cue. No warmth-bleed.
//   - Self-talk: coach-voice confidence — direct, assured, the move being called.
//   - Cue word reset: grounding register — quiet, anchoring, a single word
//     delivered as the athlete's touchstone being placed in their hand.
//   - Cue word sendoff: forward register — brief, steady, a send-off tap on the
//     shoulder. Not hyped. Not urgent. The word itself carries the charge.
//
// All clips: CLIP_LOUDNORM_FILTER (-16 LUFS / -1.5 TP / LRA 11) postFilter.
// The promoted bytes (KC-approved) are already in clips/. A future
// `--mode clips` run will skip existing files (resume support) and only
// re-render if the files are absent. This definition exists for reproducibility.

const ANCHOR_INSTRUCTIONS = `Voice Affect: Grounded, direct, bare. A single action cue delivered cleanly — no atmosphere, no warmth-bleed, no hesitation.

Tone: Neutral coach-voice. The word or phrase is the whole message; do not frame it or color it.

Pacing: Natural speech pace. Not slow, not fast. The phrase lands and is done.

Emotion: Quiet, functional. This is a cue being delivered to a hand, not a statement to move someone.

Pronunciation: Clean and precise. Each word distinct. No trailing softness.

Pauses: None added. Let the phrase end cleanly.`;

const SELFTALK_INSTRUCTIONS = `Voice Affect: Coach voice — direct, assured, the move being called. The athlete hears themselves being coached out of the collapse.

Tone: Confident without being loud. Grounded and repeatable, the way a trusted coach says the line on the bench.

Pacing: One phrase, natural pace. Deliver it the way it sounds inside the athlete's head when it's working.

Emotion: Steady confidence. Not urgent, not soft. This is the truth being called.

Pronunciation: Land the key operative words ("okay," "breathe," "steady," "secure") with weight, not emphasis. Clear and grounded.

Pauses: Brief, clean end. The phrase delivers and stops.`;

const CUE_WORD_RESET_INSTRUCTIONS = `Voice Affect: Quiet, anchoring. The word is being placed in the athlete's hand as a touchstone — not announced, not performed.

Tone: Grounded and still. The register of a quiet breath before action.

Pacing: Unhurried. The word arrives and settles. Do not rush toward it or away from it.

Emotion: Steady, inward. This is the moment of returning to center.

Pronunciation: The word is complete and clean. No trailing softness, no emphasis. It simply is.

Pauses: A brief, natural end — let the word land before silence takes over.`;

const CUE_WORD_SENDOFF_INSTRUCTIONS = `Voice Affect: Forward-moving, steady. A send-off tap on the shoulder — not a shout, not a hype line. The word carries the charge.

Tone: Brief and assured. The voice of someone who has run this and knows it works.

Pacing: Natural pace. Slightly more energized than the reset delivery, but grounded — not pushed.

Emotion: Quiet confidence and forward motion. The athlete is being released, not pumped up.

Pronunciation: The word arrives cleanly with natural energy. Clear, not soft, not sharp.

Pauses: A clean, brief end. Forward, not trailing.`;

// ── Anchor clips (5 — "Say cue word" intentionally absent per KC's call) ───

export const CLIP_ANC_LONG_EXHALE_SCRIPT: AudioScript = {
  slug: "anc-long-exhale",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Long exhale." },
  ],
};

export const CLIP_ANC_TAP_STICK_TWICE_SCRIPT: AudioScript = {
  slug: "anc-tap-stick-twice",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Tap your stick twice." },
  ],
};

export const CLIP_ANC_TOUCH_GLOVE_SCRIPT: AudioScript = {
  slug: "anc-touch-glove",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Touch your glove." },
  ],
};

export const CLIP_ANC_PRESS_THUMB_TO_PALM_SCRIPT: AudioScript = {
  slug: "anc-press-thumb-to-palm",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Press your thumb to your palm." },
  ],
};

export const CLIP_ANC_LOOK_AT_TAPE_SCRIPT: AudioScript = {
  slug: "anc-look-at-tape",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Look at your tape." },
  ],
};

// ── Self-talk clips (7) ───────────────────────────────────────────────────────
// Exact text mirrors SELF_TALK_OPTIONS from types.ts (straight apostrophes).

export const CLIP_ST_01_SCRIPT: AudioScript = {
  slug: "st-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next shift." },
  ],
};

export const CLIP_ST_02_SCRIPT: AudioScript = {
  slug: "st-02",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Breathe. Do your job." },
  ],
};

export const CLIP_ST_03_SCRIPT: AudioScript = {
  slug: "st-03",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Stay steady. Make the next play." },
  ],
};

export const CLIP_ST_04_SCRIPT: AudioScript = {
  slug: "st-04",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You don't need to do too much." },
  ],
};

export const CLIP_ST_05_SCRIPT: AudioScript = {
  slug: "st-05",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Compete, recover, go again." },
  ],
};

export const CLIP_ST_06_SCRIPT: AudioScript = {
  slug: "st-06",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Your identity is secure. Play free." },
  ],
};

export const CLIP_ST_07_SCRIPT: AudioScript = {
  slug: "st-07",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You are secure. Take the next faithful action." },
  ],
};

// ── Cue word clips — reset register (10 words × 2 registers = 20 clips) ──────
// Reset: grounding, quiet. Sendoff: forward-moving, steady.
// Base slug per word is used by the resolver; "-reset" / "-sendoff" appended.

export const CLIP_CW_STEADY_RESET_SCRIPT: AudioScript = { slug: "cw-steady-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Steady." }] };
export const CLIP_CW_STEADY_SENDOFF_SCRIPT: AudioScript = { slug: "cw-steady-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Steady." }] };

export const CLIP_CW_COURAGE_RESET_SCRIPT: AudioScript = { slug: "cw-courage-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Courage." }] };
export const CLIP_CW_COURAGE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-courage-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Courage." }] };

export const CLIP_CW_SIMPLE_RESET_SCRIPT: AudioScript = { slug: "cw-simple-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Simple." }] };
export const CLIP_CW_SIMPLE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-simple-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Simple." }] };

export const CLIP_CW_ATTACK_RESET_SCRIPT: AudioScript = { slug: "cw-attack-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Attack." }] };
export const CLIP_CW_ATTACK_SENDOFF_SCRIPT: AudioScript = { slug: "cw-attack-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Attack." }] };

export const CLIP_CW_NEXT_RESET_SCRIPT: AudioScript = { slug: "cw-next-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Next." }] };
export const CLIP_CW_NEXT_SENDOFF_SCRIPT: AudioScript = { slug: "cw-next-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Next." }] };

export const CLIP_CW_SERVE_RESET_SCRIPT: AudioScript = { slug: "cw-serve-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Serve." }] };
export const CLIP_CW_SERVE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-serve-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Serve." }] };

export const CLIP_CW_COMPETE_RESET_SCRIPT: AudioScript = { slug: "cw-compete-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Compete." }] };
export const CLIP_CW_COMPETE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-compete-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Compete." }] };

export const CLIP_CW_FAITHFUL_RESET_SCRIPT: AudioScript = { slug: "cw-faithful-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Faithful." }] };
export const CLIP_CW_FAITHFUL_SENDOFF_SCRIPT: AudioScript = { slug: "cw-faithful-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Faithful." }] };

export const CLIP_CW_FREE_RESET_SCRIPT: AudioScript = { slug: "cw-free-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Free." }] };
export const CLIP_CW_FREE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-free-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Free." }] };

export const CLIP_CW_RELENTLESS_RESET_SCRIPT: AudioScript = { slug: "cw-relentless-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Relentless." }] };
export const CLIP_CW_RELENTLESS_SENDOFF_SCRIPT: AudioScript = { slug: "cw-relentless-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 0.95, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Relentless." }] };

// ── Pre-practice "Lock In" clips (state-aware, v2 — FRO-22) ──────────────────
//
// State-aware architecture: two openers swap Beat 1; Beats 2–6 are shared.
// Registered in manifest.json under the top-level "practice" key per state
// (resolved by resolvePracticePlaylist with state + focus).
//
// State A — "dialed-in" (DEFAULT):
//   pp-opener-dialed-in → pp-name-standard → pp-goal-fusion →
//   pp-choose-focus-lead → [pp-focus-<slug>] → pp-choose-focus-tail →
//   pp-be-vocal → pp-see-it-go
//
// State B — "not-feeling-it":
//   pp-opener-get-to → (same shared tail)
//
// All clips: voice ash, speed 0.95, CLIP_LOUDNORM_FILTER.
// The practice screen has no phase-synced reveals in v1, so phases: [] on all
// catalog entries.
//
// Retired: pp-settle-receive (old single Beat 1) — removed from CLIP_SCRIPTS
// and manifest.practice. Neither state playlist references it.

// ── Opener A instruction family ───────────────────────────────────────────────
// PRACTICE_SETTLE_INSTRUCTIONS — grounded Mentor→Devotional, Coach edge on the
// release run. "Christ ran his race / verdict's in" must land flat-not-preachy.
// The "go all out / let it be ugly / fail" run = three even permissions, not
// an escalating drill-sergeant bark.
const PRACTICE_SETTLE_INSTRUCTIONS = `Voice Affect: Grounded mentor — calm, certain, speaking directly to the athlete before they step on the ice. Not a preacher, not a hype coach. The gospel line ("Christ ran his race for you — the verdict's in, and it's love") is settled news, not a sermon moment. No lift, no swell — flat and certain, the way someone speaks a fact they've lived with for years.

Tone: Steady and matter-of-fact. Identity as foundation, not inspiration. The release run ("Go all out. Let it be ugly. Fail in front of all of them.") is three even permissions — plain, not escalating. The Coach edge in the close ("Coasting isn't chill. Empty the tank.") is direct without sharpness.

Pacing: Moderate. The identity opening breathes at a slightly slower pace; the release run ("Go all out. Let it be ugly.") moves at an even, declarative clip — three parallel clauses, same weight, same pace, not a build. The close lands clean.

Emotion: Quiet conviction. The speaker has stood on this ground before and isn't selling it. The "Go all out" run is permission, not a push.

Pronunciation: "The verdict's in, and it's love" — flat and final, no upswing on "love." "Go all out. Let it be ugly. Fail in front of all of them." — each clause level, not louder or faster than the last. "Empty the tank. Now go." — the last two sentences land with quiet finality.

Pauses: Honor the in-clip silence beats. A full breath after "The verdict's in, and it's love" before the audience line. Shorter beats between the release-run clauses — they are parallel, not sequential reveals.`;

// ── Opener B instruction family ───────────────────────────────────────────────
// Teammate-warm variant — same "no lift, level and certain" discipline, slightly
// warmer/closer register. No brightening on the foothold lines ("Just win the
// first drill…") — a dragging athlete rejects fake hype.
const PRACTICE_GET_TO_INSTRUCTIONS = `Voice Affect: Teammate-warm mentor — a half-step closer and warmer than the dialed-in opener, but the same grounded certainty. Honesty gate first ("Be honest — you're not really feeling it today.") is matter-of-fact, not sympathetic hand-holding. The foothold lines ("Just win the first drill. First ten minutes, full.") are flat and practical — NOT a pep-rally lift.

Tone: Sincere and plain. The Col 3:23 pivot ("whatever you do, you do it with everything — for the Lord, not for a mood") is grounded instruction, not a motivational escalation. The gratitude cue ("a body that works, a game you actually love") is quiet — earned, not performed.

Pacing: Moderate, even. The behavioral-activation line ("The feeling shows up after you move, not before.") gets its own beat. The foothold close ("Just win the first drill. First rep. Go.") is steady and practical — no acceleration, no energy lift.

Emotion: Honest care. The speaker acknowledges the drag without dramatizing it and gives the athlete a simple, concrete move. Warmth is in the directness, not in any tonal brightening.

Pronunciation: "That's allowed. You showed up anyway. That already counts." — each sentence equal weight, no uplift on "counts." The foothold lines ("Just win the first drill. First ten minutes, full — feet moving, first to the puck.") arrive flat, matter-of-fact. "First rep. Go." — plain and final, no push.

Pauses: Honor the in-clip silence beats. A full breath after "That already counts." before the behavioral-activation turn. A clear beat after the gratitude line before the foothold close.`;

// ── Coach instruction family for Beats 2–6 and focus clips ───────────────────
// Direct, drilled, no warmth-bleed. Same family as the existing PP_COACH_INSTRUCTIONS.
const PP_COACH_INSTRUCTIONS = `Voice Affect: Coach voice — direct, steady, assured. Not a hype coach, not a preacher. The voice of someone who has run this room a hundred times and means every word.

Tone: Confident and purposeful. No warmth-bleed from the devotional register. This is the voice that knows the move and is calling it.

Pacing: Deliberate. Short declarative sentences land clean. Longer sentences move at a good coaching pace — not rushed, not slow. Key phrases get their own breath.

Emotion: Steady confidence. The athlete is being coached, not comforted. Honest without being harsh.

Pronunciation: "Full reps. Full compete. No coasting." — each cue distinct. "That's the throttle." and "you go get it" — delivered with quiet weight, not hype. "Helmet on. Go compete. Play from victory." closes with grounded finality.

Pauses: A beat between each coaching declaration. The on-ice calls ('man on,' 'time,' 'heads up,' 'D to D,' 'I'm here,' 'Help') are listed flat and matter-of-fact — NOT yelled or brightened. The send-off line "Helmet on. Go compete. Play from victory." — each clause its own breath.`;

// ── OPENER A — pp-opener-dialed-in ───────────────────────────────────────────
export const CLIP_PP_OPENER_DIALED_IN_SCRIPT: AudioScript = {
  slug: "pp-opener-dialed-in",
  voice: "ash",
  instructions: PRACTICE_SETTLE_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Who you are is already settled. Christ ran his race for you — the verdict's in, and it's love. Nothing out here changes that.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So you're not playing for the coaches, or the guys, or whoever's watching. One audience. And what you give him is all of it — not half.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That means you're free. Go all out. Let it be ugly. Fail in front of all of them — their read on you doesn't count.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Coasting isn't chill. It's holding back from the One you're actually out here for.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So empty the tank. Now go.",
    },
  ],
};

// ── OPENER B — pp-opener-get-to ───────────────────────────────────────────────
export const CLIP_PP_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Be honest — you're not really feeling it today. That's allowed. You showed up anyway. That already counts.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Here's the thing nobody tells you: the feeling shows up after you move, not before. You don't wait to want it. You commit to the first rep, go full, and let the rest catch up.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Whatever you do, you do it with everything — for the Lord, not for a mood. The flat day counts to him exactly as much as the good one. He's not grading how you feel.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "And somewhere under the drag — a body that works, a game you actually love. That's real. Let it pull you. Not guilt. Just true.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So don't try to fix the whole hour. Just win the first drill. First ten minutes, full — feet moving, first to the puck.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "First rep. Go.",
    },
  ],
};

// ── SHARED Beat 2 — pp-name-standard ─────────────────────────────────────────
export const CLIP_PP_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Whatever you do here is what shows up when it's tight. The rep you give now is the shift you'll have in overtime. Your hands don't know the difference between a drill and a final.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So the bar today is simple. Full reps. Full compete. No coasting.",
    },
  ],
};

// ── SHARED Beat 3 — pp-goal-fusion ────────────────────────────────────────────
export const CLIP_PP_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "That drill you've run a thousand times — the boring one, nobody watching — you're not getting it over with. You're rehearsing the shift you actually want, early, while it's quiet.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That battle in the corner — that's the one that decides a playoff game. Win it now, at practice, full every time, and the one with everything on the line is just one you've already done.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Not the perfect rep. The full one. That's all today asks.",
    },
  ],
};

// ── SHARED Beat 4 — focus injection (lead + focus clips + tail) ───────────────

export const CLIP_PP_CHOOSE_FOCUS_LEAD_SCRIPT: AudioScript = {
  slug: "pp-choose-focus-lead",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You picked one thing to drive today. Here it is.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_CHOOSE_FOCUS_TAIL_SCRIPT: AudioScript = {
  slug: "pp-choose-focus-tail",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "silence", durationSec: 0.5 },
    {
      type: "speech",
      text: "That's the throttle. Not something to fix when it breaks — something you bring from the first whistle. Every drill, every rep, you go get it.",
    },
  ],
};

// ── Focus clips — 7 clean full-stop declarations ─────────────────────────────
// No lead-in/trailing filler baked in. 0.5s pauses live in lead/tail clips.
// One-word clips ("Relentless", "Hungry"): loudnorm gate verified not to
// swallow the attack. The leading silence in pp-choose-focus-lead provides
// enough runway.

export const CLIP_PP_FOCUS_RELENTLESS_SCRIPT: AudioScript = {
  slug: "pp-focus-relentless",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Relentless." },
  ],
};

export const CLIP_PP_FOCUS_HUNGRY_SCRIPT: AudioScript = {
  slug: "pp-focus-hungry",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hungry." },
  ],
};

export const CLIP_PP_FOCUS_HEAD_UP_EVERY_BREAKOUT_SCRIPT: AudioScript = {
  slug: "pp-focus-head-up-every-breakout",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Head up every breakout." },
  ],
};

export const CLIP_PP_FOCUS_FEET_ALWAYS_MOVING_SCRIPT: AudioScript = {
  slug: "pp-focus-feet-always-moving",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Feet always moving." },
  ],
};

export const CLIP_PP_FOCUS_HARD_FIRST_PASS_SCRIPT: AudioScript = {
  slug: "pp-focus-hard-first-pass",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hard first pass." },
  ],
};

export const CLIP_PP_FOCUS_WIN_EVERY_RACE_SCRIPT: AudioScript = {
  slug: "pp-focus-win-every-race-to-the-puck",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Win every race to the puck." },
  ],
};

export const CLIP_PP_FOCUS_FULL_REPS_NO_GLIDE_SCRIPT: AudioScript = {
  slug: "pp-focus-full-reps-no-glide",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Full reps, no glide." },
  ],
};

// ── SHARED Beat 5 — pp-be-vocal (NEW) ────────────────────────────────────────
// By-ear note: the on-ice calls ('man on','time','heads up','D to D','I'm here',
// 'Help') must be read flat/listed, NOT yelled or brightened. "Be the loud one"
// is plain instruction, not a rally cry.
export const CLIP_PP_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "pp-be-vocal",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "One more thing nobody says out loud. Out there, talking is competing — calling for the puck, 'man on,' 'time,' 'heads up,' 'D to D' on the breakout. Coaches notice who talks. But most players go quiet — not because they don't know the call. Because being loud feels like drawing eyes, sounding dumb, looking like you're trying too hard.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "That's the same trap. Going quiet is protecting how you look — and you already settled that. What they think of you isn't the scoreboard you're playing to.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "So talk. 'I'm here.' 'Heads up.' 'Help.' Be the loud one. The players who talk the zone, call support, run their mouth the right way — they end up wearing a letter. Not because they asked for it. Because they were already doing the job.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Quiet's the easy hide. Don't take it.",
    },
  ],
};

// ── SHARED Beat 6 — pp-see-it-go ─────────────────────────────────────────────
// Terminal send-off ("Helmet on. Go compete. Play from victory.") removed —
// the pre-practice session now ends on the prayer clip that follows this beat.
export const CLIP_PP_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one rep. You, full compete, that focus locked in, nothing saved for the bench.",
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "A rep's going to go bad. Some will. That's information, not a verdict — read it, drop it, next rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You're not skating to prove who you are. You already know.",
    },
  ],
};

// ── Basketball pre-practice "Lock In" clips (FV-30 pre-practice chunk) ────────
//
// 1:1 vocab swaps onto the approved hockey pre-practice structure.
// No new reframe — sports-psych gate not needed.
// Audio rendering = FV-31 (12 new pp-bb-* slugs + AUDIO_CACHE_BUST bump).
// Until FV-31 ships, these slugs are absent from manifest.json and the
// basketball practice tail silently fails open in resolvePracticePlaylist.

// ── Basketball OPENER B — pp-bb-opener-get-to ─────────────────────────────────
// Identical to pp-opener-get-to except foothold close: "first to every loose ball."
export const CLIP_PP_BB_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-bb-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Be honest — you're not really feeling it today. That's allowed. You showed up anyway. That already counts.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Here's the thing nobody tells you: the feeling shows up after you move, not before. You don't wait to want it. You commit to the first rep, go full, and let the rest catch up.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Whatever you do, you do it with everything — for the Lord, not for a mood. The flat day counts to him exactly as much as the good one. He's not grading how you feel.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "And somewhere under the drag — a body that works, a game you actually love. That's real. Let it pull you. Not guilt. Just true.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So don't try to fix the whole practice. Just win the first drill. First ten minutes, full — feet moving, first to every loose ball.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "First rep. Go.",
    },
  ],
};

// ── Basketball Beat 2 — pp-bb-name-standard ───────────────────────────────────
// Swap: "shift you'll have in overtime" → "possession you'll have in crunch time."
export const CLIP_PP_BB_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-bb-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Whatever you do here is what shows up when it's tight. The rep you give now is the possession you'll have in crunch time. Your hands don't know the difference between a drill and a final.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So the bar today is simple. Full reps. Full compete. No coasting.",
    },
  ],
};

// ── Basketball Beat 3 — pp-bb-goal-fusion ─────────────────────────────────────
// Swaps: "shift" → "possession"; "battle in the corner" → "loose ball on the
// floor, that contested rebound, that closeout you'd rather skip."
export const CLIP_PP_BB_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-bb-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "That drill you've run a thousand times — the boring one, nobody watching — you're not getting it over with. You're rehearsing the possession you actually want, early, while it's quiet.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That loose ball on the floor, that contested rebound, that closeout you'd rather skip — that's the one that decides a playoff game. Win it now, at practice, full every time, and the one with everything on the line is just one you've already done.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Not the perfect rep. The full one. That's all today asks.",
    },
  ],
};

// ── Basketball Beat 5 — pp-bb-be-vocal ────────────────────────────────────────
// Swaps: on-court calls (screen left / shot / I got ball / help on the drive);
// "wearing a letter" → "hand the team to."
// By-ear note (FV-31): the listed calls read with the same flat/listed discipline
// as the hockey version. Decide at render whether to generalize the shared
// PP_COACH_INSTRUCTIONS example list.
export const CLIP_PP_BB_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "pp-bb-be-vocal",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "One more thing nobody says out loud. Out there, talking is competing — calling for the ball, 'screen left,' 'shot,' 'I got ball,' 'help' on the drive. Coaches notice who talks. But most players go quiet — not because they don't know the call. Because being loud feels like drawing eyes, sounding dumb, looking like you're trying too hard.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "That's the same trap. Going quiet is protecting how you look — and you already settled that. What they think of you isn't the scoreboard you're playing to.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "So talk. 'I'm here.' 'Box out.' 'Help.' Be the loud one. The players who run the floor with their voice — call the coverage, call the help, talk every possession — they're the ones coaches build around and hand the team to. Not because they asked for it. Because they were already doing the job.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Quiet's the easy hide. Don't take it.",
    },
  ],
};

// ── Basketball Beat 6 — pp-bb-see-it-go ──────────────────────────────────────
// Terminal send-off ("Lace 'em up. Go compete. Play from victory.") removed —
// the pre-practice session now ends on the prayer clip that follows this beat.
export const CLIP_PP_BB_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-bb-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one rep. You, full compete, that focus locked in, nothing saved for the bench.",
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "A rep's going to go bad. Some will. That's information, not a verdict — read it, drop it, next rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You're not playing to prove who you are. You already know.",
    },
  ],
};

// ── Basketball focus clips — 7 declarations (pp-bb-focus-*) ───────────────────

export const CLIP_PP_BB_FOCUS_RELENTLESS_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-relentless",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Relentless." },
  ],
};

export const CLIP_PP_BB_FOCUS_HUNGRY_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-hungry",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hungry." },
  ],
};

export const CLIP_PP_BB_FOCUS_TALK_EVERY_POSSESSION_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-talk-every-possession",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Talk every possession." },
  ],
};

export const CLIP_PP_BB_FOCUS_GUARD_YOUR_YARD_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-guard-your-yard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Guard your yard." },
  ],
};

export const CLIP_PP_BB_FOCUS_HIT_THE_GLASS_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-hit-the-glass",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hit the glass." },
  ],
};

export const CLIP_PP_BB_FOCUS_SPRINT_EVERY_TRANSITION_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-sprint-every-transition",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Sprint every transition." },
  ],
};

export const CLIP_PP_BB_FOCUS_BOX_OUT_EVERY_SHOT_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-box-out-every-shot",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Box out every shot." },
  ],
};

// ── Basketball VIZ clips — one per position (FV-115) ────────────────────────

export const CLIP_VIZ_GUARD_SCRIPT: AudioScript = {
  slug: "viz-guard",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...GUARD_VIZ],
};

export const CLIP_VIZ_WING_SCRIPT: AudioScript = {
  slug: "viz-wing",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...WING_VIZ],
};

export const CLIP_VIZ_BIG_SCRIPT: AudioScript = {
  slug: "viz-big",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...BIG_VIZ],
};

// ── Basketball HM clips — Guard (10 cells) (FV-115) ─────────────────────────
// Each clip extracts the hard-moment block from the corresponding
// session-guard-*.ts file. Text is verbatim from the (post-CL-* edit) source.

export const CLIP_HM_BB_GUARD_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You are running the offense. You try to force a pass through traffic. They pick it off and go the other way for a layup.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Jaw clenches. Legs go heavy on the backpedal. I can't be trusted with the rock.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Slow it down. Next possession, get the team into something simple.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Your mistake is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You come off the screen wide open. Feet set, clean look, the shot you've made a thousand times. It rims out.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders drop. A flush climbs up your neck. Now they'll sag off me. I'm not a shooter today.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The read was right. Same shot, next time it's open. Don't shrink it, don't force a worse one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. One miss is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're up on the ball. He hits you with the crossover, gets your hips turned, and blows by for the layup.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Face goes hot. Eyes want to drop to the floor. Everyone saw it. The whole gym saw me get cooked.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Next possession, get in your stance and stay in front. Take it away with your feet, not a reach.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Getting beat is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two quick reach-ins and the whistle's on you. Now you're guarding soft, can't pick up full-court, playing scared of the third.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands pull back on their own. A jolt of caution down your arms. I can't even play D without fouling.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Play angles, not reaches. Beat them to the spot, contest straight up, hands high. Defend with your feet.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The fouls are real. They are not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You make a bad read on the pick-and-roll. Coach yells your name and pulls you to the sideline. You're standing there while the game goes on.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Neck goes hot. Chest tightens against the breath. Coach doesn't trust me to run this.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The correction is about the read, not about you. Take it, run it clean, get the team into the next one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Coach is correcting the read. He is not correcting who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "After a turnover, coach calls your number. You come out, and the backup brings the ball up. You watch the offense run without you.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat in your chest. Tight in your throat. And the thought lands. They don't trust me to run it.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're still on this team, still in this game. Stay in it from the bench. Talk, watch their guard, be ready to check back in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Coming out is a stretch of the game, not a verdict on you. You did not lose who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "It's warmups. Your handle feels tight, your thoughts are racing, your heart is already going before the ball's even tipped.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heart pounding in your ears. Fingers buzzing on the ball. What if I cough it up first possession.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "These nerves are readiness, not a warning. The same energy that feels like fear is the energy that makes you quick. First possession, just get the team into something simple.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The nerves are real. They are not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Tight game, late. You're at the line to ice it. The gym goes quiet. First one is short. Second one clanks off the front rim.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Stomach sinks. Ears ringing in the quiet. I'm the guard, I'm supposed to close.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Get back on defense. Next time at the line, same routine. Breathe, eyes on the rim, shoot it the way you always do.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Two misses at the line is a moment in the game, not a measure of the closer. Missing the shot did not unmake you. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First few minutes and nothing's clicking. You're over-dribbling, pounding the ball, can't get anyone a clean look.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Grip tightens on the ball. Breath gets short and high. It's on me to fix it.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Stop trying to fix it alone. Give it up, move it, let the offense breathe. The fix is doing less, not more.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. A slow start is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_GUARD_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They go on a quick run. You're down early, and you can feel the whole team look to you to stop the bleeding.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders climb toward your ears. A weight settles across your back. This whole deficit is on me to fix.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't owe them the whole deficit. You owe them the next possession. One stop. One good look. One at a time.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. It is not yours alone to carry, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Basketball HM clips — Wing (10 cells) (FV-115) ───────────────────────────

export const CLIP_HM_BB_WING_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You drive the lane and get stripped. Or you throw the cross-court swing and they jump it. The ball is gone the other way.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Arms go limp at your sides. Feet slow on the sprint back. I tried to do too much.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Sprint back, then get right back into it. Cut hard, show your hands, ask for the ball on the next trip.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The turnover is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You catch it open in your spot. Clean look. Cold off the bench, you brick it. Front rim, nothing.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Hands go cold. A flush of doubt up the back of your neck. I'm bricking, I shouldn't shoot.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your make doesn't decide your worth, so the miss can't either. Relocate, show your hands, and take the next open one with the same confidence.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The miss is real. It does not vote on whether you take the next one, and it does not name you. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're on their best scorer. You close out, he rips by you, and finishes over the help. The bench reacts. That one's on the highlight.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Heat floods your face. Your feet feel stuck to the floor. I'm a liability.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One beat doesn't make you a liability. Get into your stance, take the matchup again, and contest the very next closeout.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Getting beat on one closeout is real. It does not make you a liability, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two quick hand-check fouls on a faster guy. The whistle keeps finding you. You feel the bench getting close.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Arms freeze at your sides. A flicker of panic before every closeout. I can't even guard anymore.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Don't back off — defend smarter. Move your feet, stay in front, hands up and back, and contest straight up without reaching.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The fouls are real. They are not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Coach stops the play and barks your name. You didn't close out. You passed up the open one. The whole gym hears it.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Ears go hot. Your eyes drop to your shoes. I can't do anything right.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Coach is coaching what you do, not deciding who you are. Take the note, close out hard, and shoot the next open one without flinching.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The correction is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your shot isn't falling, so coach pulls you. You sit down at the end of the bench and watch the game go on without you.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A hollow drop behind your ribs. Your gaze fixed on the floor in front of the bench. I'm only as good as my last make.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your worth wasn't on the scoreboard, so the bench can't take it. Stay locked in, talk on defense from your seat, and be ready the second your name is called.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Sitting down is real. The bench can hold your spot, but it cannot hold your worth — that was never on the scoreboard. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You're in warmups against a ranked team. Scouts are in the gym. Your stroke feels tight and you start doubting the shot before tip-off.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shallow breath. Hands light. I'm not ready for this.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "This is energy, not a warning. Let it sharpen you — get to your spots, hunt your first catch, and let the first shot go free.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You get fouled on a jumper. Two shots, gym goes quiet, all eyes on you. First one rims out. Second one too.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The gym goes silent and loud at once. Your mouth goes dry. Even my free shot won't fall.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two misses don't break your stroke. Keep attacking, keep getting to the line, and trust your routine on the next ones.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The misses are real. They are not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Your first few touches feel off. The ball isn't finding you and the half is slipping by. You can feel yourself going quiet.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your body goes quiet and small. Energy draining from your legs. I'm invisible out here.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Don't disappear — get loud. Sprint the lanes, cut hard, call for the ball, and demand your next touch.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The slow start is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_WING_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They go on a run and you're down early. You can feel the pull to force a shot, to answer it all by yourself, right now.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A hot urgency surges through your chest. Your hands itch for the ball. I have to fix this myself.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't have to hero-ball this. Stay aggressive inside the offense — move the ball, trust your read, and take the open one in rhythm.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. It is not yours to answer alone, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Basketball HM clips — Big (10 cells) (FV-115) ────────────────────────────
// Big × benched → slug hm-bb-big-fouled-out (per spec; big is fouled out, not benched).

export const CLIP_HM_BB_BIG_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-big-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "You roll to the rim and the help steps in. You bowl him over. Whistle. Charge. The ball goes the other way.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Shoulders curl inward. A heavy thud of frustration in your chest. Keep it out of my hands.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You want the ball again. Seal your man, call for it, roll hard, and finish strong through contact.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The turnover is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-big-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Wide open under the rim. The layup rolls off. You get the board and the putback rims out too.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your hands feel like stone. Heat creeping up from your collar. I can't even finish at the rim.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You go right back at it. Run the rim, demand the ball deep, and crash the offensive glass on the next miss.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The miss is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-big-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The switch leaves you on their quick guard. He sizes you up, crosses over, and blows by you to the rim.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Legs feel slow and rooted. A flush of exposure across your face. They'll hunt me every time.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Next switch, you give him a cushion. Drop, contain, wall him off, and stay vertical at the rim. Make him finish over a wall.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. One blow-by is real. It does not mean they own you. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-big-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Two quick fouls and the coach sits you. You come back in scared to touch anybody. You stop contesting. You stop boxing out.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your arms go stiff and cautious. A cold hesitation before every box out. I'm the weak link.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You can compete hard and stay disciplined at the same time. Stay vertical, hands straight up, beat them to the spot and box out clean. That's how you stay on the floor and help your team.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The fouls are real. They put you in foul trouble, not in question — they do not make you the weak link. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Their five just grabbed another offensive board. The coach turns and barks down the bench, loud enough for everyone. Box out! You're getting pushed around in there.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your face burns. Shoulders pull down under the words. I'm getting pushed around.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You answer with your body, physical and under control. Set a hard, legal screen. Hit first on the box out. Own the glass on the next possession.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. One soft screen is real. It does not make you soft. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_FOULED_OUT_SCRIPT: AudioScript = {
  slug: "hm-bb-big-fouled-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "The whistle blows. Number six. You're done. You walk off, the game still going, and you can't go back in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The walk off the floor feels long and slow. A lump rising in your throat. I let my team down.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're still in this game. On your feet on the bench. Loud on defense, talking coverages, lifting the next big up. Your team needs your voice and your presence.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Fouling out is real. It cost you the floor — it did not cost you who you are. Your team still needs you. Reset, and go again with your voice.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Warmups. You watch their big across the floor. He's taller, he's heavier, and he's already pushing your teammates around.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. A buzz of adrenaline through your arms. Pulse loud in your chest. What if I get bullied inside.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You get to the spot first. Beat him to your position, get your body low, and hold your ground with your feet and base — not by reaching. Be ready for the contact instead of bracing against it.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. Your body is awake. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "They grab you off the ball on purpose. Bonus. Two shots. You step to the line and both clang off the rim.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The hush of the gym presses on you. Your hands go heavy at the line. They fouled me on purpose because I'm the weak link.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You make them pay the other way. Get back, protect the rim, then seal deep and demand the ball. Make being fouled cost them.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The misses are real. They are not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-big-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "First few minutes and you're a step late to everything. He beats you to his spot. He beats you to the glass. They score twice inside.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. Your steps feel a half-beat behind. A tightness winding across your shoulders. I'm letting them set the tone in the paint.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You take the tone back. Establish position early, beat him to the spot, and get the first hit on every box out. Set it from here.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The slow start is real. It is not your identity. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

export const CLIP_HM_BB_BIG_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-big-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Now rehearse the hard moment.", speed: 1.0, mark: { phase: "hardMoment" } },
    { type: "silence", durationSec: 0.4 },
    { type: "speech", text: "Down ten early. They're scoring in the paint and crashing the offensive glass, and you're the one back there. It feels like the rim is yours to hold and it's slipping.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
    { type: "speech", text: "Feel what your body does. The weight of the paint settles on your shoulders. Breath shortening as the lead grows. It's all on me to hold the paint.", speed: 1.2, instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Now the reset. Return to your anchor.", speed: 1.0 },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The last play is over. Reset and play the play you're in.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't carry the scoreboard. You own the next possession. Wall up the rim, contest vertical, secure one rebound. Then the next one.", speed: 1.0, instructions: VISUALIZATION_INSTRUCTIONS },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Speak the truth. The deficit is real. The paint is your job, not your worth, and it is not who you are. Reset and go again.", speed: 1.2, instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS },
    { type: "silence", durationSec: 1.5 },
  ],
};

// ── Basketball personalization clips (FV-115) ─────────────────────────────────
// 3 new anchor clips (basketball-specific physical cues)
// 1 new self-talk clip (bb-token to avoid collision with st-01)

export const CLIP_ANC_BOUNCE_BALL_TWICE_SCRIPT: AudioScript = {
  slug: "anc-bounce-ball-twice",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Bounce the ball twice." },
  ],
};

export const CLIP_ANC_TAP_FLOOR_SCRIPT: AudioScript = {
  slug: "anc-tap-floor",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Tap the floor." },
  ],
};

export const CLIP_ANC_LOOK_AT_RIM_SCRIPT: AudioScript = {
  slug: "anc-look-at-rim",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Look at the rim." },
  ],
};

export const CLIP_ST_BB_01_SCRIPT: AudioScript = {
  slug: "st-bb-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next possession." },
  ],
};

// ── Pre-practice prayer clips (shared / sport-neutral) ───────────────────────
//
// Three clips pair with the pre-practice "Lock In" sequence.
// All use voice ash + speed 0.95 + CLIP_LOUDNORM_FILTER, matching every other
// pre-practice clip. The 20s / 18s trailing prayer-space silences are rendered
// as single segments — silenceMp3() passes any durationSec directly to ffmpeg
// -t, so large single-segment silences are fully supported without chaining.

// CLIP A — shared-prayer-selfguided (pregame self-guided prayer)
// Spoken identity segments: SELFTALK_INSTRUCTIONS (local const).
// Spoken invitation / prayer-space segments: PRAYER_INSTRUCTIONS.
// phase mark: "prayer" on seg5 (first PRAYER_INSTRUCTIONS speech segment),
// consistent with PRAYER_SEGMENTS in segments.ts.
export const CLIP_SHARED_PRAYER_SELFGUIDED_SCRIPT: AudioScript = {
  slug: "shared-prayer-selfguided",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Here's what's already true before the first whistle. Your worth was settled before this game, and it'll hold after it — win, lose, great night or rough one. There's nothing left to prove out there.",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That's what frees you to leave it all out there. Full compete. No holding back, no flinching when it gets hard.",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So before you go, take it to God in your own words. You don't need the right ones — he already knows what tonight holds.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Maybe you thank him that your worth is already settled. Maybe you ask for courage, or for help when it gets hard, or you just hand him the nerves. However it comes out is fine.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Now take a moment to pray.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 20.0 },
  ],
};

// CLIP B — pp-prayer (pre-practice guided prayer)
// All speech segments use PRAYER_INSTRUCTIONS.
// phase mark: "prayer" on seg1 (first speech segment).
export const CLIP_PP_PRAYER_SCRIPT: AudioScript = {
  slug: "pp-prayer",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Let's pray. Father, thank you that my worth was settled before I got here, and it'll hold long after I leave.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Nobody's watching this part. You are, and that's enough. Help me work hard when it's quiet and no one's keeping score.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Help me give you the full effort, not the half. When a rep goes bad, help me drop it fast and go again — for you.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Good reps or rough ones, they don't change how you see me. Help me do this work for you, and to glorify you. In Jesus' name, Amen.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },
  ],
};

// CLIP C — pp-prayer-selfguided (pre-practice self-guided prayer)
// Spoken identity segments: SELFTALK_INSTRUCTIONS (local const).
// Spoken invitation / prayer-space segments: PRAYER_INSTRUCTIONS.
// phase mark: "prayer" on seg5 (first PRAYER_INSTRUCTIONS speech segment).
export const CLIP_PP_PRAYER_SELFGUIDED_SCRIPT: AudioScript = {
  slug: "pp-prayer-selfguided",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "How you practice is how you play. The full rep now is the one you'll have when it counts.",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "And you're giving that effort to an audience of One. So no rep here is wasted, and no rep here defines you. The good ones and the bad ones count to him the same — did you give it everything?",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So before you get to work, take a second and talk to God in your own words. No one's watching this part but him, and that's the point.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Maybe you thank him that your worth is already settled, before a single rep. Maybe you ask for the focus to go full when it's quiet, or you just tell him you're tired today. However it comes out is fine.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Now take a moment to pray.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 18.0 },
  ],
};

// ── Hockey pre-practice focus — pp-focus-talk-every-shift (FV-121) ────────────
// Mirrors pp-bb-focus-talk-every-possession exactly; only the sport vocab differs.
export const CLIP_PP_FOCUS_TALK_EVERY_SHIFT_SCRIPT: AudioScript = {
  slug: "pp-focus-talk-every-shift",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Talk every shift." },
  ],
};

// ── Cue-word framing clips (FV-136) ──────────────────────────────────────────
//
// Two shared clips that frame the athlete's chosen cue word in context.
// The word itself is delivered by the existing bare cw-*-reset / cw-*-sendoff
// clips via the {{cueReset}} / {{cueSendoff}} sentinels in the template.
//
// shared-cue-word-intro:  framing narration at the reset point (lines 1-2
//   of the §4 script); the word follows as {{cueReset}} in the template.
// shared-cue-word-sendoff: final-beat framing "Remember your cue word:"
//   after shared-sendoff; the word follows as {{cueSendoff}} in the template.
//
// Instructions: VISUALIZATION_INSTRUCTIONS — quiet, anchoring, mentor tone.

export const CLIP_SHARED_CUE_WORD_INTRO_SCRIPT: AudioScript = {
  slug: "shared-cue-word-intro",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "When the pressure builds." },
    { type: "silence", durationSec: 0.5 },
    { type: "speech", text: "Come back to your breath and speak your cue word." },
    { type: "silence", durationSec: 0.8 },
  ],
};

export const CLIP_SHARED_CUE_WORD_SENDOFF_SCRIPT: AudioScript = {
  slug: "shared-cue-word-sendoff",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Remember your cue word:" },
    { type: "silence", durationSec: 0.3 },
  ],
};

// ── Viz positive-play clips (FV-136) — 52 discrete scenarios ─────────────────
//
// One AudioScript per scenario in docs/pregame-viz-scenarios.json.
// Codegen source: the JSON was parsed and this block produced programmatically,
// then committed. Each script:
//   - slug:         scenario.slug  (e.g. "viz-defense-retrieval")
//   - voice:        "ash"
//   - instructions: VISUALIZATION_INSTRUCTIONS  (matches the existing viz clips)
//   - speed:        0.95
//   - postFilter:   CLIP_LOUDNORM_FILTER
//   - segments:     for each line[i]: speech(line) + silence(beat)
//
// These are the discrete positive-play library that replaces the monolithic
// per-position VIZ runs (FORWARD_VIZ / DEFENSE_VIZ / GOALIE_VIZ /
// GUARD_VIZ / WING_VIZ / BIG_VIZ).  The old monolithic clips remain for
// the legacy baked-cell path; the template vizSlug now references these.
// FV-144 (v2) will let the athlete select which scenario plays.

// ── Hockey Defense (9 scenarios) ─────────────────────────────────────────────

export const CLIP_VIZ_DEFENSE_RETRIEVAL_SCRIPT: AudioScript = {
  slug: "viz-defense-retrieval",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself as the first player back, calm under pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck is dumped in behind you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check over your inside shoulder." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You turn and sprint back for it." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check again — you know where the forecheck is." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You feel him coming, but you are not rushed." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "At the puck, you sell up the wall." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "The forechecker leans. You cut back into space." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Clean pickup, head up." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Tape-to-tape pass to your winger." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_WALK_THE_LINE_SCRIPT: AudioScript = {
  slug: "viz-defense-walk-the-line",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the puck come to you at the blue line, with the whole play in front of you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck rims around the wall to you at the point." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It's bouncing — you settle it down." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You pull it off the wall, along the blue line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You open up, eyes on the lane." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "A teammate ties up the net-front." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You walk the line one more step, into the seam." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You fire it through — a hard shot, on net, low." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Stick on the ice for the rebound." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_GAP_UP_SCRIPT: AudioScript = {
  slug: "viz-defense-gap-up",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the rush coming at you, and feel yourself ready to control the space." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They break out, you swing back." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You skate it backward, eyes on the puck carrier's chest." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You close your gap — one stick-length, then tighter." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He tries to beat you wide." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You match his speed, angle him to the wall." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You stand him up at the line. No entry." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "The puck dies in the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your partner is there. You win it back." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_BREAKOUT_SCRIPT: AudioScript = {
  slug: "viz-defense-breakout",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself below the goal line, pressure coming, but your head is clear." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You retrieve it low, under pressure from F1." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check — F2 is reading your first option." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You take it behind the net, holding the puck." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "D-to-D, hard pass to your partner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He's got a step now, the forecheck overcommitted." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You skate to support, an option up the wall." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He hits you in stride at the hash marks." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You chip it out, clean. Zone exit, on the tape." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_LONG_SHIFT_SCRIPT: AudioScript = {
  slug: "viz-defense-long-shift",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself late in a hard shift, tired but still responsible." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They keep it in at your line — you can't get the clear." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The shift gets long. They cycle low and you're pinned in your zone." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your legs are burning. You want the change. It's not there yet." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stay above your check. Box out. Battle for body position." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You don't cheat for offense — you defend, take away the next pass." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck squirts loose to your corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You get to it, shoulder-check, and chip it hard off the glass and out." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Clean clear. You're first to the bench." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Fresh legs jump on. Long shift, no goal against." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You did your job. That's the change you earned." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_PINCH_SCORE_SCRIPT: AudioScript = {
  slug: "viz-defense-pinch-score",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the puck near the wall and know this is your chance to keep the play alive." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck's chipped up the wall, trying to leave the zone." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're the D at the blue line. You read it early." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You shoulder-check — your center is high, covering for you." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You step down and pinch, pin it on the wall." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You win the battle and knock it to the middle." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You walk off the wall into the slot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You snap a low shot through the traffic." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It tips in. You kept it alive and buried it." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_DEFENSE_PENALTY_KILL_CLEAR_SCRIPT: AudioScript = {
  slug: "viz-defense-penalty-kill-clear",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself on the penalty kill, locked into your lane and your job." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You are on the penalty kill. They set up high." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stay in the shot lane, stick out front." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck moves to the half wall. You do not chase." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You keep the box tight and protect the middle." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The shot comes from the point. You get in the lane." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "It hits your shin pad and drops loose." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You win the race and chip it hard down the ice." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Your bench taps their sticks. Kill the next one." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_DEFENSE_VOCAL_BREAKOUT_SCRIPT: AudioScript = {
  slug: "viz-defense-vocal-breakout",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself as the calm voice on the ice, helping everyone play faster." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your partner goes back for the puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check and read the forecheck." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You call it early: \"Reverse.\"" },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He hears you and banks it behind the net." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You collect it in stride, head up." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The winger is posted on the wall. Your center is low." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You call \"wall\" and put it on the tape." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Clean exit. Your voice made the game slower." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_DEFENSE_ANGLE_WIDE_BOXOUT_SCRIPT: AudioScript = {
  slug: "viz-defense-angle-wide-boxout",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the rush building, and feel yourself patient, square, and in control." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They come through the neutral zone with speed." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hold the middle and match his pace." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You do not lunge. You do not open the inside lane." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You angle him wide toward the boards." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He shoots from outside the dot. Low danger." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your goalie makes the save. The rebound drops in front." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You tie up his stick and take his body." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your partner collects the puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Middle protected. Rebound won. Job done." },
    { type: "silence", durationSec: 3.0 },
  ],
};

// ── Hockey Forward (10 scenarios) ────────────────────────────────────────────

export const CLIP_VIZ_FORWARD_WIN_THE_WALL_SCRIPT: AudioScript = {
  slug: "viz-forward-win-the-wall",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the puck go into your corner and know you are going to win the race." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck's chipped into your corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You get there first, low and strong." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You take the body, pin your check, protect the puck." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You pull it off the wall to the middle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You drive the net, hard, inside hand." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You go to the backhand, around the goalie's pad." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck crosses the line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck is in. You earned that one." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_GIVE_AND_GO_SCRIPT: AudioScript = {
  slug: "viz-forward-give-and-go",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See open ice ahead of you and feel your speed starting to build." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You carry it through the neutral zone, speed building." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check — your winger is filling the lane." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You give it to him and accelerate." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hit the soft spot in the D, between the two defenders." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "His return pass is on your tape, flat." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One touch to settle it, the goalie sliding." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You roof it over the blocker." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Top corner. Bar down." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_BACKCHECK_STRIP_SCRIPT: AudioScript = {
  slug: "viz-forward-backcheck-strip",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the turnover happen and feel yourself commit to getting back hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck turns over at their blue line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They're on the rush, you're the high forward." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You turn and skate, full speed, back through center." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You track the puck-carrier on his inside hand." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You catch him at the top of the circle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Active stick — you lift his, then poke the puck free." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You knock it to the corner, kill the rush." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You jump back to the bench. Clean change." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_FORWARD_NET_FRONT_SCRIPT: AudioScript = {
  slug: "viz-forward-net-front",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself at the net-front, ready to make a hard play in traffic." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The point man winds up for the shot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You set up at the net-front, stick on the ice." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You find a lane, body between the D and the goalie." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The shot comes — you get a piece, tip it down." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "The goalie kicks out a rebound." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're already on it, hands quick." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You bang it home before he resets." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck is in. Net-front work paid off." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_FACEOFF_WIN_SHOT_SCRIPT: AudioScript = {
  slug: "viz-forward-faceoff-win-shot",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself over the dot, set, calm, and ready for the puck drop." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're at the dot in the O-zone. You set your grip." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You read the linesman's hand. You win it clean back to your D." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You release off the dot and find the soft ice in the slot." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Your D walks the line and the lane opens." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck comes down to the tape in the middle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One touch, you bury it bar-down." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_FORWARD_2ON1_PASS_FINISH_SCRIPT: AudioScript = {
  slug: "viz-forward-2on1-pass-finish",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the odd-man rush opening up, with space and speed in front of you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You jump the gap and it's a 2-on-1 the other way." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You read the D — he sinks to take the pass." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You're patient. You drive the soft ice and hold the puck." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "He commits to you. The lane to your winger opens." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You slide it flat across, right onto his tape." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He one-times it home. You made that play." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_FORECHECK_STRIP_SCRIPT: AudioScript = {
  slug: "viz-forward-forecheck-strip",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself as F1, first into the zone, setting the pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're F1, first man in on the forecheck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You take the right angle and cut off his strong-side option." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You close hard and pin him to the wall." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You lift his stick and steal the puck off the boards." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You spin off pressure, low to the net." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You tuck it short side. Forecheck to goal." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_CYCLE_LOW_HIGH_SCRIPT: AudioScript = {
  slug: "viz-forward-cycle-low-high",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the puck below the goal line and feel your line ready to build pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck is below the goal line. You get there first." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You protect it with your body, shoulder into pressure." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You hear your teammate call for the cycle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You leave it soft off the wall and roll high." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck moves low to high to your D." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You drive through the defender's hands to the net-front." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The shot comes through traffic." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You screen the goalie and hunt the rebound." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Possession kept. Pressure built. That is winning hockey." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_FORWARD_3ON2_MIDDLE_DRIVE_SCRIPT: AudioScript = {
  slug: "viz-forward-3on2-middle-drive",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the rush forming, and know your middle-lane drive can open everything." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You cross the red line with speed. It is a 3-on-2." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your winger has the puck wide. You read the gap." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You drive the middle lane hard, stick on the ice." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Both defenders feel you coming through the slot." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The far winger delays into open ice." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The pass goes across. The shot comes." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You stop at the net-front, ready for the rebound." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck kicks loose. You bury it from the top of the crease." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_FORWARD_DZONE_FACEOFF_WIN_SCRIPT: AudioScript = {
  slug: "viz-forward-dzone-faceoff-win",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the defensive-zone draw and feel the importance of doing your job." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Defensive-zone draw. Late in the period." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You set your feet and know your job." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck drops. You tie up hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your winger jumps through and wins the loose puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You support low and protect the middle." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck goes wall-side, then out." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You clear the zone and get fresh legs on." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Small play. Big moment. You did your job." },
    { type: "silence", durationSec: 2.5 },
  ],
};

// ── Hockey Goalie (9 scenarios) ───────────────────────────────────────────────

export const CLIP_VIZ_GOALIE_TRACK_AND_SAVE_SCRIPT: AudioScript = {
  slug: "viz-goalie-track-and-save",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the play enter your zone and feel yourself settled in your crease." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck comes up the wall into the zone." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You set your depth, square to the puck." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You stay big, hands out front, weight on the balls of your feet." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The shooter loads up from the top of the circle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You track it off his blade, all the way in." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You take it in the chest, smother it." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The whistle blows. You've got it." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're calm. Set for the next one." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GOALIE_REBOUND_CONTROL_SCRIPT: AudioScript = {
  slug: "viz-goalie-rebound-control",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the shooter on the wing and feel yourself ready to control the puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Shot from the wing, low and hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You drop into your butterfly, sealed to the ice." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You take it off the pad." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You angle the pad, steer the rebound to the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "No second chance — the puck dies in the boards." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You push back to your feet." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You re-center on your post, depth set." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Eyes back on the puck. Next shot only." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GOALIE_POST_TO_POST_SCRIPT: AudioScript = {
  slug: "viz-goalie-post-to-post",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the puck below the goal line and feel yourself sealed and patient." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck swings low, below the goal line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You seal the near post, leak nothing short side." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The pass goes cross-ice, backdoor." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You push post to post, square on arrival." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You're set before the shot — not sliding through it." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You take it on the blocker, controlled." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You direct it high glass, out of danger." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You reset to center. You held your ground." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GOALIE_BREAKAWAY_SCRIPT: AudioScript = {
  slug: "viz-goalie-breakaway",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the player coming in alone and feel your body stay big and quiet." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He's behind the D, in alone, gathering speed." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You set your depth at the top of the crease." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You match his pace as he comes, staying patient." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Stay big. Hands out front. Don't bite on the first move." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He pulls it to his forehand, tries to go five-hole." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stay on your feet, then close the seal." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The puck hits your pads and dies." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You cover it up. You won that one-on-one." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GOALIE_GLOVE_FREEZE_SCRIPT: AudioScript = {
  slug: "viz-goalie-glove-freeze",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the shot developing through traffic and feel your glove ready out front." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Puck's in the corner, they're working it for a shot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're square, gloves out front, tracking it through." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The shot comes hard, glove side, high." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You catch it clean. The leather snaps shut." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hold it. The whistle goes." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You stayed square. You held it. Faceoff." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GOALIE_SCRAMBLE_SAVE_SCRIPT: AudioScript = {
  slug: "viz-goalie-scramble-save",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the crease get messy and know you are going to keep fighting for the puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It's a scramble in your crease. The puck's loose." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The first shot beats you and you're down and out." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't quit on it. You drive to your post." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You throw the pad across and seal the ice." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck hits you and stays out." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You found it, you covered it. Whistle. Breathe." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GOALIE_SCREEN_TRAFFIC_SCRIPT: AudioScript = {
  slug: "viz-goalie-screen-traffic",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See bodies in front of you and feel yourself working to find the puck." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "There's a shot coming and a body in your sightline." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You don't fight the screen. You move to find the puck." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You drop and look around the hip, eyes on the release." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You see it late and get a piece — it's off your chest." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You smother the rebound before a stick can find it." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You read it through the traffic. Save and freeze." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GOALIE_PLAY_PUCK_BREAKOUT_SCRIPT: AudioScript = {
  slug: "viz-goalie-play-puck-breakout",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the dump-in coming and know you can help your team before pressure arrives." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The puck is dumped in hard around the glass." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You leave your crease and get behind it early." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stop it clean behind the net." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shoulder-check. F1 is coming." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You make the simple play to your defenseman's forehand." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He collects it with time. The forecheck slows down." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You get back to your crease, square and ready." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You helped your team break out before the pressure arrived." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GOALIE_PK_SEAM_SAVE_SCRIPT: AudioScript = {
  slug: "viz-goalie-pk-seam-save",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the power play moving the puck and feel yourself patient through the seam." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They are on the power play, moving the puck around the outside." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stay patient, square to the puck." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The pass goes across the seam." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You push hard, eyes arriving before your body." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You get set on your edge before the release." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The one-timer comes. You take it in the chest." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "No rebound. Whistle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You stayed patient. You beat the pass." },
    { type: "silence", durationSec: 2.5 },
  ],
};

// ── Basketball Guard (8 scenarios) ───────────────────────────────────────────

export const CLIP_VIZ_GUARD_PICK_AND_ROLL_SCRIPT: AudioScript = {
  slug: "viz-guard-pick-and-roll",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself bringing the ball up, calm, with the floor spread in front of you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You bring it up, eyes on the floor." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You call for the screen. Your big climbs up to set it." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You wait for the screen to hit. You do not leave early." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You snake off the pick, shoulder past his man." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The big drops back in coverage." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You see the gap open in the lane." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You get downhill, two feet in the paint." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The low defender steps toward you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You read it calmly — finish if he stays, pass if he commits." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Tonight, he stays. You lay it in soft off the glass." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Good read. Good pace. Next possession." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GUARD_TRANSITION_PULLUP_SCRIPT: AudioScript = {
  slug: "viz-guard-transition-pullup",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the rebound hit your hands and feel the floor open in transition." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You snatch the rebound and push." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You see numbers, and the defense is backpedaling." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "One dribble, two, eating up the floor." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The defender keeps giving ground." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You feel your feet hit the spot just inside the line." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You rise up, balanced, eyes on the rim." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Clean release." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It drops." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You sprint back, already talking on defense." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GUARD_LIVE_STEAL_SCRIPT: AudioScript = {
  slug: "viz-guard-live-steal",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself picking up full court, low, active, and ready to pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You pick up your man full court." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're in a stance, chest in front, feet active." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "He tries to turn the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You cut him off with your chest, not your hands." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He puts his head down to dribble." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You time the bounce, dig down once, and knock it loose." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You scoop it on the run, no one between you and the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You finish it strong on the other end." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Feet first. Hands second. Clean defense." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GUARD_DRIVE_AND_KICK_SCRIPT: AudioScript = {
  slug: "viz-guard-drive-and-kick",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the closeout coming and know you are ready to attack the advantage." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You catch it at the top, your man closes out hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You rip through and attack his front foot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You turn the corner, downhill into the paint." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The low man slides over to stop the drive." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You see your shooter spot up in the corner." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You hang, draw the second defender." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You whip the kick-out on a rope." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He catches it in rhythm and buries it." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You created the shot by making the right read." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GUARD_PRESS_BREAK_SCRIPT: AudioScript = {
  slug: "viz-guard-press-break",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the press coming at you, and feel yourself calm with the ball." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They pick you up full court." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You come back to the ball, low and strong." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two defenders start to shade you toward the sideline." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You do not panic." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You retreat dribble once and create space." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Your teammate flashes to the middle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hit him on time, away from pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The ball moves ahead. The press is broken." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You sprint into spacing and get the team organized." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Calm with the ball. Simple play. Pressure handled." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_GUARD_RUN_THE_SET_SCRIPT: AudioScript = {
  slug: "viz-guard-run-the-set",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the game speeding up and feel yourself ready to settle the team." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The game is speeding up. Your team needs a good possession." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You bring it across half court under control." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You raise your hand and call the set." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You move the ball early and cut through." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The ball reverses. The defense shifts." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You get it back and make the simple read." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Your teammate gets a clean look in rhythm." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Good possession. You led without forcing." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GUARD_CLUTCH_FREE_THROWS_SCRIPT: AudioScript = {
  slug: "viz-guard-clutch-free-throws",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself at the line in a tight game, with your routine ready." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Tie game, under ten seconds, you drive hard and the whistle blows." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two shots. The other gym is loud behind the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You step to the line and the ref hands you the ball." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Three dribbles, spin it, breath out — your routine, the same every time." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Legs are tired, but you bend your knees and use them anyway." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Eyes on the back of the rim." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "First one is pure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Same breath, same hold." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Second one drops through." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You backpedal on defense, calm and ready for the next stop." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_GUARD_ICES_IT_LATE_SCRIPT: AudioScript = {
  slug: "viz-guard-ices-it-late",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the trap coming late, and feel yourself strong with the ball." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Up two, final seconds, and they trap you full-court to take the ball." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two defenders come hard — you stay low, protect the ball, and do not panic." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You keep your dribble alive and get fouled." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They have to put you on the line to stop the clock." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Bonus, two shots. You walk up calm." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Routine, breath, eyes up." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "First one is good." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Same rhythm. Second one through." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Game is not over because you celebrated. Game is over because you took care of the ball." },
    { type: "silence", durationSec: 2.5 },
  ],
};

// ── Basketball Wing (8 scenarios) ────────────────────────────────────────────

export const CLIP_VIZ_WING_CATCH_AND_SHOOT_SCRIPT: AudioScript = {
  slug: "viz-wing-catch-and-shoot",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself spaced on the wing, ready before the ball arrives." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You space to the wing, ready." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball swings around the horn." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your feet are ready before the ball arrives. Hands up, knees loaded." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The pass hits your hands." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The closeout flies at you a beat too late." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You go straight up into your shot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Smooth release over the contest." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hold your follow-through." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It drops, and you sprint back on defense." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_WING_ATTACK_CLOSEOUT_SCRIPT: AudioScript = {
  slug: "viz-wing-attack-closeout",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the skip pass coming and feel the closeout flying at you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The skip pass finds you on the wing." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You shot-fake. Your man flies by, out of control." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You rip through and put it on the floor, downhill." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two dribbles into the gap, into the paint." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The big steps up off your roller." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You read his chest. If he stays back, you finish. If he steps up, you drop it off." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Tonight, he is late." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You gather under the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You finish high off the glass through contact." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Strong attack. Right read." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_WING_DENIAL_DEFLECTION_SCRIPT: AudioScript = {
  slug: "viz-wing-denial-deflection",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See your matchup trying to get open, and feel yourself locked into the lane." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your man wants the ball on the wing." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're in the passing lane, hand in, denying." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You feel him cut, and you stay attached — ball, you, man." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The pass comes anyway, lazy, into the gap." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You jump the lane and deflect it loose." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You corral it and turn upcourt." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You push it ahead." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your team gets a clean finish on the break." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Defense created offense." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_WING_BACKDOOR_CUT_SCRIPT: AudioScript = {
  slug: "viz-wing-backdoor-cut",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See your defender overplaying, and feel the backdoor lane open." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're on the wing, and your man overplays the pass." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You feel him cheat, top hand in the lane." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You plant hard and cut backdoor behind him." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You flash open down the lane, hand ready." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The bounce pass leads you to the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You catch it in stride." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One step, eyes up." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You finish at the rim before the help arrives." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You did not stand. You cut with purpose." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_WING_CLOSEOUT_CONTAIN_SCRIPT: AudioScript = {
  slug: "viz-wing-closeout-contain",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the ball skip to the corner and feel yourself ready to close out under control." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The ball skips to your man in the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You sprint the first steps, then chop your feet." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "High hand. No fly-by." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He shot-fakes. You stay down." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He drives baseline." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You slide and cut him off." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "He picks up the ball with nowhere to go." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You contest the pass and your team resets the defense." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Disciplined closeout. No foul. No blow-by." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_WING_RELOCATE_CATCH_SHOOT_SCRIPT: AudioScript = {
  slug: "viz-wing-relocate-catch-shoot",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself move after the pass, staying active and ready." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You catch on the wing and the closeout comes hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You make the simple pass to the top." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You do not stand and watch." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You slide to the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your hands are ready. Your feet are already set." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball swings back to you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You catch in rhythm, eyes on the rim." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Smooth release." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It drops, and you sprint back on defense." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Pass. Move. Be ready." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_WING_CLUTCH_FREE_THROWS_SCRIPT: AudioScript = {
  slug: "viz-wing-clutch-free-throws",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself at the line on the road, with the gym trying to shake you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Late in a road game, you catch on the wing and rise into your jumper." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It falls, and the contact comes — and-1." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The home crowd gets loud, trying to pull you out of your routine." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You step up, settle your feet, and let the noise wash past you." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "One dribble, deep breath, the same stroke you shoot in an empty gym." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Elbow in, follow through, hold it." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Bottom of the net." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You turn and sprint back, calm and locked in." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_WING_LATE_JUMPER_SCRIPT: AudioScript = {
  slug: "viz-wing-late-jumper",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the ball find you late, with space to rise into your shot." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Under thirty seconds, a one-possession game, the ball finds you on the wing." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your man flies at the closeout, hand up, trying to run you off the line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One hard jab." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You rise up clean over the contest." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Elbow in, eyes on the rim, the same shot you have practiced over and over." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "It leaves your hand soft, perfect rotation." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "It drops clean." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You turn and sprint back, already onto the next stop." },
    { type: "silence", durationSec: 2.5 },
  ],
};

// ── Basketball Big (8 scenarios) ─────────────────────────────────────────────

export const CLIP_VIZ_BIG_ROLL_AND_FINISH_SCRIPT: AudioScript = {
  slug: "viz-big-roll-and-finish",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself sprinting into the screen, ready to create contact and roll hard." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You climb up and set a wall of a screen." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your guard rubs his man off you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You feel the hit, then you roll hard to the rim." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The low man tags you, then recovers out." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You're open, sealing down the middle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The pocket pass hits you on the roll." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You catch it on the move." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Two feet. Strong base." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You go up strong through the contact." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The ball drops. Strong finish." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_BIG_POST_SEAL_DROPSTEP_SCRIPT: AudioScript = {
  slug: "viz-big-post-seal-dropstep",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself beating your man down the floor and earning deep position." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You sprint the floor and beat your man down." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You did the work before the catch." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You sit him on your back, seal deep, hands high." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your guard hits you on the block." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You feel where he is playing you — high side." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You drop step baseline into the open lane." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "One strong dribble, into your body." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You go up off two feet and finish over him." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Early work. Deep catch. Strong finish." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_BIG_BOXOUT_OUTLET_SCRIPT: AudioScript = {
  slug: "viz-big-boxout-outlet",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the shot go up and feel yourself ready to own the glass." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The shot goes up from the wing." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You find your man, put a body on him, and hit him first." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You feel him try to slip around." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You stay attached." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The ball comes off long to your side." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You go get it at its highest point, two hands." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You land, chin it, and pivot away from pressure." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You see your guard leaking out." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You hit the outlet ahead and start the break." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The possession ends because you did your work on the glass." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_BIG_RIM_PROTECT_AND_GO_SCRIPT: AudioScript = {
  slug: "viz-big-rim-protect-and-go",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the guard coming downhill and feel yourself ready to protect the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Their guard turns the corner, downhill at you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You're in drop coverage, walling up the paint." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You hold your ground, feet set, chest square." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "He gathers and goes up at the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You meet him vertical, hands high, no reach." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He has to finish over length." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The shot comes off." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "You secure it with two hands." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Outlet ahead. Your stop started the break." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_BIG_RESCREEN_ROLL_SCRIPT: AudioScript = {
  slug: "viz-big-rescreen-roll",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself coming into the screen with purpose, ready to create an advantage." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You sprint into the screen, feet set, wide base." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your guard waits until you make contact." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The defender fights over the top." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You turn and re-screen, changing the angle." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "Now your guard gets downhill." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You roll hard into the open lane." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The help steps up." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your teammate gets the corner three." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Your screen created the shot. That is winning basketball." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_BIG_SHORT_ROLL_READ_SCRIPT: AudioScript = {
  slug: "viz-big-short-roll-read",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the defense step toward your guard and feel the pocket open for you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You set the screen high. Your guard turns the corner." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Both defenders step toward him." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You slip into the pocket, hands ready." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "The pass hits you at the free-throw line." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You land on two feet and read the low man." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He steps up to stop you." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You drop the pass to your teammate under the rim." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Easy finish." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You made the right read." },
    { type: "silence", durationSec: 3.0 },
  ],
};

export const CLIP_VIZ_BIG_CLUTCH_FREE_THROWS_SCRIPT: AudioScript = {
  slug: "viz-big-clutch-free-throws",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See yourself at the line late, with everyone expecting the miss." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "They put you on the line on purpose, late, hoping you'll miss." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The whole gym knows the plan." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You step up slow, set your feet wide, and breathe it all the way down." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "Spin the ball, find your line, same routine you grind after every practice." },
    { type: "silence", durationSec: 2.5 },
    { type: "speech", text: "You shot these when no one was watching." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Push it soft off the fingertips." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "First one drops." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Same motion, no rush." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Second one falls clean." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You did your job. Now get back and protect the paint." },
    { type: "silence", durationSec: 2.5 },
  ],
};

export const CLIP_VIZ_BIG_GAME_SEALING_BLOCK_SCRIPT: AudioScript = {
  slug: "viz-big-game-sealing-block",
  voice: "ash",
  instructions: VISUALIZATION_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "See the final possession coming at the rim, and feel yourself ready to wall up." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Final possession, you're guarding the rim, protecting a two-point lead." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Their guard turns the corner and comes downhill at you full speed." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You slide over, feet set, hands straight up." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Vertical. No reach." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "He goes up to finish." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You wall up, stay vertical, and take away the finish." },
    { type: "silence", durationSec: 3.0 },
    { type: "speech", text: "All contest. No whistle." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "The rebound falls to your hands." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "You rip it down strong." },
    { type: "silence", durationSec: 2.0 },
    { type: "speech", text: "Outlet it ahead, and the game is yours." },
    { type: "silence", durationSec: 3.0 },
  ],
};

// ── Ordered list of TTS clip scripts (no openers — they are loudnorm-passed) ──
//
// Phase 2 ordering: shared structural → VIZ × 3 positions → HM × 30 cells
// (hm-forward-nervous first for backward compatibility with P1) → CLOSING.
export const CLIP_SCRIPTS: AudioScript[] = [
  // Shared structural
  CLIP_SHARED_OPENING_SCRIPT,
  // VIZ — all 3 positions (monolithic — retained for legacy baked-cell path)
  CLIP_VIZ_FORWARD_SCRIPT,
  CLIP_VIZ_DEFENSE_SCRIPT,
  CLIP_VIZ_GOALIE_SCRIPT,
  // HM — Forward (10)
  CLIP_HM_FORWARD_NERVOUS_SCRIPT,
  CLIP_HM_FORWARD_MISSED_CHANCE_SCRIPT,
  CLIP_HM_FORWARD_TURNOVER_SCRIPT,
  CLIP_HM_FORWARD_BEATEN_WIDE_SCRIPT,
  CLIP_HM_FORWARD_BAD_PENALTY_SCRIPT,
  CLIP_HM_FORWARD_COACH_YELLS_SCRIPT,
  CLIP_HM_FORWARD_BENCHED_SCRIPT,
  CLIP_HM_FORWARD_GET_HIT_SCRIPT,
  CLIP_HM_FORWARD_START_SLOW_SCRIPT,
  CLIP_HM_FORWARD_FIRST_GOAL_AGAINST_SCRIPT,
  // HM — Defense (10)
  CLIP_HM_DEFENSE_BEATEN_WIDE_SCRIPT,
  CLIP_HM_DEFENSE_TURNOVER_SCRIPT,
  CLIP_HM_DEFENSE_MISSED_CHANCE_SCRIPT,
  CLIP_HM_DEFENSE_BAD_PENALTY_SCRIPT,
  CLIP_HM_DEFENSE_COACH_YELLS_SCRIPT,
  CLIP_HM_DEFENSE_BENCHED_SCRIPT,
  CLIP_HM_DEFENSE_NERVOUS_SCRIPT,
  CLIP_HM_DEFENSE_GET_HIT_SCRIPT,
  CLIP_HM_DEFENSE_START_SLOW_SCRIPT,
  CLIP_HM_DEFENSE_FIRST_GOAL_AGAINST_SCRIPT,
  // HM — Goalie (10)
  CLIP_HM_GOALIE_COACH_YELLS_SCRIPT,
  CLIP_HM_GOALIE_TURNOVER_SCRIPT,
  CLIP_HM_GOALIE_MISSED_CHANCE_SCRIPT,
  CLIP_HM_GOALIE_BEATEN_WIDE_SCRIPT,
  CLIP_HM_GOALIE_BAD_PENALTY_SCRIPT,
  CLIP_HM_GOALIE_PULLED_SCRIPT,
  CLIP_HM_GOALIE_NERVOUS_SCRIPT,
  CLIP_HM_GOALIE_GET_HIT_SCRIPT,
  CLIP_HM_GOALIE_START_SLOW_SCRIPT,
  CLIP_HM_GOALIE_FIRST_GOAL_AGAINST_SCRIPT,
  // Shared CLOSING
  CLIP_SHARED_RESET_PLAN_SCRIPT,
  CLIP_SHARED_PRAYER_SCRIPT,
  CLIP_SHARED_SENDOFF_SCRIPT,
  // Cue-word framing clips (FV-136) — shared narration that wraps the bare cw-* word clips.
  CLIP_SHARED_CUE_WORD_INTRO_SCRIPT,
  CLIP_SHARED_CUE_WORD_SENDOFF_SCRIPT,
  // Viz positive-play clips (FV-136) — 52 discrete scenarios replacing monolithic VIZ runs.
  // Hockey Defense (9)
  CLIP_VIZ_DEFENSE_RETRIEVAL_SCRIPT,
  CLIP_VIZ_DEFENSE_WALK_THE_LINE_SCRIPT,
  CLIP_VIZ_DEFENSE_GAP_UP_SCRIPT,
  CLIP_VIZ_DEFENSE_BREAKOUT_SCRIPT,
  CLIP_VIZ_DEFENSE_LONG_SHIFT_SCRIPT,
  CLIP_VIZ_DEFENSE_PINCH_SCORE_SCRIPT,
  CLIP_VIZ_DEFENSE_PENALTY_KILL_CLEAR_SCRIPT,
  CLIP_VIZ_DEFENSE_VOCAL_BREAKOUT_SCRIPT,
  CLIP_VIZ_DEFENSE_ANGLE_WIDE_BOXOUT_SCRIPT,
  // Hockey Forward (10)
  CLIP_VIZ_FORWARD_WIN_THE_WALL_SCRIPT,
  CLIP_VIZ_FORWARD_GIVE_AND_GO_SCRIPT,
  CLIP_VIZ_FORWARD_BACKCHECK_STRIP_SCRIPT,
  CLIP_VIZ_FORWARD_NET_FRONT_SCRIPT,
  CLIP_VIZ_FORWARD_FACEOFF_WIN_SHOT_SCRIPT,
  CLIP_VIZ_FORWARD_2ON1_PASS_FINISH_SCRIPT,
  CLIP_VIZ_FORWARD_FORECHECK_STRIP_SCRIPT,
  CLIP_VIZ_FORWARD_CYCLE_LOW_HIGH_SCRIPT,
  CLIP_VIZ_FORWARD_3ON2_MIDDLE_DRIVE_SCRIPT,
  CLIP_VIZ_FORWARD_DZONE_FACEOFF_WIN_SCRIPT,
  // Hockey Goalie (9)
  CLIP_VIZ_GOALIE_TRACK_AND_SAVE_SCRIPT,
  CLIP_VIZ_GOALIE_REBOUND_CONTROL_SCRIPT,
  CLIP_VIZ_GOALIE_POST_TO_POST_SCRIPT,
  CLIP_VIZ_GOALIE_BREAKAWAY_SCRIPT,
  CLIP_VIZ_GOALIE_GLOVE_FREEZE_SCRIPT,
  CLIP_VIZ_GOALIE_SCRAMBLE_SAVE_SCRIPT,
  CLIP_VIZ_GOALIE_SCREEN_TRAFFIC_SCRIPT,
  CLIP_VIZ_GOALIE_PLAY_PUCK_BREAKOUT_SCRIPT,
  CLIP_VIZ_GOALIE_PK_SEAM_SAVE_SCRIPT,
  // Basketball Guard (8)
  CLIP_VIZ_GUARD_PICK_AND_ROLL_SCRIPT,
  CLIP_VIZ_GUARD_TRANSITION_PULLUP_SCRIPT,
  CLIP_VIZ_GUARD_LIVE_STEAL_SCRIPT,
  CLIP_VIZ_GUARD_DRIVE_AND_KICK_SCRIPT,
  CLIP_VIZ_GUARD_PRESS_BREAK_SCRIPT,
  CLIP_VIZ_GUARD_RUN_THE_SET_SCRIPT,
  CLIP_VIZ_GUARD_CLUTCH_FREE_THROWS_SCRIPT,
  CLIP_VIZ_GUARD_ICES_IT_LATE_SCRIPT,
  // Basketball Wing (8)
  CLIP_VIZ_WING_CATCH_AND_SHOOT_SCRIPT,
  CLIP_VIZ_WING_ATTACK_CLOSEOUT_SCRIPT,
  CLIP_VIZ_WING_DENIAL_DEFLECTION_SCRIPT,
  CLIP_VIZ_WING_BACKDOOR_CUT_SCRIPT,
  CLIP_VIZ_WING_CLOSEOUT_CONTAIN_SCRIPT,
  CLIP_VIZ_WING_RELOCATE_CATCH_SHOOT_SCRIPT,
  CLIP_VIZ_WING_CLUTCH_FREE_THROWS_SCRIPT,
  CLIP_VIZ_WING_LATE_JUMPER_SCRIPT,
  // Basketball Big (8)
  CLIP_VIZ_BIG_ROLL_AND_FINISH_SCRIPT,
  CLIP_VIZ_BIG_POST_SEAL_DROPSTEP_SCRIPT,
  CLIP_VIZ_BIG_BOXOUT_OUTLET_SCRIPT,
  CLIP_VIZ_BIG_RIM_PROTECT_AND_GO_SCRIPT,
  CLIP_VIZ_BIG_RESCREEN_ROLL_SCRIPT,
  CLIP_VIZ_BIG_SHORT_ROLL_READ_SCRIPT,
  CLIP_VIZ_BIG_CLUTCH_FREE_THROWS_SCRIPT,
  CLIP_VIZ_BIG_GAME_SEALING_BLOCK_SCRIPT,
  // Phase 3b personalization clips — anchor, self-talk, cue words.
  // Resume-safe: existing files in clips/ are skipped. Regenerate only when
  // intentionally re-rendering (e.g. new instruction changes).
  CLIP_ANC_LONG_EXHALE_SCRIPT,
  CLIP_ANC_TAP_STICK_TWICE_SCRIPT,
  CLIP_ANC_TOUCH_GLOVE_SCRIPT,
  CLIP_ANC_PRESS_THUMB_TO_PALM_SCRIPT,
  CLIP_ANC_LOOK_AT_TAPE_SCRIPT,
  CLIP_ST_01_SCRIPT,
  CLIP_ST_02_SCRIPT,
  CLIP_ST_03_SCRIPT,
  CLIP_ST_04_SCRIPT,
  CLIP_ST_05_SCRIPT,
  CLIP_ST_06_SCRIPT,
  CLIP_ST_07_SCRIPT,
  CLIP_CW_STEADY_RESET_SCRIPT,
  CLIP_CW_STEADY_SENDOFF_SCRIPT,
  CLIP_CW_COURAGE_RESET_SCRIPT,
  CLIP_CW_COURAGE_SENDOFF_SCRIPT,
  CLIP_CW_SIMPLE_RESET_SCRIPT,
  CLIP_CW_SIMPLE_SENDOFF_SCRIPT,
  CLIP_CW_ATTACK_RESET_SCRIPT,
  CLIP_CW_ATTACK_SENDOFF_SCRIPT,
  CLIP_CW_NEXT_RESET_SCRIPT,
  CLIP_CW_NEXT_SENDOFF_SCRIPT,
  CLIP_CW_SERVE_RESET_SCRIPT,
  CLIP_CW_SERVE_SENDOFF_SCRIPT,
  CLIP_CW_COMPETE_RESET_SCRIPT,
  CLIP_CW_COMPETE_SENDOFF_SCRIPT,
  CLIP_CW_FAITHFUL_RESET_SCRIPT,
  CLIP_CW_FAITHFUL_SENDOFF_SCRIPT,
  CLIP_CW_FREE_RESET_SCRIPT,
  CLIP_CW_FREE_SENDOFF_SCRIPT,
  CLIP_CW_RELENTLESS_RESET_SCRIPT,
  CLIP_CW_RELENTLESS_SENDOFF_SCRIPT,
  // Pre-practice "Lock In" clips (state-aware v2, FRO-22).
  // Resume-safe: existing files in clips/ are skipped.
  // Retired: pp-settle-receive, pp-choose-focus (replaced below).
  CLIP_PP_OPENER_DIALED_IN_SCRIPT,
  CLIP_PP_OPENER_GET_TO_SCRIPT,
  CLIP_PP_NAME_STANDARD_SCRIPT,
  CLIP_PP_GOAL_FUSION_SCRIPT,
  CLIP_PP_CHOOSE_FOCUS_LEAD_SCRIPT,
  CLIP_PP_CHOOSE_FOCUS_TAIL_SCRIPT,
  CLIP_PP_FOCUS_RELENTLESS_SCRIPT,
  CLIP_PP_FOCUS_HUNGRY_SCRIPT,
  CLIP_PP_FOCUS_HEAD_UP_EVERY_BREAKOUT_SCRIPT,
  CLIP_PP_FOCUS_FEET_ALWAYS_MOVING_SCRIPT,
  CLIP_PP_FOCUS_HARD_FIRST_PASS_SCRIPT,
  CLIP_PP_FOCUS_WIN_EVERY_RACE_SCRIPT,
  CLIP_PP_FOCUS_FULL_REPS_NO_GLIDE_SCRIPT,
  CLIP_PP_BE_VOCAL_SCRIPT,
  CLIP_PP_SEE_IT_GO_SCRIPT,
  // Basketball pre-practice "Lock In" clips (FV-30 pre-practice chunk).
  // Audio rendering = FV-31. Resume-safe: existing files skipped by generator.
  CLIP_PP_BB_OPENER_GET_TO_SCRIPT,
  CLIP_PP_BB_NAME_STANDARD_SCRIPT,
  CLIP_PP_BB_GOAL_FUSION_SCRIPT,
  CLIP_PP_BB_BE_VOCAL_SCRIPT,
  CLIP_PP_BB_SEE_IT_GO_SCRIPT,
  CLIP_PP_BB_FOCUS_RELENTLESS_SCRIPT,
  CLIP_PP_BB_FOCUS_HUNGRY_SCRIPT,
  CLIP_PP_BB_FOCUS_TALK_EVERY_POSSESSION_SCRIPT,
  CLIP_PP_BB_FOCUS_GUARD_YOUR_YARD_SCRIPT,
  CLIP_PP_BB_FOCUS_HIT_THE_GLASS_SCRIPT,
  CLIP_PP_BB_FOCUS_SPRINT_EVERY_TRANSITION_SCRIPT,
  CLIP_PP_BB_FOCUS_BOX_OUT_EVERY_SHOT_SCRIPT,
  // Basketball pregame hard-moment cells (FV-30) — Guard (10)
  // NOTE: these full-session scripts remain in CLIP_SCRIPTS for the legacy
  // baked-cell render path. The FV-115 decomposed hm-bb-* clips (below) are
  // the compositional-clip-playlist equivalents registered for FV-116.
  SESSION_GUARD_TURNOVER_SCRIPT,
  SESSION_GUARD_MISSED_SHOT_SCRIPT,
  SESSION_GUARD_GOT_COOKED_SCRIPT,
  SESSION_GUARD_FOUL_TROUBLE_SCRIPT,
  SESSION_GUARD_COACH_YELLS_SCRIPT,
  SESSION_GUARD_BENCHED_SCRIPT,
  SESSION_GUARD_NERVOUS_SCRIPT,
  SESSION_GUARD_MISSED_FTS_SCRIPT,
  SESSION_GUARD_START_SLOW_SCRIPT,
  SESSION_GUARD_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball pregame hard-moment cells (FV-30) — Wing (10)
  SESSION_WING_TURNOVER_SCRIPT,
  SESSION_WING_MISSED_SHOT_SCRIPT,
  SESSION_WING_GOT_COOKED_SCRIPT,
  SESSION_WING_FOUL_TROUBLE_SCRIPT,
  SESSION_WING_COACH_YELLS_SCRIPT,
  SESSION_WING_BENCHED_SCRIPT,
  SESSION_WING_NERVOUS_SCRIPT,
  SESSION_WING_MISSED_FTS_SCRIPT,
  SESSION_WING_START_SLOW_SCRIPT,
  SESSION_WING_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball pregame hard-moment cells (FV-30) — Big (10; benched→fouled-out)
  SESSION_BIG_TURNOVER_SCRIPT,
  SESSION_BIG_MISSED_SHOT_SCRIPT,
  SESSION_BIG_GOT_COOKED_SCRIPT,
  SESSION_BIG_FOUL_TROUBLE_SCRIPT,
  SESSION_BIG_COACH_YELLS_SCRIPT,
  SESSION_BIG_FOULED_OUT_SCRIPT,
  SESSION_BIG_NERVOUS_SCRIPT,
  SESSION_BIG_MISSED_FTS_SCRIPT,
  SESSION_BIG_START_SLOW_SCRIPT,
  SESSION_BIG_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball VIZ clips (FV-115) — compositional clip-playlist architecture.
  // Audio rendering = FV-116. Resume-safe: existing files skipped by generator.
  CLIP_VIZ_GUARD_SCRIPT,
  CLIP_VIZ_WING_SCRIPT,
  CLIP_VIZ_BIG_SCRIPT,
  // Basketball HM clips (FV-115) — Guard (10)
  CLIP_HM_BB_GUARD_TURNOVER_SCRIPT,
  CLIP_HM_BB_GUARD_MISSED_SHOT_SCRIPT,
  CLIP_HM_BB_GUARD_GOT_COOKED_SCRIPT,
  CLIP_HM_BB_GUARD_FOUL_TROUBLE_SCRIPT,
  CLIP_HM_BB_GUARD_COACH_YELLS_SCRIPT,
  CLIP_HM_BB_GUARD_BENCHED_SCRIPT,
  CLIP_HM_BB_GUARD_NERVOUS_SCRIPT,
  CLIP_HM_BB_GUARD_MISSED_FTS_SCRIPT,
  CLIP_HM_BB_GUARD_START_SLOW_SCRIPT,
  CLIP_HM_BB_GUARD_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball HM clips (FV-115) — Wing (10)
  CLIP_HM_BB_WING_TURNOVER_SCRIPT,
  CLIP_HM_BB_WING_MISSED_SHOT_SCRIPT,
  CLIP_HM_BB_WING_GOT_COOKED_SCRIPT,
  CLIP_HM_BB_WING_FOUL_TROUBLE_SCRIPT,
  CLIP_HM_BB_WING_COACH_YELLS_SCRIPT,
  CLIP_HM_BB_WING_BENCHED_SCRIPT,
  CLIP_HM_BB_WING_NERVOUS_SCRIPT,
  CLIP_HM_BB_WING_MISSED_FTS_SCRIPT,
  CLIP_HM_BB_WING_START_SLOW_SCRIPT,
  CLIP_HM_BB_WING_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball HM clips (FV-115) — Big (10; benched slot → hm-bb-big-fouled-out)
  CLIP_HM_BB_BIG_TURNOVER_SCRIPT,
  CLIP_HM_BB_BIG_MISSED_SHOT_SCRIPT,
  CLIP_HM_BB_BIG_GOT_COOKED_SCRIPT,
  CLIP_HM_BB_BIG_FOUL_TROUBLE_SCRIPT,
  CLIP_HM_BB_BIG_COACH_YELLS_SCRIPT,
  CLIP_HM_BB_BIG_FOULED_OUT_SCRIPT,
  CLIP_HM_BB_BIG_NERVOUS_SCRIPT,
  CLIP_HM_BB_BIG_MISSED_FTS_SCRIPT,
  CLIP_HM_BB_BIG_START_SLOW_SCRIPT,
  CLIP_HM_BB_BIG_FALL_BEHIND_EARLY_SCRIPT,
  // Basketball personalization clips (FV-115) — anchors + self-talk
  CLIP_ANC_BOUNCE_BALL_TWICE_SCRIPT,
  CLIP_ANC_TAP_FLOOR_SCRIPT,
  CLIP_ANC_LOOK_AT_RIM_SCRIPT,
  CLIP_ST_BB_01_SCRIPT,
  // Pre-practice focus — hockey "Talk every shift" (FV-121)
  CLIP_PP_FOCUS_TALK_EVERY_SHIFT_SCRIPT,
  // Pre-practice + pregame prayer clips (sport-neutral, Issue 1)
  CLIP_SHARED_PRAYER_SELFGUIDED_SCRIPT,
  CLIP_PP_PRAYER_SCRIPT,
  CLIP_PP_PRAYER_SELFGUIDED_SCRIPT,
];
