// Pilot guided-audio script — Forward × "I miss a scoring chance."
//
// Pre-rendered build-time MP3 per cell. This is the canonical pattern for
// the remaining 29 scripts (3 positions × 10 adversities). Segments 1-3
// and 8-9 are near-identical across all cells; 4-6 are position-specific;
// 7 is the position-adversity cell. The athlete's cue word, self-talk,
// and reset anchor surface on-screen during playback — they are NOT in
// the audio.
//
// Voice: "ash" — the From Victory mentor voice, same one used for the
// breath threshold. Script-level instructions in the 6-facet form steer
// toward a calm-vibe baseline; per-segment overrides (also 6-facet,
// because the API replaces — not merges — when an override is set) take
// over only where the register genuinely shifts.
//
// Per-segment `speed` overrides do most of the pacing work: active
// visualization segments (4-7) bump to 1.0; devotional segments (1, 3, 9)
// drop to 0.88-0.90 against the 0.95 script-level default.
//
// Per breath-threshold's lesson, overrides are used sparingly — only
// when a segment needs a register the script-level instruction does not
// already cover.
//
// Runtime target: ~5 minutes (~300s). Speech ~640 words at 150-180 wpm
// on ash at 0.95 playback ≈ 210-250s of speech. Silence segments add
// roughly 70s. Total should land in the 280-320s window.

import type { AudioScript } from "./types";

// Per-segment overrides REPLACE the script-level instruction entirely for
// that segment's API call (see scripts/generate-pregame-audio.ts L136 —
// `seg.instructions ?? script.instructions`). So each override below is
// a self-contained 6-facet block, not a delta. These four constants are
// the canonical override set for the guided session — segments 7-9 share
// the same shape across all 30 (position × adversity) cells, so the
// remaining 29 scripts will import the same overrides.

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

const VISUALIZATION_INSTRUCTIONS = `Voice Affect: Steady, present mentor walking the athlete through a mental rehearsal. Half a step more active than the meditative breath cues; not preachy, not hyped.

Tone: Confident and grounded. The voice that knows what the athlete is about to do and is calling each beat in advance.

Pacing: Deliberate. Each phrase is its own image — leave space for the athlete to actually see it, feel it, or rehearse it before the next phrase arrives. Pace as if guiding someone through a stretch routine, not reading a paragraph.

Emotion: Quiet confidence. The athlete is being walked through something they can already do; the voice steadies them, doesn't hype them.

Pronunciation: Clear and direct. Each sensory or action cue ("See the boards," "Three hard strides," "Win a puck race") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

const HARD_MOMENT_NARRATION_INSTRUCTIONS = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it.

Pronunciation: The false-story sentences ("I should have buried that," "I am letting the team down," "I am not a finisher") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Heat in your face" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story spiral, let the sentences arrive in quicker succession the way they do in the athlete's head, with only the smallest beat between.`;

const HARD_MOMENT_TRUTH_INSTRUCTIONS = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "real," "identity," and "information, not a verdict" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "Your mistake is real." / "It is not your identity." / "The chance is information, not a verdict."`;

const RESET_PLAN_INSTRUCTIONS = `Voice Affect: Coach voice. Clean and repeatable, the way a teammate would tap the five steps out for you on the bench.

Tone: Direct and focused. No warmth-bleed; this is the move, not the comfort.

Pacing: Five short cues with a long beat between each. Even, drilled, memorable. The pauses are part of the move, not gaps between sentences.

Emotion: Steady confidence. The voice that has run this move a thousand times.

Pronunciation: Each cue distinct and clean. Do not run them together.

Pauses: A long, clear beat between every cue — long enough for the athlete to mentally rehearse the step before the next one arrives. Do not run them together under any circumstances. Each cue must be heard, processed, and the image formed before the next cue begins. This is the most important facet for this register.`;

const NARRATIVE_INSTRUCTIONS = `Voice Affect: Engaged and present, like a trusted pastor or sermon-giver unpacking truth in real time — not a meditation guide, not a hype coach. Conversational depth with quiet conviction.

Tone: Sincere, warm, convicted. The speaker believes what they are saying and wants the athlete to receive it.

Pacing: Lively and conversational. Sermon-cadenced, not meditation-cadenced. Do not slow down for emphasis; let meaning land through clarity, not drag.

Emotion: Quiet conviction. Honest. No drama, no excess weight on individual words.

Pronunciation: Clear and engaged. Key phrases ("more than conquerors," "loved before you lace up," "you are already loved") land with the natural emphasis a sermon-giver would give them, not with artificial slowness.

Pauses: Natural sermon rhythm — beats between thoughts, not between every word. The script's typed silence segments handle structural pauses; let your sentences breathe at a conversational pace.`;

const PRAYER_INSTRUCTIONS = `Voice Affect: Devotional guide voice. As if the athlete is praying along, not being preached at.

Tone: Honest and grounded. Not eloquent. Not sentimental. Not sermon-cadenced.

Pacing: Slow, quiet, unhurried. The slowest segment in the session.

Emotion: Real before God. Quiet trust, not performance.

Pronunciation: "Father" and the key requests ("compete with courage," "respond well") land softly but clearly. No emphasis-for-effect anywhere.

Pauses: Generous. Let each sentence settle before the next one starts.`;

export const SESSION_FORWARD_MISSED_CHANCE_SCRIPT: AudioScript = {
  slug: "session-forward-missed-chance",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 0.95,
  segments: [
    // ── Regulate breath (Mentor, meditative)
    // Cell starts at breath section. Segment 1 (identity) is delivered by
    // the need-specific opener.mp3 stitched in front of this file at
    // runtime. See compositional architecture in audio/types.ts.
    {
      type: "speech",
      text: "Now, take two breaths. Four in. Six out.",
      mark: { phase: "settle" },
    },
    { type: "silence", durationSec: .8 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale. ",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 0 },
    },
    { type: "silence", durationSec: 6 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 1 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "exhale", round: 1 },
    },
    { type: "silence", durationSec: 6 },

    // ── Remember what is true (Devotional guide)
    // One Keller-tone line. Not a sermon. The gospel-anchored truth that
    // grounds the rest of the work.
    {
      type: "speech",
      text: "Remember what is true.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: .8 },
    {
      type: "speech",
      text: "The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },

    // ── Enter the rink (Mentor)
    // Familiarization imagery. Sensory. Forward-specific environment but
    // still recognizable to any skater on this team.
    // Structural split — one sensory image per speech segment so each
    // feeling gets its own beat. Compound "Feel your gloves, your stick,
    // the weight of your helmet" becomes three "Feel X" segments so the
    // tactile rehearsal lands on each item separately.
    {
      type: "speech",
      text: "Keep your eyes closed. See yourself running onto the ice.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "You smell the ice, the zamboni.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "Hear the skates carving in warmup.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2. },
    {
      type: "speech",
      text: "You feel your edges. Feel your gloves.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your stick.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your helmet.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You tell yourself, You belong here.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First shift (Coach)
    // Task imagery. Forward moves only. Direct, focused, disciplined.
    // Sharper register than the rink familiarization above.
    {
      type: "speech",
      text: "Now visualize you that your line is called.",
      speed: 1.0,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: .25 },
    // Structural pause splits — one sentence per speech segment with
    // explicit silence between, since instruction-only steering wasn't
    // getting strong enough beats from the model. Each cue gets its
    // own image.
    {
      type: "speech",
      text: "You hop the boards. You see the play",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },
    {
      type: "speech",
      text: "Three hard strides into the play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Your Eyes are up. you shoulder check.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Take the puck and make the simple, strong play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "Get back hard on the change.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach)
    // Forward scenes from ROLE_CONTENT. Narrated, not listed. Same
    // instructional register as First shift.
    {
      type: "speech",
      text: "See yourself win a puck race along the wall.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "you Get there first, get low, take the body.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "you make a play, Drive inside, hard to the net, shoot, and score.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now visualize the next play.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Your teamate has the puck, the puck turns over, you backcheck harder than everyone else and stop the goal.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Hard moment (Mentor → Coach)
    // THE adversity-specific segment for this cell. Coping imagery
    // template: See it → Feel it → Breathe → Speak truth → Take the
    // next faithful action. One false-story sentence in the athlete's
    // internal voice, not paragraphs. The collapse is shown, not
    // narrated from outside.
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: .4 },
    {
      type: "speech",
      text: "You are alone in the slot. The pass finds your tape. You shoot. It rings off the post.",
      speed: 1,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Heat in your face. I should have buried that.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale on the bench.",
      speed: 1,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell. The principle:
    // the last play is over, the move is to play the play you're in.
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Speak the truth. Your mistake is real. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
  

    // ── Reset plan (Coach)
    // The generic 5-step move. Framed as the universal pattern, not the
    // athlete's specific anchor / cue / self-talk (those are on-screen).
    {
      type: "speech",
      text: "This is the move. Every time. Whatever happens tonight.",
      speed: 1.0,
      mark: { phase: "reset" },
    },
    { type: "silence", durationSec: 1 },
    {
      type: "speech",
      text: "See it. Feel it. Breathe. Speak truth. Take the next faithful action.",
      speed: 1,
      instructions: RESET_PLAN_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },

    // ── Prayer / send-off (Devotional guide)
    // First-person, honest, not eloquent. No "amen." Lands the brand
    // spine — play from victory.
    {
      type: "speech",
      text: "Let's pray. Father, thank you that my worth was settled before this game and will hold after it. Help me compete with courage. Help me respond well when it gets hard. Help me serve my team. Whatever happens out there, help me to glorify you. In Jesus' name, Amen",
      speed: 1,
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "You are secure. Now play from victory.",
      speed: 1,
      mark: { phase: "done" },
    },
  ],
};
