// Pilot guided-audio script — Forward × "I miss a scoring chance."
//
// Pre-rendered build-time MP3 per cell. This is the canonical pattern for
// the remaining 29 scripts (3 positions × 10 adversities). Segments 1-3
// and 8-9 are near-identical across all cells; 4-6 are position-specific;
// 7 is the position-adversity cell. The athlete's cue word, self-talk,
// and reset anchor surface on-screen during playback — they are NOT in
// the audio.
//
// Voice: "ash" — the From Victory mentor voice, same one used for the
// breath threshold. Script-level instructions in the 6-facet form steer
// toward a calm-vibe baseline; per-segment overrides (also 6-facet,
// because the API replaces — not merges — when an override is set) take
// over only where the register genuinely shifts.
//
// Per-segment `speed` overrides do most of the pacing work: active
// visualization segments (4-7) bump to 1.0; devotional segments (1, 3, 9)
// drop to 0.88-0.90 against the 0.95 script-level default.
//
// Per breath-threshold's lesson, overrides are used sparingly — only
// when a segment needs a register the script-level instruction does not
// already cover.
//
// Runtime target: ~5 minutes (~300s). Speech ~640 words at 150-180 wpm
// on ash at 0.95 playback ≈ 210-250s of speech. Silence segments add
// roughly 70s. Total should land in the 280-320s window.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
  VISUALIZATION_INSTRUCTIONS,
} from "./instructions.ts";
import {
  CLOSING,
  FORWARD_VIZ,
} from "./segments.ts";

// Per-segment overrides REPLACE the script-level instruction entirely for
// that segment's API call (see scripts/generate-pregame-audio.ts —
// `seg.instructions ?? script.instructions`). So each override below is
// a self-contained 6-facet block, not a delta. The canonical blocks live
// in ./instructions.ts; the two below stay LOCAL on purpose — their
// example phrases are tuned to this cell's hard-moment lines ("I should
// have buried that," "the chance is information, not a verdict").

const HARD_MOMENT_NARRATION_INSTRUCTIONS = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it.

Pronunciation: The false-story sentences ("I should have buried that," "I am letting the team down," "I am not a finisher") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Heat in your face" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story spiral, let the sentences arrive in quicker succession the way they do in the athlete's head, with only the smallest beat between.`;

const HARD_MOMENT_TRUTH_INSTRUCTIONS = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "real," "identity," and "information, not a verdict" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "Your mistake is real." / "It is not your identity." / "The chance is information, not a verdict."`;

export const SESSION_FORWARD_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "session-forward-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [

    // ── Regulate breath (Mentor, meditative)
    // Cell starts at breath section. Segment 1 (identity) is delivered by
    // the need-specific opener.mp3 stitched in front of this file at
    // runtime. See compositional architecture in audio/types.ts.
    {
      type: "speech",
      text: "Now, take two breaths. Four in. Six out.",
      mark: { phase: "settle" },
    },
    { type: "silence", durationSec: .8 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale. ",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 1 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 1 },
    },
    { type: "silence", durationSec: 6 },

    // ── Remember what is true (Devotional guide)
    // One Keller-tone line. Not a sermon. The gospel-anchored truth that
    // grounds the rest of the work.
    {
      type: "speech",
      text: "Remember what is true.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: .8 },
    {
      type: "speech",
      text: "The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    ...FORWARD_VIZ,


    // ── Hard moment (Mentor → Coach)
    // THE adversity-specific segment for this cell. Coping imagery
    // template: See it → Feel it → Breathe → Speak truth → Take the
    // next faithful action. One false-story sentence in the athlete's
    // internal voice, not paragraphs. The collapse is shown, not
    // narrated from outside.
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: .4 },
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
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale on the bench.",
      speed: 1,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell. The principle:
    // the last play is over, the move is to play the play you're in.
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
