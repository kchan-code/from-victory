/**
 * Unit tests for the `sportLabel` display-name helper (FV-159 / FV-56 §2).
 *
 * `sportLabel` produces the capitalized label shown in the Settings sport row
 * and the change-sport confirm copy ("Switch to Basketball?"). It is derived
 * from the raw sport string, NOT a hardcoded per-sport map — so a 3rd sport
 * added to SUPPORTED_SPORTS gets a correct label for free (forward-compat,
 * FV-56 §4). These tests pin that contract.
 *
 * Pure function, node env, no mocking — same style as athlete-sport-schema.test.ts.
 */

import { describe, it, expect } from "vitest";

import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

describe("sportLabel", () => {
  it("capitalizes the launch sports", () => {
    expect(sportLabel("hockey")).toBe("Hockey");
    expect(sportLabel("basketball")).toBe("Basketball");
  });

  it("produces a non-empty capitalized label for every supported sport", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const label = sportLabel(sport);
      // First character upper-cased, remainder preserved — derived, not mapped.
      expect(label).toBe(sport.charAt(0).toUpperCase() + sport.slice(1));
      expect(label.length).toBe(sport.length);
      expect(label[0]).toBe(label[0]?.toUpperCase());
    }
  });
});
