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
export function assembleWavBlob(buffers: AudioBuffer[]): Blob {
  if (buffers.length === 0) {
    throw new RangeError("assembleWavBlob: buffers array must not be empty");
  }

  // ── 1. Measure total sample count ───────────────────────────────────────────
  // Sum the length (sample frames) of each buffer's channel 0.
  // AudioBuffer.length is the number of sample frames (not bytes).
  let totalSamples = 0;
  for (const buf of buffers) {
    totalSamples += buf.length;
  }

  // ── 2. WAV header constants ──────────────────────────────────────────────────
  // Read sampleRate from the first buffer so a future format change doesn't
  // silently corrupt the header. Hard-coding 24000 would break if, e.g., the
  // TTS ceiling changes and clips are re-rendered at 48 kHz.
  // reason: noUncheckedIndexedAccess widens to AudioBuffer|undefined; the
  // length === 0 guard above guarantees buffers[0] is defined here.
  const sampleRate = buffers[0]!.sampleRate;
  const numChannels = 1; // mono output — see channel policy above
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8; // bytes/sec
  const blockAlign = (numChannels * bitsPerSample) / 8; // bytes per sample frame

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
  const dataByteLength = totalSamples * blockAlign; // totalSamples * 2
  const totalByteLength = HEADER_BYTES + dataByteLength;

  // ── 3. Allocate buffer and write header ──────────────────────────────────────
  const arrayBuffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(arrayBuffer);

  // Helper: write a 4-char ASCII tag at a byte offset.
  const writeTag = (offset: number, tag: string) => {
    for (let i = 0; i < 4; i++) {
      view.setUint8(offset + i, tag.charCodeAt(i));
    }
  };

  writeTag(0, "RIFF");
  view.setUint32(4, 36 + dataByteLength, true);   // chunkSize (LE)
  writeTag(8, "WAVE");
  writeTag(12, "fmt ");
  view.setUint32(16, 16, true);                    // subchunk1Size: 16 for PCM
  view.setUint16(20, 1, true);                     // audioFormat: 1 = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeTag(36, "data");
  view.setUint32(40, dataByteLength, true);        // subchunk2Size

  // ── 4. Write PCM samples ─────────────────────────────────────────────────────
  // Each float32 sample from channel 0 is clamped to [-1, 1] then scaled to
  // int16 range. We scale by 0x7FFF (32767) rather than 32768 to guarantee
  // the result fits in a signed int16 for both +1.0 and -1.0:
  //   +1.0 * 32767 =  32767  → fits in int16 max  (+32767)
  //   -1.0 * 32767 = -32767  → fits in int16 min  (-32768, well within range)
  // Scaling by 32768 would map +1.0 → +32768, which overflows int16.
  // The clamp is present even though the -1.5 dBTP loudnorm headroom means
  // clipping should be very rare; codec decode and concatenation arithmetic
  // can still produce transient values slightly outside [-1, 1].
  const SCALE = 0x7fff; // 32767
  let writeOffset = HEADER_BYTES;

  for (const buf of buffers) {
    const channel = buf.getChannelData(0); // Float32Array, channel 0
    const len = channel.length;
    for (let i = 0; i < len; i++) {
      // Clamp to [-1, 1], scale to int16, round to nearest integer.
      // reason: noUncheckedIndexedAccess widens to number|undefined; `i` is
      // bounded by channel.length so the value is always defined at runtime.
      const clamped = Math.max(-1, Math.min(1, channel[i] ?? 0));
      const int16 = Math.round(clamped * SCALE);
      view.setInt16(writeOffset, int16, true); // little-endian
      writeOffset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}
