// Pilot guided-audio script — Defense × "I get beaten wide."
//
// THIRD pilot. Completes position coverage (Forward + Goalie + Defense)
// and validates the canonical template across all three positions.
// Mirrors the structure locked in session-forward-missed-chance.ts.
// Same 7 voice-instruction blocks (duplicated below — will refactor to
// a shared module once this third pilot confirms the pattern holds).
// Same 9-segment shape. Same runtime target (~4:45-4:55).
//
// What's identical to Forward + Goalie:
//   - Segments 1-3 (Receive identity + breath + Remember what is true)
//   - Segment 8 (Reset plan)
//   - Segment 9 (Prayer + send-off)
//
// What's cell-specific:
//   - Segment 4 (Enter the rink): Defense is a skater like the Forward,
//     so the sensory frame is lifted from the Forward pilot verbatim.
//     Same pre-game experience; no reason to drift.
//   - Segment 5 (First shift): D-specific action cues — hop the boards,
//     get to your gap, shoulder check, see the play, hold your line and
//     make a simple first pass, box out and go again.
//   - Segment 6 (Role rehearsal): ROLE_CONTENT.Defense scenes — shoulder
//     check, retrieve the puck, make the first pass, hold your gap,
//     box out.
//   - Segment 7 (Hard moment): D-zone scene — beaten wide, lose the
//     angle, puck carrier gets behind you.
//
// KC D-coaching note (2026-05-26) — the reason this cell departs from
// the canonical hard-moment template by ONE segment:
//
//     "In the reset, it's important that the d man doesn't tighten up
//      and back up too much. Then it's hard to control gap and you
//      become slow to react when tight."
//
// The D-man's instinctive overreaction to being beaten wide (tense up,
// skate backward) is the very thing that compounds the problem: poor
// gap, slow reactions, more beats wide. So this cell inserts a single
// extra "tactical reset" segment between the body reset and the
// identity reset — three short corrective cues ("Stay loose. Don't
// back up. Hold your gap.") in the Coach-on-the-bench register. This
// addition is CELL-SPECIFIC and intentional. Do not propagate it to
// the Forward or Goalie templates; their hard-moment collapses do not
// have an equivalent body-mechanical overreaction that compounds.
//
// Voice + speed defaults match the Forward pilot exactly.
// Athlete's cue word, self-talk, and reset anchor surface on-screen
// during playback — they are NOT in the audio.

import type { AudioScript } from "./types";

// Per-segment overrides REPLACE the script-level instruction entirely
// for that segment's API call. Duplicated from
// session-forward-missed-chance.ts for the pilot phase; will be
// hoisted to a shared module now that a third pilot confirms the
// pattern holds.

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

Pronunciation: Clear and direct. Each sensory or action cue ("Get to your gap," "Shoulder check," "Hold your line") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

const HARD_MOMENT_NARRATION_INSTRUCTIONS = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it.

Pronunciation: The false-story sentences ("I lost my gap," "He blew by me," "I am a step slow tonight") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Burn in your chest" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story sentence, let it arrive in the natural rhythm of the athlete's own head, with only the smallest beat before it.`;

const HARD_MOMENT_TRUTH_INSTRUCTIONS = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "real," "identity," and "reset and go again" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "Your mistake is real." / "It is not your identity." / "Reset and go again."`;

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

export const SESSION_DEFENSE_BEATEN_WIDE_SCRIPT: AudioScript = {
  slug: "session-defense-beaten-wide",
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
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "Inhale.",
      instructions: BREATH_INSTRUCTIONS,
      mark: { phase: "inhale", round: 0 },
    },
    { type: "silence", durationSec: 4 },
    {
      type: "speech",
      text: "Exhale.",
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
    // Identical to the Forward + Goalie pilots. One Keller-tone line.
    {
      type: "speech",
      text: "Remember what is true.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 0.8 },
    {
      type: "speech",
      text: "The worst game you ever play does not lower your standing with God. The best game you ever play does not raise it. You are loved before you lace up. You are loved after the final horn.",
      speed: 1.0,
      instructions: NARRATIVE_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },

    // ── Enter the rink (Mentor) — SKATER SENSORY
    // Defense and Forward share the pre-game gear/sensory experience,
    // so this block is lifted verbatim from the Forward pilot. One
    // sensory image per speech segment.
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
    { type: "silence", durationSec: 2.0 },
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

    // ── First shift (Coach) — DEFENSE
    // D-specific action cues. Forwards drive offense; D-men hold gap,
    // retrieve, make the first pass, box out. Same Coach register as
    // Forward first-shift. One cue per speech segment.
    {
      type: "speech",
      text: "Now visualize that your line is called.",
      speed: 1.0,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 0.25 },
    {
      type: "speech",
      text: "You hop the boards. Get to your gap.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Shoulder check before the puck arrives.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "See the play develop.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Hold your line. Make a simple first pass.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Box out at the net front. Go again.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — DEFENSE
    // ROLE_CONTENT.Defense scenes — shoulder check, retrieve the puck,
    // make the first pass, hold your gap, box out. Per Forward template:
    // no intro line, no separate phase mark — flows directly from First
    // shift. KC's "you do X" framing carried through.
    {
      type: "speech",
      text: "See yourself shoulder check before you pick up the puck.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You retrieve the puck, calm and strong.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You make the first pass, clean and on the tape.",
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
      text: "You hold your gap, you stay between the man and the net, and you box out in front.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Hard moment (Mentor → Coach) — DEFENSE × BEATEN WIDE
    // Coping imagery template: See it → Feel it → Breathe → Speak truth.
    // Reset Plan (segment 8) handles "next faithful action."
    //
    // CELL-SPECIFIC ADDITION (KC D-coaching note, 2026-05-26): a single
    // extra "tactical reset" beat between the body reset and the
    // identity reset. The D-man's instinctive overreaction to being
    // beaten wide is to tense up and skate backward — which destroys
    // gap and slows reactions, compounding the problem. Three short
    // corrective cues drilled into the moment: "Stay loose. Don't back
    // up. Hold your gap." Coach-on-the-bench register. Do NOT propagate
    // this segment to Forward or Goalie templates.
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "You are back in your zone. The puck carrier comes wide. He has speed. You lose the angle. He has a step on you.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Stomach drop. Burn in your chest. I lost my gap.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale on the bench.",
      speed: 1.0,
    },
    { type: "silence", durationSec: 2.0 },
    // Canonical tactical reset — applies to every cell. The principle:
    // the last play is over, the move is to play the play you're in.
    // Wiersma-style "repeatable response system" in one line.
    {
      type: "speech",
      text: "The last play is over. Reset and play the play you're in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    // Cell-specific tactical addition (KC D-coaching note 2026-05-26).
    // D-man's reflexive overreaction to being beaten wide is to tighten
    // up + skate backward, which destroys gap and slows reactions. Three
    // short corrective cues drilled into the moment.
    {
      type: "speech",
      text: "Stay loose. Don't back up. Hold your gap.",
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
    // Identical to the Forward + Goalie pilots. The generic 5-step move.
    {
      type: "speech",
      text: "This is the move. Every time. Whatever happens tonight.",
      speed: 1.0,
      mark: { phase: "reset" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "See it. Feel it. Breathe. Speak truth. Take the next faithful action.",
      speed: 1.0,
      instructions: RESET_PLAN_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.5 },

    // ── Prayer / send-off (Devotional guide)
    // Identical to the Forward + Goalie pilots. "Let's pray." prefix +
    // Christian close ending with "In Jesus' name, Amen." Lands the
    // brand spine — play from victory.
    {
      type: "speech",
      text: "Let's pray. Father, thank you that my worth was settled before this game and will hold after it. Help me compete with courage. Help me respond well when it gets hard. Help me serve my team. Whatever happens out there, help me to glorify you. In Jesus' name, Amen",
      speed: 1.0,
      instructions: PRAYER_INSTRUCTIONS,
      mark: { phase: "prayer" },
    },
    { type: "silence", durationSec: 2.5 },
    {
      type: "speech",
      text: "You are secure. Now play from victory.",
      speed: 1.0,
      mark: { phase: "done" },
    },
  ],
};
