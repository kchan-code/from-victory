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
