// Unit tests for sport-registry.ts — covers logic that hockey-only suites don't.
//
// Three areas:
//   A. HOCKEY_CONFIG.cellSlugFor — all 3 roles × 10 adversities, plus the
//      Goalie × benched → goalie-pulled special case.
//   B. BASKETBALL_CONFIG.cellSlugFor — positional (Guard/Wing/Big), incl. the
//      Big × benched → bb-big-fouled-out special case.
//   B2. No-ask path (synthetic fixture) — a sport with no roles yields a
//      role-less slug and skips the position picker (no MVP sport is no-ask).
//   C. getSportConfig — returns the correct config per key; type system
//      ensures no unknown-key path exists at runtime (no fallback to test).
//
// Run narrowly: npx vitest run components/pregame/__tests__/sport-registry.test.ts

import { describe, it, expect } from "vitest";

import {
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  getSportConfig,
  type SportConfig,
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
// B. BASKETBALL_CONFIG.cellSlugFor — positional (Guard/Wing/Big), FV-30
// ---------------------------------------------------------------------------

describe("BASKETBALL_CONFIG.cellSlugFor", () => {
  const roles = ["Guard", "Wing", "Big"] as const;

  it("produces bb-{role.toLowerCase()}-{frag} for every role × adversity combination", () => {
    const unexpected: string[] = [];

    for (const role of roles) {
      for (const adversity of BASKETBALL_CONFIG.adversities) {
        const frag = BASKETBALL_CONFIG.adversitySlugFragments[adversity];
        // Skip the Big × benched special case — covered separately below.
        if (role === "Big" && frag === "benched") continue;

        if (frag === undefined) {
          unexpected.push(`adversity "${adversity}" has no slug fragment in BASKETBALL_CONFIG`);
          continue;
        }

        const expected = `bb-${role.toLowerCase()}-${frag}`;
        const actual = BASKETBALL_CONFIG.cellSlugFor(adversity, role);

        if (actual !== expected) {
          unexpected.push(
            `[${role} × "${adversity}"] expected "${expected}" but got "${actual}"`,
          );
        }
      }
    }

    expect(unexpected).toEqual([]);
  });

  it("Big × 'I get benched.' → 'bb-big-fouled-out' (not bb-big-benched)", () => {
    const result = BASKETBALL_CONFIG.cellSlugFor("I get benched.", "Big");
    expect(result).toBe("bb-big-fouled-out");
    expect(result).not.toBe("bb-big-benched");
  });

  it("all 10 adversity strings have a fragment in adversitySlugFragments", () => {
    const missing: string[] = [];
    for (const adversity of BASKETBALL_CONFIG.adversities) {
      if (!(adversity in BASKETBALL_CONFIG.adversitySlugFragments)) {
        missing.push(adversity);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// B2. No-ask path — synthetic fixture. No MVP sport is no-ask (hockey and
// basketball both declare roles), but the engine must still support a sport
// that declares none (e.g. tennis, swimming): no position picker, role=null
// terminal state, role-less slugs.
// ---------------------------------------------------------------------------

const NO_ASK_FRAGMENTS: Record<string, string> = { "I lose focus.": "lose-focus" };

const NO_ASK_CONFIG: SportConfig = {
  displayName: "Test No-Ask Sport",
  // no `roles` field → no-ask shape
  adversities: ["I lose focus."],
  adversitySlugFragments: NO_ASK_FRAGMENTS,
  cellSlugFor: (adversity, role) => {
    const frag = NO_ASK_FRAGMENTS[adversity] ?? "lose-focus";
    return role ? `noask-${role.toLowerCase()}-${frag}` : `noask-${frag}`;
  },
  practiceFocusOptions: [],
  practiceFocusSlugs: {},
  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-opener-get-to",
  },
};

describe("no-ask sport path (synthetic fixture)", () => {
  it("declares no roles, so the position picker is skipped", () => {
    const roles = NO_ASK_CONFIG.roles;
    const hasNoRoles = roles === undefined || roles.length === 0;
    expect(hasNoRoles).toBe(true);
  });

  it("cellSlugFor with role=null does not crash and yields a role-less slug", () => {
    expect(() => NO_ASK_CONFIG.cellSlugFor("I lose focus.", null)).not.toThrow();
    expect(NO_ASK_CONFIG.cellSlugFor("I lose focus.", null)).toBe("noask-lose-focus");
  });

  it("cellSlugFor with role=undefined does not crash", () => {
    expect(() => NO_ASK_CONFIG.cellSlugFor("I lose focus.", undefined)).not.toThrow();
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
