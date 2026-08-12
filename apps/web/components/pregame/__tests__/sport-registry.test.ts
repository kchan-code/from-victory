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
  BASEBALL_CONFIG,
  FOOTBALL_CONFIG,
  LACROSSE_CONFIG,
  SOCCER_CONFIG,
  getSportConfig,
  adversityOptionsFor,
  adversityLabelFor,
  type SportConfig,
} from "../sport-registry";
import { NEEDS, NEED_VERSE, RESET_ANCHORS, SELF_TALK_OPTIONS } from "../types";
import { SUPPORTED_SPORTS, type Sport } from "@/lib/sports";
import { positivePlaysFor, sportHasPositivePlays, POSITIVE_PLAYS } from "../positive-plays";

// ---------------------------------------------------------------------------
// FV-117 regression guard: HOCKEY_CONFIG picker lists must stay byte-identical
// (order + content) to the original global lists. Hockey is the live beta sport,
// so the per-sport registry refactor must never silently reorder or alter its
// chips. (Caught a "Long exhale" reorder in qa review of PR #122.)
// FV-124: "Be more Vocal" added to both NEEDS and HOCKEY_CONFIG.needs; the
// parity invariant holds — HOCKEY_CONFIG.needs continues to equal NEEDS.
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
// B-baseball. BASEBALL_CONFIG.cellSlugFor — positional (Pitcher/Catcher/Infield/
// Outfield), FV-94/FV-98. Special cases: Pitcher × benched → pulled, Pitcher ×
// hbp → hit-batter, Catcher × hbp → foul-tip. (Pitcher ships 9 — no
// fielding-error cell; the two throwing-yips cells are authored but withheld
// from the picker.) Baseball is COMPOSITIONAL-ONLY (golf/football precedent —
// FV-98): cellSlugFor returns the hm-bsb-* hard-moment clip directly. There is
// no baked bsb-* composite — zero exist in the rendered catalog.
// ---------------------------------------------------------------------------

describe("BASEBALL_CONFIG.cellSlugFor", () => {
  const roles = ["Pitcher", "Catcher", "Infield", "Outfield"] as const;
  const special = new Set(["Pitcher|benched", "Pitcher|hbp", "Pitcher|error", "Catcher|hbp"]);

  it("produces hm-bsb-{role.toLowerCase()}-{frag} for every role × adversity (minus special cases)", () => {
    const unexpected: string[] = [];
    for (const role of roles) {
      for (const adversity of BASEBALL_CONFIG.adversities) {
        const frag = BASEBALL_CONFIG.adversitySlugFragments[adversity];
        if (frag === undefined) {
          unexpected.push(`adversity "${adversity}" has no slug fragment in BASEBALL_CONFIG`);
          continue;
        }
        if (special.has(`${role}|${frag}`)) continue; // covered separately below
        const expected = `hm-bsb-${role.toLowerCase()}-${frag}`;
        const actual = BASEBALL_CONFIG.cellSlugFor(adversity, role);
        if (actual !== expected) {
          unexpected.push(`[${role} × "${adversity}"] expected "${expected}" but got "${actual}"`);
        }
      }
    }
    expect(unexpected).toEqual([]);
  });

  it("Pitcher special cases: benched → pulled, hbp → hit-batter, error → strikeout (9-cell)", () => {
    expect(BASEBALL_CONFIG.cellSlugFor("I get benched.", "Pitcher")).toBe("hm-bsb-pitcher-pulled");
    expect(BASEBALL_CONFIG.cellSlugFor("I get hit by a pitch.", "Pitcher")).toBe("hm-bsb-pitcher-hit-batter");
    // Pitcher drops the fielding-error cell (ships 9); the never-shown combo
    // redirects to an existing clip so the exhaustive matrix stays 39 distinct.
    expect(BASEBALL_CONFIG.cellSlugFor("I make an error.", "Pitcher")).toBe("hm-bsb-pitcher-strikeout");
  });

  it("Catcher × 'I get hit by a pitch.' → hm-bsb-catcher-foul-tip", () => {
    expect(BASEBALL_CONFIG.cellSlugFor("I get hit by a pitch.", "Catcher")).toBe("hm-bsb-catcher-foul-tip");
  });

  it("all 10 adversity strings have a fragment in adversitySlugFragments", () => {
    const missing: string[] = [];
    for (const adversity of BASEBALL_CONFIG.adversities) {
      if (!(adversity in BASEBALL_CONFIG.adversitySlugFragments)) missing.push(adversity);
    }
    expect(missing).toEqual([]);
  });

  it("getSportConfig('baseball') returns BASEBALL_CONFIG", () => {
    expect(getSportConfig("baseball")).toBe(BASEBALL_CONFIG);
  });
});

// ---------------------------------------------------------------------------
// B-baseball-2. The "I lose my command." throwing-yips withhold (FV-93 §5/§6,
// the FV-119 / lacrosse-yips / golf-first-tee pattern). Catcher + Infield
// withhold it from the picker (the throwing yips); Pitcher relabels it
// ("I lose the zone.") and keeps offering it (a pitcher losing the zone is
// the routine failure mode, not a clinical yips episode); Outfield offers it
// unrelabeled via the flat-list fallback — for an outfielder this key means a
// bad relay throw, not the yips, so there is no clinical reason to withhold it.
// ---------------------------------------------------------------------------

describe("BASEBALL_CONFIG — the 'I lose my command.' throwing-yips withhold (FV-93 §5/§6)", () => {
  const LOSE_COMMAND = "I lose my command.";

  it("Catcher and Infield do NOT offer it in their Hard Moment picker", () => {
    const offered: string[] = [];
    for (const role of ["Catcher", "Infield"] as const) {
      const keys = adversityOptionsFor(BASEBALL_CONFIG, role).map((o) => o.key);
      if (keys.includes(LOSE_COMMAND)) offered.push(role);
    }
    expect(
      offered,
      `"${LOSE_COMMAND}" must stay picker-withheld for Catcher/Infield; offered for: ${offered.join(", ")}`,
    ).toEqual([]);
  });

  it("Pitcher DOES offer it, relabeled 'I lose the zone.'", () => {
    const opts = adversityOptionsFor(BASEBALL_CONFIG, "Pitcher");
    const match = opts.find((o) => o.key === LOSE_COMMAND);
    expect(match).toBeDefined();
    expect(match?.label).toBe("I lose the zone.");
  });

  it("Outfield DOES offer it via the flat fallback (a bad throw, not the yips — no roleAdversities override)", () => {
    const opts = adversityOptionsFor(BASEBALL_CONFIG, "Outfield");
    const match = opts.find((o) => o.key === LOSE_COMMAND);
    expect(match).toBeDefined();
    expect(match?.label).toBe(LOSE_COMMAND);
  });

  it("the two gated cells still resolve via cellSlugFor (authored + rendered, just picker-withheld)", () => {
    expect(BASEBALL_CONFIG.cellSlugFor(LOSE_COMMAND, "Catcher")).toBe("hm-bsb-catcher-lose-command");
    expect(BASEBALL_CONFIG.cellSlugFor(LOSE_COMMAND, "Infield")).toBe("hm-bsb-infield-lose-command");
  });

  it("the key stays in the flat adversities array (grid parity — authored, not offered for every role)", () => {
    expect(BASEBALL_CONFIG.adversities).toContain(LOSE_COMMAND);
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
// F. HOCKEY_CONFIG practice fields — FV-121 "Talk every shift" parity
// ---------------------------------------------------------------------------

describe("HOCKEY_CONFIG practice fields — FV-121 hockey focus parity", () => {
  it("practiceFocusOptions includes 'Talk every shift'", () => {
    expect(HOCKEY_CONFIG.practiceFocusOptions).toContain("Talk every shift");
  });

  it("practiceFocusSlugs maps 'Talk every shift' → 'pp-focus-talk-every-shift'", () => {
    expect(HOCKEY_CONFIG.practiceFocusSlugs["Talk every shift"]).toBe(
      "pp-focus-talk-every-shift",
    );
  });

  it("practiceFocusOptions has exactly 8 entries after FV-121 addition", () => {
    // Was 7 before FV-121; +1 = 8.
    expect(HOCKEY_CONFIG.practiceFocusOptions).toHaveLength(8);
  });

  it("practiceFocusSlugs has one entry per practiceFocusOptions item", () => {
    for (const option of HOCKEY_CONFIG.practiceFocusOptions) {
      expect(
        HOCKEY_CONFIG.practiceFocusSlugs,
        `Missing slug for "${option}"`,
      ).toHaveProperty(option);
    }
  });

  it("every hockey practiceFocusSlugs value is a pp-focus-* slug", () => {
    for (const [option, slug] of Object.entries(HOCKEY_CONFIG.practiceFocusSlugs)) {
      expect(slug, `Slug for "${option}"`).toMatch(/^pp-focus-/);
    }
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
    expect(byKey["I get beaten wide."]).toBe("I let in a soft one.");
    expect(byKey["I miss a scoring chance."]).toBe("I give up a bad rebound.");
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

  it("basketball: Guard/Wing return the flat 10; Big is FV-119-gated to 8", () => {
    // Guard + Wing have no override → the shared flat list of 10.
    for (const role of ["Guard", "Wing"] as const) {
      const opts = adversityOptionsFor(BASKETBALL_CONFIG, role);
      expect(opts.map((o) => o.key)).toEqual([...BASKETBALL_CONFIG.adversities]);
      expect(opts.every((o) => o.key === o.label)).toBe(true);
    }
    // Big is FV-119-gated: the two most intense distress cells are withheld
    // until clinical sign-off — "I get benched." (→ hm-bb-big-fouled-out) and
    // "We fall behind early." (→ hm-bb-big-fall-behind-early).
    const bigOpts = adversityOptionsFor(BASKETBALL_CONFIG, "Big").map((o) => o.key);
    expect(bigOpts).toHaveLength(8);
    expect(bigOpts).not.toContain("I get benched.");
    expect(bigOpts).not.toContain("We fall behind early.");
    for (const a of BASKETBALL_CONFIG.adversities) {
      if (a === "I get benched." || a === "We fall behind early.") continue;
      expect(bigOpts).toContain(a);
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
    ).toBe("I give up a bad rebound.");
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

  it("hockey needs has 10 options (9 original + 'Be more Vocal' from FV-124)", () => {
    expect(HOCKEY_CONFIG.needs).toHaveLength(10);
  });

  it("basketball needs has 10 options (9 original + 'Be more Vocal' from FV-124)", () => {
    expect(BASKETBALL_CONFIG.needs).toHaveLength(10);
  });

  it("both sports share 9 common needs (sport-specific one differs, plus shared Be more Vocal)", () => {
    const hockeySet = new Set(HOCKEY_CONFIG.needs);
    const bbSet = new Set(BASKETBALL_CONFIG.needs);
    const shared = [...hockeySet].filter((n) => bbSet.has(n));
    expect(shared).toHaveLength(9);
  });

  it("both sports include 'Be more Vocal' (FV-124)", () => {
    expect(HOCKEY_CONFIG.needs).toContain("Be more Vocal");
    expect(BASKETBALL_CONFIG.needs).toContain("Be more Vocal");
  });
});

// ── Golf individual-sport needs + picker copy (FV-294) ──────────────────────
// Golf is an individual sport: it drops the team-sport needs (Leadership,
// Physical courage, Be more Vocal) and adds "Trust my swing" (commitment, not
// contact), and it overrides the positive-plays picker copy to a "shots"
// register. These guard that config so a future edit can't silently regress it.
describe("FV-294: golf individual-sport needs + positive-plays copy", () => {
  const golf = getSportConfig("golf");

  it("golf needs has 8 options", () => {
    expect(golf.needs).toHaveLength(8);
  });

  it("golf needs includes 'Trust my swing' and 'Better course management'", () => {
    expect(golf.needs).toContain("Trust my swing");
    expect(golf.needs).toContain("Better course management");
  });

  it("golf drops the team-sport needs (Physical courage / Leadership / Be more Vocal)", () => {
    expect(golf.needs).not.toContain("Physical courage");
    expect(golf.needs).not.toContain("Leadership");
    expect(golf.needs).not.toContain("Be more Vocal");
  });

  it("every golf need resolves to an opener slug", () => {
    const missing = golf.needs.filter((need) => !resolveOpenerSlug(need, "golf"));
    expect(missing).toEqual([]);
  });

  it("'Trust my swing' reuses the shared decisions opener (FV-294 option A)", () => {
    // FV-466: the shared fallback is now the sport-neutral opener-shared-* set.
    expect(resolveOpenerSlug("Trust my swing", "golf")).toBe("opener-shared-decisions");
    expect(NEED_OPENER_SLUGS["Trust my swing"]).toBe("opener-shared-decisions");
  });

  it("'Trust my swing' has a NEED_VERSE entry on Proverbs 3:5-6 with the ordering eyebrow", () => {
    const verse = NEED_VERSE["Trust my swing"];
    expect(verse.reference).toBe("Proverbs 3:5-6");
    expect(verse.eyebrow).toBeTruthy();
  });

  it("golf overrides the picker copy to its own 'shots' register", () => {
    expect(golf.positivePlaysCopy?.label).toBe("Step 04 · Shots");
    expect(golf.positivePlaysCopy?.heading).toContain("shots");
  });

  it("team sports leave positivePlaysCopy undefined (fall back to the default)", () => {
    expect(HOCKEY_CONFIG.positivePlaysCopy).toBeUndefined();
    expect(BASKETBALL_CONFIG.positivePlaysCopy).toBeUndefined();
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

  it("hockey has 7 anchors (added 'Take a drink')", () => {
    expect(HOCKEY_CONFIG.anchors).toHaveLength(7);
  });

  it("basketball has 6 anchors (unchanged)", () => {
    expect(BASKETBALL_CONFIG.anchors).toHaveLength(6);
  });

  // NOTE: the basketball-only anchor→slug coverage check was replaced by a
  // generic per-selectable-sport guard — see the FV-301 describe below.
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

  // NOTE: the basketball-only self-talk→slug coverage check was replaced by a
  // generic per-selectable-sport guard — see the FV-301 describe below.
});

// ---------------------------------------------------------------------------
// FV-301: every SELECTABLE sport voices its picker options
//
// Replaces the two basketball-only coverage checks above with one generic pass
// over every sport an athlete can actually select (SUPPORTED_SPORTS — hockey,
// basketball, golf). When a chosen anchor / self-talk phrase isn't in its slug
// map, resolvePlaylist resolves it to null and silently drops the clip
// (audio-playlist.ts ~L288) — the athlete picks it and hears nothing at the
// reset. So every selectable option must map to a slug.
//
// Symmetric across sports and robust to HOCKEY_CONFIG.anchors being decoupled
// from the legacy RESET_ANCHORS constant: hockey is asserted here via
// HOCKEY_CONFIG.anchors DIRECTLY (config.anchors), not transitively through
// RESET_ANCHORS (the FV-301 acceptance criterion).
//
// KNOWN_UNVOICED_* documents the one LIVE exception: golf shipped (it is in
// SUPPORTED_SPORTS) with three sport-specific anchors + one self-talk phrase
// whose audio clips were planned-but-never-rendered. Per GOLF_CONFIG they "drop
// cleanly until then" — the Pre-Game Card + text mode still show the wording;
// only the ~3s spoken reset clip is absent. Tracked for render-or-remove in
// FV-303. Listing them keeps the guard green for the documented gap while still
// failing on any NEW unmapped option (a real regression). The stale-entry test
// forces this list to shrink the moment those clips render or the options drop.
// ---------------------------------------------------------------------------

const KNOWN_UNVOICED_ANCHORS: Partial<Record<Sport, readonly string[]>> = {
  // FV-303 — golf anchors rendered; FV-468 — football anchors rendered.
  // No known unvoiced anchors remain.
};

const KNOWN_UNVOICED_SELFTALK: Partial<Record<Sport, readonly string[]>> = {
  // FV-303 — golf self-talk rendered; FV-468 — football self-talk rendered.
  // No known unvoiced self-talk remains.
};

describe("FV-301: every selectable sport voices its picker options", () => {
  it("every anchor (except 'Say cue word') maps to ANCHOR_OPTION_SLUGS", () => {
    const intentionallySkipped = new Set(["Say cue word"]);
    const unmapped: string[] = [];

    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport);
      const pending = new Set(KNOWN_UNVOICED_ANCHORS[sport] ?? []);
      for (const anchor of config.anchors) {
        if (intentionallySkipped.has(anchor)) continue;
        if (anchor in ANCHOR_OPTION_SLUGS) continue;
        if (pending.has(anchor)) continue; // documented gap — FV-303
        unmapped.push(
          `${sport} anchor "${anchor}" has no ANCHOR_OPTION_SLUGS entry`,
        );
      }
    }

    expect(unmapped).toEqual([]);
  });

  it("every self-talk phrase maps to SELFTALK_OPTION_SLUGS", () => {
    const unmapped: string[] = [];

    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport);
      const pending = new Set(KNOWN_UNVOICED_SELFTALK[sport] ?? []);
      for (const phrase of config.selfTalkOptions) {
        if (phrase in SELFTALK_OPTION_SLUGS) continue;
        if (pending.has(phrase)) continue; // documented gap — FV-303
        unmapped.push(
          `${sport} self-talk "${phrase}" has no SELFTALK_OPTION_SLUGS entry`,
        );
      }
    }

    expect(unmapped).toEqual([]);
  });

  // Keep the known-gap lists honest: every KNOWN_UNVOICED_* entry must still be
  // a real option for that sport AND still be unmapped. When golf's clips render
  // (the option gains a slug) or the option is removed, this fails until the
  // stale entry is deleted — so the allowlist can only shrink, never rot.
  it("KNOWN_UNVOICED_* lists have no stale entries", () => {
    const stale: string[] = [];

    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport);
      for (const anchor of KNOWN_UNVOICED_ANCHORS[sport] ?? []) {
        if (!config.anchors.includes(anchor)) {
          stale.push(
            `${sport} anchor "${anchor}" is allowlisted but not in config.anchors`,
          );
        } else if (anchor in ANCHOR_OPTION_SLUGS) {
          stale.push(
            `${sport} anchor "${anchor}" is now voiced — remove from KNOWN_UNVOICED_ANCHORS`,
          );
        }
      }
      for (const phrase of KNOWN_UNVOICED_SELFTALK[sport] ?? []) {
        if (!config.selfTalkOptions.includes(phrase)) {
          stale.push(
            `${sport} self-talk "${phrase}" is allowlisted but not in config.selfTalkOptions`,
          );
        } else if (phrase in SELFTALK_OPTION_SLUGS) {
          stale.push(
            `${sport} self-talk "${phrase}" is now voiced — remove from KNOWN_UNVOICED_SELFTALK`,
          );
        }
      }
    }

    expect(stale).toEqual([]);
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

  it("hockey has no 'Better decisions with the ball' option so it falls back to opener-shared-decisions", () => {
    // "Better decisions with the ball" is a basketball-only label, but the
    // NeedToday union now includes it. It's not in HOCKEY_OPENER_OVERRIDES
    // (hockey never offers it), so resolution falls back to the sport-neutral
    // shared map (opener-shared-decisions, FV-466) via NEED_OPENER_SLUGS.
    expect(resolveOpenerSlug("Better decisions with the ball", "hockey")).toBe(
      "opener-shared-decisions",
    );
  });

  it("basketball 'Confidence' uses the sport-specific opener-bb-confidence (FV-120)", () => {
    // FV-120 rendered all 6 remaining basketball opener variants.
    // basketball 'Confidence' now has its own opener-bb-confidence clip.
    expect(resolveOpenerSlug("Confidence", "basketball")).toBe(
      "opener-bb-confidence",
    );
  });

  it("basketball 'Calm' falls back to the sport-neutral opener-shared-calm (FV-466)", () => {
    expect(resolveOpenerSlug("Calm", "basketball")).toBe("opener-shared-calm");
  });

  it("returns null for an unknown need string", () => {
    expect(resolveOpenerSlug("Unknown need", "hockey")).toBeNull();
    expect(resolveOpenerSlug("Unknown need", "basketball")).toBeNull();
  });

  it("default sport is hockey — resolveOpenerSlug without sport arg uses hockey resolution", () => {
    // Physical courage: hockey → shared opener-courage (not bb-courage)
    expect(resolveOpenerSlug("Physical courage")).toBe("opener-courage");
  });

  it("NEED_OPENER_SLUGS contains 'Better decisions with the ball' mapping to opener-shared-decisions", () => {
    // Ensures the NeedToday union extension is fully covered in the shared map.
    expect(NEED_OPENER_SLUGS["Better decisions with the ball"]).toBe("opener-shared-decisions");
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

  // FV-124: Be more Vocal opener resolution
  it("'Be more Vocal' hockey → 'opener-be-vocal'", () => {
    expect(resolveOpenerSlug("Be more Vocal", "hockey")).toBe("opener-be-vocal");
  });

  it("'Be more Vocal' basketball → 'opener-bb-be-vocal'", () => {
    expect(resolveOpenerSlug("Be more Vocal", "basketball")).toBe("opener-bb-be-vocal");
  });
});

// ---------------------------------------------------------------------------
// FV-294 regression guard: the positivePlays step must never be shown empty.
//
// PregameFlow shows the positivePlays step only when sportHasPositivePlays(roles)
// is true, NOT when the sport merely declares roles. The step is
// `required: (s) => s.positivePlays.length > 0`, so a sport that declares roles
// but ships no plays (golf — Bomber/Ball-Striker/Scrambler exist, zero viz plays
// until the FV-294 content lands) would render an empty picker the athlete can
// never satisfy → TRAPPED on Step 04. That was live when golf went selectable
// (FV-270); the integrity assertion that would have caught it only looped
// hockey+basketball. This is that missing assertion.
// ---------------------------------------------------------------------------

describe("FV-294 — sportHasPositivePlays gates the picker so no athlete is trapped", () => {
  it("returns true now that golf ships plays for all 3 roles (FV-294 — was false before the 21 viz clips landed)", () => {
    // Point-in-time assertion updated: golf now has 7 plays × 3 roles (Bomber /
    // Ball-Striker / Scrambler), so the picker is safe to show and this flips
    // to true. The durable guard is the SUPPORTED_SPORTS loop in the next test.
    const golfConfig = getSportConfig("golf");
    const golfRoles = golfConfig.roles ?? [];
    expect(golfRoles.length).toBeGreaterThan(0);
    expect(sportHasPositivePlays(golfConfig.sportKey, golfRoles)).toBe(true);
  });

  it("requires EVERY role to have plays, not just some", () => {
    expect(sportHasPositivePlays("hockey", ["Forward", "Defense", "Goalie"])).toBe(true);
    // A hypothetical sport with "Forward" (plays exist) + "UnknownRole" (no plays)
    // → the whole step must stay hidden because UnknownRole yields an empty picker.
    expect(sportHasPositivePlays("hockey", ["Forward", "UnknownRole"])).toBe(false);
  });

  it("returns false for no-role / empty / undefined", () => {
    expect(sportHasPositivePlays("hockey", [])).toBe(false);
    expect(sportHasPositivePlays("hockey", undefined)).toBe(false);
  });

  it("every supported sport that shows the picker has plays for ALL its roles", () => {
    for (const sport of SUPPORTED_SPORTS) {
      const config = getSportConfig(sport);
      const roles = config.roles ?? [];
      if (!sportHasPositivePlays(config.sportKey, roles)) continue; // step is skipped — safe
      for (const role of roles) {
        expect(positivePlaysFor(config.sportKey, role).length).toBeGreaterThan(0);
      }
    }
  });

  it("hockey and lacrosse 'Defense'/'Goalie' role names don't collide across sports (FV-406)", () => {
    // Regression guard for the bug the `sport` field fixed: before FV-406,
    // positivePlaysFor(role) filtered on role alone, so hockey's Defense/
    // Goalie picker could leak lacrosse's Defense/Goalie plays (or vice
    // versa) once lacrosse went live. Lacrosse is now live (FV-407), so this
    // guard is load-bearing, not just verifiable-in-advance.
    const hockeyDefense = positivePlaysFor("hockey", "Defense");
    const laxDefense = positivePlaysFor("lacrosse", "Defense");
    const hockeyGoalie = positivePlaysFor("hockey", "Goalie");
    const laxGoalie = positivePlaysFor("lacrosse", "Goalie");
    expect(hockeyDefense.every((p) => p.sport === "hockey")).toBe(true);
    expect(laxDefense.every((p) => p.sport === "lacrosse")).toBe(true);
    expect(hockeyGoalie.every((p) => p.sport === "hockey")).toBe(true);
    expect(laxGoalie.every((p) => p.sport === "lacrosse")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FV-406/FV-407: LACROSSE_CONFIG — registry wiring integrity.
//
// Lacrosse went LIVE per the 2026-08-11 KC launch directive (FV-407):
// docs/lacrosse-module-map.md, FV-404 KC-ratified taxonomy, athlete-
// selectable via SUPPORTED_SPORTS (lib/sports.ts). The grid: 5 positions
// × 10 shared adversities → 47 distinct cells; + 3 clinically WITHHELD
// yips-class cells (FV-404 §4, the FV-119 pattern) = 50 authored.
// ---------------------------------------------------------------------------

import { LACROSSE_PREGAME_CLIP_SCRIPTS } from "../audio/clips-lacrosse";
import { LACROSSE_VIZ_CLIP_SCRIPTS } from "../audio/clips-viz-lacrosse";
import { SOCCER_PREGAME_CLIP_SCRIPTS } from "../audio/clips-soccer";
import { SOCCER_VIZ_CLIP_SCRIPTS } from "../audio/clips-viz-soccer";
import { CLIP_SCRIPTS } from "../audio/clips";

describe("FV-407: lacrosse is LIVE", () => {
  it("lacrosse IS in SUPPORTED_SPORTS (athlete-selectable)", () => {
    expect(SUPPORTED_SPORTS as readonly string[]).toContain("lacrosse");
  });

  it("getSportConfig('lacrosse') returns LACROSSE_CONFIG with sportKey 'lacrosse'", () => {
    expect(getSportConfig("lacrosse")).toBe(LACROSSE_CONFIG);
    expect(LACROSSE_CONFIG.sportKey).toBe("lacrosse");
  });

  it("lacrosse's positive-play content is complete (FV-406) — sportHasPositivePlays gates the picker, same as any live sport", () => {
    // FV-406 wired all 35 lacrosse POSITIVE_PLAYS entries (7 per role), so
    // sportHasPositivePlays returns true — the FV-294 trap this gate exists
    // to prevent (an athlete stranded on an empty picker) is now a live
    // concern for lacrosse, and this assertion is load-bearing.
    expect(sportHasPositivePlays(LACROSSE_CONFIG.sportKey, LACROSSE_CONFIG.roles)).toBe(true);
  });
});

describe("LACROSSE_CONFIG.cellSlugFor — the FV-404 grid", () => {
  const roles = LACROSSE_CONFIG.roles ?? [];

  it("declares the 5 ratified positions (FV-404 §1 — LSM folds into Defense)", () => {
    expect(roles).toEqual(["Attack", "Midfield", "Defense", "FOGO", "Goalie"]);
  });

  it("all 10 adversity strings have a fragment in adversitySlugFragments", () => {
    const missing: string[] = [];
    for (const adversity of LACROSSE_CONFIG.adversities) {
      if (!(adversity in LACROSSE_CONFIG.adversitySlugFragments)) missing.push(adversity);
    }
    expect(missing).toEqual([]);
  });

  it("the full 5×10 matrix resolves to exactly 47 distinct hm-lax-* cells (FV-404 §3)", () => {
    const slugs = new Set<string>();
    for (const role of roles) {
      for (const adversity of LACROSSE_CONFIG.adversities) {
        slugs.add(LACROSSE_CONFIG.cellSlugFor(adversity, role));
      }
    }
    expect(slugs.size).toBe(47);
    expect([...slugs].every((s) => s.startsWith("hm-lax-"))).toBe(true);
    // The withheld yips cells are NOT reachable from the shared-10 grid.
    expect(slugs.has("hm-lax-fogo-clamp-yips")).toBe(false);
    expect(slugs.has("hm-lax-goalie-save-yips")).toBe(false);
    expect(slugs.has("hm-lax-defense-clear-yips")).toBe(false);
  });

  it("Attack special cases: failed-clear → rode-out; dropped dodged reroutes to turnover", () => {
    expect(LACROSSE_CONFIG.cellSlugFor("I fail a clear.", "Attack")).toBe("hm-lax-attack-rode-out");
    // Attack drops `dodged` (omitted from its picker); the reroute keeps the
    // integrity matrix whole (the baseball pitcher-error precedent).
    expect(LACROSSE_CONFIG.cellSlugFor("I get dodged.", "Attack")).toBe("hm-lax-attack-turnover");
  });

  it("FOGO special cases resolve to the dot-true cells (FV-404 Appendix)", () => {
    expect(LACROSSE_CONFIG.cellSlugFor("I get dodged.", "FOGO")).toBe("hm-lax-fogo-lose-draws");
    expect(LACROSSE_CONFIG.cellSlugFor("I take a bad penalty.", "FOGO")).toBe("hm-lax-fogo-violation");
    expect(LACROSSE_CONFIG.cellSlugFor("I get benched.", "FOGO")).toBe("hm-lax-fogo-off-the-dot");
    expect(LACROSSE_CONFIG.cellSlugFor("We fall behind early.", "FOGO")).toBe("hm-lax-fogo-behind-at-the-dot");
    // Dropped FOGO combos (never shown in his picker) reroute, not 404:
    expect(LACROSSE_CONFIG.cellSlugFor("I get shut off.", "FOGO")).toBe("hm-lax-fogo-lose-draws");
    expect(LACROSSE_CONFIG.cellSlugFor("I fail a clear.", "FOGO")).toBe("hm-lax-fogo-turnover");
  });

  it("Goalie special cases resolve to the goalie-true cells (goalie-pulled precedent)", () => {
    expect(LACROSSE_CONFIG.cellSlugFor("I turn the ball over.", "Goalie")).toBe("hm-lax-goalie-throw-away");
    expect(LACROSSE_CONFIG.cellSlugFor("I get dodged.", "Goalie")).toBe("hm-lax-goalie-beaten-clean");
    expect(LACROSSE_CONFIG.cellSlugFor("I take a bad penalty.", "Goalie")).toBe("hm-lax-goalie-man-down");
    expect(LACROSSE_CONFIG.cellSlugFor("I get shut off.", "Goalie")).toBe("hm-lax-goalie-soft-goal");
    expect(LACROSSE_CONFIG.cellSlugFor("I get benched.", "Goalie")).toBe("hm-lax-goalie-pulled");
  });

  it("no combination ever produces hm-lax-goalie-benched (a goalie is pulled)", () => {
    for (const adversity of LACROSSE_CONFIG.adversities) {
      expect(LACROSSE_CONFIG.cellSlugFor(adversity, "Goalie")).not.toBe("hm-lax-goalie-benched");
    }
  });
});

describe("LACROSSE_CONFIG — the ⚠⚠ withheld yips cells (FV-404 §4 / FV-119 pattern)", () => {
  const roles = LACROSSE_CONFIG.roles ?? [];

  it("'I lose my touch.' is NOT a selectable adversity", () => {
    expect(LACROSSE_CONFIG.adversities).not.toContain("I lose my touch.");
  });

  it("no position's Hard Moment picker carries the yips umbrella key", () => {
    for (const role of roles) {
      const keys = adversityOptionsFor(LACROSSE_CONFIG, role).map((o) => o.key);
      expect(keys, `${role} picker must omit the gated umbrella`).not.toContain("I lose my touch.");
    }
  });

  it("cellSlugFor still resolves the umbrella per position (grid completeness for the clinical re-enable)", () => {
    expect(LACROSSE_CONFIG.cellSlugFor("I lose my touch.", "FOGO")).toBe("hm-lax-fogo-clamp-yips");
    expect(LACROSSE_CONFIG.cellSlugFor("I lose my touch.", "Goalie")).toBe("hm-lax-goalie-save-yips");
    expect(LACROSSE_CONFIG.cellSlugFor("I lose my touch.", "Defense")).toBe("hm-lax-defense-clear-yips");
    // Attack/Midfield carry NO yips cell — cold-touch is the slump flavor of
    // shut-off, which ships live (FV-404 §4).
    expect(LACROSSE_CONFIG.cellSlugFor("I lose my touch.", "Attack")).toBe("hm-lax-attack-shut-off");
    expect(LACROSSE_CONFIG.cellSlugFor("I lose my touch.", "Midfield")).toBe("hm-lax-midfield-shut-off");
  });
});

describe("LACROSSE_CONFIG — Hard Moment picker options per position (FV-404 §3 counts)", () => {
  it("Attack shows 9 (drops dodged); FOGO shows 8 (drops shut-off + failed-clear)", () => {
    expect(adversityOptionsFor(LACROSSE_CONFIG, "Attack")).toHaveLength(9);
    expect(adversityOptionsFor(LACROSSE_CONFIG, "Attack").map((o) => o.key)).not.toContain("I get dodged.");
    expect(adversityOptionsFor(LACROSSE_CONFIG, "FOGO")).toHaveLength(8);
    const fogoKeys = adversityOptionsFor(LACROSSE_CONFIG, "FOGO").map((o) => o.key);
    expect(fogoKeys).not.toContain("I get shut off.");
    expect(fogoKeys).not.toContain("I fail a clear.");
  });

  it("Midfield + Defense fall back to the flat 10; Goalie shows a relabelled 10", () => {
    expect(adversityOptionsFor(LACROSSE_CONFIG, "Midfield")).toHaveLength(10);
    expect(adversityOptionsFor(LACROSSE_CONFIG, "Defense")).toHaveLength(10);
    expect(adversityOptionsFor(LACROSSE_CONFIG, "Goalie")).toHaveLength(10);
  });

  it("every roleAdversities key is a canonical adversity (labels are display-only, FV-101)", () => {
    const bad: string[] = [];
    for (const [role, options] of Object.entries(LACROSSE_CONFIG.roleAdversities ?? {})) {
      for (const o of options) {
        if (!LACROSSE_CONFIG.adversities.includes(o.key)) bad.push(`${role}: "${o.key}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("position-true relabels surface downstream via adversityLabelFor", () => {
    expect(adversityLabelFor(LACROSSE_CONFIG, "Goalie", "I get benched.")).toBe("I get pulled.");
    expect(adversityLabelFor(LACROSSE_CONFIG, "FOGO", "I get dodged.")).toBe("I lose a string of draws.");
    expect(adversityLabelFor(LACROSSE_CONFIG, "Attack", "I fail a clear.")).toBe("I get rode out.");
    // Roles without an override pass the key through.
    expect(adversityLabelFor(LACROSSE_CONFIG, "Midfield", "I get dodged.")).toBe("I get dodged.");
  });
});

describe("LACROSSE_CONFIG — practice + picker field completeness", () => {
  it("roleContent covers all 5 positions with a title and 5 scenes each", () => {
    for (const role of LACROSSE_CONFIG.roles ?? []) {
      const content = LACROSSE_CONFIG.roleContent?.[role];
      expect(content, `roleContent missing for ${role}`).toBeDefined();
      expect(content!.title.length).toBeGreaterThan(0);
      expect(content!.scenes).toHaveLength(5);
    }
  });

  it("every practiceFocusOptions entry maps to a pp-lax-focus-* slug (keys exact)", () => {
    expect(Object.keys(LACROSSE_CONFIG.practiceFocusSlugs).sort()).toEqual(
      [...LACROSSE_CONFIG.practiceFocusOptions].sort(),
    );
    for (const slug of Object.values(LACROSSE_CONFIG.practiceFocusSlugs)) {
      expect(slug).toMatch(/^pp-lax-focus-/);
    }
  });

  it("every lacrosse need resolves to an opener slug (shared-opener fallback)", () => {
    const missing = LACROSSE_CONFIG.needs.filter(
      (need) => !resolveOpenerSlug(need, "lacrosse"),
    );
    expect(missing).toEqual([]);
  });

  it("keeps the NeedToday union stable: the decisions swap reuses basketball's member", () => {
    expect(LACROSSE_CONFIG.needs).toContain("Better decisions with the ball");
    expect(LACROSSE_CONFIG.needs).not.toContain("Better puck decisions");
  });
});

// ---------------------------------------------------------------------------
// FV-406/FV-407: registry ↔ clip-script coverage. These assert config-internal
// script authoring only; file-existence + manifest coverage are asserted in
// playlist-integrity.test.ts (which now includes lacrosse in
// RENDERED_SPORT_CONFIGS since the FV-407 render populated
// manifest.practiceState.lacrosse).
//
// FV-406 UPDATE: the FV-404/FV-405 "two library themes, no flagship" VIZ
// contract was superseded during FV-406 wiring — lacrosse now ships the same
// flagship + 7-per-role positive-play contract every live sport ships
// (docs/scripts/lacrosse.md; see positive-plays.ts). Hard-moment scripts stay
// in clips-lacrosse.ts (LACROSSE_PREGAME_CLIP_SCRIPTS); VIZ scripts (flagship
// + positive plays) moved to clips-viz-lacrosse.ts (LACROSSE_VIZ_CLIP_SCRIPTS)
// and are registered into the manifest separately via clips.ts.
// ---------------------------------------------------------------------------

describe("FV-406: every lacrosse registry cell has an authored hard-moment script", () => {
  const scriptSlugs = new Set(LACROSSE_PREGAME_CLIP_SCRIPTS.map((s) => s.slug));

  it("ships 50 unique hard-moment scripts: 47 grid cells + 3 withheld yips", () => {
    expect(LACROSSE_PREGAME_CLIP_SCRIPTS).toHaveLength(50);
    expect(scriptSlugs.size).toBe(50);
  });

  it("every grid cell (5×10 via cellSlugFor) has a script", () => {
    const missing: string[] = [];
    for (const role of LACROSSE_CONFIG.roles ?? []) {
      for (const adversity of LACROSSE_CONFIG.adversities) {
        const slug = LACROSSE_CONFIG.cellSlugFor(adversity, role);
        if (!scriptSlugs.has(slug)) missing.push(`[${role} × "${adversity}"] → ${slug}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("the 3 withheld yips cells are authored (grid-complete for the clinical gate)", () => {
    for (const slug of ["hm-lax-fogo-clamp-yips", "hm-lax-goalie-save-yips", "hm-lax-defense-clear-yips"]) {
      expect(scriptSlugs.has(slug), `${slug} must be authored`).toBe(true);
    }
  });

  it("no VIZ scripts leak into the hard-moment array (they live in clips-viz-lacrosse.ts)", () => {
    const leaked = LACROSSE_PREGAME_CLIP_SCRIPTS.filter((s) => s.slug.startsWith("viz-lax-"));
    expect(leaked.map((s) => s.slug)).toEqual([]);
  });
});

describe("FV-406: lacrosse VIZ library matches the flagship + 7-per-role positive-play contract", () => {
  const vizScriptSlugs = new Set(LACROSSE_VIZ_CLIP_SCRIPTS.map((s) => s.slug));
  const laxPlays = POSITIVE_PLAYS.filter((p) => p.sport === "lacrosse");

  it("ships exactly 40 VIZ scripts: 5 flagships + 35 positive plays (7 per role)", () => {
    expect(LACROSSE_VIZ_CLIP_SCRIPTS).toHaveLength(40);
    expect(vizScriptSlugs.size).toBe(40);
  });

  it("every role has exactly one flagship (viz-lax-<role>) and 7 positive-play scripts", () => {
    for (const role of LACROSSE_CONFIG.roles ?? []) {
      const token = role.toLowerCase();
      expect(vizScriptSlugs.has(`viz-lax-${token}`), `flagship viz-lax-${token} missing`).toBe(true);
      const plays = [...vizScriptSlugs].filter((s) => s.startsWith(`viz-lax-${token}-`));
      expect(plays, `${role} positive-play script count`).toHaveLength(7);
    }
  });

  it("every lacrosse POSITIVE_PLAYS slug has a matching VIZ script (registry ↔ audio-content wiring)", () => {
    const missing = laxPlays.filter((p) => !vizScriptSlugs.has(p.slug)).map((p) => p.slug);
    expect(missing).toEqual([]);
  });

  it("POSITIVE_PLAYS declares 35 lacrosse entries — 7 per role, matching the VIZ library", () => {
    expect(laxPlays).toHaveLength(35);
    for (const role of LACROSSE_CONFIG.roles ?? []) {
      expect(laxPlays.filter((p) => p.role === role), `lacrosse ${role} play count`).toHaveLength(7);
    }
  });
});

// ---------------------------------------------------------------------------
// FV-76: SOCCER_CONFIG — dormant registry wiring (lacrosse FV-406 analog).
//
// Soccer is DORMANT: in the Sport union + SPORT_REGISTRY, clip scripts and
// POSITIVE_PLAYS complete, NOT in SUPPORTED_SPORTS (lib/sports.ts). Audio
// render is FV-76; go-live enablement is FV-78/79. The grid: 4 positions ×
// 10 shared adversities → 40 distinct cells; + 5 clinically WITHHELD cells
// (4 shootout + GK handling-yips, module map §4) = 45 authored.
// ---------------------------------------------------------------------------

describe("FV-76: soccer is DORMANT (registry-wired, not athlete-selectable)", () => {
  it("soccer is NOT in SUPPORTED_SPORTS (athlete-selectable set unchanged)", () => {
    expect(SUPPORTED_SPORTS as readonly string[]).not.toContain("soccer");
  });

  it("getSportConfig('soccer') returns SOCCER_CONFIG with sportKey 'soccer'", () => {
    expect(getSportConfig("soccer")).toBe(SOCCER_CONFIG);
    expect(SOCCER_CONFIG.sportKey).toBe("soccer");
  });

  it("soccer's positive-play content is complete — sportHasPositivePlays would pass once live", () => {
    // Wired all 28 soccer POSITIVE_PLAYS entries (7 per role), so
    // sportHasPositivePlays returns true. The picker is unreachable while
    // soccer is absent from SUPPORTED_SPORTS; this assertion is load-bearing
    // for the FV-78/79 go-live so the sport does not silently degrade to
    // flagship-only (FV-294 trap).
    expect(sportHasPositivePlays(SOCCER_CONFIG.sportKey, SOCCER_CONFIG.roles)).toBe(true);
  });
});

describe("SOCCER_CONFIG.cellSlugFor — the module-map grid", () => {
  const roles = SOCCER_CONFIG.roles ?? [];

  it("declares the 4 ratified positions (module map §1 — winger→Forward, fullback→Defender)", () => {
    expect(roles).toEqual(["Forward", "Midfielder", "Defender", "Goalkeeper"]);
  });

  it("all 10 adversity strings have a fragment in adversitySlugFragments", () => {
    const missing: string[] = [];
    for (const adversity of SOCCER_CONFIG.adversities) {
      if (!(adversity in SOCCER_CONFIG.adversitySlugFragments)) missing.push(adversity);
    }
    expect(missing).toEqual([]);
  });

  it("the full 4×10 matrix resolves to exactly 40 distinct hm-soc-* cells (uniform grid, no drops)", () => {
    const slugs = new Set<string>();
    for (const role of roles) {
      for (const adversity of SOCCER_CONFIG.adversities) {
        slugs.add(SOCCER_CONFIG.cellSlugFor(adversity, role));
      }
    }
    expect(slugs.size).toBe(40);
    expect([...slugs].every((s) => s.startsWith("hm-soc-"))).toBe(true);
    // The withheld cells are NOT reachable from the shared-10 grid.
    expect(slugs.has("hm-soc-fwd-shootout")).toBe(false);
    expect(slugs.has("hm-soc-gk-handling-yips")).toBe(false);
  });

  it("Forward special cases: missed-chance → sitter; beaten → marked-out; start-slow → drought", () => {
    expect(SOCCER_CONFIG.cellSlugFor("I miss a big chance.", "Forward")).toBe("hm-soc-fwd-sitter");
    expect(SOCCER_CONFIG.cellSlugFor("I get beaten one-v-one.", "Forward")).toBe("hm-soc-fwd-marked-out");
    expect(SOCCER_CONFIG.cellSlugFor("I start slow.", "Forward")).toBe("hm-soc-fwd-drought");
  });

  it("Midfielder special case: start-slow → cant-get-into-it", () => {
    expect(SOCCER_CONFIG.cellSlugFor("I start slow.", "Midfielder")).toBe("hm-soc-mid-cant-get-into-it");
  });

  it("Defender special cases: beaten → turned; goal-on-me keeps the identity slug", () => {
    expect(SOCCER_CONFIG.cellSlugFor("I get beaten one-v-one.", "Defender")).toBe("hm-soc-def-turned");
    expect(SOCCER_CONFIG.cellSlugFor("The goal is on me.", "Defender")).toBe("hm-soc-def-goal-on-me");
  });

  it("Goalkeeper special cases resolve to the keeper-true cells", () => {
    expect(SOCCER_CONFIG.cellSlugFor("I give the ball away.", "Goalkeeper")).toBe("hm-soc-gk-played-into-trouble");
    expect(SOCCER_CONFIG.cellSlugFor("I miss a big chance.", "Goalkeeper")).toBe("hm-soc-gk-dropped-cross");
    expect(SOCCER_CONFIG.cellSlugFor("I get beaten one-v-one.", "Goalkeeper")).toBe("hm-soc-gk-beaten-near-post");
    expect(SOCCER_CONFIG.cellSlugFor("I get booked.", "Goalkeeper")).toBe("hm-soc-gk-penalty-conceded");
    expect(SOCCER_CONFIG.cellSlugFor("The goal is on me.", "Goalkeeper")).toBe("hm-soc-gk-soft-goal");
    expect(SOCCER_CONFIG.cellSlugFor("I get benched.", "Goalkeeper")).toBe("hm-soc-gk-dropped");
  });

  it("no combination ever produces hm-soc-gk-benched (a keeper loses the shirt)", () => {
    for (const adversity of SOCCER_CONFIG.adversities) {
      expect(SOCCER_CONFIG.cellSlugFor(adversity, "Goalkeeper")).not.toBe("hm-soc-gk-benched");
    }
  });

  it("vizSlugFor uses abbreviated position tokens (not role.toLowerCase())", () => {
    expect(SOCCER_CONFIG.vizSlugFor?.("Forward")).toBe("viz-soc-fwd");
    expect(SOCCER_CONFIG.vizSlugFor?.("Midfielder")).toBe("viz-soc-mid");
    expect(SOCCER_CONFIG.vizSlugFor?.("Defender")).toBe("viz-soc-def");
    expect(SOCCER_CONFIG.vizSlugFor?.("Goalkeeper")).toBe("viz-soc-gk");
  });
});

describe("SOCCER_CONFIG — the ⚠⚠ withheld cells (module map §4 / FV-119 pattern)", () => {
  const roles = SOCCER_CONFIG.roles ?? [];

  it("'I miss in the shootout.' and 'I lose my hands.' are NOT selectable adversities", () => {
    expect(SOCCER_CONFIG.adversities).not.toContain("I miss in the shootout.");
    expect(SOCCER_CONFIG.adversities).not.toContain("I lose my hands.");
  });

  it("no position's Hard Moment picker carries the gated umbrella keys", () => {
    for (const role of roles) {
      const keys = adversityOptionsFor(SOCCER_CONFIG, role).map((o) => o.key);
      expect(keys, `${role} picker must omit shootout`).not.toContain("I miss in the shootout.");
      expect(keys, `${role} picker must omit lose-hands`).not.toContain("I lose my hands.");
    }
  });

  it("cellSlugFor still resolves the umbrellas per position (grid completeness for the clinical re-enable)", () => {
    expect(SOCCER_CONFIG.cellSlugFor("I miss in the shootout.", "Forward")).toBe("hm-soc-fwd-shootout");
    expect(SOCCER_CONFIG.cellSlugFor("I miss in the shootout.", "Midfielder")).toBe("hm-soc-mid-shootout");
    expect(SOCCER_CONFIG.cellSlugFor("I miss in the shootout.", "Defender")).toBe("hm-soc-def-shootout");
    expect(SOCCER_CONFIG.cellSlugFor("I miss in the shootout.", "Goalkeeper")).toBe("hm-soc-gk-shootout");
    expect(SOCCER_CONFIG.cellSlugFor("I lose my hands.", "Goalkeeper")).toBe("hm-soc-gk-handling-yips");
    // Outfield positions carry NO yips cell — cold spell is the slump flavor
    // of start-slow, which ships (module map §4).
    expect(SOCCER_CONFIG.cellSlugFor("I lose my hands.", "Forward")).toBe("hm-soc-fwd-drought");
    expect(SOCCER_CONFIG.cellSlugFor("I lose my hands.", "Midfielder")).toBe("hm-soc-mid-cant-get-into-it");
    expect(SOCCER_CONFIG.cellSlugFor("I lose my hands.", "Defender")).toBe("hm-soc-def-start-slow");
  });
});

describe("SOCCER_CONFIG — Hard Moment picker options per position (uniform 10)", () => {
  it("every position shows 10 (no drops)", () => {
    for (const role of SOCCER_CONFIG.roles ?? []) {
      expect(adversityOptionsFor(SOCCER_CONFIG, role), role).toHaveLength(10);
    }
  });

  it("every roleAdversities key is a canonical adversity (labels are display-only, FV-101)", () => {
    const bad: string[] = [];
    for (const [role, options] of Object.entries(SOCCER_CONFIG.roleAdversities ?? {})) {
      for (const o of options) {
        if (!SOCCER_CONFIG.adversities.includes(o.key)) bad.push(`${role}: "${o.key}"`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("position-true relabels surface downstream via adversityLabelFor", () => {
    expect(adversityLabelFor(SOCCER_CONFIG, "Forward", "I miss a big chance.")).toBe("I miss a sitter.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Forward", "I get beaten one-v-one.")).toBe("I get marked out of the game.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Forward", "I start slow.")).toBe("The goals aren't coming.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Midfielder", "I start slow.")).toBe("I can't get into the game.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Defender", "I get beaten one-v-one.")).toBe("I get turned.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Goalkeeper", "I get benched.")).toBe("I lose the shirt.");
    expect(adversityLabelFor(SOCCER_CONFIG, "Goalkeeper", "The goal is on me.")).toBe("I let in a soft one.");
  });
});

describe("SOCCER_CONFIG — practice + picker field completeness", () => {
  it("roleContent covers all 4 positions with a title and 5 scenes each", () => {
    for (const role of SOCCER_CONFIG.roles ?? []) {
      const content = SOCCER_CONFIG.roleContent?.[role];
      expect(content, `roleContent missing for ${role}`).toBeDefined();
      expect(content!.title.length).toBeGreaterThan(0);
      expect(content!.scenes).toHaveLength(5);
    }
  });

  it("every practiceFocusOptions entry maps to a pp-soc-focus-* slug (keys exact)", () => {
    expect(Object.keys(SOCCER_CONFIG.practiceFocusSlugs).sort()).toEqual(
      [...SOCCER_CONFIG.practiceFocusOptions].sort(),
    );
    for (const slug of Object.values(SOCCER_CONFIG.practiceFocusSlugs)) {
      expect(slug).toMatch(/^pp-soc-focus-/);
    }
  });

  it("soccer pre-practice clips (opener + beats + focus cues) are in CLIP_SCRIPTS", () => {
    const clipSlugs = new Set(CLIP_SCRIPTS.map((s) => s.slug));
    const expected = [
      SOCCER_CONFIG.practiceOpenerSlugs["not-feeling-it"],
      "pp-soc-name-standard",
      "pp-soc-goal-fusion",
      "pp-soc-be-vocal",
      "pp-soc-see-it-go",
      ...Object.values(SOCCER_CONFIG.practiceFocusSlugs),
    ];
    expect(expected.filter((slug) => !clipSlugs.has(slug))).toEqual([]);
  });

  it("every soccer need resolves to an opener slug (shared-opener fallback)", () => {
    const missing = SOCCER_CONFIG.needs.filter(
      (need) => !resolveOpenerSlug(need, "soccer"),
    );
    expect(missing).toEqual([]);
  });

  it("keeps the NeedToday union stable: the decisions swap reuses basketball's member", () => {
    expect(SOCCER_CONFIG.needs).toContain("Better decisions with the ball");
    expect(SOCCER_CONFIG.needs).not.toContain("Better puck decisions");
  });
});

describe("FV-76: every soccer registry cell has an authored hard-moment script", () => {
  const scriptSlugs = new Set(SOCCER_PREGAME_CLIP_SCRIPTS.map((s) => s.slug));

  it("ships 45 unique hard-moment scripts: 40 grid cells + 5 withheld", () => {
    expect(SOCCER_PREGAME_CLIP_SCRIPTS).toHaveLength(45);
    expect(scriptSlugs.size).toBe(45);
  });

  it("every grid cell (4×10 via cellSlugFor) has a script", () => {
    const missing: string[] = [];
    for (const role of SOCCER_CONFIG.roles ?? []) {
      for (const adversity of SOCCER_CONFIG.adversities) {
        const slug = SOCCER_CONFIG.cellSlugFor(adversity, role);
        if (!scriptSlugs.has(slug)) missing.push(`[${role} × "${adversity}"] → ${slug}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("the 5 withheld cells are authored (grid-complete for the clinical gate)", () => {
    for (const slug of [
      "hm-soc-fwd-shootout",
      "hm-soc-mid-shootout",
      "hm-soc-def-shootout",
      "hm-soc-gk-shootout",
      "hm-soc-gk-handling-yips",
    ]) {
      expect(scriptSlugs.has(slug), `${slug} must be authored`).toBe(true);
    }
  });

  it("no VIZ scripts leak into the hard-moment array (they live in clips-viz-soccer.ts)", () => {
    const leaked = SOCCER_PREGAME_CLIP_SCRIPTS.filter((s) => s.slug.startsWith("viz-soc-"));
    expect(leaked.map((s) => s.slug)).toEqual([]);
  });
});

describe("FV-76: soccer VIZ library matches the flagship + 7-per-role positive-play contract", () => {
  const vizScriptSlugs = new Set(SOCCER_VIZ_CLIP_SCRIPTS.map((s) => s.slug));
  const socPlays = POSITIVE_PLAYS.filter((p) => p.sport === "soccer");
  const tokens: Record<string, string> = {
    Forward: "fwd",
    Midfielder: "mid",
    Defender: "def",
    Goalkeeper: "gk",
  };

  it("ships exactly 32 VIZ scripts: 4 flagships + 28 positive plays (7 per role)", () => {
    expect(SOCCER_VIZ_CLIP_SCRIPTS).toHaveLength(32);
    expect(vizScriptSlugs.size).toBe(32);
  });

  it("every role has exactly one flagship (viz-soc-<pos>) and 7 positive-play scripts", () => {
    for (const role of SOCCER_CONFIG.roles ?? []) {
      const token = tokens[role]!;
      expect(vizScriptSlugs.has(`viz-soc-${token}`), `flagship viz-soc-${token} missing`).toBe(true);
      const plays = [...vizScriptSlugs].filter((s) => s.startsWith(`viz-soc-${token}-`));
      expect(plays, `${role} positive-play script count`).toHaveLength(7);
    }
  });

  it("every soccer POSITIVE_PLAYS slug has a matching VIZ script (registry ↔ audio-content wiring)", () => {
    const missing = socPlays.filter((p) => !vizScriptSlugs.has(p.slug)).map((p) => p.slug);
    expect(missing).toEqual([]);
  });

  it("POSITIVE_PLAYS declares 28 soccer entries — 7 per role, matching the VIZ library", () => {
    expect(socPlays).toHaveLength(28);
    for (const role of SOCCER_CONFIG.roles ?? []) {
      expect(socPlays.filter((p) => p.role === role), `soccer ${role} play count`).toHaveLength(7);
    }
  });

  it("every soccer HM + VIZ script is registered in CLIP_SCRIPTS (generator input)", () => {
    const clipSlugs = new Set(CLIP_SCRIPTS.map((s) => s.slug));
    const missing = [
      ...SOCCER_PREGAME_CLIP_SCRIPTS,
      ...SOCCER_VIZ_CLIP_SCRIPTS,
    ]
      .map((s) => s.slug)
      .filter((slug) => !clipSlugs.has(slug));
    expect(missing).toEqual([]);
  });
});

describe("FOOTBALL_CONFIG — the §6.3 big-hit clinical withhold (FV-206 / FV-119 pattern)", () => {
  const BIG_HIT = "I take a big hit.";

  it("withholds the big-hit adversity from EVERY role's picker", () => {
    const offered: string[] = [];
    for (const role of FOOTBALL_CONFIG.roles ?? []) {
      const opts = FOOTBALL_CONFIG.roleAdversities?.[role] ?? [];
      if (opts.some((o) => o.key === BIG_HIT)) offered.push(role);
    }
    expect(
      offered,
      `big-hit must stay picker-withheld until clinical sign-off; offered for: ${offered.join(", ")}`,
    ).toEqual([]);
  });

  it("keeps big-hit in the flat adversities list (grid parity — authored, not offered)", () => {
    expect(FOOTBALL_CONFIG.adversities).toContain(BIG_HIT);
  });

  it("the 7 big-hit cells resolve to their authored clips (grid-complete for the clinical gate)", () => {
    for (const role of FOOTBALL_CONFIG.roles ?? []) {
      const slug = FOOTBALL_CONFIG.cellSlugFor(BIG_HIT, role);
      expect(slug, `cellSlugFor(big-hit, ${role})`).toBe(`hm-ftb-${role.toLowerCase()}-big-hit`);
    }
  });
});
