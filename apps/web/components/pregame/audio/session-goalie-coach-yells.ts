// Pilot guided-audio script — Goalie × "Coach yells."
//
// SECOND pilot. Mirrors the canonical structure locked in
// session-forward-missed-chance.ts. Shares the canonical
// voice-instruction blocks via ./instructions.ts, with cell-specific
// SCRIPT / VISUALIZATION / HARD_MOMENT overrides kept local below. Same 9-segment shape. Same
// runtime target (~5:20 / 320s).
//
// What's identical to the Forward pilot:
//   - Segments 1-3 (Receive identity + breath + Remember what is true)
//   - Segment 8 (Reset plan)
//   - Segment 9 (Prayer + send-off)
//
// What's cell-specific:
//   - Segment 4 (Enter the rink): goalie sensory frame — crease, cage,
//     pads, blocker/glove, goal line, anthem, water bottle
//   - Segment 5 (First save, not first shift): puck drop, first shot,
//     first rebound, settling in. Phase mark stays `firstShift` for
//     backward compatibility; conceptually it is "first save" here.
//   - Segment 6 (Role rehearsal): ROLE_CONTENT.Goalie scenes verbatim
//   - Segment 7 (Hard moment): EXTERNAL adversity — coach yells. The
//     false-story spiral is about the coach's view of the goalie and
//     what it means for status / role / future on the team. Not about
//     the goalie's own performance.
//
// Voice + speed defaults match the Forward pilot exactly.
// Athlete's cue word, self-talk, and reset anchor surface on-screen
// during playback — they are NOT in the audio.

import type { AudioScript } from "./types";
import {
  CLOSING,
  OPENING,
} from "./segments.ts";


// Per-segment overrides REPLACE the script-level instruction entirely for
// that segment's API call. The canonical instruction blocks live in
// ./instructions.ts; the consts below stay LOCAL on purpose — their cues
// and example phrases are tuned to this goalie scene (first-save rehearsal,
// the "He is going to pull me" spiral), so they intentionally diverge from
// the shared register rather than import it.

const SCRIPT_INSTRUCTIONS = `Voice Affect: Calm, composed, grounded. A trusted mentor sitting next to the athlete on headphones before a game — not a preacher, not a hype coach.

Tone: Sincere, warm, spiritually steady. Honest without being heavy. Confident without being hyped.

Pacing: Steady and moderate. Slower and more contemplative in devotional and prayer segments; a half-step more active in rink and first-save visualization; meditative on breath cues.

Emotion: Genuine care and quiet confidence. Honest in the prayer; assured in the visualization; steady in the reset cues. Never performative, never urgent.

Pronunciation: Clear and precise. Land identity-anchoring phrases ("you are already loved," "the coach is loud," "play from victory") with weight, not emphasis. Breath cues fully voiced.

Pauses: Generous beats after weight-bearing sentences. Brief beats between Coach-voice cues. The script's typed silence segments carry structural pauses; let your sentence ends breathe naturally into them.`;

const VISUALIZATION_INSTRUCTIONS = `Voice Affect: Steady, present mentor walking the athlete through a mental rehearsal. Half a step more active than the meditative breath cues; not preachy, not hyped.

Tone: Confident and grounded. The voice that knows what the athlete is about to do and is calling each beat in advance.

Pacing: Deliberate. Each phrase is its own image — leave space for the athlete to actually see it, feel it, or rehearse it before the next phrase arrives. Pace as if guiding someone through a stretch routine, not reading a paragraph.

Emotion: Quiet confidence. The athlete is being walked through something they can already do; the voice steadies them, doesn't hype them.

Pronunciation: Clear and direct. Each sensory or action cue ("See the crease," "Set your feet," "Track the puck") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

const HARD_MOMENT_NARRATION_INSTRUCTIONS = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it. Whether the trigger is the athlete's own mistake or an outside voice (coach, parent, crowd), the spiral is named flatly without taking a side on whether it is justified.

Pronunciation: The false-story sentences ("He does not trust me," "He is going to pull me," "I am losing my spot") land flat — no emphasis, no irony, no italics. Just the voice as it would arrive in the crease.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Tight jaw," "Heat in your chest" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story spiral, let the sentences arrive in quicker succession the way they do in the athlete's head, with only the smallest beat between.`;

const HARD_MOMENT_TRUTH_INSTRUCTIONS = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land "loud," "identity," and "information, not a verdict" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim — "The coach is loud." / "It is not your identity." / "His voice is information, not a verdict."`;

export const SESSION_GOALIE_COACH_YELLS_SCRIPT: AudioScript = {
  slug: "session-goalie-coach-yells",
  voice: "ash",
  instructions: SCRIPT_INSTRUCTIONS,
  speed: 1.0,
  segments: [
    ...OPENING,


    // ── Enter the rink (Mentor) — GOALIE SENSORY
    // Goalie's pre-game frame: crease, cage, blocker + glove, pads,
    // anthem, water bottle on the back of the net. Structural split —
    // one sensory image per speech segment so each beat lands.
    {
      type: "speech",
      text: "See the crease.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
      mark: { phase: "rink" },
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "The blue paint under your skates.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.0 },
    {
      type: "speech",
      text: "The crossbar behind your head.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Hear the anthem fade out.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Feel your glove.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel your blocker.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.2 },
    {
      type: "speech",
      text: "Feel the weight of your pads, settled and ready.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "You belong here.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.25 },

    // ── First save (Coach) — GOALIE-SPECIFIC
    // No shifts for a goalie. Reframe as the opening minutes / first
    // shot / first rebound. Same Coach register as Forward first-shift.
    {
      type: "speech",
      text: "Puck drops.",
      speed: 1.0,
      mark: { phase: "firstShift" },
    },
    { type: "silence", durationSec: 0.25 },
    {
      type: "speech",
      text: "Set your feet in the crease.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Square to the shooter.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Track the puck all the way in.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Make the first save, calm and big.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Control the rebound. Cover, or steer it to the corner.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Reset. Eyes back to the puck.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },

    // ── Role rehearsal (Coach) — GOALIE
    // ROLE_CONTENT.Goalie scenes verbatim. Same instructional register
    // as First save. Per Forward template: no intro line, no separate
    // phase mark — flows directly from First save.
    {
      type: "speech",
      text: "Set your feet.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Track the puck.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Control the rebound.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Reset after traffic.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Next shot only.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },


    // ── Hard moment (Mentor → Coach) — EXTERNAL ADVERSITY
    // Coach yells. The collapse pattern differs from the Forward pilot:
    // the false story is not about a missed performance moment, it is
    // about the coach's view of the goalie and what it means for status
    // / role / future on the team. Coping imagery template still holds:
    // See it → Feel it → Breathe → Speak truth → Take the next faithful
    // action.
    {
      type: "speech",
      text: "Now rehearse the hard moment.",
      speed: 1.0,
      mark: { phase: "hardMoment" },
    },
    { type: "silence", durationSec: 0.4 },
    {
      type: "speech",
      text: "A goal goes in. The whistle blows. You hear your coach from the bench. Loud. Sharp. Maybe your name. Maybe not. The whole rink can hear it.",
      speed: 1.0,
      instructions: VISUALIZATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    {
      type: "speech",
      text: "Feel what your body does. Tight jaw. Heat in your chest. He does not trust me.",
      speed: 1.2,
      instructions: HARD_MOMENT_NARRATION_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 2.0 },
    {
      type: "speech",
      text: "Now the reset. One long exhale in your crease.",
      speed: 1.0,
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
      text: "Speak the truth. The coach is loud. It is not your identity. Reset and go again.",
      speed: 1.2,
      instructions: HARD_MOMENT_TRUTH_INSTRUCTIONS,
    },
    { type: "silence", durationSec: 1.5 },
    ...CLOSING,
  ],
};
