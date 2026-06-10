// Pregame opener — Today's focus: "Leadership."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Leadership on the Today's Focus screen.
//
// Verse: Mark 10:45 — the Son of Man came to serve.
// Why: The defining inversion of leadership in the New Testament.
// Lewis's "There Are No Ordinary People" sits underneath — every
// teammate, including the bench player, is not ordinary. Strong fit
// for a 16-21 athlete navigating captaincy, locker-room status, or
// the inner ring.
// Identity truth: "Real leadership is not standing above your team.
// It is standing under them — the way Christ stood under you."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_LEADERSHIP_SCRIPT: AudioScript = {
  slug: "opener-leadership",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Take a long breath.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Jesus said in Mark 10. His disciples were arguing about who would be greatest. Jesus called them over and said this. Whoever wants to become great among you must be your servant, and whoever wants to be first must be slave of all. For even the Son of Man did not come to be served, but to serve, and to give his life as a ransom for many.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "To serve does not mean to be soft. Jesus was not weak. It means using whatever you have been given — the C, the A, a top-line spot, a loud voice — to lift the player next to you, not to stand above them. The fourth-line winger is not ordinary. The backup goalie is not ordinary. Lead like that is true.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Real leadership is not standing above your team. It is standing under them — the way Christ stood under you.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
