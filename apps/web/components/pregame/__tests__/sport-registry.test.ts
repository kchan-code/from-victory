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
  adversityLabelFor,
  type SportConfig,
} from "../sport-registry";
import { NEEDS, RESET_ANCHORS, SELF_TALK_OPTIONS } from "../types";

// ---------------------------------------------------------------------------
// FV-117 regression guard: HOCKEY_CONFIG picker lists must stay byte-identical
// (order + content) to the original global lists. Hockey is the live beta sport,
// so the per-sport registry refactor must never silently reorder or alter its
// chips. (Caught a "Long exhale" reorder in qa review of PR #122.)
// ---------------------------------------------------------------------------

describe("HOCKEY_CONFIG picker lists == original globals (zero hockey change)", () => {
  it("needs match NEEDS exactly (order + content)", () => {
    expect(HOCKEY_CONFIG.needs).toEqual(NEEDS);
  });
  it("anchors match RESET_ANCHORS exactly (order + content)", () => {
    expect(HOCKEY_CONFIG.anchors).toEqual(RESET_ANCHORS);
  });
  it("selfTalkOptions match SELF_TALK_OPTIONS exactly (order + content)", () => {
    expect(HOCKEY_CONFIG.selfTalkOptions).toEqual(SELF_TALK_OPTIONS);
  });
});

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

    // Every goalie key is a CANONICAL hockey adversity that resolves to its
    // real, already-rendered goalie cell — no new audio. Asserted to the EXACT
    // slug (not just a /^session-goalie-/ prefix) so a label accidentally
    // leaking into the key field can't pass via cellSlugFor's missed-chance
    // fallback.
    const expectedSlug: Record<string, string> = {
      "We give up the first goal.": "session-goalie-first-goal-against",
      "I get benched.": "session-goalie-pulled",
      "I get beaten wide.": "session-goalie-beaten-wide",
      "I miss a scoring chance.": "session-goalie-missed-chance",
      "I feel nervous.": "session-goalie-nervous",
      "I start slow.": "session-goalie-start-slow",
      "I get hit.": "session-goalie-get-hit",
      "I turn the puck over.": "session-goalie-turnover",
      "Coach yells.": "session-goalie-coach-yells",
    };
    for (const { key } of opts) {
      expect(HOCKEY_CONFIG.adversities).toContain(key);
      expect(HOCKEY_CONFIG.cellSlugFor(key, "Goalie")).toBe(expectedSlug[key]);
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

// ---------------------------------------------------------------------------
// E. adversityLabelFor — downstream display label for a stored key (FV-101)
//    The chip shows the goalie label, but state.adversity stores the canonical
//    KEY. Every downstream display (Review, session card, text-mode script)
//    must render the SAME goalie label, not the skater key — or the bug
//    reappears one screen later.
// ---------------------------------------------------------------------------

describe("adversityLabelFor — downstream display label", () => {
  it("maps a goalie's stored key to its goalie-true label", () => {
    expect(adversityLabelFor(HOCKEY_CONFIG, "Goalie", "I get benched.")).toBe(
      "I get pulled.",
    );
    expect(
      adversityLabelFor(HOCKEY_CONFIG, "Goalie", "I miss a scoring chance."),
    ).toBe("I get beat on a breakaway.");
    expect(
      adversityLabelFor(HOCKEY_CONFIG, "Goalie", "We give up the first goal."),
    ).toBe("I let in the first goal.");
  });

  it("returns the key unchanged for skaters, custom free-text, and basketball", () => {
    expect(adversityLabelFor(HOCKEY_CONFIG, "Forward", "I get benched.")).toBe(
      "I get benched.",
    );
    // Custom free-text adversity (not in any override) shows as typed.
    expect(
      adversityLabelFor(HOCKEY_CONFIG, "Goalie", "My grandma is watching"),
    ).toBe("My grandma is watching");
    expect(
      adversityLabelFor(BASKETBALL_CONFIG, "Guard", "I get benched."),
    ).toBe("I get benched.");
  });

  it("passes a null key through (downstream keeps its own fallback)", () => {
    expect(adversityLabelFor(HOCKEY_CONFIG, "Goalie", null)).toBeNull();
    expect(adversityLabelFor(HOCKEY_CONFIG, null, "I get benched.")).toBe(
      "I get benched.",
    );
  });

  it("round-trips with adversityOptionsFor — the chip label IS the display label", () => {
    for (const role of HOCKEY_CONFIG.roles ?? []) {
      for (const { key, label } of adversityOptionsFor(HOCKEY_CONFIG, role)) {
        expect(adversityLabelFor(HOCKEY_CONFIG, role, key)).toBe(label);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// FV-117: per-sport picker lists (needs / anchors / selfTalkOptions)
// ---------------------------------------------------------------------------

import {
  ANCHOR_OPTION_SLUGS,
  SELFTALK_OPTION_SLUGS,
  NEED_OPENER_SLUGS,
  resolveOpenerSlug,
} from "../audio-mapping";

// ── Needs picker ─────────────────────────────────────────────────────────────

describe("FV-117: sport-keyed needs picker", () => {
  it("hockey needs contains 'Better puck decisions' and NOT 'Better decisions with the ball'", () => {
    expect(HOCKEY_CONFIG.needs).toContain("Better puck decisions");
    expect(HOCKEY_CONFIG.needs).not.toContain("Better decisions with the ball");
  });

  it("basketball needs contains 'Better decisions with the ball' and NOT 'Better puck decisions'", () => {
    expect(BASKETBALL_CONFIG.needs).toContain("Better decisions with the ball");
    expect(BASKETBALL_CONFIG.needs).not.toContain("Better puck decisions");
  });

  it("hockey needs has 9 options (unchanged from original NEEDS list)", () => {
    expect(HOCKEY_CONFIG.needs).toHaveLength(9);
  });

  it("basketball needs has 9 options (one swap, same count)", () => {
    expect(BASKETBALL_CONFIG.needs).toHaveLength(9);
  });

  it("both sports share 8 common needs (only the sport-specific one differs)", () => {
    const hockeySet = new Set(HOCKEY_CONFIG.needs);
    const bbSet = new Set(BASKETBALL_CONFIG.needs);
    const shared = [...hockeySet].filter((n) => bbSet.has(n));
    expect(shared).toHaveLength(8);
  });
});

// ── Anchors picker ────────────────────────────────────────────────────────────

describe("FV-117: sport-keyed anchors picker", () => {
  it("hockey anchors contains 'Tap stick twice' and 'Touch glove'", () => {
    expect(HOCKEY_CONFIG.anchors).toContain("Tap stick twice");
    expect(HOCKEY_CONFIG.anchors).toContain("Touch glove");
  });

  it("basketball anchors does NOT contain 'Tap stick twice' or 'Touch glove'", () => {
    expect(BASKETBALL_CONFIG.anchors).not.toContain("Tap stick twice");
    expect(BASKETBALL_CONFIG.anchors).not.toContain("Touch glove");
  });

  it("basketball anchors contains 'Bounce ball twice', 'Tap floor', 'Look at rim'", () => {
    expect(BASKETBALL_CONFIG.anchors).toContain("Bounce ball twice");
    expect(BASKETBALL_CONFIG.anchors).toContain("Tap floor");
    expect(BASKETBALL_CONFIG.anchors).toContain("Look at rim");
  });

  it("hockey anchors does NOT contain 'Bounce ball twice', 'Tap floor', or 'Look at rim'", () => {
    expect(HOCKEY_CONFIG.anchors).not.toContain("Bounce ball twice");
    expect(HOCKEY_CONFIG.anchors).not.toContain("Tap floor");
    expect(HOCKEY_CONFIG.anchors).not.toContain("Look at rim");
  });

  it("both sports share 'Long exhale', 'Press thumb to palm', and 'Say cue word'", () => {
    const shared = ["Long exhale", "Press thumb to palm", "Say cue word"];
    for (const anchor of shared) {
      expect(HOCKEY_CONFIG.anchors).toContain(anchor);
      expect(BASKETBALL_CONFIG.anchors).toContain(anchor);
    }
  });

  it("hockey has 6 anchors (unchanged)", () => {
    expect(HOCKEY_CONFIG.anchors).toHaveLength(6);
  });

  it("basketball has 6 anchors (same count as hockey)", () => {
    expect(BASKETBALL_CONFIG.anchors).toHaveLength(6);
  });

  it("every basketball anchor (except 'Say cue word') has a slug in ANCHOR_OPTION_SLUGS", () => {
    const skip = new Set(["Say cue word"]);
    const unmapped: string[] = [];
    for (const anchor of BASKETBALL_CONFIG.anchors) {
      if (skip.has(anchor)) continue;
      if (!(anchor in ANCHOR_OPTION_SLUGS)) {
        unmapped.push(`basketball anchor "${anchor}" not in ANCHOR_OPTION_SLUGS`);
      }
    }
    expect(unmapped).toEqual([]);
  });
});

// ── Self-talk picker ──────────────────────────────────────────────────────────

describe("FV-117: sport-keyed selfTalkOptions picker", () => {
  it("hockey selfTalkOptions contains 'You're okay. Next shift.'", () => {
    expect(HOCKEY_CONFIG.selfTalkOptions).toContain("You're okay. Next shift.");
  });

  it("hockey selfTalkOptions does NOT contain 'You're okay. Next possession.'", () => {
    expect(HOCKEY_CONFIG.selfTalkOptions).not.toContain(
      "You're okay. Next possession.",
    );
  });

  it("basketball selfTalkOptions contains 'You're okay. Next possession.'", () => {
    expect(BASKETBALL_CONFIG.selfTalkOptions).toContain(
      "You're okay. Next possession.",
    );
  });

  it("basketball selfTalkOptions does NOT contain 'You're okay. Next shift.'", () => {
    expect(BASKETBALL_CONFIG.selfTalkOptions).not.toContain(
      "You're okay. Next shift.",
    );
  });

  it("both sports share the 6 sport-neutral self-talk phrases", () => {
    const neutral = [
      "Breathe. Do your job.",
      "Stay steady. Make the next play.",
      "You don't need to do too much.",
      "Compete, recover, go again.",
      "Your identity is secure. Play free.",
      "You are secure. Take the next faithful action.",
    ];
    for (const phrase of neutral) {
      expect(HOCKEY_CONFIG.selfTalkOptions).toContain(phrase);
      expect(BASKETBALL_CONFIG.selfTalkOptions).toContain(phrase);
    }
  });

  it("hockey has 7 self-talk options (unchanged)", () => {
    expect(HOCKEY_CONFIG.selfTalkOptions).toHaveLength(7);
  });

  it("basketball has 7 self-talk options (same count as hockey)", () => {
    expect(BASKETBALL_CONFIG.selfTalkOptions).toHaveLength(7);
  });

  it("every basketball selfTalkOption has a slug in SELFTALK_OPTION_SLUGS", () => {
    const unmapped: string[] = [];
    for (const phrase of BASKETBALL_CONFIG.selfTalkOptions) {
      if (!(phrase in SELFTALK_OPTION_SLUGS)) {
        unmapped.push(`basketball self-talk "${phrase}" not in SELFTALK_OPTION_SLUGS`);
      }
    }
    expect(unmapped).toEqual([]);
  });
});

// ── Need→opener slug resolution (FV-117 / FV-116) ────────────────────────────

describe("FV-117: resolveOpenerSlug — sport-keyed opener resolution", () => {
  it("hockey 'Physical courage' uses the shared opener-courage slug", () => {
    expect(resolveOpenerSlug("Physical courage", "hockey")).toBe("opener-courage");
  });

  it("basketball 'Physical courage' uses the sport-specific opener-bb-courage", () => {
    expect(resolveOpenerSlug("Physical courage", "basketball")).toBe(
      "opener-bb-courage",
    );
  });

  it("basketball 'Better decisions with the ball' uses opener-bb-decisions", () => {
    expect(resolveOpenerSlug("Better decisions with the ball", "basketball")).toBe(
      "opener-bb-decisions",
    );
  });

  it("hockey has no 'Better decisions with the ball' option so it falls back to opener-decisions", () => {
    // "Better decisions with the ball" is a basketball-only label, but the
    // NeedToday union now includes it. Hockey resolution falls back to the
    // shared map (opener-decisions) via NEED_OPENER_SLUGS.
    expect(resolveOpenerSlug("Better decisions with the ball", "hockey")).toBe(
      "opener-decisions",
    );
  });

  it("basketball 'Confidence' falls back to the shared opener-confidence (no bb override yet)", () => {
    expect(resolveOpenerSlug("Confidence", "basketball")).toBe(
      "opener-confidence",
    );
  });

  it("basketball 'Calm' falls back to opener-calm", () => {
    expect(resolveOpenerSlug("Calm", "basketball")).toBe("opener-calm");
  });

  it("returns null for an unknown need string", () => {
    expect(resolveOpenerSlug("Unknown need", "hockey")).toBeNull();
    expect(resolveOpenerSlug("Unknown need", "basketball")).toBeNull();
  });

  it("default sport is hockey — resolveOpenerSlug without sport arg uses hockey resolution", () => {
    // Physical courage: hockey → shared opener-courage (not bb-courage)
    expect(resolveOpenerSlug("Physical courage")).toBe("opener-courage");
  });

  it("NEED_OPENER_SLUGS contains 'Better decisions with the ball' mapping to opener-decisions", () => {
    // Ensures the NeedToday union extension is fully covered in the shared map.
    expect(NEED_OPENER_SLUGS["Better decisions with the ball"]).toBe("opener-decisions");
  });

  it("every hockey need has an opener slug via resolveOpenerSlug", () => {
    const missing: string[] = [];
    for (const need of HOCKEY_CONFIG.needs) {
      if (!resolveOpenerSlug(need, "hockey")) {
        missing.push(need);
      }
    }
    expect(missing).toEqual([]);
  });

  it("every basketball need has an opener slug via resolveOpenerSlug", () => {
    const missing: string[] = [];
    for (const need of BASKETBALL_CONFIG.needs) {
      if (!resolveOpenerSlug(need, "basketball")) {
        missing.push(need);
      }
    }
    expect(missing).toEqual([]);
  });
});
