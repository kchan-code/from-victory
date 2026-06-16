// Pregame opener — Today's focus: "Joy."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Joy on the Today's Focus screen.
//
// Verse: 1 Thessalonians 5:16-18 — be joyful always, pray continually,
// give thanks in all circumstances.
// Why: Joy is paired with prayer and thanksgiving — Paul writes it
// as a triplet, not a standalone command. The athlete who stays
// connected to God in every shift, every loss, every win, is the
// one who carries joy that does not depend on the scoreboard.
// Identity truth: "Joy is not a mood that changes with the
// scoreboard. It is a posture you take toward the God who is always
// with you."

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_JOY_SCRIPT: AudioScript = {
  slug: "opener-joy",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your face soften.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from 1 Thessalonians 5. Paul was writing to a young church facing real hardship: Rejoice always. Pray continually. Give thanks in all circumstances. For this is God’s will for you in Christ Jesus.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Joy does not mean you fake a smile or pretend the hard shift did not happen. Paul ties joy to prayer and thanksgiving — staying connected to God in the middle of what is hard.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So remember the gift. A body that can move. A team to play with. A game you love. A chance to compete.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "The scoreboard matters, but it is not the whole story. Keep perspective. Give thanks. You get to do this today.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Play with joy. Pray as you go. Compete hard, and take the next shift free.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
