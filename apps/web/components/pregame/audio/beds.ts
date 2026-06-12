// FV-227 — Music bed registry for the pregame session.
//
// Three synthesized ambient beds, each a seamless loop mastered to match
// each other in level. Athletes can choose one or none (silence) from a
// picker before the session starts.
//
// Architecture decisions (lead-binding per FV-227 brief):
//   - Beds are mixed into the runtime WAV blob client-side at a constant
//     linear gain, looped for the full playlist duration (~5 min).
//   - No dynamic ducking in v1 — constant low gain under the voice clips.
//   - One shared gain constant (BED_MIX_GAIN) — beds are mastered to equal
//     loudness so a single value works for all three.
//   - Files are content-addressed (bed-<id>.<hash8>.mp3) under /audio/beds/.
//     They do NOT live under /audio/pregame/ so they are outside the clips
//     manifest and SW /audio/pregame/* cache path (see FV-142 + sw.js audit
//     note in README.md alongside these assets).
//
// MANIFEST_VERSION / AUDIO_CACHE_BUST notes:
//   These beds have their own path (/audio/beds/) and are NOT clips.
//   They do NOT update MANIFEST_VERSION (that is clip-catalog-specific).
//   Phase 2 (frontend) must add /audio/beds/* to the SW audio cache path
//   and to audio-precache.ts to get offline coverage. See README.md.
//
// Client-side gain spec:
//   Voice clips land at -16.8 LUFS integrated (shared-opening reference).
//   Beds are mastered to -27 to -28 LUFS integrated (≈ -29 dBFS RMS mean).
//   Mix gap ≈ 10-11 dB. The recommended client-side linear gain is 0.35
//   (= -9.1 dB). This places the bed 9 dB under voice during speech, which
//   is imperceptible as masking but clearly audible as ambience during
//   breathing pauses and silences.
//
//   If the client mixes via Web Audio GainNode, set gainNode.gain.value = 0.35.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BedId = "still" | "pulse" | "rise" | "rain" | "stream" | "grace";

export type Bed = {
  /** Internal id used for resolving the asset URL and serializing state. */
  readonly id: BedId;
  /** Short athlete-facing label for the picker (≤ 10 chars, calm register). */
  readonly label: string;
  /** One-sentence description for the picker tooltip / accessibility label. */
  readonly description: string;
  /** Public URL path to the content-addressed MP3. */
  readonly path: string;
  /** Loop duration in seconds (as encoded — the client loops at this boundary). */
  readonly loopDurationSec: number;
  /**
   * Recommended client-side linear gain to mix under -16.8 LUFS voice clips.
   * All three beds share this value (they are mastered to equal loudness).
   * Apply via Web Audio GainNode: gainNode.gain.value = recommendedGain.
   */
  readonly recommendedGain: number;
};

// ---------------------------------------------------------------------------
// Shared mix gain constant
//
// Beds are mastered to ≈ -29 dBFS mean / -27 to -28 LUFS integrated.
// Voice clips are ≈ -20.5 dBFS mean / -16.8 LUFS integrated.
// Gap ≈ 8.5 dB (RMS) / ~10.5 dB (LUFS).
//
// At client-side gain 0.35 (= -9.1 dB), the summed bed sits ≈ 9 dB under
// voice — firmly in "ambience, not distraction" territory.
// ---------------------------------------------------------------------------
export const BED_MIX_GAIN = 0.35;

// ---------------------------------------------------------------------------
// Bed catalog
//
// Copy is flagged for KC/lead review — short labels and descriptions proposed
// by audio-engineer as candidates, not final.
// ---------------------------------------------------------------------------
export const BEDS: readonly Bed[] = [
  {
    id: "still",
    // COPY CANDIDATE (KC review): "Still" — calm, single word, no spiritual freight
    label: "Still",
    description: "Warm sustained tone — near-static, for calm focus.",
    path: "/audio/beds/bed-still.04f1b7b9.mp3",
    loopDurationSec: 68,
    recommendedGain: BED_MIX_GAIN,
  },
  {
    id: "pulse",
    // COPY CANDIDATE (KC review): "Pulse" — implies the rhythmic heartbeat element
    label: "Pulse",
    description: "Same warmth with a slow rhythmic element, like a settled heartbeat.",
    path: "/audio/beds/bed-pulse.153b2ff8.mp3",
    loopDurationSec: 71,
    recommendedGain: BED_MIX_GAIN,
  },
  {
    id: "rise",
    // COPY CANDIDATE (KC review): "Rise" — implies the gradual build
    label: "Rise",
    description: "Starts sparse and gradually layers in — builds through the opening.",
    path: "/audio/beds/bed-rise.6af32fd2.mp3",
    loopDurationSec: 70,
    recommendedGain: BED_MIX_GAIN,
  },
  {
    id: "rain",
    // COPY CANDIDATE (KC review): "Rain" — clear sensory label, natural/calming
    label: "Rain",
    description: "Soft rainfall — warm noise bed with the speech band carved out.",
    path: "/audio/beds/bed-rain.46ab1a7d.mp3",
    loopDurationSec: 90,
    recommendedGain: BED_MIX_GAIN,
  },
  {
    id: "stream",
    // COPY CANDIDATE (KC review): "Stream" — evokes flowing water, peaceful
    label: "Stream",
    description: "Burbling water — drifting resonant peaks, like a rocky stream.",
    path: "/audio/beds/bed-stream.d146d7d6.mp3",
    loopDurationSec: 80,
    recommendedGain: BED_MIX_GAIN,
  },
  {
    id: "grace",
    // COPY CANDIDATE (KC review): "Amazing Grace" — explicit hymn title is the right
    // athlete-facing label here; the tune is recognizable and the faith connection is
    // intentional. Keep it explicit rather than euphemistic.
    label: "Amazing Grace",
    description: "Fragmentary hymn phrases on a warm pad — widely spaced so the melody rests between lines.",
    path: "/audio/beds/bed-grace.13c87e8b.mp3",
    loopDurationSec: 88,
    recommendedGain: BED_MIX_GAIN,
  },
] as const;

/** Look up a bed by id. Returns undefined for unknown ids (e.g. null/"silence"). */
export function getBed(id: string | null | undefined): Bed | undefined {
  if (!id) return undefined;
  return BEDS.find((b) => b.id === id);
}
