// Pregame opener — Today's focus: "Calm."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Calm on the Today's Focus screen.
//
// Verse: Philippians 4:6-7 — peace beyond understanding.
// Why: The canonical anxiety/peace passage, written by Paul from a
// Roman prison. Honest about pressure (do not be anxious about
// anything), specific about the move (prayer + thanksgiving), and
// names the result (peace that guards the heart). Aligns with
// Wiersma's "regulate, do not suppress" — peace is not the absence of
// pressure.
// Identity truth: "Peace is not the absence of pressure. It is the
// presence of Christ when pressure comes."

import type { AudioScript } from "./types";

const SCRIPT_INSTRUCTIONS = `Voice Affect: Calm, composed, grounded. A trusted mentor sitting next to the athlete on headphones before a game — not a preacher, not a hype coach.

Tone: Sincere, warm, spiritually steady. Honest without being heavy. Confident without being hyped.

Pacing: Steady and moderate. Slower and more contemplative in devotional and prayer segments; a half-step more active in rink and first-shift visualization; meditative on breath cues.

Emotion: Genuine care and quiet confidence. Honest in the prayer; assured in the visualization; steady in the reset cues. Never performative, never urgent.

Pronunciation: Clear and precise. Land identity-anchoring phrases ("you are already loved," "your mistake is real," "play from victory") with weight, not emphasis. Breath cues fully voiced.

Pauses: Generous beats after weight-bearing sentences. Brief beats between Coach-voice cues. The script's typed silence segments carry structural pauses; let your sentence ends breathe naturally into them.`;

const BREATH_INSTRUCTIONS = `Voice Affect: Calm, composed, grounded. A trusted mentor guiding the athlete through stillness — not a fitness instructor, not a preacher, not a meditation app narrator.

Tone: Warm, present, intimate. Spiritually steady without being sentimental. Not preachy. Not soft to the point of disappearing.

Pacing: Slow and unhurried. Each breath cue is a complete sentence, fully voiced, before the silence segment takes over. Do not rush.

Emotion: Quiet care. The athlete has their eyes closed; speak as if you know it. No performance, no hype, no urgency.

Pronunciation: Clear and gentle. Land "Inhale" and "Exhale" cleanly — fully voiced, never sharp, never rushed.

Pauses: The script's typed silence segments carry structural pauses. Let your sentence ends breathe naturally into them. A brief beat after each cue is enough.`;

const NARRATIVE_INSTRUCTIONS = `Voice Affect: Engaged and present, like a trusted pastor or sermon-giver unpacking truth in real time — not a meditation guide, not a hype coach. Conversational depth with quiet conviction.

Tone: Sincere, warm, convicted. The speaker believes what they are saying and wants the athlete to receive it.

Pacing: Lively and conversational. Sermon-cadenced, not meditation-cadenced. Do not slow down for emphasis; let meaning land through clarity, not drag.

Emotion: Quiet conviction. Honest. No drama, no excess weight on individual words.

Pronunciation: Clear and engaged. Key phrases ("more than conquerors," "loved before you lace up," "you are already loved") land with the natural emphasis a sermon-giver would give them, not with artificial slowness.

Pauses: Natural sermon rhythm — beats between thoughts, not between every word. The script's typed silence segments handle structural pauses; let your sentences breathe at a conversational pace.`;

export const OPENER_CALM_SCRIPT: AudioScript = {
  slug: "opener-calm",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Let your shoulders drop.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote in Philippians 4. Not from a quiet life. From a Roman prison. Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Peace that transcends understanding does not mean you stop feeling nerves. It means a peace that does not match what is in front of you can guard you while you compete. The pressure is still real. So is the One holding you steady inside it.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Peace is not the absence of pressure. It is the presence of Christ when pressure comes.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
