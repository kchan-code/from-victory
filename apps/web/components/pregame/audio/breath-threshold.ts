// Threshold-step breath audio. 3 rounds of 4-in / 6-out, bookended by a
// short intro and outro. Used by BreathScreen (pregame step 1).
//
// First-draft copy. Content trio (curator + sports-psychologist + youth-
// pastor) refines as part of the audio style guide pass; structure stays
// fixed so timing + sphere sync don't have to change when copy moves.

import type { AudioScript } from "./types";

export const BREATH_THRESHOLD_SCRIPT: AudioScript = {
  slug: "breath-threshold",
  voice: "ash",
  instructions:
    "Speak in a calm, grounded mentor voice. Slightly slower than conversational. Pause naturally between sentences. Sound like a trusted coach who believes what they're saying. Not preachy, not hype.",
  speed: 0.95,
  segments: [
    // ── Intro
    {
      type: "speech",
      text: "Breathe first.",
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Before you choose your focus, lead your body back to ready. Four counts in. Six counts out. Three rounds.",
    },
    { type: "silence", durationSec: 2 },

    // ── Round 1
    {
      type: "speech",
      text: "Inhale.",
      instructions:
        "Soft and even. Begin the breath cue right at the start of the inhale.",
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions: "Soft. Lengthen the word slightly to match the long out-breath.",
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },

    // ── Round 2
    {
      type: "speech",
      text: "Inhale. Receive.",
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

    // ── Outro
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Ready. Now set your focus.",
      mark: { phase: "done" },
    },
  ],
};
