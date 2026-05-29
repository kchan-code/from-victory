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
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your face soften.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote in 1 Thessalonians 5. He was writing to a young church facing real hardship. Be joyful always, pray continually, give thanks in all circumstances. For this is God's will for you in Christ Jesus.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Be joyful always does not mean fake a smile or pretend the loss did not hurt. Look at how Paul ties it together. Joy, prayer, thanksgiving. The athlete who prays continually and gives thanks even after a tough shift is the athlete who can carry joy into the next one. Joy is not the absence of hardship. It is what you have when you stay connected to God in the middle of it.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Joy is not a mood that changes with the scoreboard. It is a posture you take toward the God who is always with you.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
