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
      text: "Speak the truth. You missed the puck. It is not your identity. Reset and go again.",
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

// ── Pre-practice "Get To" clips (generic, no per-position/need tree) ─────────
//
// Five sequential beats that form a single ~2-min pre-practice primer.
// Registered in manifest.json under the top-level "practice" key:
//   { "clips": ["pp-settle-receive","pp-name-standard","pp-goal-fusion",
//               "pp-choose-focus","pp-see-it-go"] }
// The practice screen is a simple player — no phase-synced reveals in v1,
// so phases: [] on all five catalog entries.
//
// Beat 1 (pp-settle-receive) uses a Mentor/Devotional register — the faith
// anchor lands here ("you don't have to practice; you get to"). Beats 2-5
// are Coach register — direct, drilled, no warmth-bleed.

// Mentor / devotional blend for beat 1 — warm, present, gospel-grounded.
const PP_MENTOR_DEVOTIONAL_INSTRUCTIONS = `Voice Affect: Calm, grounded mentor with a devotional undertone — warm and personal, not preacher-loud, not meditation-app soft. Speaking directly into the athlete's ear before a session.

Tone: Sincere and settled. The voice knows the gospel anchor it is delivering and speaks with the ease of someone who has stood on this ground before.

Pacing: Unhurried. The opening "Stay here a second" is a full stop, not a setup. The identity statement "you are already loved" is not rushed. The closing pivot from "have to" to "get to" has its own beat.

Emotion: Quiet joy with conviction. Not heavy, not sentimental. The gospel is settled news, not a sell.

Pronunciation: "Helmet's not on yet" lands conversationally. "Already loved. Fully. Today." — each word is its own sentence in delivery weight. "You get to." ends with a quiet, confident close, not an upswing.

Pauses: A clear beat after "One breath." Give the athlete a moment in the silence. Another beat after "In... and out." before moving into the identity statement. The three-beat staccato — "Already loved. Fully. Today." — needs space between each word.`;

// Coach register for beats 2-5 — direct, drilled, no warmth-bleed.
const PP_COACH_INSTRUCTIONS = `Voice Affect: Coach voice — direct, steady, assured. Not a hype coach, not a preacher. The voice of someone who has run this room a hundred times and means every word.

Tone: Confident and purposeful. No warmth-bleed from the devotional register. This is the voice that knows the move and is calling it.

Pacing: Deliberate. Short declarative sentences land clean. Longer sentences move at a good coaching pace — not rushed, not slow. Key phrases get their own breath.

Emotion: Steady confidence. The athlete is being coached, not comforted. Honest without being harsh.

Pronunciation: "Your body keeps the receipts." — plain and final. "Full reps. Full compete. No coasting." — each cue distinct. "That is the playoff shift." and "That is overtime." — delivered with quiet weight, not hype. "Play from victory." closes with grounded finality.

Pauses: A beat between each coaching declaration. "Not someday. Right now." — a clear pause between the two. The send-off line "Helmet on. Go compete. Play from victory." — each clause its own breath.`;

export const CLIP_PP_SETTLE_RECEIVE_SCRIPT: AudioScript = {
  slug: "pp-settle-receive",
  voice: "ash",
  instructions: PP_MENTOR_DEVOTIONAL_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Helmet's not on yet. Stay here a second.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "One breath. In... and out.",
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Before you skate, hear this: you're not stepping on the ice to earn anything. Your worth was settled a long time ago — at a cross, not at center ice.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You're already loved. So you don't have to practice. You get to.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Here's the truth most players never learn: you don't rise to the big game. You sink to your training.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "How you practice is how you play.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "Every rep you take at half-speed is a rep you'll take at half-speed when it counts. Your body keeps the receipts.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "So the bar today is simple. Full reps. Full compete. No coasting.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now here's the move.",
    },
    { type: "silence", durationSec: 0.5 },
    {
      type: "speech",
      text: "That drill you've done a thousand times — the boring one nobody's watching? You're not getting through it. You're rehearsing the moment you dream about, early, while it's quiet.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "That battle in the corner — that is the playoff shift.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "Treat it like the Super Bowl today, and when the real one comes, it's just another shift.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "This isn't about the perfect rep — it's about the full one. Pour everything in, because nothing out there can touch who you already are.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_CHOOSE_FOCUS_SCRIPT: AudioScript = {
  slug: "pp-choose-focus",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You picked your one focus today. That's your throttle.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "Not something to fix when it goes wrong — something to drive, from the first whistle.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "Every drill, every line, every race to the puck, you bring it. Lock it in.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 0.95,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one rep. You, at full compete, your focus locked in, nothing left on the bench.",
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "And when a rep goes bad — because some will — that's information, not a verdict. Read it, drop it, next rep.",
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "You're not skating to prove who you are. You already know.",
    },
    { type: "silence", durationSec: 0.5 },
    {
      type: "speech",
      text: "Helmet on. Go compete. Play from victory.",
    },
    { type: "silence", durationSec: 0.5 },
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
  // Pre-practice "Get To" session clips (generic, ~2 min).
  // Resume-safe: existing files in clips/ are skipped.
  CLIP_PP_SETTLE_RECEIVE_SCRIPT,
  CLIP_PP_NAME_STANDARD_SCRIPT,
  CLIP_PP_GOAL_FUSION_SCRIPT,
  CLIP_PP_CHOOSE_FOCUS_SCRIPT,
  CLIP_PP_SEE_IT_GO_SCRIPT,
];
