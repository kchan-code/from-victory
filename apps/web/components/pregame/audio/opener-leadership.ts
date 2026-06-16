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
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Mark 10. The disciples were arguing about who would be greatest. Jesus called them over and said, Whoever wants to become great among you must be your servant. For even the Son of Man did not come to be served, but to serve, and to give His life as a ransom for many.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Jesus does not call leaders to be soft. He calls them to serve. To use what they have been given — a letter, a role, a voice, a shift — to lift the people around them.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So lead by serving. Talk early. Bring energy. Pick up a teammate after a bad shift. Make the simple play that helps the group.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The C, the A, the ice time, the line — none of it is for standing above the team. It is for helping the team move forward.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Lead like Christ. Strong enough to serve. Free enough to put the team first.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
