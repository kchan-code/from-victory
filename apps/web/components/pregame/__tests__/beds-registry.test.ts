// beds-registry.test.ts — FV-227
//
// Structural integrity guard for the beds registry (beds.ts).
// Node env — no browser APIs, no mocking.
// Pattern mirrors the pregame-sample / playlist-integrity guards.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

import { BEDS, getBed, BED_MIX_GAIN } from "@/components/pregame/audio/beds";

// ---------------------------------------------------------------------------
// Disk-presence helper
// ---------------------------------------------------------------------------

// __dirname: apps/web/components/pregame/__tests__
// beds live under: apps/web/public/audio/beds/
const WEB_ROOT = path.resolve(__dirname, "..", "..", "..");
const BEDS_DIR = path.join(WEB_ROOT, "public", "audio", "beds");

function bedFileExists(bedPath: string): boolean {
  // bedPath is a public URL path like "/audio/beds/bed-still.04f1b7b9.mp3".
  // Strip the leading slash and resolve relative to WEB_ROOT.
  const relative = bedPath.replace(/^\//, "");
  return fs.existsSync(path.join(WEB_ROOT, "public", relative));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BEDS registry (FV-227)", () => {
  it("contains exactly 6 beds", () => {
    expect(BEDS).toHaveLength(6);
  });

  it("every bed has a unique id", () => {
    const ids = BEDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every bed id is one of the expected values", () => {
    const expected = new Set(["still", "pulse", "rise", "rain", "stream", "grace"]);
    for (const { id } of BEDS) {
      expect(expected.has(id)).toBe(true);
    }
  });

  it("every bed has a non-empty label (≤ 16 chars)", () => {
    // 16 accommodates "Amazing Grace" (13) — the explicit hymn title is the
    // right label per the registry's copy note; picker rows wrap fine at 375px.
    for (const { id, label } of BEDS) {
      expect(label.trim().length, `bed "${id}" label is empty`).toBeGreaterThan(0);
      expect(label.length, `bed "${id}" label exceeds 16 chars`).toBeLessThanOrEqual(16);
    }
  });

  it("every bed has a non-empty description", () => {
    for (const { id, description } of BEDS) {
      expect(description.trim().length, `bed "${id}" description is empty`).toBeGreaterThan(0);
    }
  });

  it("every bed path points to a file that exists on disk", () => {
    for (const { id, path: bedPath } of BEDS) {
      expect(
        bedFileExists(bedPath),
        `bed "${id}" file not found on disk: ${bedPath}`,
      ).toBe(true);
    }
  });

  it("every bed path follows the content-addressed naming convention", () => {
    // Pattern: /audio/beds/bed-<id>.<hash8>.mp3
    const re = /^\/audio\/beds\/bed-[a-z]+\.[0-9a-f]{8}\.mp3$/;
    for (const { id, path: bedPath } of BEDS) {
      expect(
        re.test(bedPath),
        `bed "${id}" path "${bedPath}" does not match the content-addressed pattern`,
      ).toBe(true);
    }
  });

  it("every bed has a positive loopDurationSec", () => {
    for (const { id, loopDurationSec } of BEDS) {
      expect(loopDurationSec, `bed "${id}" loopDurationSec is not positive`).toBeGreaterThan(0);
    }
  });

  it("every bed recommendedGain equals BED_MIX_GAIN", () => {
    for (const { id, recommendedGain } of BEDS) {
      expect(recommendedGain, `bed "${id}" recommendedGain does not equal BED_MIX_GAIN`).toBe(
        BED_MIX_GAIN,
      );
    }
  });
});

describe("BED_MIX_GAIN constant", () => {
  it("is within the safe mixing range (0 < gain ≤ 1)", () => {
    expect(BED_MIX_GAIN).toBeGreaterThan(0);
    expect(BED_MIX_GAIN).toBeLessThanOrEqual(1);
  });

  it("equals the spec value 0.35", () => {
    // This is intentionally a snapshot assertion so a future audio-engineer
    // gain change is a visible, deliberate edit here rather than a silent value
    // drift. If KC's by-ear call changes the gain, update this test in the same PR.
    expect(BED_MIX_GAIN).toBe(0.35);
  });
});

describe("getBed()", () => {
  it("returns a Bed for each known id", () => {
    for (const { id } of BEDS) {
      expect(getBed(id)).toBeDefined();
      expect(getBed(id)?.id).toBe(id);
    }
  });

  it("returns undefined for null", () => {
    expect(getBed(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(getBed(undefined)).toBeUndefined();
  });

  it("returns undefined for an unknown string", () => {
    expect(getBed("not-a-bed")).toBeUndefined();
  });

  it("returns undefined for the empty string", () => {
    expect(getBed("")).toBeUndefined();
  });
});

describe("beds directory on disk", () => {
  it("contains exactly the files referenced by the BEDS registry (no extra, no missing)", () => {
    const registryPaths = new Set(
      BEDS.map((b) => path.basename(b.path)),
    );

    const diskFiles = fs
      .readdirSync(BEDS_DIR)
      .filter((f) => f.endsWith(".mp3"));

    // Every disk MP3 must be in the registry.
    for (const f of diskFiles) {
      expect(
        registryPaths.has(f),
        `Disk file "${f}" is not referenced by the BEDS registry`,
      ).toBe(true);
    }

    // Every registry path must exist on disk (covered by the per-bed test
    // above, but checking count here catches ghost registry entries).
    expect(diskFiles.length).toBe(BEDS.length);
  });
});
