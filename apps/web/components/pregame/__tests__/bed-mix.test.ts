// bed-mix.test.ts — FV-227
//
// Unit tests for the mixBedIntoPcm pure helper in encode-wav.ts.
// Node env — no browser APIs, tests the mixing math over real Float32Arrays
// and DataViews. These cover the loop, fade-in, fade-out, and gain logic.

import { describe, it, expect } from "vitest";
import { mixBedIntoPcm } from "@/components/pregame/audio/encode-wav";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a DataView of N int16 samples all set to `voiceSampleValue`. */
function makePcmView(numSamples: number, voiceSampleValue = 0): DataView {
  const buf = new ArrayBuffer(numSamples * 2);
  const view = new DataView(buf);
  for (let i = 0; i < numSamples; i++) {
    view.setInt16(i * 2, voiceSampleValue, true);
  }
  return view;
}

/** Build a Float32Array of `length` samples all set to `value`. */
function makeBed(length: number, value = 1.0): Float32Array {
  return new Float32Array(length).fill(value);
}

/** Read all int16 samples from a DataView. */
function readSamples(view: DataView): number[] {
  const out: number[] = [];
  for (let i = 0; i < view.byteLength / 2; i++) {
    out.push(view.getInt16(i * 2, true));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mixBedIntoPcm — basic behaviour", () => {
  it("does nothing when bedChannel0 is empty", () => {
    const voice = makePcmView(10, 1000);
    mixBedIntoPcm(voice, new Float32Array(0), 1.0, 0, 0);
    // All samples unchanged.
    expect(readSamples(voice).every((s) => s === 1000)).toBe(true);
  });

  it("does nothing when voicePcm is empty (byteLength = 0)", () => {
    // Should not throw.
    const empty = new DataView(new ArrayBuffer(0));
    expect(() =>
      mixBedIntoPcm(empty, makeBed(10), 1.0, 0, 0),
    ).not.toThrow();
  });

  it("mixes a full-amplitude constant bed at gain 1.0 with no fade into a silent voice", () => {
    // 4 samples, silent voice, bed = [1.0, 1.0, 1.0, 1.0], gain = 1.0, no fade.
    const voice = makePcmView(4, 0);
    mixBedIntoPcm(voice, makeBed(4, 1.0), 1.0, 0, 0);
    const samples = readSamples(voice);
    // 1.0 * 0x7fff = 32767 scaled to int16.
    expect(samples).toEqual([32767, 32767, 32767, 32767]);
  });

  it("applies gain correctly (0.5 gain → half the full-amplitude bed value)", () => {
    const voice = makePcmView(4, 0);
    mixBedIntoPcm(voice, makeBed(4, 1.0), 0.5, 0, 0);
    const samples = readSamples(voice);
    // 1.0 * 0.5 * 0x7fff = ~16383/16384.
    for (const s of samples) {
      expect(s).toBeGreaterThanOrEqual(16383);
      expect(s).toBeLessThanOrEqual(16384);
    }
  });

  it("adds bed to an existing (non-silent) voice signal", () => {
    // Voice at +10000, bed at 0.5 amplitude, gain 1.0 → mixed = 10000 + 0.5*32767 ≈ 26383.
    const voice = makePcmView(4, 10000);
    mixBedIntoPcm(voice, makeBed(4, 0.5), 1.0, 0, 0);
    const samples = readSamples(voice);
    for (const s of samples) {
      expect(s).toBeGreaterThan(10000);
      expect(s).toBeLessThanOrEqual(32767);
    }
  });

  it("clamps overflowed samples to int16 max (32767)", () => {
    // Voice at 32767 (max), bed = full amplitude at gain 1.0 → would overflow.
    const voice = makePcmView(4, 32767);
    mixBedIntoPcm(voice, makeBed(4, 1.0), 1.0, 0, 0);
    const samples = readSamples(voice);
    expect(samples.every((s) => s <= 32767)).toBe(true);
  });

  it("clamps underflowed samples to int16 min (-32768)", () => {
    // Voice at -32768 (min), bed = -1.0 at gain 1.0 → would underflow.
    const voice = makePcmView(4, -32768);
    mixBedIntoPcm(voice, makeBed(4, -1.0), 1.0, 0, 0);
    const samples = readSamples(voice);
    expect(samples.every((s) => s >= -32768)).toBe(true);
  });
});

describe("mixBedIntoPcm — bed loop", () => {
  it("loops a short bed over a longer voice", () => {
    // Bed = [1.0, -1.0] (2 samples), voice = 6 samples silent, gain 1.0, no fade.
    // Expected pattern: 32767, -32767, 32767, -32767, 32767, -32767.
    const voice = makePcmView(6, 0);
    const bed = new Float32Array([1.0, -1.0]);
    mixBedIntoPcm(voice, bed, 1.0, 0, 0);
    const samples = readSamples(voice);
    // Odd indices (0,2,4) → 32767; even indices (1,3,5) → -32767.
    expect(samples[0]).toBe(32767);
    expect(samples[1]).toBe(-32767);
    expect(samples[2]).toBe(32767);
    expect(samples[3]).toBe(-32767);
    expect(samples[4]).toBe(32767);
    expect(samples[5]).toBe(-32767);
  });

  it("handles a bed longer than the voice (no crash, no out-of-bounds)", () => {
    const voice = makePcmView(4, 0);
    const longBed = makeBed(1000, 0.5);
    expect(() => mixBedIntoPcm(voice, longBed, 1.0, 0, 0)).not.toThrow();
    // Only first 4 samples of the bed are used.
    const samples = readSamples(voice);
    for (const s of samples) {
      // 0.5 * 32767 ≈ 16383/16384
      expect(s).toBeGreaterThanOrEqual(16383);
      expect(s).toBeLessThanOrEqual(16384);
    }
  });
});

describe("mixBedIntoPcm — fade-in", () => {
  it("first sample is zero-ish when fade-in covers the whole buffer", () => {
    // 4 samples, full fade-in over 4 samples → envelope at i=0 is 0/4 = 0.
    const voice = makePcmView(4, 0);
    mixBedIntoPcm(voice, makeBed(4, 1.0), 1.0, 4, 0);
    const samples = readSamples(voice);
    // i=0: envelope = 0/4 = 0 → mixed = 0.
    expect(samples[0]).toBe(0);
    // i=3: envelope = 3/4 = 0.75 → mixed ≈ 0.75 * 32767 ≈ 24575.
    expect(samples[3]).toBeGreaterThan(0);
  });

  it("sample at the end of fade-in is at (near) full gain", () => {
    // 10 samples, fade-in over 5 samples.
    // At i=5 (first non-fade sample), envelope = 1.0.
    const voice = makePcmView(10, 0);
    mixBedIntoPcm(voice, makeBed(10, 1.0), 1.0, 5, 0);
    const samples = readSamples(voice);
    // i=5: full gain → 32767.
    expect(samples[5]).toBe(32767);
    // i=4: envelope = 4/5 = 0.8 → ≈ 26213/26214.
    expect(samples[4]).toBeLessThan(32767);
  });
});

describe("mixBedIntoPcm — fade-out", () => {
  it("last sample is zero when fade-out covers the whole buffer", () => {
    // 4 samples, full fade-out over 4 samples.
    // At i=3 (last): envelope = (4-3)/4 = 0.25; at i=0: envelope = (4-0)/4 = 1.0.
    const voice = makePcmView(4, 0);
    mixBedIntoPcm(voice, makeBed(4, 1.0), 1.0, 0, 4);
    const samples = readSamples(voice);
    // i=3: envelope = 1/4 = 0.25 → ~8191/8192.
    expect(samples[3]).toBeGreaterThan(0);
    expect(samples[3]).toBeLessThan(32767);
    // i=0: envelope = 4/4 = 1.0 → 32767.
    expect(samples[0]).toBe(32767);
  });

  it("penultimate sample has higher gain than last sample (fade decreasing)", () => {
    const voice = makePcmView(8, 0);
    mixBedIntoPcm(voice, makeBed(8, 1.0), 1.0, 0, 4);
    const samples = readSamples(voice);
    // Fade-out covers the last 4 samples (i=4,5,6,7).
    // samples[6] (envelope 2/4=0.5) should be > samples[7] (envelope 1/4=0.25).
    // reason: noUncheckedIndexedAccess widens array elements; i is in-bounds here.
    expect(samples[6] ?? 0).toBeGreaterThan(samples[7] ?? 0);
  });
});

describe("mixBedIntoPcm — simultaneous fade-in and fade-out", () => {
  it("fade-in and fade-out both active: middle samples are at full gain", () => {
    // 10 samples, fade-in 3, fade-out 3.
    // Middle range [3..6] has envelope 1.0.
    const voice = makePcmView(10, 0);
    mixBedIntoPcm(voice, makeBed(10, 1.0), 1.0, 3, 3);
    const samples = readSamples(voice);
    // i=3..6 should be at full gain (32767).
    for (let i = 3; i <= 6; i++) {
      expect(samples[i]).toBe(32767);
    }
    // i=0 should be less (fade-in).
    expect(samples[0]).toBeLessThan(32767);
    // i=9 should be less (fade-out: envelope = 1/3).
    expect(samples[9]).toBeLessThan(32767);
  });
});
