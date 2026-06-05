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
  adversityOptionsFor,
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

// Cast required: NO_ASK_CONFIG is a synthetic fixture for a hypothetical future
// no-ask sport (tennis, swimming). It can't carry a valid `Sport` sportKey because
// that union only contains launch sports. The cast is intentional and safe for
// this test-only fixture.
const NO_ASK_CONFIG = {
  displayName: "Test No-Ask Sport",
  // no `roles` field → no-ask shape
  adversities: ["I lose focus."],
  adversitySlugFragments: NO_ASK_FRAGMENTS,
  cellSlugFor: (adversity: string, role?: string | null) => {
    const frag = NO_ASK_FRAGMENTS[adversity] ?? "lose-focus";
    return role ? `noask-${role.toLowerCase()}-${frag}` : `noask-${frag}`;
  },
  practiceFocusOptions: [] as const,
  practiceFocusSlugs: {} as Record<string, string>,
  practiceOpenerSlugs: {
    "dialed-in": "pp-opener-dialed-in",
    "not-feeling-it": "pp-opener-get-to",
  },
} as unknown as SportConfig;

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

// ---------------------------------------------------------------------------
// D. sportKey field — registry key round-trip (FV-30)
// ---------------------------------------------------------------------------

describe("SportConfig.sportKey", () => {
  it("HOCKEY_CONFIG.sportKey is 'hockey'", () => {
    expect(HOCKEY_CONFIG.sportKey).toBe("hockey");
  });

  it("BASKETBALL_CONFIG.sportKey is 'basketball'", () => {
    expect(BASKETBALL_CONFIG.sportKey).toBe("basketball");
  });

  it("getSportConfig(sportKey) round-trips to the same config object", () => {
    expect(getSportConfig(HOCKEY_CONFIG.sportKey)).toBe(HOCKEY_CONFIG);
    expect(getSportConfig(BASKETBALL_CONFIG.sportKey)).toBe(BASKETBALL_CONFIG);
  });
});

// ---------------------------------------------------------------------------
// E. BASKETBALL_CONFIG practice fields (FV-30 pre-practice chunk)
// ---------------------------------------------------------------------------

describe("BASKETBALL_CONFIG practice fields (FV-30)", () => {
  it("practiceFocusOptions has exactly 7 entries", () => {
    expect(BASKETBALL_CONFIG.practiceFocusOptions).toHaveLength(7);
  });

  it("practiceFocusSlugs has one entry per practiceFocusOptions item", () => {
    for (const option of BASKETBALL_CONFIG.practiceFocusOptions) {
      expect(
        BASKETBALL_CONFIG.practiceFocusSlugs,
        `Missing slug for "${option}"`,
      ).toHaveProperty(option);
    }
  });

  it("every practiceFocusSlugs value is a pp-bb-focus-* slug", () => {
    for (const [option, slug] of Object.entries(BASKETBALL_CONFIG.practiceFocusSlugs)) {
      expect(slug, `Slug for "${option}"`).toMatch(/^pp-bb-focus-/);
    }
  });

  it("practiceOpenerSlugs: dialed-in reuses pp-opener-dialed-in (sport-neutral)", () => {
    expect(BASKETBALL_CONFIG.practiceOpenerSlugs["dialed-in"]).toBe("pp-opener-dialed-in");
  });

  it("practiceOpenerSlugs: not-feeling-it uses pp-bb-opener-get-to (basketball-specific)", () => {
    expect(BASKETBALL_CONFIG.practiceOpenerSlugs["not-feeling-it"]).toBe("pp-bb-opener-get-to");
  });
});

// ---------------------------------------------------------------------------
// D. adversityOptionsFor — position-aware Hard Moment options (FV-101)
// ---------------------------------------------------------------------------

describe("adversityOptionsFor — Hard Moment options", () => {
  it("hockey Goalie gets goalie-true labels mapped to the same cells", () => {
    const opts = adversityOptionsFor(HOCKEY_CONFIG, "Goalie");
    const byKey = Object.fromEntries(opts.map((o) => [o.key, o.label]));

    // The bug: a goalie was shown skater-framed labels. These re-label to
    // goalie-true language WITHOUT changing the canonical key.
    expect(byKey["I get benched."]).toBe("I get pulled.");
    expect(byKey["I get beaten wide."]).toBe("I get beat post to post.");
    expect(byKey["I miss a scoring chance."]).toBe("I get beat on a breakaway.");
    expect(byKey["We give up the first goal."]).toBe("I let in the first goal.");

    // Every goalie key is a CANONICAL hockey adversity, so cellSlugFor resolves
    // to a real, already-rendered goalie cell — no new audio.
    for (const { key } of opts) {
      expect(HOCKEY_CONFIG.adversities).toContain(key);
      expect(HOCKEY_CONFIG.cellSlugFor(key, "Goalie")).toMatch(
        /^session-goalie-/,
      );
    }
  });

  it("drops 'I take a bad penalty' for the goalie (KC: not a goalie issue)", () => {
    const keys = adversityOptionsFor(HOCKEY_CONFIG, "Goalie").map((o) => o.key);
    expect(keys).not.toContain("I take a bad penalty.");
    expect(keys).toHaveLength(9);
  });

  it("skaters (Forward/Defense) get the flat list, label === key", () => {
    for (const role of ["Forward", "Defense"]) {
      const opts = adversityOptionsFor(HOCKEY_CONFIG, role);
      expect(opts.map((o) => o.key)).toEqual([...HOCKEY_CONFIG.adversities]);
      expect(opts.every((o) => o.key === o.label)).toBe(true);
    }
  });

  it("null role falls back to the flat list", () => {
    const opts = adversityOptionsFor(HOCKEY_CONFIG, null);
    expect(opts.map((o) => o.key)).toEqual([...HOCKEY_CONFIG.adversities]);
  });

  it("basketball (no roleAdversities) returns the flat list for every role", () => {
    for (const role of BASKETBALL_CONFIG.roles ?? []) {
      const opts = adversityOptionsFor(BASKETBALL_CONFIG, role);
      expect(opts.map((o) => o.key)).toEqual([...BASKETBALL_CONFIG.adversities]);
      expect(opts.every((o) => o.key === o.label)).toBe(true);
    }
  });
});
