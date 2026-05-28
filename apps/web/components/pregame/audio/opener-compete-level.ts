// Pregame opener — Today's focus: "Compete level."
//
// Replaces segment 1 of the locked pilot session when the athlete
// selects Compete level on the Today's Focus screen.
//
// Verse: Colossians 3:23-24 — whatever you do, work at it with all
// your heart, as working for the Lord.
// Why: The cleanest scriptural foundation for compete-level. Reframes
// effort as worship — not for the coach's approval, not for the stat
// line, but unto the Lord. Removes the audience pressure that makes
// athletes hold back. Vocation framework (Keller, "Every Good
// Endeavor").
// Identity truth: "You are not competing for an audience. You are
// competing for an Audience of One who already calls you His."

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

export const OPENER_COMPETE_LEVEL_SCRIPT: AudioScript = {
  slug: "opener-compete-level",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    {
      type: "speech",
      text: "Close your eyes. Sit forward.",
      speed: 1.0,
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "intro" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Listen to what Paul wrote in Colossians 3. Whatever you do, work at it with all your heart, as working for the Lord, not for human masters, since you know that you will receive an inheritance from the Lord as a reward. It is the Lord Christ you are serving.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Working for the Lord does not mean playing harder to earn his love. You already have it. It means every battle on the wall, every backcheck, every shift is offered up to the One who gave you the body to play. Effort becomes worship. The coach is not your final audience. God is.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "You are not competing for an audience. You are competing for an Audience of One who already calls you His.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
  ],
};
