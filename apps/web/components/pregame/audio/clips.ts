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
import { CLIP_LOUDNORM_FILTER } from "./loudnorm.ts";
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

// FV-136: 52 discrete positive-play viz clips (one per scenario in §1 of md)
import { VIZ_CLIP_SCRIPTS } from "./clips-viz.ts";
import { BASEBALL_PREGAME_CLIP_SCRIPTS } from "./clips-baseball.ts";
import { GOLF_PREGAME_CLIP_SCRIPTS } from "./clips-golf.ts";
// FV-294: 21 golf positive-play viz clips + st-glf-02 self-talk
import { GOLF_VIZ_CLIP_SCRIPTS } from "./clips-viz-golf.ts";
import { FOOTBALL_PREGAME_CLIP_SCRIPTS } from "./clips-football.ts";
import { FOOTBALL_VIZ_CLIP_SCRIPTS } from "./clips-viz-football.ts";
import { SWIMMING_PREGAME_CLIP_SCRIPTS } from "./clips-swimming.ts";
import { TRACKFIELD_PREGAME_CLIP_SCRIPTS } from "./clips-trackfield.ts";
import { LACROSSE_PREGAME_CLIP_SCRIPTS } from "./clips-lacrosse.ts";

// The EBU R128 loudness normalization filter applied to every clip.
// -16 LUFS integrated / -1.5 dBTP true-peak / LRA 11 LU.
// To re-pass at a different target, change the I= value in loudnorm.ts and regenerate.
// -14 LUFS = I=-14   (louder, matches streaming platforms)
// -18 LUFS = I=-18   (quieter, headroom for mixing)
export { CLIP_LOUDNORM_FILTER } from "./loudnorm.ts";

// ── Shared structural clips ──────────────────────────────────────────────────

export const CLIP_SHARED_OPENING_SCRIPT: AudioScript = {
  slug: "shared-opening",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...OPENING],
};

// ── VIZ clips — one per position ─────────────────────────────────────────────

export const CLIP_VIZ_FORWARD_SCRIPT: AudioScript = {
  slug: "viz-forward",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...FORWARD_VIZ],
};

export const CLIP_VIZ_DEFENSE_SCRIPT: AudioScript = {
  slug: "viz-defense",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...DEFENSE_VIZ],
};

export const CLIP_VIZ_GOALIE_SCRIPT: AudioScript = {
  slug: "viz-goalie",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are on the bench before the first shift. Your hands feel light. Your legs feel shaky. Your heart is up in your throat.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes keep jumping to the ice. Your stick feels light in your hands. The thought hits: I'm not ready for this.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "These nerves are energy, not danger. Let them sharpen you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "First shift, move your feet, get to the wall, and touch the game early.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are alone in the slot. The pass finds your tape. You shoot. It rings off the post.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your stick feels heavy for a second. Your eyes follow the puck away from the net. The thought hits: I should have finished that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That chance is over. The next puck is still yours.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Stay dangerous. Get back to the slot, show your stick, and be ready for the next look.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-forward-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You get the puck on the wall and try to force it through the middle. It hits a stick. The other team turns it back the other way.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your shoulders tighten. You glance toward the bench. The thought hits: Coach is going to cut my minutes.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Get back into the play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, move your feet, use the wall, and make the strong simple play.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_BEATEN_WIDE_SCRIPT: AudioScript = {
  slug: "hm-forward-beaten-wide",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are backchecking through the neutral zone. The winger has the puck and a step. You reach. He goes by you on the outside.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your lungs are burning. Your stick reaches instead of your feet. The thought hits: I let him skate past me.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That rush is over. Get your feet moving again.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next backcheck, take the inside lane, match his speed, and finish through the puck.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-forward-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are chasing the play. You reach with your stick. The whistle blows. The ref points at you. Two minutes.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your stick feels too far from your body. Your feet are late. The thought hits: I gave them a power play.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The whistle happened. Learn from it, then compete clean.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, move your feet, get body position, and keep your stick down.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-forward-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You come back to the bench. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight jaw. Heat in your chest. He is going to bury me.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "That correction is over. Take what helps and come back to now.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "The volume is not the verdict. Take the correction, keep your feet moving, and answer with your next shift.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-forward-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Two shifts go by. Then three. The line goes out without you. You sit on the bench. Your name never gets called.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your legs feel ready but trapped. The thought hits: He does not trust me out there.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The bench has your body for a stretch. It does not have your mind.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Stay loud, watch the pace, and be ready to bring energy when the door opens.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-forward-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are on the wall. You do not see him coming. He finishes his check. You hit the boards hard. The puck is gone.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "The air leaves your chest. Your shoulder stings. The thought hits: I got caught on the wall.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That hit is over. Get your breath back and return to the next battle.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next wall play, check early, protect the puck, and make the strong play.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-forward-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. You have not touched the puck cleanly. Your legs feel a step behind. Nothing is coming easy.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight grip on the stick. Shoulders up. I am not in this game.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "The slow start is over. Build the game from this next shift.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Loose hands. Simple plays. Let the game come to you.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Speak the truth. You do not need to chase the game. Let it come to you. Win one wall battle, finish a check, make one simple play, and build from there.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_FORWARD_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-forward-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck is in your net. The other team celebrates. You skate back to the bench while the rink gets loud.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You glance toward the bench. The thought hits: Coach is going to cut my minutes.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That goal is over. The game is still in front of you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, move your feet, get on the forecheck, and help turn the momentum back.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are back in your zone. The puck carrier comes wide. He has speed. You lose the angle. He has a step on you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your feet feel heavy for a second. Your hips are turned. The thought hits: I gave him the lane.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "He won that rush. He does not own the next one.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-defense-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You retrieve the puck behind your net. You try to make the pass through the slot. It hits a stick. The other team has it in front. They take a wide open shot",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes snap to your goalie. Your chest tightens fast. Your head drops.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Get back into structure.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next breakout, shoulder-check first, choose the simple play, and move it strong.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "hm-defense-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You walk the blue line. The lane opens. You step in and shoot. It misses the net wide.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your stick feels tight in your hands. Your eyes follow the puck around the glass. The thought hits: Coach will be pissed.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That shot is over. The next puck can still get through.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next look, head up, shoot for a stick, a pad, or the open lane.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-defense-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck carrier cuts inside. You bring your stick up. The whistle blows. The ref points at you. Two minutes.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heat in your face. Tight in your chest. You think, I just put us down a man.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The whistle happened. Learn from it, then compete clean.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, trust your feet. Hold your gap. Stick down.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-defense-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You come off the ice. The coach is loud. Sharp. Maybe your name. Maybe not. The whole bench can hear it.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your jaw locks. Your eyes drop toward the floor. The thought hits: He does not trust me back there.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The volume is not the verdict. Take the correction. Leave the shame.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, play steady — feet set, gap tight, first pass simple.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-defense-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Your partner goes out with someone else. Then again. You sit on the bench. The door does not open.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You listen to the coach call out the pairings. Your legs feel ready but stuck. The thought hits: He does not trust me back there.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The bench has your body for a shift. It does not have your mind.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Stay in the game. Watch the forecheck, talk to your partner, and be ready when the door opens.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-defense-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are on the bench before the first shift. Your legs feel heavy. Your hands feel light. Your heart is up in your throat.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes keep finding the other team’s rushers. Your hands tighten on the stick. You're watching the puck and you chase and you're late and you get beat.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "These nerves are energy, not danger. Let them sharpen you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Skate loose, finish a check and make a hit. hold the middle.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-defense-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are back for the puck. You do not see him coming. He finishes his check. You hit the boards hard. The puck is gone.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "The air leaves your chest. Your shoulder stings. The thought hits: I should have checked first.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That hit is over. Get your breath back and return to the next puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next retrieval, check early, protect the puck, and make the strong first play.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-defense-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. Your gap has been late. Your passes have been off. Nothing is coming easy.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your hands squeeze the stick. Your shoulders ride high. The thought hits: I am chasing the game right now.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The slow start is over. Build the game from this next shift.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Shoulder check, finish your checks, hold your gap. Make the first simple pass.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_DEFENSE_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-defense-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck goes in behind your goalie. The other bench celebrates. The horn sounds. You skate back to center ice.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your shoulders pull tight. Your eyes go back to the net. The thought hits: We let that one get through.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That goal is over. It does not get the next shift.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shift, stay loose, hold your gap, and make the first simple play.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "A goal goes in. The whistle blows. You hear your coach from the bench. Loud. Sharp. Maybe your name. Maybe not. The whole rink can hear it.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your mask feels hot. Your eyes stay on the crease. The thought hits: Everyone is looking at me.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The volume is not the verdict. Take what helps. Let the rest pass.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shot, set your depth, quiet your hands, and meet the puck square.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-goalie-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are behind the net with the puck. You try to move it up the wall. It hits a forechecker’s stick. The other team has it on top of your crease.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes snap back to the front of the net. Your chest tightens fast. The thought hits: I just handed them a chance.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Get set and find the puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next play, decide early — move it strong or leave it for your defenseman.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "hm-goalie-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The first shot comes through traffic. You make the save, but the rebound kicks out. You push across, reach for the second shot, and it slips past you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your pad feels late getting across. Your eyes follow the puck into the net. The thought hits: I almost had the second one.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That rebound is over. Reset your crease and come back to the next shot.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next rebound, track it first, push under control, and arrive square.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_SOFT_GOAL_SCRIPT: AudioScript = {
  slug: "hm-goalie-soft-goal",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The shot comes from the outside. You see it the whole way. It should be routine. It slips through, and the puck is in the back of the net.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your glove feels heavy. Your eyes go back into the net. The thought hits: I should have had that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That goal is over. Settle your crease and come back to the next shot.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next puck, track it all the way in, stay quiet, and make the simple save.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_BAD_PENALTY_SCRIPT: AudioScript = {
  slug: "hm-goalie-bad-penalty",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck is loose near your crease. You reach with your stick as the player cuts across. He goes down. The whistle blows. The ref points at you. Two minutes for tripping.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your stick feels caught out in front of you. Your chest tightens. The thought hits: I just put them on the power play.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The whistle is over. Settle your crease and get ready for the next shot.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "On the kill, stay patient, trust your reads, and meet the puck square.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

// Special slug: Goalie × "I get benched." → hm-goalie-pulled
// (a goalie isn't "benched," they're "pulled" — matches session-goalie-pulled.ts)
export const CLIP_HM_GOALIE_PULLED_SCRIPT: AudioScript = {
  slug: "hm-goalie-pulled",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The coach taps your backup. You skate to the bench. You sit at the end. The game keeps going without you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your mask feels heavy in your hands. Your eyes stay on the crease. The thought hits: He gave up on me.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The bench has your body for now. It does not have your worth.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Stay present, support your teammate, and keep your mind in the game.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-goalie-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are in your crease before the puck drops. Your hands feel light. Your chest feels tight. Your heart is up in your throat.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes keep finding the shooters in warmups. Your shoulders ride high. The thought hits: I am not ready for this.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "These nerves are energy, not danger. Let them sharpen you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "First shot, set your depth, quiet your hands, and track it all the way in.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_GET_HIT_SCRIPT: AudioScript = {
  slug: "hm-goalie-get-hit",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "There is traffic in your crease. A body comes through. You take the contact. You lose the puck.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your chest tightens under the pads. Your eyes search for the puck. The thought hits: I am going to get run again.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That contact is over. Get set and find the puck again.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next screen, hold your ground, stay big, and track through the traffic.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-goalie-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First period is half over. The puck has felt small. You have been late on a shot or two. Nothing is coming easy.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your glove hand feels tight. Your shoulders ride high. The thought hits: I am fighting the puck right now.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The slow start is over. Build the game from this next shot.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Set your depth, quiet your hands, and track the puck all the way in.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_GOALIE_FIRST_GOAL_AGAINST_SCRIPT: AudioScript = {
  slug: "hm-goalie-first-goal-against",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The puck is in the back of your net. The other team celebrates behind you. You fish it out of the mesh. You skate to the top of your crease.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your mask feels hot. Your eyes follow the puck out of the net. The thought hits: First one is on me.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That goal is over. The game is still in front of you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next shot, set your depth, stay patient, and track it all the way in.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

// ── Shared CLOSING clips ──────────────────────────────────────────────────────

export const CLIP_SHARED_RESET_PLAN_SCRIPT: AudioScript = {
  slug: "shared-reset-plan",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...RESET_PLAN_SEGMENTS],
};

export const CLIP_SHARED_PRAYER_SCRIPT: AudioScript = {
  slug: "shared-prayer",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...PRAYER_SEGMENTS],
};

export const CLIP_SHARED_SENDOFF_SCRIPT: AudioScript = {
  slug: "shared-sendoff",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
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

// ── Anchor clips (6 — "Say cue word" intentionally absent per KC's call) ───

export const CLIP_ANC_LONG_EXHALE_SCRIPT: AudioScript = {
  slug: "anc-long-exhale",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Long exhale." },
  ],
};

export const CLIP_ANC_TAP_STICK_TWICE_SCRIPT: AudioScript = {
  slug: "anc-tap-stick-twice",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Tap your stick twice." },
  ],
};

export const CLIP_ANC_TOUCH_GLOVE_SCRIPT: AudioScript = {
  slug: "anc-touch-glove",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Touch your glove." },
  ],
};

export const CLIP_ANC_PRESS_THUMB_TO_PALM_SCRIPT: AudioScript = {
  slug: "anc-press-thumb-to-palm",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Press your thumb to your palm." },
  ],
};

export const CLIP_ANC_LOOK_AT_TAPE_SCRIPT: AudioScript = {
  slug: "anc-look-at-tape",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Look at your tape." },
  ],
};

// Hockey, all positions — the bench-bottle reset (KC's call). Universal across
// forward / defense / goalie; everyone has a bottle on the bench rail or net.
export const CLIP_ANC_TAKE_A_DRINK_SCRIPT: AudioScript = {
  slug: "anc-take-a-drink",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Take a drink from your bottle." },
  ],
};

// ── Self-talk clips (7) ───────────────────────────────────────────────────────
// Exact text mirrors SELF_TALK_OPTIONS from types.ts (straight apostrophes).

export const CLIP_ST_01_SCRIPT: AudioScript = {
  slug: "st-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next shift." },
  ],
};

export const CLIP_ST_02_SCRIPT: AudioScript = {
  slug: "st-02",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Breathe. Do your job." },
  ],
};

export const CLIP_ST_03_SCRIPT: AudioScript = {
  slug: "st-03",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Stay steady. Make the next play." },
  ],
};

export const CLIP_ST_04_SCRIPT: AudioScript = {
  slug: "st-04",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You don't need to do too much." },
  ],
};

export const CLIP_ST_05_SCRIPT: AudioScript = {
  slug: "st-05",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Compete, recover, go again." },
  ],
};

export const CLIP_ST_06_SCRIPT: AudioScript = {
  slug: "st-06",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Your identity is secure. Play free." },
  ],
};

export const CLIP_ST_07_SCRIPT: AudioScript = {
  slug: "st-07",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You are secure. Take the next faithful action." },
  ],
};

// ── Cue word clips — reset register (10 words × 2 registers = 20 clips) ──────
// Reset: grounding, quiet. Sendoff: forward-moving, steady.
// Base slug per word is used by the resolver; "-reset" / "-sendoff" appended.

export const CLIP_CW_STEADY_RESET_SCRIPT: AudioScript = { slug: "cw-steady-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Steady." }] };
export const CLIP_CW_STEADY_SENDOFF_SCRIPT: AudioScript = { slug: "cw-steady-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Steady." }] };

export const CLIP_CW_COURAGE_RESET_SCRIPT: AudioScript = { slug: "cw-courage-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Courage." }] };
export const CLIP_CW_COURAGE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-courage-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Courage." }] };

export const CLIP_CW_SIMPLE_RESET_SCRIPT: AudioScript = { slug: "cw-simple-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Simple." }] };
export const CLIP_CW_SIMPLE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-simple-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Simple." }] };

export const CLIP_CW_ATTACK_RESET_SCRIPT: AudioScript = { slug: "cw-attack-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Attack." }] };
export const CLIP_CW_ATTACK_SENDOFF_SCRIPT: AudioScript = { slug: "cw-attack-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Attack." }] };

export const CLIP_CW_NEXT_RESET_SCRIPT: AudioScript = { slug: "cw-next-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Next." }] };
export const CLIP_CW_NEXT_SENDOFF_SCRIPT: AudioScript = { slug: "cw-next-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Next." }] };

export const CLIP_CW_SERVE_RESET_SCRIPT: AudioScript = { slug: "cw-serve-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Serve." }] };
export const CLIP_CW_SERVE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-serve-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Serve." }] };

export const CLIP_CW_COMPETE_RESET_SCRIPT: AudioScript = { slug: "cw-compete-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Compete." }] };
export const CLIP_CW_COMPETE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-compete-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Compete." }] };

export const CLIP_CW_FAITHFUL_RESET_SCRIPT: AudioScript = { slug: "cw-faithful-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Faithful." }] };
export const CLIP_CW_FAITHFUL_SENDOFF_SCRIPT: AudioScript = { slug: "cw-faithful-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Faithful." }] };

export const CLIP_CW_FREE_RESET_SCRIPT: AudioScript = { slug: "cw-free-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Free." }] };
export const CLIP_CW_FREE_SENDOFF_SCRIPT: AudioScript = { slug: "cw-free-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Free." }] };

export const CLIP_CW_RELENTLESS_RESET_SCRIPT: AudioScript = { slug: "cw-relentless-reset", voice: "ash", instructions: CUE_WORD_RESET_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Relentless." }] };
export const CLIP_CW_RELENTLESS_SENDOFF_SCRIPT: AudioScript = { slug: "cw-relentless-sendoff", voice: "ash", instructions: CUE_WORD_SENDOFF_INSTRUCTIONS, speed: 1.1, postFilter: CLIP_LOUDNORM_FILTER, segments: [{ type: "speech", text: "Relentless." }] };

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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Before you step in, remember where you stand. Christ has already spoken for you.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "You are loved, held, and sent — before the first whistle, before the first touch, before anything goes right or wrong.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So compete like someone who has been set free.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Not reckless. Not careless. Free.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Free to play hard. Free to take the open chance. Free to recover when something breaks down. Free to give your whole effort without handing your worth to the result.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Step in with courage.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Play the game in front of you.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Christ has already won the victory you needed most.",
    },
  ],
};

// ── OPENER A Variation 2 — pp-opener-dialed-in-2 ─────────────────────────────
export const CLIP_PP_OPENER_DIALED_IN_2_SCRIPT: AudioScript = {
  slug: "pp-opener-dialed-in-2",
  voice: "ash",
  instructions: PRACTICE_SETTLE_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Before you start, settle this.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "You do not have to earn anyone's approval today.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Not the coach's. Not the crowd's. Not your teammates'. Not even your own.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "In Christ, your worth is already secure. Not because you performed. Not because you proved yourself. Because Jesus has already won what you could never earn.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So put down the weight of proving who you are.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Play for Him — not to make Him love you, but because He already does.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "That is what makes you free.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Free to compete with courage. Free to make a mistake and come back. Free to give everything without fear deciding how far you go.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So step in.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "No holding back. No playing small. No carrying the last play.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Give everything you have.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Play from victory.",
    },
  ],
};

// ── OPENER A Variation 3 — pp-opener-dialed-in-3 ─────────────────────────────
export const CLIP_PP_OPENER_DIALED_IN_3_SCRIPT: AudioScript = {
  slug: "pp-opener-dialed-in-3",
  voice: "ash",
  instructions: PRACTICE_SETTLE_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Take a breath.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "You get to do this today.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "A body that can move. A game you love. A chance to compete, serve, and lay it all down.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "That is a gift.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Do not spend it protecting comfort.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Bring the whole thing to God — your effort, your nerves, your joy, your edge. He already knows what you are worth. He already called you loved before you laced up.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "So you are not performing for approval.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "You are free.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "And free does not mean casual.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Free means full.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Full speed. Full heart. Full compete.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Not half-speed to avoid a mistake. Not playing small to look composed. Not holding something back so failure hurts less.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Step in grateful.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Compete with courage.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Empty the tank.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "First rep, all of it.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "Now go.",
    },
  ],
};

// ── OPENER B — pp-opener-get-to ───────────────────────────────────────────────
export const CLIP_PP_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You showed up on a day you did not feel like it.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That matters.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do not wait for the feeling to lead.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Move first.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "First stride. First battle. First puck.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Let your body wake up while you work.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "God is not asking you to fake energy. Bring faithful effort with what you have today.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "A body that can move. A game you love. A chance to get better.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Start small.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Win the first drill.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Feet moving. Stick down. First to the puck.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "First rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Go.",
    },
  ],
};

// ── SHARED Beat 2 — pp-name-standard ─────────────────────────────────────────
export const CLIP_PP_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Today, every rep has a purpose.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Skate it like it matters. Handle the puck like it matters. Make the habit real.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "No wasted reps.",
    },
  ],
};

// ── SHARED Beat 3 — pp-goal-fusion ────────────────────────────────────────────
export const CLIP_PP_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "The standard today is simple.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Game-speed reps. Clean habits. No coasting.",
    },
  ],
};

// ── SHARED Beat 4 — focus injection (lead + focus clips + tail) ───────────────

export const CLIP_PP_CHOOSE_FOCUS_LEAD_SCRIPT: AudioScript = {
  slug: "pp-choose-focus-lead",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You chose the word you want to carry into this practice. Let it set the tone.",
    },
    { type: "silence", durationSec: 0.5 },
  ],
};

export const CLIP_PP_CHOOSE_FOCUS_TAIL_SCRIPT: AudioScript = {
  slug: "pp-choose-focus-tail",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "silence", durationSec: 0.5 },
    {
      type: "speech",
      text: "Bring it from the start. Let that word shape the way you compete.",
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Relentless." },
  ],
};

export const CLIP_PP_FOCUS_HUNGRY_SCRIPT: AudioScript = {
  slug: "pp-focus-hungry",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hungry." },
  ],
};

export const CLIP_PP_FOCUS_HEAD_UP_EVERY_BREAKOUT_SCRIPT: AudioScript = {
  slug: "pp-focus-head-up-every-breakout",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Head up every breakout." },
  ],
};

export const CLIP_PP_FOCUS_FEET_ALWAYS_MOVING_SCRIPT: AudioScript = {
  slug: "pp-focus-feet-always-moving",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Feet always moving." },
  ],
};

export const CLIP_PP_FOCUS_HARD_FIRST_PASS_SCRIPT: AudioScript = {
  slug: "pp-focus-hard-first-pass",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hard first pass." },
  ],
};

export const CLIP_PP_FOCUS_WIN_EVERY_RACE_SCRIPT: AudioScript = {
  slug: "pp-focus-win-every-race-to-the-puck",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Win every race to the puck." },
  ],
};

export const CLIP_PP_FOCUS_FULL_REPS_NO_GLIDE_SCRIPT: AudioScript = {
  slug: "pp-focus-full-reps-no-glide",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Full reps, no glide." },
  ],
};

// ── SHARED Beat 5 — pp-be-vocal ───────────────────────────────────────────────
export const CLIP_PP_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "pp-be-vocal",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Talking is part of competing.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Call \"man on.\" Call \"time.\" Call support.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You are free to speak.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Be loud early. Help your team play faster.",
    },
  ],
};

// ── SHARED Beat 6 — pp-see-it-go ─────────────────────────────────────────────
// Terminal send-off removed — the pre-practice session ends on the prayer clip
// that follows this beat.
export const CLIP_PP_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "First stride. Stick down. Finish through the puck.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "If it goes bad, read it, drop it, and go again.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Next rep.",
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
export const CLIP_PP_BB_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-bb-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You showed up on a day you did not feel like it.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That matters.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do not wait for the feeling to lead.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Move first.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Talk on defense. Sprint through the rep. Let your body wake up while you work.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Whatever you do, do it with everything — for the Lord, not for a mood.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "God is not asking you to fake energy. Bring faithful effort with what you have today.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "A body that can move. A ball in your hands. A game you love. A chance to get better.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Start small.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Win the first drill.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "First rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Go.",
    },
  ],
};

// ── Basketball Beat 2 — pp-bb-name-standard ───────────────────────────────────
export const CLIP_PP_BB_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-bb-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "The standard today is simple.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Game-speed reps. Clean footwork. No drifting.",
    },
  ],
};

// ── Basketball Beat 3 — pp-bb-goal-fusion ─────────────────────────────────────
export const CLIP_PP_BB_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-bb-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "The simple reps are not filler.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Closeouts. Loose balls. Footwork. Finishes.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do them full now, so they are there when it counts.",
    },
  ],
};

// ── Basketball Beat 5 — pp-bb-be-vocal ────────────────────────────────────────
export const CLIP_PP_BB_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "pp-bb-be-vocal",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Talking is part of competing.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Call the ball. Call the screen. Call the help.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You do not have to stay quiet to protect how you look.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You are free to speak.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So be loud early.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Let your voice bring energy, clarity, and confidence to the floor.",
    },
  ],
};

// ── Basketball Beat 6 — pp-bb-see-it-go ──────────────────────────────────────
// Terminal send-off removed — the pre-practice session ends on the prayer clip
// that follows this beat.
export const CLIP_PP_BB_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-bb-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one rep.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Game speed. Clean feet. Full focus.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "If it goes bad, learn fast and drop it.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Next rep.",
    },
  ],
};

// ── Basketball focus clips — 7 declarations (pp-bb-focus-*) ───────────────────

export const CLIP_PP_BB_FOCUS_RELENTLESS_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-relentless",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Relentless." },
  ],
};

export const CLIP_PP_BB_FOCUS_HUNGRY_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-hungry",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hungry." },
  ],
};

export const CLIP_PP_BB_FOCUS_TALK_EVERY_POSSESSION_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-talk-every-possession",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Talk every possession." },
  ],
};

export const CLIP_PP_BB_FOCUS_GUARD_YOUR_YARD_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-guard-your-yard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Guard your yard." },
  ],
};

export const CLIP_PP_BB_FOCUS_HIT_THE_GLASS_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-hit-the-glass",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Hit the glass." },
  ],
};

export const CLIP_PP_BB_FOCUS_SPRINT_EVERY_TRANSITION_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-sprint-every-transition",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Sprint every transition." },
  ],
};

export const CLIP_PP_BB_FOCUS_BOX_OUT_EVERY_SHOT_SCRIPT: AudioScript = {
  slug: "pp-bb-focus-box-out-every-shot",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Box out every shot." },
  ],
};

// ── Baseball pre-practice "Lock In" clips (FV-220) ───────────────────────────
//
// 1:1 vocab swaps onto the approved hockey/basketball pre-practice structure
// (per the basketball FV-30 precedent: no new reframe — sports-psych gate not
// needed). Swaps: shift/possession → at-bat/rep/inning; loose ball/contested
// rebound/closeout → the ground ball in the hole / the backhand pick / the
// two-strike at-bat; on-court calls → "I got it"/"two"/"cut two"/"back".
// Audio rendering + manifest.practiceState.baseball tail = FV-95. Until then the
// baseball practice tail fails open to the text timer in resolvePracticePlaylist.

// ── Baseball OPENER B — pp-baseball-opener-get-to ────────────────────────────
export const CLIP_PP_BASEBALL_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-baseball-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 1.1,
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
      text: "So don't try to fix the whole practice. Just win the first round in the cage. First ten minutes, full — feet moving, first to every ground ball.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "First rep. Go.",
    },
  ],
};

// ── Baseball Beat 2 — pp-baseball-name-standard ──────────────────────────────
export const CLIP_PP_BASEBALL_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-baseball-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Whatever you do here is what shows up when it's tight. The rep you give now is the at-bat you'll have with the game on the line. Your hands don't know the difference between a drill and the bottom of the seventh.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So the bar today is simple. Full reps. Full compete. No coasting.",
    },
  ],
};

// ── Baseball Beat 3 — pp-baseball-goal-fusion (Duckworth goal-fusion) ─────────
export const CLIP_PP_BASEBALL_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-baseball-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "That drill you've run a thousand times — the boring one, nobody watching — you're not getting it over with. You're rehearsing the at-bat you actually want, early, while it's quiet.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That ground ball in the hole, that backhand pick, that two-strike at-bat you'd rather skip — that's the one that decides a playoff game. Win it now, at practice, full every time, and the one with everything on the line is just one you've already done.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Not the perfect rep. The full one. That's all today asks.",
    },
  ],
};

// ── Baseball Beat 5 — pp-baseball-be-vocal ───────────────────────────────────
export const CLIP_PP_BASEBALL_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "pp-baseball-be-vocal",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "One more thing nobody says out loud. Out there, talking is competing — calling for the ball, 'I got it,' 'two,' 'four's the play,' 'back' on the runner. Coaches notice who talks. But most players go quiet — not because they don't know the call. Because being loud feels like drawing eyes, sounding dumb, looking like you're trying too hard.",
    },
    { type: "silence", durationSec: 1.2 },
    {
      type: "speech",
      text: "That's the same trap. Going quiet is protecting how you look — and you already settled that. What they think of you isn't the scoreboard you're playing to.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "So talk. 'I'm here.' 'One out.' 'I got it.' Be the loud one. The players who run the field with their voice — call the cutoff, call the situation, talk every pitch — they're the ones coaches build around and hand the team to. Not because they asked for it. Because they were already doing the job.",
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Quiet's the easy hide. Don't take it.",
    },
  ],
};

// ── Baseball Beat 6 — pp-baseball-see-it-go ──────────────────────────────────
// Terminal send-off removed — the pre-practice session ends on the prayer clip
// that follows this beat (mirrors hockey/basketball).
export const CLIP_PP_BASEBALL_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-baseball-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
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
      text: "You're not out here to prove who you are. You already know.",
    },
  ],
};

// ── Baseball pre-practice focus presets — pp-baseball-focus-* ─────────────────
// Single-phrase clips; slugs match BASEBALL_CONFIG.practiceFocusSlugs (FV-94).

export const CLIP_PP_BASEBALL_FOCUS_RELENTLESS_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-relentless",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Relentless." }],
};

export const CLIP_PP_BASEBALL_FOCUS_HUNGRY_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-hungry",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Hungry." }],
};

export const CLIP_PP_BASEBALL_FOCUS_STAY_IN_THE_BOX_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-stay-in-the-box",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Stay in the box." }],
};

export const CLIP_PP_BASEBALL_FOCUS_READ_THE_PITCH_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-read-the-pitch",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Read the pitch." }],
};

export const CLIP_PP_BASEBALL_FOCUS_SOFT_HANDS_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-soft-hands",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Soft hands." }],
};

export const CLIP_PP_BASEBALL_FOCUS_QUICK_FEET_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-quick-feet",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Quick feet." }],
};

export const CLIP_PP_BASEBALL_FOCUS_ONE_PITCH_AT_A_TIME_SCRIPT: AudioScript = {
  slug: "pp-baseball-focus-one-pitch-at-a-time",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "One pitch at a time." }],
};

// ── Golf pre-practice "Lock In" clips (FV-267) ───────────────────────────────
//
// 1:1 vocab swaps onto the approved hockey/basketball/baseball pre-practice
// structure (per the basketball FV-30 precedent: no new reframe — sports-psych
// gate not needed). Golf is INDIVIDUAL: no teammates, no calling plays, no
// "talk every rep" — so baseball's "be-vocal" communication beat is replaced by
// a routine-discipline beat (pp-golf-full-routine), the cleaner practice-room →
// competition transfer for a self-accountable sport. Swaps: cage / ground ball /
// at-bat → range / bucket / shot; the bottom of the seventh → the 18th tee with
// a number on the line; "I got it" / "two" / "back" → the full pre-shot routine
// on every ball. No yips / shank language (clinically gated, withheld). Audio
// rendering + manifest.practiceState.golf tail = FV-266. Until then the golf
// practice tail fails open to the text timer in resolvePracticePlaylist.

// ── Golf OPENER B — pp-golf-opener-get-to ────────────────────────────────────
export const CLIP_PP_GOLF_OPENER_GET_TO_SCRIPT: AudioScript = {
  slug: "pp-golf-opener-get-to",
  voice: "ash",
  instructions: PRACTICE_GET_TO_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "You showed up on a day you did not feel like it.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That matters.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do not wait for the feeling to lead.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Start with one clear target.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Go through the routine.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Make one committed swing.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Let your body and mind wake up while you work.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Whatever you do, do it with everything — for the Lord, not for a mood.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "God is not asking you to fake energy. Bring faithful effort with what you have today.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "A body that can move. A game you love. A chance to get better.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Let that pull you.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Not guilt. Just truth.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do not try to fix the whole session.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Win the first ten minutes.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Pick a target. Commit to the swing. Learn from the result.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "First ball.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Begin.",
    },
  ],
};

// ── Golf Beat 2 — pp-golf-name-standard ──────────────────────────────────────
export const CLIP_PP_GOLF_NAME_STANDARD_SCRIPT: AudioScript = {
  slug: "pp-golf-name-standard",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "The standard today is simple.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Every ball gets a target. Every swing gets commitment.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "No rushing. No chasing.",
    },
  ],
};

// ── Golf Beat 3 — pp-golf-goal-fusion ────────────────────────────────────────
export const CLIP_PP_GOLF_GOAL_FUSION_SCRIPT: AudioScript = {
  slug: "pp-golf-goal-fusion",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "The simple reps are not filler.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Short putts. Half-wedges. Bunker shots. Alignment.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Do them with a target and a routine.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That is how practice shows up on the course.",
    },
  ],
};

// ── Golf Beat 5 — pp-golf-full-routine (routine discipline; golf-true) ────────
// Replaces baseball's "be-vocal." Golf is individual — no cutoff to call, no
// teammate to talk to. The transferable practice-room habit is the full
// pre-shot routine on every rep: it's what holds on the first tee when the
// hands go cold.
export const CLIP_PP_GOLF_FULL_ROUTINE_SCRIPT: AudioScript = {
  slug: "pp-golf-full-routine",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Do not waste the range by raking and swinging.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Pick a target. Set your body. Commit to the shot.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Some balls get the full routine. Every ball gets attention.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "That is what holds on the first tee.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Build it now.",
    },
  ],
};

// ── Golf Beat 6 — pp-golf-see-it-go ──────────────────────────────────────────
// Terminal send-off removed — the pre-practice session ends on the prayer clip
// that follows this beat (mirrors hockey/basketball/baseball).
export const CLIP_PP_GOLF_SEE_IT_GO_SCRIPT: AudioScript = {
  slug: "pp-golf-see-it-go",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "See one shot.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Pick the target. Feel the setup. Commit to the swing.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Watch the ball honestly. Take the feedback without chasing it.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Good shot or bad shot, it does not define you.",
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Next ball.",
    },
  ],
};

// ── Golf pre-practice focus presets — pp-golf-focus-* ─────────────────────────
// Single-phrase clips; slugs match GOLF_CONFIG.practiceFocusSlugs (FV-265).

export const CLIP_PP_GOLF_FOCUS_COMMITTED_TO_EVERY_SHOT_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-committed-to-every-shot",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Committed to every shot." }],
};

export const CLIP_PP_GOLF_FOCUS_ONE_SHOT_AT_A_TIME_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-one-shot-at-a-time",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "One shot at a time." }],
};

export const CLIP_PP_GOLF_FOCUS_PICK_A_SMALL_TARGET_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-pick-a-small-target",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Pick a small target." }],
};

export const CLIP_PP_GOLF_FOCUS_FULL_ROUTINE_EVERY_BALL_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-full-routine-every-ball",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Full routine, every ball." }],
};

export const CLIP_PP_GOLF_FOCUS_TAKE_MY_MEDICINE_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-take-my-medicine",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  // Spoken label verbatim (matches the other 6 focus clips + the
  // GOLF_CONFIG.practiceFocusOptions "Take my medicine" label).
  segments: [{ type: "speech", text: "Take my medicine." }],
};

export const CLIP_PP_GOLF_FOCUS_SPEED_ON_EVERY_PUTT_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-speed-on-every-putt",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Speed on every putt." }],
};

export const CLIP_PP_GOLF_FOCUS_RESET_BETWEEN_SHOTS_SCRIPT: AudioScript = {
  slug: "pp-golf-focus-reset-between-shots",
  voice: "ash",
  instructions: PP_COACH_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [{ type: "speech", text: "Reset between shots." }],
};

// ── Basketball VIZ clips — one per position (FV-115) ────────────────────────

export const CLIP_VIZ_GUARD_SCRIPT: AudioScript = {
  slug: "viz-guard",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...GUARD_VIZ],
};

export const CLIP_VIZ_WING_SCRIPT: AudioScript = {
  slug: "viz-wing",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...WING_VIZ],
};

export const CLIP_VIZ_BIG_SCRIPT: AudioScript = {
  slug: "viz-big",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [...BIG_VIZ],
};

// ── Basketball HM clips — Guard (10 cells) (FV-115) ─────────────────────────
// Text is verbatim from docs/pregame-scripts.md § "3 · Hard Moments — Basketball".

export const CLIP_HM_BB_GUARD_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are running the offense. You try to force a pass through traffic. They pick it off and go the other way for a layup.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your jaw clenches. You turn and chase the play. The thought hits: I forced that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Sprint back into the play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next possession, advance it with pace, hit the first action, and make the defense move.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You come off the screen wide open. Feet set, clean look, the shot you've made a thousand times. It rims out.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your shoulders drop for a second. You start second-guessing the next one.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That shot is over. Stay ready for the next clean look.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next clean look, trust your prep, step into it, and let it go.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You're up on the ball. He hits you with the crossover, gets your hips turned, and blows by for the layup.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your hips are turned. Your eyes drop for a second. The thought hits: He got me bad.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That drive is over. Guard the next possession clean.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next possession, sit in your stance, take away the first move, and contain with your chest.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Two quick reach-ins and the whistle's on you. Now you're guarding soft, can't pick up full-court, playing scared of the third.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your hands pull back. Your feet get cautious. The thought hits: I can't guard him without fouling.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Those whistles are over. Pressure with your feet, not your hands.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Beat him to the spot, chest in front, hands high, contest clean.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You make a bad read on the pick-and-roll. Coach yells your name and pulls you to the sideline. You’re standing there while the game goes on.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You stand there watching the play without you. The thought hits: I missed the read.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The correction is about the play. Take it and move on.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next possession, slow it down, see the floor, and get the team into the right action.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "After a turnover, coach calls your number. You come out, and the backup brings the ball up. You watch the offense run without you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You sit down hard. Your eyes stay on the floor. The thought hits: I just lost my minutes.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Stay in it. The next chance may come fast.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Watch their guard, talk from the sideline, and be ready to organize when you go back in.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "It's warmups. Your handle feels tight, your thoughts are racing, your heart is already going before the ball's even tipped.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Heart pounding in your ears. Fingers buzzing on the ball. What if I cough it up first possession.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Come back to your breath. Come back to the ball.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "These nerves are readiness, not a warning. The same energy that feels like fear is the energy that makes you quick. First possession, just get the team into something simple.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Tight game, late. You're at the line to ice it. The gym goes quiet. First one clanks off the rim.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You hear the miss before the ball hits the floor. The thought hits: I was supposed to close that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That shot is over. Reset for the second one. Trust your routine. Trust your stroke.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First few minutes and nothing is clicking. You are over-dribbling, pounding the ball, and nobody is getting a clean look.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your grip tightens on the ball. The thought hits: I can’t get us into anything.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The slow start is over. Start this possession clean.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Advance it with pace, hit the first action, and make the defense move.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_GUARD_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-guard-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "They go on a quick run. You’re down early, and you can feel the whole team look to you to stop the bleeding.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You bring it up and everything feels sped up. The thought hits: We’re in trouble.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That run is over. Get one stop, then get one score.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Bring it up with pace, hit the first action, and get the team one clean look.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

// ── Basketball HM clips — Wing (10 cells) (FV-115) ───────────────────────────

export const CLIP_HM_BB_WING_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You drive the lane and get stripped. Or you throw the cross-court swing and they jump it. The ball is gone the other way.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your feet pause for a second. The thought hits: I need to get it back.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Sprint back into the play.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next trip, cut hard, space right, and let the offense find you.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You catch it open in your spot. Clean look. Cold off the bench, you brick it. Front rim, nothing.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your hands feel tight for a second. You start second-guessing the next one.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That shot is over. Relocate and stay ready.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next clean look, show your hands, trust your prep, and let it go.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You’re on their best scorer. You close out, he rips by you, and finishes over the help. The bench reacts. That one’s on the highlight.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your feet stop for a second. The thought hits: He went right through me.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That closeout is over. Take the matchup again.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next closeout, arrive under control, cut off the straight line, and contest without flying by.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Two quick hand-check fouls on a faster guy. The whistle keeps finding you. You feel the bench getting close.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your arms freeze for a second. Your feet get cautious on the closeout. The thought hits: I can’t guard him without fouling.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Those whistles are over. Guard the angle, not the jersey.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Close out under control, keep your chest in front, hands back, and contest clean.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Coach stops the play and barks your name. You did not close out. You passed up the open one. The whole gym hears it.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your ears get hot. Your eyes drop for a second. The thought hits: I played scared.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The correction is over. Take the part you need.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next possession, close out hard, stay shot-ready, and take the open one in rhythm.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_BENCHED_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-benched",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Your shot is not falling, so coach pulls you. You sit down at the end of the bench and watch the game go on without you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You sit down hard. Your eyes stay on the floor. The thought hits: I just lost my minutes.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Stay in it. The next chance may come fast.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Talk on defense, watch the spacing, and be ready when your name is called.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You're in warmups against a ranked team. Scouts are in the gym. Your stroke feels tight and you start pressing before tip-off.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your eyes keep finding the scouts. Your shot feels tight. The thought hits: I have to show them what I can do.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "You do not need to prove it all on the first touch.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Run the floor, space hard, and take the right shot when it comes.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You get fouled on a jumper. Two shots. The gym goes quiet as you step to the line. First one rims out.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You hear the miss before the ball hits the floor. You start thinking about the second one.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That shot is over. Reset for the second one.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Same routine. Breathe, eyes on the rim, trust your stroke.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Your first few touches feel off. The ball is not finding you and the half is slipping by. You can feel yourself going quiet.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You drift to the corner and stop talking. The thought hits: I’m invisible tonight. I’m just chasing and can’t get started.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The slow start is over. Get yourself back in the game.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Sprint the lanes, cut hard, talk on defense, and stay shot-ready.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_WING_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-wing-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "They go on a run and you're down early. You can feel the pull to force a shot, to answer it all by yourself, right now.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your pace speeds up. Your hands want the ball. The thought hits: I have to answer this myself.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That run is over. Get one stop, then get one score.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Guard your matchup, sprint to space, and take the rhythm shot when it comes.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

// ── Basketball HM clips — Big (10 cells) (FV-115) ────────────────────────────
// Big × benched → slug hm-bb-big-fouled-out (per spec; big is fouled out, not benched).

export const CLIP_HM_BB_BIG_TURNOVER_SCRIPT: AudioScript = {
  slug: "hm-bb-big-turnover",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You roll to the rim and the help steps in. You bowl him over. Whistle. Charge. The ball goes the other way.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You stop for a second. Your shoulders drop. The thought hits: I forced that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That turnover is over. Sprint back and protect the paint.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next trip, roll under control, show your hands, and make the simple play.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_MISSED_SHOT_SCRIPT: AudioScript = {
  slug: "hm-bb-big-missed-shot",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Wide open under the rim. The layup rolls off. You get the board and the putback rims out too.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You stare at the rim for a second. Your hands feel heavy. The thought hits: I should finish those.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That finish is over. Run the floor and get back to the glass.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next trip, seal deep, show your hands, and finish through contact.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_GOT_COOKED_SCRIPT: AudioScript = {
  slug: "hm-bb-big-got-cooked",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The switch leaves you on their quick guard. He sizes you up, crosses over, and blows by you to the rim.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your feet feel stuck for a second. The thought hits: They’re going to come at me again.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "He won that switch. He does not get the next one for free.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next switch, give space, angle the drive, and meet him vertical at the rim.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_FOUL_TROUBLE_SCRIPT: AudioScript = {
  slug: "hm-bb-big-foul-trouble",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Two quick fouls and the coach sits you. You come back in scared to touch anybody. You stop contesting. You stop boxing out.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your arms feel stiff and cautious. Your feet hesitate before contact. The thought hits: I’m the weak link.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Those whistles are over. You can compete hard and stay disciplined.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Defend with your feet, stay vertical, hands straight up, and box out clean.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Their five just grabbed another offensive board. The coach turns and barks down the bench, loud enough for everyone. Box out! You’re getting pushed around in there.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Your shoulders pull down under the words. Your eyes go to the paint. The thought hits: I’m getting pushed around.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The volume is not the verdict. Take the correction. Leave the shame.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next possession, hit first, box out, and protect the paint.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_FOULED_OUT_SCRIPT: AudioScript = {
  slug: "hm-bb-big-fouled-out",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "The whistle blows. That is your last foul. Coach has to take you out, and the game keeps going without you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You sit down and stare at the court. The thought hits: I can’t help them now.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "You are out of the game, but you are not out of the team.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Stay up, talk on defense, call coverages, and help the next big be ready.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_NERVOUS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-nervous",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Warmups. You watch their big across the floor. He is taller, stronger, and already throwing his body around in the paint.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You shift in your seat. Your shoulders tense as you watch him move people. The thought hits: This is going to be a long night.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "These nerves are energy, not danger. Let them sharpen you.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "First possession, get low, hit first, and hold your ground with your base.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_MISSED_FTS_SCRIPT: AudioScript = {
  slug: "hm-bb-big-missed-fts",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Bonus. Two shots. The gym gets quiet as you step to the line. First one clangs off the rim. Second one does too.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You hear the gym react. Your hands feel heavy. The thought hits: I have to make up for that.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "Those free throws are over. Get back and protect the rim.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Next trip, stay aggressive — seal early, show your hands, and finish through contact.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_START_SLOW_SCRIPT: AudioScript = {
  slug: "hm-bb-big-start-slow",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "First few minutes and you're a step late to everything. He beats you to his spot. He beats you to the glass. They score twice inside.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You feel late to every hit. The thought hits: He is beating me to the spot.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "The slow start is over. Start this possession clean.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Get low early, hit first on the box out, and own the next rebound.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

export const CLIP_HM_BB_BIG_FALL_BEHIND_EARLY_SCRIPT: AudioScript = {
  slug: "hm-bb-big-fall-behind-early",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "Down ten early. They’re scoring in the paint and crashing the offensive glass, and you’re the one back there. It feels like the rim is yours to hold and it’s slipping.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "You look at the scoreboard, then back at the paint. The thought hits: We’re getting pushed around.",
      speed: 1.1,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Now the reset. Return to your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 3 },
    {
      type: "speech",
      text: "That run is over. Get one stop, one board, then one score.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
    {
      type: "speech",
      text: "Wall up, contest vertical, and finish the possession with the rebound.",
      speed: 1.1,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2 },
  ],
};

// ── Basketball personalization clips (FV-115) ─────────────────────────────────
// 3 new anchor clips (basketball-specific physical cues)
// 1 new self-talk clip (bb-token to avoid collision with st-01)

export const CLIP_ANC_BOUNCE_BALL_TWICE_SCRIPT: AudioScript = {
  slug: "anc-bounce-ball-twice",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Bounce the ball twice." },
  ],
};

export const CLIP_ANC_TAP_FLOOR_SCRIPT: AudioScript = {
  slug: "anc-tap-floor",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Tap the floor." },
  ],
};

export const CLIP_ANC_LOOK_AT_RIM_SCRIPT: AudioScript = {
  slug: "anc-look-at-rim",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Look at the rim." },
  ],
};

export const CLIP_ST_BB_01_SCRIPT: AudioScript = {
  slug: "st-bb-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next possession." },
  ],
};

// ── Baseball personalization clips (FV-94 follow-up; render = FV-95) ─────────
// 2 baseball-specific anchor clips + 1 self-talk clip (bsb-token to avoid
// collision with st-01 / st-bb-01). These complete the baseball pregame option
// set declared in BASEBALL_CONFIG.anchors / .selfTalkOptions. Their slug-map
// wiring in audio-mapping.ts (ANCHOR_OPTION_SLUGS / SELFTALK_OPTION_SLUGS) is
// intentionally deferred to FV-95: adding a map value before the clip is in the
// rendered manifest catalog would fail the playlist-integrity §3 check. Until
// then a baseball athlete who picks one of these just gets no anchor/self-talk
// clip (the resolver drops the sentinel) — baseball pregame isn't live pre-FV-95.

export const CLIP_ANC_TAP_BAT_TWICE_SCRIPT: AudioScript = {
  slug: "anc-tap-bat-twice",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Tap your bat twice." },
  ],
};

export const CLIP_ANC_LOOK_AT_THE_PITCHER_SCRIPT: AudioScript = {
  slug: "anc-look-at-the-pitcher",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Look at the pitcher." },
  ],
};

export const CLIP_ST_BSB_01_SCRIPT: AudioScript = {
  slug: "st-bsb-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next at-bat." },
  ],
};

// ── Golf personalization clips (FV-303) ──────────────────────────────────────
// 3 golf-specific anchor clips + 1 self-talk clip. These complete the golf
// pregame option set. Their slug-map wiring in audio-mapping.ts
// (ANCHOR_OPTION_SLUGS / SELFTALK_OPTION_SLUGS) is added in the same PR so
// the playlist-integrity §3 check passes when the clips are in the manifest.

export const CLIP_ANC_GLF_REGRIP_SCRIPT: AudioScript = {
  slug: "anc-glf-regrip",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Re-grip the club." },
  ],
};

export const CLIP_ANC_GLF_GLOVE_TAP_SCRIPT: AudioScript = {
  slug: "anc-glf-glove-tap",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Glove tap." },
  ],
};

export const CLIP_ANC_GLF_STEP_BACK_SCRIPT: AudioScript = {
  slug: "anc-glf-step-back",
  voice: "ash",
  instructions: ANCHOR_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Step back, then step in." },
  ],
};

export const CLIP_ST_GLF_01_SCRIPT: AudioScript = {
  slug: "st-glf-01",
  voice: "ash",
  instructions: SELFTALK_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "You're okay. Next shot." },
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
// Finalized text from docs/pregame-scripts.md §4.
export const CLIP_SHARED_PRAYER_SELFGUIDED_SCRIPT: AudioScript = {
  slug: "shared-prayer-selfguided",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Take a moment with God.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You do not need perfect words. He already knows what you are carrying.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Thank him. Give him the pressure. Ask for courage. Ask to play free and serve your team.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Now pray in your own words.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 30.0 },
  ],
};

// FV-136: Cue-word scaffold clips (shared-cue-word-intro + shared-cue-word-sendoff)
//
// The md's §4 has two beats that wrap the athlete's chosen cue word:
//   shared-cue-word-intro:    "When the pressure builds." [0.5s]
//                             "Come back to your breath and speak your cue word." [0.8s]
//                             {insert word}. [0.6s]    ← CANNOT be rendered as TTS
//   shared-cue-word-sendoff:  "Remember your cue word: {insert word}." [2s]
//
// The "{insert word}" token is the athlete's chosen cue word — a runtime selection.
// It CANNOT be TTS'd into these clips. The existing cw-<word>-reset/sendoff clips
// supply the word audio.
//
// STITCH MECHANISM (needs KC's call before playlist template changes):
//   Current template sentinel: {{cueReset}} → expands to cw-<word>-reset
//   To add the intro frame, the template would need to change from:
//     [..., "{{cueReset}}", ...]
//   to:
//     [..., "shared-cue-word-intro-pre", "{{cueReset}}", ...]
//   where "shared-cue-word-intro-pre" plays lines 1-2, then cw-<word>-reset delivers the word.
//   Similarly for the sendoff: "shared-cue-word-sendoff-pre" + {{cueSendoff}}.
//
// These clip DEFINITIONS are authored here so they are ready for generation.
// The PHASE2_TEMPLATES in generate-pregame-audio.ts will need a separate update
// to insert the scaffold clips into the playlist template. That change requires
// KC's decision on whether to ship the intro/sendoff frames in the MVP cut
// (they are new audio not in the current live clips).
//
// If KC decides NOT to ship the frames: these clips are defined but never referenced
// in any template, so they cause no harm (just won't be rendered).

export const CLIP_SHARED_CUE_WORD_INTRO_PRE_SCRIPT: AudioScript = {
  // This is the preamble to the cue word reset — plays before cw-<word>-reset.
  // Slug: "shared-cue-word-intro-pre" (not "shared-cue-word-intro" to distinguish
  // from any future monolithic version that somehow handles the token).
  slug: "shared-cue-word-intro-pre",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "When the pressure builds.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 0.5 },
    {
      type: "speech",
      text: "Come back to your breath and speak your cue word.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 0.8 },
    // ← cw-<word>-reset clip plays after this in the playlist
  ],
};

export const CLIP_SHARED_CUE_WORD_SENDOFF_PRE_SCRIPT: AudioScript = {
  // Preamble to the cue word sendoff — plays before cw-<word>-sendoff.
  // The md says "Remember your cue word: {insert word}." — this clip delivers
  // "Remember your cue word:" and cw-<word>-sendoff delivers the word.
  slug: "shared-cue-word-sendoff-pre",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Remember your cue word:",
      speed: 1.1,
    },
    { type: "silence", durationSec: 0.3 },
    // ← cw-<word>-sendoff clip plays after this in the playlist
  ],
};

// CLIP B — pp-prayer (pre-practice guided prayer)
// All speech segments use PRAYER_INSTRUCTIONS.
// phase mark: "prayer" on seg1 (first speech segment).
export const CLIP_PP_PRAYER_SCRIPT: AudioScript = {
  slug: "pp-prayer",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Let's pray. Father, thank you that my worth was settled before I got here, and it will hold long after I leave.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Thank you for this work — the quiet reps, the hidden effort, the chances to get better when no one is keeping score.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Help me bring full effort today. Not to prove myself, but because this body, this sport, and this opportunity are gifts from you.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "When a rep goes bad, help me drop it fast, learn from it, and go again.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Good reps or rough ones, nothing changes how you see me in Christ.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Help me train with courage, discipline, and joy.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Let this effort honor you.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "In Jesus' name, Amen.",
      instructions: PRAYER_INSTRUCTIONS,
    },
  ],
};

// CLIP C — pp-prayer-selfguided (pre-practice self-guided prayer)
// Spoken identity segments: SELFTALK_INSTRUCTIONS (local const).
// Spoken invitation / prayer-space segments: PRAYER_INSTRUCTIONS.
// phase mark: "prayer" on the first PRAYER_INSTRUCTIONS speech segment.
export const CLIP_PP_PRAYER_SELFGUIDED_SCRIPT: AudioScript = {
  slug: "pp-prayer-selfguided",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "How you practice is how you play.",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "This work matters, even when no one is keeping score. The clean reps build you. The rough reps teach you. None of them define you.",
      instructions: SELFTALK_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "So take a moment with God.",
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Thank him that your worth is already settled in Christ. Ask for focus, discipline, and full effort. Give him whatever you are carrying today.",
      instructions: PRAYER_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Then pray in your own words.",
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
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    { type: "speech", text: "Talk every shift." },
  ],
};

// ── Ordered list of TTS clip scripts (no openers — they are loudnorm-passed) ──
//
// Phase 2 ordering: shared structural → VIZ × 3 positions → HM × 30 cells
// (hm-forward-nervous first for backward compatibility with P1) → CLOSING.
// ── Shared structural intro clips ────────────────────────────────────────────
//
// shared-viz-intro     — plays immediately before the first viz-* clip. Delivers
//                        "Now, visualize this scenario." in VISUALIZATION_INSTRUCTIONS
//                        register to prime the athlete for the imagery sequence.
//                        Injected at runtime in audio-playlist.ts after the FV-144
//                        positive-play swap so it precedes whichever viz clip(s) are
//                        active. Guarded by manifest.clips["shared-viz-intro"] so
//                        older manifests/test fixtures skip it cleanly.
//
// shared-anchor-intro  — plays immediately before the resolved anchor clip.
//                        Delivers "Remember your anchor." Injected in the
//                        {{anchor}} sentinel branch in audio-playlist.ts, same
//                        guard pattern as the FV-153 cue-word scaffold clips.
//
// shared-selftalk-intro — plays immediately before the resolved self-talk clip.
//                         Delivers "Now, say it to yourself." Injected in the
//                         {{selfTalk}} sentinel branch in audio-playlist.ts.

export const CLIP_SHARED_VIZ_INTRO_SCRIPT: AudioScript = {
  slug: "shared-viz-intro",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now, visualize this scenario.",
      speed: 1.1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.6 },
  ],
};

export const CLIP_SHARED_ANCHOR_INTRO_SCRIPT: AudioScript = {
  slug: "shared-anchor-intro",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Remember your anchor.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 0.6 },
  ],
};

export const CLIP_SHARED_SELFTALK_INTRO_SCRIPT: AudioScript = {
  slug: "shared-selftalk-intro",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  postFilter: CLIP_LOUDNORM_FILTER,
  segments: [
    {
      type: "speech",
      text: "Now, say it to yourself.",
      speed: 1.1,
    },
    { type: "silence", durationSec: 0.6 },
  ],
};

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
  CLIP_HM_GOALIE_SOFT_GOAL_SCRIPT,
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
  CLIP_ANC_TAKE_A_DRINK_SCRIPT,
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
  CLIP_PP_OPENER_DIALED_IN_2_SCRIPT,
  CLIP_PP_OPENER_DIALED_IN_3_SCRIPT,
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
  // Baseball pre-practice "Lock In" clips (FV-220). Render = FV-95.
  CLIP_PP_BASEBALL_OPENER_GET_TO_SCRIPT,
  CLIP_PP_BASEBALL_NAME_STANDARD_SCRIPT,
  CLIP_PP_BASEBALL_GOAL_FUSION_SCRIPT,
  CLIP_PP_BASEBALL_BE_VOCAL_SCRIPT,
  CLIP_PP_BASEBALL_SEE_IT_GO_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_RELENTLESS_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_HUNGRY_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_STAY_IN_THE_BOX_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_READ_THE_PITCH_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_SOFT_HANDS_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_QUICK_FEET_SCRIPT,
  CLIP_PP_BASEBALL_FOCUS_ONE_PITCH_AT_A_TIME_SCRIPT,
  // Golf pre-practice "Lock In" clips (FV-267). Render = FV-266.
  CLIP_PP_GOLF_OPENER_GET_TO_SCRIPT,
  CLIP_PP_GOLF_NAME_STANDARD_SCRIPT,
  CLIP_PP_GOLF_GOAL_FUSION_SCRIPT,
  CLIP_PP_GOLF_FULL_ROUTINE_SCRIPT,
  CLIP_PP_GOLF_SEE_IT_GO_SCRIPT,
  CLIP_PP_GOLF_FOCUS_COMMITTED_TO_EVERY_SHOT_SCRIPT,
  CLIP_PP_GOLF_FOCUS_ONE_SHOT_AT_A_TIME_SCRIPT,
  CLIP_PP_GOLF_FOCUS_PICK_A_SMALL_TARGET_SCRIPT,
  CLIP_PP_GOLF_FOCUS_FULL_ROUTINE_EVERY_BALL_SCRIPT,
  CLIP_PP_GOLF_FOCUS_TAKE_MY_MEDICINE_SCRIPT,
  CLIP_PP_GOLF_FOCUS_SPEED_ON_EVERY_PUTT_SCRIPT,
  CLIP_PP_GOLF_FOCUS_RESET_BETWEEN_SHOTS_SCRIPT,
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
  // Baseball personalization clips (FV-94 follow-up; render = FV-95).
  CLIP_ANC_TAP_BAT_TWICE_SCRIPT,
  CLIP_ANC_LOOK_AT_THE_PITCHER_SCRIPT,
  CLIP_ST_BSB_01_SCRIPT,
  // Pre-practice focus — hockey "Talk every shift" (FV-121)
  CLIP_PP_FOCUS_TALK_EVERY_SHIFT_SCRIPT,
  // Pre-practice + pregame prayer clips (sport-neutral, Issue 1)
  CLIP_SHARED_PRAYER_SELFGUIDED_SCRIPT,
  CLIP_PP_PRAYER_SCRIPT,
  CLIP_PP_PRAYER_SELFGUIDED_SCRIPT,
  // FV-136: 52 discrete positive-play viz clips (one per scenario in §1 of md)
  // These replace the 6 monolithic VIZ clips at runtime; the monolithic clips remain
  // for backward compatibility during transition. Keep the viz library LAST in the
  // list so the catalog count check in generate-pregame-audio.ts can reference a
  // stable offset — update the count when regenerating.
  ...VIZ_CLIP_SCRIPTS,
  // Baseball pregame clips (FV-94) — 4 VIZ + 39 hard-moment cells.
  ...BASEBALL_PREGAME_CLIP_SCRIPTS,
  // Golf pregame clips (FV-265) — 3 profile VIZ + 30 hard-moment cells (render = FV-266).
  ...GOLF_PREGAME_CLIP_SCRIPTS,
  // Golf anchors + self-talk (FV-303)
  CLIP_ANC_GLF_REGRIP_SCRIPT,
  CLIP_ANC_GLF_GLOVE_TAP_SCRIPT,
  CLIP_ANC_GLF_STEP_BACK_SCRIPT,
  CLIP_ST_GLF_01_SCRIPT,
  // Golf positive-play viz clips (FV-294) — 21 per-play viz + st-glf-02 self-talk.
  // These replace the flagship viz-bomber/viz-ballstriker/viz-scrambler in
  // resolvePlaylist() when the athlete picks plays from the picker.
  ...GOLF_VIZ_CLIP_SCRIPTS,
  // Football pregame clips (FV-202, v2 DORMANT) — 7 role VIZ + 67 hard-moment
  // cells. Registered so the generator renders them at the (deferred) audio
  // pass; the committed manifest.json does not yet contain them.
  ...FOOTBALL_PREGAME_CLIP_SCRIPTS,
  ...FOOTBALL_VIZ_CLIP_SCRIPTS,
  // Swimming pregame clips (FV-275, v2 DORMANT) — 4 specialty VIZ + 38
  // hard-moment cells. Same deferred-render staging as football.
  ...SWIMMING_PREGAME_CLIP_SCRIPTS,
  // Track & Field pregame clips (FV-TRF, v2 DORMANT) — 5 event-group VIZ + 38
  // hard-moment cells. Same deferred-render staging.
  ...TRACKFIELD_PREGAME_CLIP_SCRIPTS,
  // Lacrosse pregame clips (FV-406, v2 DORMANT) — 10 library VIZ (2 per
  // position, FV-404 §2) + 50 hard-moment cells (47 grid + 3 withheld yips,
  // FV-404). Same deferred-render staging; prose is FV-405 book-overridden
  // at render.
  ...LACROSSE_PREGAME_CLIP_SCRIPTS,
  // FV-136: Cue-word scaffold preamble clips (audio before the {insert word} token)
  CLIP_SHARED_CUE_WORD_INTRO_PRE_SCRIPT,
  CLIP_SHARED_CUE_WORD_SENDOFF_PRE_SCRIPT,
  // Shared structural intro clips — viz, anchor, and self-talk lead-ins.
  // Injected at runtime in audio-playlist.ts (guarded by manifest.clips[slug]).
  CLIP_SHARED_VIZ_INTRO_SCRIPT,
  CLIP_SHARED_ANCHOR_INTRO_SCRIPT,
  CLIP_SHARED_SELFTALK_INTRO_SCRIPT,
];
