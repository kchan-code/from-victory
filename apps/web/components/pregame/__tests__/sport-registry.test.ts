// Unit tests for sport-registry.ts — covers logic that hockey-only suites don't.
//
// Three areas:
//   A. HOCKEY_CONFIG.cellSlugFor — all 3 roles × 10 adversities, plus the
//      Goalie × benched → goalie-pulled special case.
//   B. BASKETBALL_CONFIG no-roles path — role=null yields a role-less slug
//      and does not crash or emit a hockey-shaped value.
//   C. getSportConfig — returns the correct config per key; type system
//      ensures no unknown-key path exists at runtime (no fallback to test).
//
// Run narrowly: npx vitest run components/pregame/__tests__/sport-registry.test.ts

import { describe, it, expect } from "vitest";

import {
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  getSportConfig,
} from "../sport-registry";

// ---------------------------------------------------------------------------
// A. HOCKEY_CONFIG.cellSlugFor — 3 roles × 10 adversities
// ---------------------------------------------------------------------------

describe("HOCKEY_CONFIG.cellSlugFor", () => {
  const roles = ["Forward", "Defense", "Goalie"] as const;

  it("produces session-{role.toLowerCase()}-{frag} for every role × adversity combination", () => {
    const unexpected: string[] = [];

    for (const role of roles) {
      for (const adversity of HOCKEY_CONFIG.adversities) {
        const frag = HOCKEY_CONFIG.adversitySlugFragments[adversity];
        // Skip the Goalie × benched special case — covered separately below.
        if (role === "Goalie" && frag === "benched") continue;

        if (frag === undefined) {
          unexpected.push(`adversity "${adversity}" has no slug fragment in HOCKEY_CONFIG`);
          continue;
        }

        const expected = `session-${role.toLowerCase()}-${frag}`;
        const actual = HOCKEY_CONFIG.cellSlugFor(adversity, role);

        if (actual !== expected) {
          unexpected.push(
            `[${role} × "${adversity}"] expected "${expected}" but got "${actual}"`,
          );
        }
      }
    }

    expect(unexpected).toEqual([]);
  });

  it("Goalie × 'I get benched.' → 'session-goalie-pulled' (not session-goalie-benched)", () => {
    const result = HOCKEY_CONFIG.cellSlugFor("I get benched.", "Goalie");
    expect(result).toBe("session-goalie-pulled");
    expect(result).not.toBe("session-goalie-benched");
  });

  it("all 10 adversity strings have a fragment in adversitySlugFragments", () => {
    const missing: string[] = [];
    for (const adversity of HOCKEY_CONFIG.adversities) {
      if (!(adversity in HOCKEY_CONFIG.adversitySlugFragments)) {
        missing.push(adversity);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// B. No-roles path — BASKETBALL_CONFIG (stub: no roles declared)
// ---------------------------------------------------------------------------

describe("BASKETBALL_CONFIG no-roles path", () => {
  it("has no roles field (or an empty roles array) so the position picker is skipped", () => {
    // Either roles is absent or empty — both are valid no-ask shapes.
    const roles = BASKETBALL_CONFIG.roles;
    const hasNoRoles = roles === undefined || roles.length === 0;
    expect(hasNoRoles).toBe(true);
  });

  it("cellSlugFor with role=null does not crash", () => {
    // The basketball stub always returns a placeholder slug.
    // The key assertion is no throw and no hockey-shaped output.
    expect(() => BASKETBALL_CONFIG.cellSlugFor("any adversity", null)).not.toThrow();
  });

  it("cellSlugFor with role=null does not return a hockey-shaped slug", () => {
    const result = BASKETBALL_CONFIG.cellSlugFor("any adversity", null);
    // Hockey slugs follow session-{forward|defense|goalie}-{frag} pattern.
    expect(result).not.toMatch(/^session-(forward|defense|goalie)-/);
  });

  it("cellSlugFor with role=undefined does not crash", () => {
    expect(() => BASKETBALL_CONFIG.cellSlugFor("any adversity", undefined)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// C. getSportConfig — registry lookup
// ---------------------------------------------------------------------------

describe("getSportConfig", () => {
  it("returns HOCKEY_CONFIG for sport='hockey'", () => {
    expect(getSportConfig("hockey")).toBe(HOCKEY_CONFIG);
  });

  it("returns BASKETBALL_CONFIG for sport='basketball'", () => {
    expect(getSportConfig("basketball")).toBe(BASKETBALL_CONFIG);
  });
});
