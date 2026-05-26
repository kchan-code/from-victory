// Threshold-step breath audio. 3 rounds of 4-in / 6-out, bookended by a
// short intro and outro. Used by BreathScreen (pregame step 1).
//
// First-draft copy. Content trio (curator + sports-psychologist + youth-
// pastor) refines as part of the audio style guide pass; structure stays
// fixed so timing + sphere sync don't have to change when copy moves.

import type { AudioScript } from "./types";

export const BREATH_THRESHOLD_SCRIPT: AudioScript = {
  slug: "breath-threshold",
  // sage reads softer and more meditative than ash. Reserved for breath +
  // settling moments; the full 5-min session may want ash for the more
  // active visualization segments.
  voice: "sage",
  instructions:
    "Speak in a soft, hushed voice. Like a meditation guide settling someone into stillness, not a coach giving direction. Calm and breath-aware. Warm. Intimate. Not preachy. The athlete is closing their eyes; speak like you know it.",
  speed: 0.95,
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
