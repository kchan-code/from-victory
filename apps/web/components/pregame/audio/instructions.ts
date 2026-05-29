// Shared "Calm Vibe" delivery instructions for the pregame audio TTS.
//
// OpenAI gpt-4o-mini-tts accepts a free-form `instructions` field that steers
// delivery across six facets (Voice Affect / Tone / Pacing / Emotion /
// Pronunciation / Pauses). These eight named blocks are the canonical,
// locked register for every opener and session cell. A script's top-level
// `instructions` sets the default; a segment's `instructions` overrides it
// for that one TTS call (see scripts/generate-pregame-audio.ts).
//
// Voice is locked at `ash`. When a cell needs scene-specific delivery cues
// (e.g. a goalie's "first-save" rehearsal, or false-story lines naming that
// cell's own thoughts), it imports the blocks it shares and declares a LOCAL
// override const for the one it tunes — so divergence stays visible and
// intentional, not copy-pasted drift.
//
// Single source of truth: edit a block here and regenerate audio (see the
// audio-regen steps in the handoff). Do NOT re-fork these per file.

export const SCRIPT_INSTRUCTIONS = `Voice Affect: Calm, composed, grounded. A trusted mentor sitting next to the athlete on headphones before a game — not a preacher, not a hype coach.

Tone: Sincere, warm, spiritually steady. Honest without being heavy. Confident without being hyped.

Pacing: Steady and moderate. Slower and more contemplative in devotional and prayer segments; a half-step more active in rink and first-shift visualization; meditative on breath cues.

Emotion: Genuine care and quiet confidence. Honest in the prayer; assured in the visualization; steady in the reset cues. Never performative, never urgent.

Pronunciation: Clear and precise. Land identity-anchoring phrases ("you are already loved," "your mistake is real," "play from victory") with weight, not emphasis. Breath cues fully voiced.

Pauses: Generous beats after weight-bearing sentences. Brief beats between Coach-voice cues. The script's typed silence segments carry structural pauses; let your sentence ends breathe naturally into them.`;

export const BREATH_INSTRUCTIONS = `Voice Affect: Calm, composed, grounded. A trusted mentor guiding the athlete through stillness — not a fitness instructor, not a preacher, not a meditation app narrator.

Tone: Warm, present, intimate. Spiritually steady without being sentimental. Not preachy. Not soft to the point of disappearing.

Pacing: Slow and unhurried. Each breath cue is a complete sentence, fully voiced, before the silence segment takes over. Do not rush.

Emotion: Quiet care. The athlete has their eyes closed; speak as if you know it. No performance, no hype, no urgency.

Pronunciation: Clear and gentle. Land "Inhale" and "Exhale" cleanly — fully voiced, never sharp, never rushed.

Pauses: The script's typed silence segments carry structural pauses. Let your sentence ends breathe naturally into them. A brief beat after each cue is enough.`;

export const NARRATIVE_INSTRUCTIONS = `Voice Affect: Engaged and present, like a trusted pastor or sermon-giver unpacking truth in real time — not a meditation guide, not a hype coach. Conversational depth with quiet conviction.

Tone: Sincere, warm, convicted. The speaker believes what they are saying and wants the athlete to receive it.

Pacing: Lively and conversational. Sermon-cadenced, not meditation-cadenced. Do not slow down for emphasis; let meaning land through clarity, not drag.

Emotion: Quiet conviction. Honest. No drama, no excess weight on individual words.

Pronunciation: Clear and engaged. Key phrases ("run with perseverance," "fixing our eyes on Jesus," "loved before you lace up") land with the natural emphasis a sermon-giver would give them, not with artificial slowness.

Pauses: Natural sermon rhythm — beats between thoughts, not between every word. The script's typed silence segments handle structural pauses; let your sentences breathe at a conversational pace.`;

export const VISUALIZATION_INSTRUCTIONS = `Voice Affect: Steady, present mentor walking the athlete through a mental rehearsal. Half a step more active than the meditative breath cues; not preachy, not hyped.

Tone: Confident and grounded. The voice that knows what the athlete is about to do and is calling each beat in advance.

Pacing: Deliberate. Each phrase is its own image — leave space for the athlete to actually see it, feel it, or rehearse it before the next phrase arrives. Pace as if guiding someone through a stretch routine, not reading a paragraph.

Emotion: Quiet confidence. The athlete is being walked through something they can already do; the voice steadies them, doesn't hype them.

Pronunciation: Clear and direct. Each sensory or action cue ("See the boards," "Three hard strides," "Win a puck race") lands cleanly on its own.

Pauses: A clear, audible pause between every short phrase. Give the athlete a full beat to mentally complete the image before the next one starts. The cues should feel like beads on a string with space between, not a continuous sentence. This is the most important facet for this register — do not run phrases together.`;

export const HARD_MOMENT_NARRATION_INSTRUCTIONS = `Voice Affect: Inside the athlete's experience — close, intimate, second-person. Less mentor-from-outside, more recognized internal voice.

Tone: Honest and unvarnished. Not dramatic. Not performative. The athlete recognizes this voice as their own.

Pacing: Steady. Do not slow down for emphasis on the false-story sentences; let them arrive plainly the way they actually would.

Emotion: Neutral observation, not pity. The naming of the collapse is the work; do not soften it. Whether the trigger is the athlete's own mistake or an outside voice (coach, parent, crowd), the spiral is named flatly without taking a side on whether it is justified.

Pronunciation: The false-story sentences land flat — no emphasis, no irony, no italics. Just the voice as it would arrive on the bench or in the crease.

Pauses: Two paces, in this order. (1) After each body-noticing observation — "Stomach drop," "Heat in your face" — pause clearly so the athlete actually notices what is named before the next observation arrives. (2) Then for the false-story sentence, let it arrive in the natural rhythm of the athlete's own head, with only the smallest beat before it.`;

export const HARD_MOMENT_TRUTH_INSTRUCTIONS = `Voice Affect: Coach voice — steadier and more grounded than the narration that preceded it. The register shift should be audible.

Tone: Direct, assured, not consoling. The athlete is being led out of the collapse, not coddled through it.

Pacing: Slightly more deliberate than the narration. Each truth-claim gets its own beat.

Emotion: Confident care. The voice that knows the move and is calling it.

Pronunciation: Land the event-naming sentence, "identity," and "reset and go again" with weight, not emphasis. Clear and grounded.

Pauses: A breath between each truth-claim.`;

export const RESET_PLAN_INSTRUCTIONS = `Voice Affect: Coach voice. Clean and repeatable, the way a teammate would tap the five steps out for you on the bench.

Tone: Direct and focused. No warmth-bleed; this is the move, not the comfort.

Pacing: Five short cues with a long beat between each. Even, drilled, memorable. The pauses are part of the move, not gaps between sentences.

Emotion: Steady confidence. The voice that has run this move a thousand times.

Pronunciation: Each cue distinct and clean. Do not run them together.

Pauses: A long, clear beat between every cue — long enough for the athlete to mentally rehearse the step before the next one arrives. Do not run them together under any circumstances. Each cue must be heard, processed, and the image formed before the next cue begins. This is the most important facet for this register.`;

export const PRAYER_INSTRUCTIONS = `Voice Affect: Devotional guide voice. As if the athlete is praying along, not being preached at.

Tone: Honest and grounded. Not eloquent. Not sentimental. Not sermon-cadenced.

Pacing: Slow, quiet, unhurried. The slowest segment in the session.

Emotion: Real before God. Quiet trust, not performance.

Pronunciation: "Father" and the key requests ("compete with courage," "respond well") land softly but clearly. No emphasis-for-effect anywhere.

Pauses: Generous. Let each sentence settle before the next one starts.`;
