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
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Helmet on. Go compete. Play from victory.",
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
// Identical to pp-see-it-go except closer: "Lace 'em up." (was "Helmet on.")
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
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Lace 'em up. Go compete. Play from victory.",
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

// ── Ordered list of TTS clip scripts (no openers — they are loudnorm-passed) ──
//
// Phase 2 ordering: shared structural → VIZ × 3 positions → HM × 30 cells
// (hm-forward-nervous first for backward compatibility with P1) → CLOSING.
export const CLIP_SCRIPTS: AudioScript[] = [
  // Shared structural
  CLIP_SHARED_OPENING_SCRIPT,
  // VIZ — all 3 positions
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
];
