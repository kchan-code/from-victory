// Threshold-step breath audio. 3 rounds of 4-in / 6-out, bookended by a
// short intro and outro. Used by BreathScreen (pregame step 1).
//
// First-draft copy. Content trio (curator + sports-psychologist + youth-
// pastor) refines as part of the audio style guide pass; structure stays
// fixed so timing + sphere sync don't have to change when copy moves.

import type { AudioScript } from "./types";

export const BREATH_THRESHOLD_SCRIPT: AudioScript = {
  slug: "breath-threshold",
  // ash is the From Victory voice — warm, grounded mentor. Same voice
  // carries through the breath threshold and all 30 guided-session
  // scripts. Calm-vibe instructions in the 6-facet form below steer
  // ash toward the meditative end of its range for this script.
  voice: "ash",
  instructions: `Voice Affect: Calm, composed, grounded. A trusted mentor guiding the athlete through stillness — not a fitness instructor, not a preacher, not a meditation app narrator.

Tone: Warm, present, intimate. Spiritually steady without being sentimental. Not preachy. Not soft to the point of disappearing.

Pacing: Slow and unhurried. Each breath cue is a complete sentence, fully voiced, before the silence segment takes over. Do not rush.

Emotion: Quiet care. The athlete has their eyes closed; speak as if you know it. No performance, no hype, no urgency.

Pronunciation: Clear and gentle. Land "Inhale" and "Exhale" cleanly — fully voiced, never sharp, never rushed.

Pauses: The script's typed silence segments carry structural pauses. Let your sentence ends breathe naturally into them. A brief beat after each cue is enough.`,
  speed: 0.95,
  // Warming EQ — this render came out thin/tinny relative to the openers and
  // session cells: ~6 dB quieter overall, weaker low body, hotter highs. This
  // restores the low end, tames the harsh ~4 kHz presence and top, and lifts
  // the level to match the rest of the session. Applied at final encode.
  // (Also applied once to the committed MP3; keep the two identical.)
  postFilter:
    "bass=g=4:f=180,equalizer=f=4000:width_type=q:width=1.2:g=-2.5,treble=g=-2:f=8000,volume=4.5dB",
  segments: [
    // ── Intro — slightly brisk for the threshold cue; protocol callout
    // lands as a single line so the door doesn't feel laborious.
    {
      type: "speech",
      text: "Breathe first and reset. 4 seconds in, 6 seconds out, from the diaphragm, not the chest.",
      speed: 1.1,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },

    // ── Round 1 — per-segment instructions intentionally dropped. Prior
    // "slow rising / lengthened" overrides made R1 cues drag noticeably
    // longer than R3's plain "Inhale./Exhale.". Keeping breath cues
    // uniform on the script-level instructions is closer to what beta
    // testers reacted well to.
    {
      type: "speech",
      text: "Inhale.",
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },

    // ── Round 2 — "Receive" intentionally dropped from the audio; the
    // on-screen "Receive · 4s" label still carries the cue.
    {
      type: "speech",
      text: "Inhale.",
      mark: { phase: "inhale", round: 1 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale. Release.",
      mark: { phase: "exhale", round: 1 },
    },
    { type: "silence", durationSec: 6 },

    // ── Round 3
    {
      type: "speech",
      text: "Inhale.",
      mark: { phase: "inhale", round: 2 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      mark: { phase: "exhale", round: 2 },
    },
    { type: "silence", durationSec: 6 },

    // ── Outro — matches intro energy (1.0 speed) so the close doesn't
    // drag after the meditative middle.
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Ready. Now set your focus.",
      speed: 1.0,
      mark: { phase: "done" },
    },
  ],
};
