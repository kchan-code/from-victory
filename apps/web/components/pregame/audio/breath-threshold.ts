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
    "Speak in a soft, hushed, almost-whispered voice. Like a meditation guide settling someone into stillness, not a coach giving direction. Slow and breath-aware. Warm. Intimate. Let each phrase land before the next — leave space. Never urgent. Never preachy. The athlete is closing their eyes; speak like you know it.",
  speed: 0.88,
  segments: [
    // ── Intro — runs at conversational pace; the meditative pace
    // kicks in once we hit the breath cues. Keeps the door from
    // feeling laborious.
    {
      type: "speech",
      text: "Breathe first.",
      speed: 1.0,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 0.6 },
    {
      type: "speech",
      text: "Before you choose your focus, lead your body back to ready. Four counts in. Six counts out. Three rounds.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 1.2 },

    // ── Round 1
    {
      type: "speech",
      text: "Inhale.",
      instructions:
        "Almost whispered. Breathy. Let the word itself sound like a slow in-breath rising.",
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions:
        "Soft, lengthened, with audible breath. Let the word drop away like a long out-breath.",
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },

    // ── Round 2 — "Receive" intentionally dropped from the audio;
    // the on-screen "Receive · 4s" label still carries the cue.
    {
      type: "speech",
      text: "Inhale.",
      instructions:
        "Almost whispered. Breathy. Let the word itself sound like a slow in-breath rising.",
      mark: { phase: "inhale", round: 1 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale. Release.",
      instructions:
        "Soft, lengthened, with audible breath. Let the word drop away like a long out-breath.",
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

    // ── Outro
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Ready. Now set your focus.",
      mark: { phase: "done" },
    },
  ],
};
