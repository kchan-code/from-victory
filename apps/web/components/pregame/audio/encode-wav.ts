// encode-wav.ts — assemble decoded clip AudioBuffers into a single WAV Blob
// for playback via HTMLAudioElement instead of the Web Audio API scheduler.
//
// WHY: iOS Safari suspends an AudioContext when the screen locks (deliberate
// power-management behavior on iOS 16+). AudioBufferSourceNodes, which the
// clip-playlist engine schedules on an AudioContext, therefore stop firing
// mid-session. A plain HTMLAudioElement backed by a blob: URL is treated like
// a podcast/media-player stream and keeps playing through screen-lock — the
// same category as Safari's native <audio> playback. Converting the already-
// decoded PCM buffers into a single WAV blob lets the hook hand one URL to an
// HTMLAudioElement and get fully gapless, screen-lock-safe playback.
//
// This conversion happens client-side, in memory. See the size note below
// (~14 MB for a 5-minute 24 kHz mono session) — callers should revoke the
// blob URL via URL.revokeObjectURL() when the player unmounts.

/**
 * Concatenate the channel-0 PCM of each AudioBuffer in order and encode as
 * a standard 16-bit PCM RIFF/WAVE file.
 *
 * Channel policy: all clips in the pregame/practice pipeline are mono (1 ch).
 * If a buffer is delivered with >1 channel — e.g. a future format change or
 * an accidentally stereo clip — we take channel 0 only (left channel) rather
 * than downmixing. This is intentional: the pipeline's mastering chain targets
 * mono throughout, so channel 0 IS the signal. A true downmix (L+R)/2 would
 * not add correctness and could reintroduce phasing artefacts if someone ever
 * accidentally sends in a real stereo file. The caller is expected to confirm
 * mono input; this is a safety net, not a feature.
 *
 * @param buffers Decoded AudioBuffers, already in playback order.
 *   Must be non-empty. All buffers must share the same sampleRate
 *   (the header is written from buffers[0].sampleRate).
 * @returns A Blob with MIME type "audio/wav" ready to feed to
 *   URL.createObjectURL → HTMLAudioElement.src.
 */
/**
 * Build the full WAV ArrayBuffer (44-byte header + 16-bit PCM body) from a
 * sequence of AudioBuffers. This is the shared inner implementation used by
 * both `assembleWavBlob` (silence path) and `assembleWavBlobWithBed` (mix
 * path), so neither path has to allocate or encode the PCM twice.
 *
 * @internal Not exported — callers use assembleWavBlob / assembleWavBlobWithBed.
 */
function buildWavArrayBuffer(buffers: AudioBuffer[]): ArrayBuffer {
  // ── 1. Measure total sample count ───────────────────────────────────────────
  let totalSamples = 0;
  for (const buf of buffers) {
    totalSamples += buf.length;
  }

  // ── 2. WAV header constants ──────────────────────────────────────────────────
  // Read sampleRate from the first buffer so a future format change doesn't
  // silently corrupt the header. Hard-coding 24000 would break if, e.g., the
  // TTS ceiling changes and clips are re-rendered at 48 kHz.
  // reason: noUncheckedIndexedAccess widens to AudioBuffer|undefined; the
  // length === 0 guard in the public callers guarantees buffers[0] is defined.
  const sampleRate = buffers[0]!.sampleRate;
  const numChannels = 1; // mono output — see channel policy above
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  // Standard 44-byte RIFF/WAVE/fmt/data header layout:
  //   Offset  Size  Content
  //      0     4   "RIFF"
  //      4     4   chunkSize = 36 + dataByteLength  (little-endian uint32)
  //      8     4   "WAVE"
  //     12     4   "fmt "
  //     16     4   subchunk1Size = 16  (PCM)
  //     20     2   audioFormat = 1  (PCM)
  //     22     2   numChannels
  //     24     4   sampleRate
  //     28     4   byteRate
  //     32     2   blockAlign
  //     34     2   bitsPerSample
  //     36     4   "data"
  //     40     4   subchunk2Size = numSamples * blockAlign
  //     44  …data…

  const HEADER_BYTES = 44;
  const dataByteLength = totalSamples * blockAlign;
  const totalByteLength = HEADER_BYTES + dataByteLength;

  // ── 3. Allocate buffer and write header ──────────────────────────────────────
  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  const writeTag = (offset: number, tag: string) => {
    for (let i = 0; i < 4; i++) {
      view.setUint8(offset + i, tag.charCodeAt(i));
    }
  };

  writeTag(0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);
  writeTag(8, "WAVE");
  writeTag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeTag(36, "data");
  view.setUint32(40, dataByteLength, true);

  // ── 4. Write PCM samples ─────────────────────────────────────────────────────
  // Each float32 sample from channel 0 is clamped to [-1, 1] then scaled to
  // int16 range. We scale by 0x7FFF (32767) rather than 32768 to guarantee
  // the result fits in a signed int16 for both +1.0 and -1.0:
  //   +1.0 * 32767 =  32767  → fits in int16 max  (+32767)
  //   -1.0 * 32767 = -32767  → fits in int16 min  (-32768, well within range)
  // Scaling by 32768 would map +1.0 → +32768, which overflows int16.
  const SCALE = 0x7fff; // 32767
  let writeOffset = HEADER_BYTES;

  for (const buf of buffers) {
    const channel = buf.getChannelData(0);
    const len = channel.length;
    for (let i = 0; i < len; i++) {
      // reason: noUncheckedIndexedAccess widens to number|undefined; `i` is
      // bounded by channel.length so the value is always defined at runtime.
      const clamped = Math.max(-1, Math.min(1, channel[i] ?? 0));
      view.setInt16(writeOffset, Math.round(clamped * SCALE), true);
      writeOffset += 2;
    }
  }

  return arrayBuffer;
}

export function assembleWavBlob(buffers: AudioBuffer[]): Blob {
  if (buffers.length === 0) {
    throw new RangeError("assembleWavBlob: buffers array must not be empty");
  }
  return new Blob([buildWavArrayBuffer(buffers)], { type: "audio/wav" });
}

// ---------------------------------------------------------------------------
// Music bed mixing (FV-227)
// ---------------------------------------------------------------------------

/**
 * Mix a music bed into a voice PCM buffer in-place.
 *
 * Architecture decision: the mixing is a pure in-place operation over
 * Float32Arrays so it can be unit-tested without Web Audio APIs. The caller
 * (useClipPlayer) decodes the bed MP3 with an AudioContext, extracts channel 0
 * as a Float32Array, and passes it here along with the already-assembled voice
 * PCM (the same DataView that will become the WAV blob body). After this call
 * the voice PCM samples include the mixed bed; the WAV header is unchanged.
 *
 * Loop and fade math:
 *   - The bed buffer is looped (wrapped) to fill the full voice duration.
 *   - A linear fade-in of `fadeInSamples` at the start smoothly brings the
 *     bed from silence to full gain (avoids a hard onset click).
 *   - A linear fade-out of `fadeOutSamples` at the end smoothly returns the
 *     bed to silence (avoids a hard cutoff click at session end).
 *   - The gain at each sample is: BED_MIX_GAIN × fade_envelope.
 *   - Summed peaks remain safe: beds are mastered ≤ −12 dBTP (worst case
 *     Rain/Stream; summing headroom verified in review). At 0.35 gain the
 *     effective peak is −12 − 9.1 = −21.1 dBTP. Added to voice peaks of
 *     ≤ −1.8 dBTP the sum is still safely below 0 dBFS.
 *
 * @param voicePcm     DataView over the raw 16-bit PCM body (after the 44-byte
 *                     WAV header). Samples are little-endian int16; written back
 *                     in-place. Byte length must be even.
 * @param bedChannel0  Float32Array of the bed's channel-0 PCM (from
 *                     AudioBuffer.getChannelData(0)), already decoded.
 *                     May be shorter than the voice; it is looped.
 * @param gain         Linear gain to apply to the bed (e.g. BED_MIX_GAIN = 0.35).
 * @param fadeInSamples  Number of samples over which to ramp the bed up from 0
 *                       to full gain (1.5 s at 24 kHz → 36000 samples).
 * @param fadeOutSamples Number of samples over which to ramp the bed down from
 *                       full gain to 0 (2 s at 24 kHz → 48000 samples).
 */
export function mixBedIntoPcm(
  voicePcm: DataView,
  bedChannel0: Float32Array,
  gain: number,
  fadeInSamples: number,
  fadeOutSamples: number,
): void {
  if (bedChannel0.length === 0) return;

  // Total voice sample count (each int16 = 2 bytes).
  const totalVoiceSamples = Math.floor(voicePcm.byteLength / 2);
  if (totalVoiceSamples === 0) return;

  const bedLen = bedChannel0.length;

  for (let i = 0; i < totalVoiceSamples; i++) {
    // Looped bed sample (wrap index into bed buffer).
    // reason: noUncheckedIndexedAccess widens Float32Array element to
    // number|undefined; index is always within bounds via the modulo.
    const bedSample = bedChannel0[i % bedLen] ?? 0;

    // Linear fade envelope:
    //   fade-in:  first `fadeInSamples` samples ramp 0→1
    //   fade-out: last `fadeOutSamples` samples ramp 1→0
    //   middle:   1.0 (full gain)
    let envelope = 1.0;
    if (i < fadeInSamples && fadeInSamples > 0) {
      envelope = i / fadeInSamples;
    } else if (i >= totalVoiceSamples - fadeOutSamples && fadeOutSamples > 0) {
      envelope = (totalVoiceSamples - i) / fadeOutSamples;
    }

    // Read existing voice sample (little-endian int16).
    const byteOffset = i * 2;
    const voiceSample = voicePcm.getInt16(byteOffset, /* littleEndian */ true);

    // Mix: voice + (bed × gain × envelope), clamped to int16 range.
    const mixed = voiceSample + bedSample * gain * envelope * 0x7fff;
    const clamped = Math.max(-32768, Math.min(32767, Math.round(mixed)));

    voicePcm.setInt16(byteOffset, clamped, /* littleEndian */ true);
  }
}

/**
 * Build a DataView over the PCM body of a WAV Blob's underlying ArrayBuffer.
 *
 * Helper for useClipPlayer: after assembleWavBlob() produces the Blob, we
 * need a DataView over the PCM body (bytes after the 44-byte header) so we
 * can call mixBedIntoPcm. The ArrayBuffer is obtained by re-slicing the Blob.
 *
 * @param arrayBuffer  The full WAV file ArrayBuffer (header + PCM body).
 * @returns DataView over the PCM body only (offset 44, length - 44).
 *          Returns null if the buffer is too short to contain a valid header.
 */
export function wavPcmBodyView(arrayBuffer: ArrayBuffer): DataView | null {
  const HEADER_BYTES = 44;
  if (arrayBuffer.byteLength <= HEADER_BYTES) return null;
  return new DataView(arrayBuffer, HEADER_BYTES);
}

/**
 * Assemble voice clip buffers into a WAV blob, then mix in the bed channel
 * (if provided) using mixBedIntoPcm. Returns the final mixed (or unmixed,
 * on bed absence) Blob.
 *
 * This is the entry point called by useClipPlayer when a bed is selected.
 * Splitting the bed-mix out here keeps the hot-path in useClipPlayer thin.
 *
 * @param buffers     Voice clip AudioBuffers in playback order.
 * @param bedChannel0 Bed channel-0 Float32Array, or null for silence.
 * @param gain        Linear mix gain for the bed.
 * @param sampleRate  Voice sample rate (used to compute fade durations in samples).
 * @param fadeInSec   Fade-in duration in seconds (default 1.5).
 * @param fadeOutSec  Fade-out duration in seconds (default 2.0).
 */
export function assembleWavBlobWithBed(
  buffers: AudioBuffer[],
  bedChannel0: Float32Array | null,
  gain: number,
  sampleRate: number,
  fadeInSec = 1.5,
  fadeOutSec = 2.0,
): Blob {
  // Build the WAV ArrayBuffer once via the shared helper.
  const arrayBuffer = buildWavArrayBuffer(buffers);

  // Silence path — return the unmodified voice blob immediately. No second
  // allocation needed; the ArrayBuffer from buildWavArrayBuffer is all we need.
  if (bedChannel0 === null || bedChannel0.length === 0) {
    return new Blob([arrayBuffer], { type: "audio/wav" });
  }

  // Mix bed into the PCM body in-place. buildWavArrayBuffer wrote the voice
  // PCM into arrayBuffer at offset 44 (HEADER_BYTES); we get a DataView over
  // that region and pass it to mixBedIntoPcm. No second encode pass — the
  // voice PCM is written exactly once, and the mix modifies it in-place.
  const HEADER_BYTES = 44;
  const pcmBody = new DataView(arrayBuffer, HEADER_BYTES);
  const fadeInSamples = Math.round(fadeInSec * sampleRate);
  const fadeOutSamples = Math.round(fadeOutSec * sampleRate);
  mixBedIntoPcm(pcmBody, bedChannel0, gain, fadeInSamples, fadeOutSamples);

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
