// Pregame opener — Today's focus: "Be more Vocal." (Basketball variant)
//
// Basketball sport-vocab swap of opener-be-vocal. Identical gospel spine
// (Romans 8:1, "verdict was settled at the cross") and identity dissolve;
// segs 2/3/5 carry basketball-specific language.
//
// Verse: Romans 8:1 — no condemnation for those in Christ.
// Why: The "stay quiet / don't risk being wrong out loud" pull is a
// performance-identity problem. The gospel dissolves it: the verdict
// was settled before the game started. Freedom to speak is freedom
// that flows FROM the cross, not a confidence trick.
// Identity truth: "What anyone out there thinks of you is not the
// verdict on you. You have nothing left to protect. You are free to speak."
//
// VOICE-DELIVERY NOTE (for the by-ear pass):
// In seg 4, the clause "don't risk it, don't be the one who's wrong
// out loud" is the *quoted fear-voice's content*, not the coach's
// instruction — it should read as the voice being externalized
// ("when that voice tells you… — hear it for what it is"), not as
// a command. The coach is naming a thing, not instructing the athlete
// to do it.

import type { AudioScript } from "./types";
import {
  BREATH_INSTRUCTIONS,
  NARRATIVE_INSTRUCTIONS,
  SCRIPT_INSTRUCTIONS,
} from "./instructions.ts";

export const OPENER_BB_BE_VOCAL_SCRIPT: AudioScript = {
  slug: "opener-bb-be-vocal",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.1,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Drop your shoulders.",
      speed: 1.1,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Psalm 118 is a song of trust under pressure — the writer is surrounded and pushed hard, but because the Lord is with him, fear of people does not rule him.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Hear this from Psalm 118:6. The Lord is with me; I will not be afraid. What can people do to me?",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Fear wants you quiet. It tells you not to draw attention, not to be wrong out loud, not to look like you are trying too hard.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "But in Christ, you do not have to protect your image. You are already secure.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "So speak. I got ball. Screen left. Shot. Help. Box out. Cutter. Make your teammates play faster.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Talking is competing. Your voice moves the defense before the offense gets comfortable. It helps your team win.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "Be loud early. Be clear. Be steady. Let your voice lead the possession.",
      speed: 1.1,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1 },
  ],
};
