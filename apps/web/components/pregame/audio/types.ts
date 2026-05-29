// Shared types for the build-time audio pipeline.
//
// A script is a typed sequence of speech + silence segments. The generator
// (apps/web/scripts/generate-pregame-audio.ts) turns it into one final MP3
// plus a sidecar JSON timeline that the runtime uses to sync visuals
// (BreathingSphere, transcript scroll) to audio playback.

export type Phase =
  | "intro"
  | "inhale"
  | "exhale"
  | "settle"
  // ── Guided-session phases (segments 4-9 of the 5-min session)
  | "rink"
  | "firstShift"
  | "roleRehearsal"
  | "hardMoment"
  | "reset"
  | "prayer"
  | "done";

export type PhaseMark = {
  // Logical phase the segment starts. Runtime maps this back onto the
  // BreathingSphere's animation state machine.
  phase: Phase;
  // Optional round index (0-based) for breathing phases. Lets the sphere
  // light up the correct round pip.
  round?: number;
};

export type Segment =
  | {
      type: "speech";
      text: string;
      // Voice-instruction override for this segment only (e.g. softer for
      // "Receive", slower for the prayer). Defaults to the script-level
      // instruction.
      instructions?: string;
      // Per-segment speed override (0.25..4.0). Lets the intro run
      // closer to conversational pace while breath cues stay at the
      // meditative script-level default.
      speed?: number;
      // If present, marks this segment's *start* as a new phase boundary
      // in the emitted timeline.
      mark?: PhaseMark;
    }
  | {
      type: "silence";
      durationSec: number;
      mark?: PhaseMark;
    };

export type AudioScript = {
  // File slug — generator writes `${slug}.mp3` and `${slug}.json`.
  slug: string;
  // gpt-4o-mini-tts voice. Default for From Victory is "ash" (warm,
  // grounded mentor). Override per script if needed.
  voice: "ash" | "onyx" | "sage" | "alloy" | "echo" | "fable" | "nova" | "shimmer" | "coral";
  // Per-script voice instruction. gpt-4o-mini-tts supports steering the
  // delivery via natural language.
  instructions: string;
  // 0.25..4.0 — TTS playback speed. Default 1.0; mentor pace usually 0.95.
  speed?: number;
  segments: Segment[];
  // Optional ffmpeg audio-filter chain applied once to the final
  // concatenated MP3 (the generator re-encodes instead of stream-copying
  // when this is set). Used to correct the tonal balance of a render —
  // e.g. breath-threshold came out thin/tinny relative to the other files,
  // so it gets a warming EQ here. Keep in sync with any manual
  // post-process applied to the committed MP3.
  postFilter?: string;
};

// Sidecar timeline JSON — emitted by the generator alongside the MP3 so
// runtime visuals don't have to guess phase timestamps.
export type AudioTimeline = {
  slug: string;
  durationSec: number;
  phases: Array<{
    phase: Phase;
    startSec: number;
    round?: number;
  }>;
};
