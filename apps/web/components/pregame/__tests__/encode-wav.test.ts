// Unit tests for assembleWavBlob in audio/encode-wav.ts.
//
// assembleWavBlob is a pure function: AudioBuffer[] → Blob.
// AudioBuffer is a browser interface; in the node test environment we satisfy
// it with a minimal plain-object mock — only the three fields the function
// actually reads (sampleRate, length, getChannelData) need to be present.
//
// DataView, ArrayBuffer, and Blob are all available in Node 18+.

import { describe, it, expect } from "vitest";
import { assembleWavBlob } from "../audio/encode-wav";

// ---------------------------------------------------------------------------
// Mock AudioBuffer factory
// ---------------------------------------------------------------------------

/**
 * Produce a minimal AudioBuffer-shaped object from a Float32Array.
 * The function under test reads:
 *   buf.sampleRate     — used for the WAV header byteRate field
 *   buf.length         — used for totalSamples accumulation
 *   buf.getChannelData(0) — the PCM sample data
 */
function mockAudioBuffer(
  samples: Float32Array,
  sampleRate = 24000,
): AudioBuffer {
  return {
    sampleRate,
    length: samples.length,
    duration: samples.length / sampleRate,
    numberOfChannels: 1,
    getChannelData: (_channel: number) => samples,
    copyFromChannel: () => { /* unused */ },
    copyToChannel: () => { /* unused */ },
  } as unknown as AudioBuffer;
}

// ---------------------------------------------------------------------------
// Helper: read the assembled Blob back into a DataView for header assertions.
// Blob.arrayBuffer() is async; we use a synchronous workaround by reading the
// underlying ArrayBuffer via the Uint8Array path available in Node.
// ---------------------------------------------------------------------------

async function blobToDataView(blob: Blob): Promise<DataView> {
  const ab = await blob.arrayBuffer();
  return new DataView(ab);
}

function readAscii(view: DataView, offset: number, len = 4): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += String.fromCharCode(view.getUint8(offset + i));
  }
  return s;
}

// ---------------------------------------------------------------------------
// 1. Empty-input guard
// ---------------------------------------------------------------------------

describe("assembleWavBlob — empty-input guard", () => {
  it("throws RangeError when called with an empty array", () => {
    expect(() => assembleWavBlob([])).toThrowError(RangeError);
    expect(() => assembleWavBlob([])).toThrowError(
      /buffers array must not be empty/i,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. RIFF/WAVE header structure
// ---------------------------------------------------------------------------

describe("assembleWavBlob — RIFF/WAVE header", () => {
  const SAMPLES = 1024;
  const SAMPLE_RATE = 24000;
  const pcm = new Float32Array(SAMPLES).fill(0); // silence
  const buf = mockAudioBuffer(pcm, SAMPLE_RATE);

  it("blob MIME type is audio/wav", () => {
    const blob = assembleWavBlob([buf]);
    expect(blob.type).toBe("audio/wav");
  });

  it("blob size equals 44-byte header + 2 * totalSamples (16-bit PCM)", () => {
    const blob = assembleWavBlob([buf]);
    expect(blob.size).toBe(44 + SAMPLES * 2);
  });

  it("RIFF tag is at offset 0", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(readAscii(view, 0)).toBe("RIFF");
  });

  it("WAVE tag is at offset 8", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(readAscii(view, 8)).toBe("WAVE");
  });

  it("fmt  tag is at offset 12", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(readAscii(view, 12)).toBe("fmt ");
  });

  it("data tag is at offset 36", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(readAscii(view, 36)).toBe("data");
  });

  it("chunkSize (offset 4) equals 36 + dataByteLength (LE uint32)", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    const chunkSize = view.getUint32(4, true);
    expect(chunkSize).toBe(36 + SAMPLES * 2);
  });

  it("subchunk1Size (offset 16) is 16 for PCM", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(16, true)).toBe(16);
  });

  it("audioFormat (offset 20) is 1 for PCM", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint16(20, true)).toBe(1);
  });

  it("numChannels (offset 22) is 1 (mono)", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint16(22, true)).toBe(1);
  });

  it("sampleRate (offset 24) matches buffers[0].sampleRate", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
  });

  it("byteRate (offset 28) equals sampleRate * numCh * 2", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(28, true)).toBe(SAMPLE_RATE * 1 * 2);
  });

  it("blockAlign (offset 32) is 2 (mono 16-bit)", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint16(32, true)).toBe(2);
  });

  it("bitsPerSample (offset 34) is 16", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint16(34, true)).toBe(16);
  });

  it("subchunk2Size (offset 40) equals totalSamples * 2", async () => {
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(40, true)).toBe(SAMPLES * 2);
  });
});

// ---------------------------------------------------------------------------
// 3. Sample count — multiple buffers concatenated
// ---------------------------------------------------------------------------

describe("assembleWavBlob — multi-buffer concatenation", () => {
  it("blob size = 44 + 2 * (sum of all buffer lengths)", () => {
    const a = mockAudioBuffer(new Float32Array(100));
    const b = mockAudioBuffer(new Float32Array(200));
    const c = mockAudioBuffer(new Float32Array(300));
    const blob = assembleWavBlob([a, b, c]);
    expect(blob.size).toBe(44 + (100 + 200 + 300) * 2);
  });

  it("subchunk2Size field reflects total sample count across all buffers", async () => {
    const a = mockAudioBuffer(new Float32Array(512));
    const b = mockAudioBuffer(new Float32Array(1024));
    const view = await blobToDataView(assembleWavBlob([a, b]));
    expect(view.getUint32(40, true)).toBe((512 + 1024) * 2);
  });

  it("chunkSize field reflects total sample count across all buffers", async () => {
    const a = mockAudioBuffer(new Float32Array(512));
    const b = mockAudioBuffer(new Float32Array(1024));
    const view = await blobToDataView(assembleWavBlob([a, b]));
    expect(view.getUint32(4, true)).toBe(36 + (512 + 1024) * 2);
  });
});

// ---------------------------------------------------------------------------
// 4. PCM sample encoding — clamp, scale, little-endian
// ---------------------------------------------------------------------------

describe("assembleWavBlob — PCM sample encoding", () => {
  /**
   * Read sample at a given 0-based index from the PCM data region.
   * PCM data starts at byte offset 44 (after the 44-byte header).
   */
  function readSample(view: DataView, sampleIndex: number): number {
    return view.getInt16(44 + sampleIndex * 2, true /* little-endian */);
  }

  it("silent input (0.0) encodes to int16 value 0", async () => {
    const pcm = new Float32Array([0.0, 0.0, 0.0]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(0);
    expect(readSample(view, 1)).toBe(0);
    expect(readSample(view, 2)).toBe(0);
  });

  it("+1.0 encodes to 32767 (SCALE = 0x7FFF), not 32768 (no overflow)", async () => {
    const pcm = new Float32Array([1.0]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(32767);
  });

  it("-1.0 encodes to -32767 (within int16 min -32768)", async () => {
    const pcm = new Float32Array([-1.0]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(-32767);
  });

  it("+0.5 encodes to Math.round(0.5 * 32767) = 16384", async () => {
    const pcm = new Float32Array([0.5]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(Math.round(0.5 * 32767));
  });

  it("-0.5 encodes to Math.round(-0.5 * 32767) = -16384", async () => {
    const pcm = new Float32Array([-0.5]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(Math.round(-0.5 * 32767));
  });

  it("clamps values above +1.0 to 32767 (codec overload guard)", async () => {
    const pcm = new Float32Array([1.5, 2.0, 99.0]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(32767);
    expect(readSample(view, 1)).toBe(32767);
    expect(readSample(view, 2)).toBe(32767);
  });

  it("clamps values below -1.0 to -32767 (codec underflow guard)", async () => {
    const pcm = new Float32Array([-1.5, -2.0, -99.0]);
    const view = await blobToDataView(assembleWavBlob([mockAudioBuffer(pcm)]));
    expect(readSample(view, 0)).toBe(-32767);
    expect(readSample(view, 1)).toBe(-32767);
    expect(readSample(view, 2)).toBe(-32767);
  });

  it("multi-buffer: second buffer samples appear after first buffer samples", async () => {
    // buf A has one sample at +1.0; buf B has one sample at -1.0.
    const a = mockAudioBuffer(new Float32Array([1.0]));
    const b = mockAudioBuffer(new Float32Array([-1.0]));
    const view = await blobToDataView(assembleWavBlob([a, b]));
    expect(readSample(view, 0)).toBe(32767);
    expect(readSample(view, 1)).toBe(-32767);
  });

  it("samples are written in little-endian order (byte check on +1.0 = 0xFF7F LE)", async () => {
    // 32767 in little-endian: low byte = 0xFF, high byte = 0x7F
    const pcm = new Float32Array([1.0]);
    const blob = assembleWavBlob([mockAudioBuffer(pcm)]);
    const ab = await blob.arrayBuffer();
    const bytes = new Uint8Array(ab);
    // PCM data region starts at byte 44
    expect(bytes[44]).toBe(0xff); // low byte of 32767
    expect(bytes[45]).toBe(0x7f); // high byte of 32767
  });
});

// ---------------------------------------------------------------------------
// 5. sampleRate from buffers[0] (not hard-coded)
// ---------------------------------------------------------------------------

describe("assembleWavBlob — sampleRate header field", () => {
  it("uses sampleRate from buffers[0] — 44100 Hz produces correct header", async () => {
    const pcm = new Float32Array(100);
    const buf = mockAudioBuffer(pcm, 44100);
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint32(28, true)).toBe(44100 * 1 * 2); // byteRate
  });

  it("uses sampleRate from buffers[0] — 48000 Hz produces correct header", async () => {
    const pcm = new Float32Array(100);
    const buf = mockAudioBuffer(pcm, 48000);
    const view = await blobToDataView(assembleWavBlob([buf]));
    expect(view.getUint32(24, true)).toBe(48000);
  });
});

// ---------------------------------------------------------------------------
// 6. Size sanity for realistic session parameters
// ---------------------------------------------------------------------------

describe("assembleWavBlob — realistic session size", () => {
  it("5-minute session at 24 kHz produces a blob close to the documented ~14 MB", () => {
    // 5 min = 300 s × 24000 samples/s = 7_200_000 samples × 2 bytes = 14_400_000 bytes + 44 header
    const TOTAL_SAMPLES = 300 * 24000;
    // Use a single large buffer for efficiency in the test.
    const pcm = new Float32Array(TOTAL_SAMPLES);
    const buf = mockAudioBuffer(pcm, 24000);
    const blob = assembleWavBlob([buf]);
    const expectedBytes = 44 + TOTAL_SAMPLES * 2;
    expect(blob.size).toBe(expectedBytes);
    // Document: ~14.4 MB for a 5-min 24 kHz mono session.
    expect(blob.size).toBeGreaterThan(14_000_000);
    expect(blob.size).toBeLessThan(15_000_000);
  });
});
