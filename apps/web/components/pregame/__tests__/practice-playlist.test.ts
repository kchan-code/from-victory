// FRO-22 / FV-30 unit tests for the state-aware pre-practice "Lock In" playlist:
// resolvePracticePlaylist(manifest, state, focus, sportConfig) +
// PRACTICE_FOCUS_SLUGS + PRACTICE_FOCUS_OPTIONS for both hockey and basketball.
//
// Hockey playlist order:
//   [state opener] → pp-name-standard → pp-goal-fusion →
//   pp-choose-focus-lead → [pp-focus-<slug>?] → pp-choose-focus-tail →
//   pp-be-vocal → pp-see-it-go
//
// Basketball playlist order:
//   [state opener] → pp-bb-name-standard → pp-bb-goal-fusion →
//   pp-choose-focus-lead → [pp-bb-focus-<slug>?] → pp-choose-focus-tail →
//   pp-bb-be-vocal → pp-bb-see-it-go
//
//   - "dialed-in"      → opener pp-opener-dialed-in (DEFAULT; sport-neutral)
//   - "not-feeling-it" → opener pp-opener-get-to (hockey) / pp-bb-opener-get-to (basketball)
//
// Run narrowly: npx vitest run components/pregame/__tests__/practice-playlist.test.ts

import { describe, it, expect } from "vitest";

import {
  resolvePracticePlaylist,
  type ClipManifest,
} from "../audio-playlist";

import { type PracticeState } from "../types";
import { HOCKEY_CONFIG, BASKETBALL_CONFIG } from "../sport-registry";

// Focus options + their pp-focus slugs are sourced from the registry
// (the runtime authoritative source), not a proxy re-export.
const PRACTICE_FOCUS_OPTIONS = HOCKEY_CONFIG.practiceFocusOptions;
const PRACTICE_FOCUS_SLUGS = HOCKEY_CONFIG.practiceFocusSlugs;

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function catalogEntry(url: string, durationSec = 10) {
  return {
    url,
    durationSec,
    phases: [{ phase: "settle" as const, offsetSec: 0 }],
  };
}

/** Shared tail (Beats 2–6) — identical for both states; the opener is
 *  prepended and the focus clip injected by the resolver. */
const HOCKEY_SHARED_TAIL = [
  "pp-name-standard",
  "pp-goal-fusion",
  "pp-choose-focus-lead",
  "pp-choose-focus-tail",
  "pp-be-vocal",
  "pp-see-it-go",
];

// Keep legacy alias for the p5 backward-compat tests below.
const SHARED_TAIL = HOCKEY_SHARED_TAIL;

/** Basketball shared tail (Beats 2–6). */
const BB_SHARED_TAIL = [
  "pp-bb-name-standard",
  "pp-bb-goal-fusion",
  "pp-choose-focus-lead",
  "pp-choose-focus-tail",
  "pp-bb-be-vocal",
  "pp-bb-see-it-go",
];

const FOCUS_OPTION = "Relentless";
const FOCUS_SLUG = "pp-focus-relentless";
const BB_FOCUS_OPTION = "Relentless";
const BB_FOCUS_SLUG = "pp-bb-focus-relentless";

/** Build a p5 state-aware practice manifest (backward-compat shape).
 *  practiceState is keyed by state directly (no sport nesting). */
function buildP5Manifest(
  { includeFocus = true }: { includeFocus?: boolean } = {},
): ClipManifest {
  const clips: ClipManifest["clips"] = {
    "pp-opener-dialed-in": catalogEntry("/audio/pregame/clips/pp-opener-dialed-in.mp3", 20),
    "pp-opener-get-to": catalogEntry("/audio/pregame/clips/pp-opener-get-to.mp3", 25),
    "pp-name-standard": catalogEntry("/audio/pregame/clips/pp-name-standard.mp3", 12),
    "pp-goal-fusion": catalogEntry("/audio/pregame/clips/pp-goal-fusion.mp3", 15),
    "pp-choose-focus-lead": catalogEntry("/audio/pregame/clips/pp-choose-focus-lead.mp3", 5),
    "pp-choose-focus-tail": catalogEntry("/audio/pregame/clips/pp-choose-focus-tail.mp3", 8),
    "pp-be-vocal": catalogEntry("/audio/pregame/clips/pp-be-vocal.mp3", 18),
    "pp-see-it-go": catalogEntry("/audio/pregame/clips/pp-see-it-go.mp3", 14),
  };
  if (includeFocus) {
    clips[FOCUS_SLUG] = catalogEntry(`/audio/pregame/clips/${FOCUS_SLUG}.mp3`, 3);
  }
  return {
    version: "p5",
    clips,
    templates: [],
    practiceState: {
      "dialed-in": [...SHARED_TAIL],
      "not-feeling-it": [...SHARED_TAIL],
    },
  };
}

/** Catalog entries shared between hockey and basketball in a p6 manifest. */
function buildSharedCatalogEntries(): ClipManifest["clips"] {
  return {
    "pp-opener-dialed-in": catalogEntry("/audio/pregame/clips/pp-opener-dialed-in.mp3", 20),
    "pp-choose-focus-lead": catalogEntry("/audio/pregame/clips/pp-choose-focus-lead.mp3", 5),
    "pp-choose-focus-tail": catalogEntry("/audio/pregame/clips/pp-choose-focus-tail.mp3", 8),
  };
}

/** Build a p6 sport-keyed practice manifest.
 *  practiceState[sport]["state"] is the shared tail. */
function buildP6HockeyManifest(
  { includeFocus = true }: { includeFocus?: boolean } = {},
): ClipManifest {
  const clips: ClipManifest["clips"] = {
    ...buildSharedCatalogEntries(),
    "pp-opener-get-to": catalogEntry("/audio/pregame/clips/pp-opener-get-to.mp3", 25),
    "pp-name-standard": catalogEntry("/audio/pregame/clips/pp-name-standard.mp3", 12),
    "pp-goal-fusion": catalogEntry("/audio/pregame/clips/pp-goal-fusion.mp3", 15),
    "pp-be-vocal": catalogEntry("/audio/pregame/clips/pp-be-vocal.mp3", 18),
    "pp-see-it-go": catalogEntry("/audio/pregame/clips/pp-see-it-go.mp3", 14),
  };
  if (includeFocus) {
    clips[FOCUS_SLUG] = catalogEntry(`/audio/pregame/clips/${FOCUS_SLUG}.mp3`, 3);
  }
  return {
    version: "p6",
    clips,
    templates: [],
    practiceState: {
      hockey: {
        "dialed-in": [...HOCKEY_SHARED_TAIL],
        "not-feeling-it": [...HOCKEY_SHARED_TAIL],
      },
    },
  };
}

/** Build a p6 manifest that includes both hockey and basketball tails. */
function buildP6FullManifest(
  { includeHockeyFocus = true, includeBbFocus = true }: {
    includeHockeyFocus?: boolean;
    includeBbFocus?: boolean;
  } = {},
): ClipManifest {
  const clips: ClipManifest["clips"] = {
    ...buildSharedCatalogEntries(),
    // Hockey clips
    "pp-opener-get-to": catalogEntry("/audio/pregame/clips/pp-opener-get-to.mp3", 25),
    "pp-name-standard": catalogEntry("/audio/pregame/clips/pp-name-standard.mp3", 12),
    "pp-goal-fusion": catalogEntry("/audio/pregame/clips/pp-goal-fusion.mp3", 15),
    "pp-be-vocal": catalogEntry("/audio/pregame/clips/pp-be-vocal.mp3", 18),
    "pp-see-it-go": catalogEntry("/audio/pregame/clips/pp-see-it-go.mp3", 14),
    // Basketball clips
    "pp-bb-opener-get-to": catalogEntry("/audio/pregame/clips/pp-bb-opener-get-to.mp3", 25),
    "pp-bb-name-standard": catalogEntry("/audio/pregame/clips/pp-bb-name-standard.mp3", 12),
    "pp-bb-goal-fusion": catalogEntry("/audio/pregame/clips/pp-bb-goal-fusion.mp3", 15),
    "pp-bb-be-vocal": catalogEntry("/audio/pregame/clips/pp-bb-be-vocal.mp3", 18),
    "pp-bb-see-it-go": catalogEntry("/audio/pregame/clips/pp-bb-see-it-go.mp3", 14),
  };
  if (includeHockeyFocus) {
    clips[FOCUS_SLUG] = catalogEntry(`/audio/pregame/clips/${FOCUS_SLUG}.mp3`, 3);
  }
  if (includeBbFocus) {
    clips[BB_FOCUS_SLUG] = catalogEntry(`/audio/pregame/clips/${BB_FOCUS_SLUG}.mp3`, 3);
  }
  return {
    version: "p6",
    clips,
    templates: [],
    practiceState: {
      hockey: {
        "dialed-in": [...HOCKEY_SHARED_TAIL],
        "not-feeling-it": [...HOCKEY_SHARED_TAIL],
      },
      basketball: {
        "dialed-in": [...BB_SHARED_TAIL],
        "not-feeling-it": [...BB_SHARED_TAIL],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// 1. State-aware routing (p5)
// ---------------------------------------------------------------------------

describe("resolvePracticePlaylist — state-aware routing (p5)", () => {
  it('"dialed-in" starts with pp-opener-dialed-in and follows the full order', () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "dialed-in", FOCUS_OPTION);
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toEqual([
      "pp-opener-dialed-in",
      "pp-name-standard",
      "pp-goal-fusion",
      "pp-choose-focus-lead",
      FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-be-vocal",
      "pp-see-it-go",
    ]);
  });

  it('"not-feeling-it" swaps ONLY the opener (pp-opener-get-to), shared tail identical', () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "not-feeling-it", FOCUS_OPTION);
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs[0]).toBe("pp-opener-get-to");
    expect(slugs).not.toContain("pp-opener-dialed-in");
    // everything after the opener is the shared tail with the focus injected
    expect(slugs.slice(1)).toEqual([
      "pp-name-standard",
      "pp-goal-fusion",
      "pp-choose-focus-lead",
      FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-be-vocal",
      "pp-see-it-go",
    ]);
  });

  it("injects the focus clip immediately after pp-choose-focus-lead", () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "dialed-in", FOCUS_OPTION);
    const slugs = result!.map((c) => c.slug);
    const leadIdx = slugs.indexOf("pp-choose-focus-lead");
    expect(leadIdx).toBeGreaterThan(-1);
    expect(slugs[leadIdx + 1]).toBe(FOCUS_SLUG);
  });

  it("cache-busts every resolved clip URL", () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "dialed-in", FOCUS_OPTION);
    for (const clip of result!) {
      expect(clip.url).toContain("v=");
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Fail-closed / fail-safe behaviour
// ---------------------------------------------------------------------------

describe("resolvePracticePlaylist — fail-safe", () => {
  it("null focus → focus clip omitted, lead+tail still flow (no crash, not null)", () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "dialed-in", null);
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs.some((s) => s.startsWith("pp-focus-"))).toBe(false);
    expect(slugs).toContain("pp-choose-focus-lead");
    expect(slugs).toContain("pp-choose-focus-tail");
  });

  it("unknown focus string → focus clip dropped cleanly", () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), "dialed-in", "Not A Real Focus");
    expect(result).not.toBeNull();
    expect(result!.some((c) => c.slug.startsWith("pp-focus-"))).toBe(false);
  });

  it("unknown/invalid state → defaults to dialed-in opener (no crash)", () => {
    // Cast through unknown to feed an invalid state and prove the fail-safe default.
    const result = resolvePracticePlaylist(
      buildP5Manifest(),
      "whatever" as unknown as PracticeState,
      FOCUS_OPTION,
    );
    expect(result).not.toBeNull();
    expect(result![0]!.slug).toBe("pp-opener-dialed-in");
  });

  it("missing state arg → defaults to dialed-in", () => {
    const result = resolvePracticePlaylist(buildP5Manifest(), undefined, FOCUS_OPTION);
    expect(result).not.toBeNull();
    expect(result![0]!.slug).toBe("pp-opener-dialed-in");
  });

  it("returns null when a required structural slug is absent from the catalog", () => {
    const manifest = buildP5Manifest();
    delete manifest.clips["pp-be-vocal"]; // a required shared-tail clip
    const result = resolvePracticePlaylist(manifest, "dialed-in", FOCUS_OPTION);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Backward-compat: legacy p4 flat practice.clips path
// ---------------------------------------------------------------------------

describe("resolvePracticePlaylist — legacy p4 flat path", () => {
  it("returns null when neither practiceState nor practice is present", () => {
    const manifest: ClipManifest = { version: "p3", clips: {}, templates: [] };
    expect(resolvePracticePlaylist(manifest)).toBeNull();
  });

  it("resolves the flat practice.clips list when practiceState is absent (p4)", () => {
    const manifest: ClipManifest = {
      version: "p4",
      clips: {
        "pp-be-vocal": catalogEntry("/audio/pregame/clips/pp-be-vocal.mp3", 18),
        "pp-see-it-go": catalogEntry("/audio/pregame/clips/pp-see-it-go.mp3", 14),
      },
      templates: [],
      practice: { clips: ["pp-be-vocal", "pp-see-it-go"] },
    };
    const result = resolvePracticePlaylist(manifest);
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toEqual(["pp-be-vocal", "pp-see-it-go"]);
  });

  it("p4 path fails closed when a slug is absent from the catalog", () => {
    const manifest: ClipManifest = {
      version: "p4",
      clips: { "pp-be-vocal": catalogEntry("/audio/pregame/clips/pp-be-vocal.mp3", 18) },
      templates: [],
      practice: { clips: ["pp-be-vocal", "pp-missing-slug"] },
    };
    expect(resolvePracticePlaylist(manifest)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. PRACTICE_FOCUS_OPTIONS shape (FRO-22: "First" dropped → 7)
// ---------------------------------------------------------------------------

describe("PRACTICE_FOCUS_OPTIONS shape", () => {
  it('has exactly 7 options ("First" dropped per FRO-22)', () => {
    expect(PRACTICE_FOCUS_OPTIONS).toHaveLength(7);
  });

  it('does not contain "First"', () => {
    expect(PRACTICE_FOCUS_OPTIONS).not.toContain("First");
  });

  it("contains all 7 expected options", () => {
    const EXPECTED = [
      "Relentless",
      "Hungry",
      "Head up every breakout",
      "Feet always moving",
      "Hard first pass",
      "Win every race to the puck",
      "Full reps, no glide",
    ];
    for (const option of EXPECTED) {
      expect(PRACTICE_FOCUS_OPTIONS, `Expected "${option}"`).toContain(option);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. PRACTICE_FOCUS_SLUGS map
// ---------------------------------------------------------------------------

describe("PRACTICE_FOCUS_SLUGS map", () => {
  it("has exactly 7 entries, one per focus option", () => {
    expect(Object.keys(PRACTICE_FOCUS_SLUGS)).toHaveLength(7);
    for (const option of PRACTICE_FOCUS_OPTIONS) {
      expect(PRACTICE_FOCUS_SLUGS, `Missing slug for "${option}"`).toHaveProperty(option);
    }
  });

  it("every value is a pp-focus-* slug", () => {
    for (const [option, slug] of Object.entries(PRACTICE_FOCUS_SLUGS)) {
      expect(slug, `Slug for "${option}"`).toMatch(/^pp-focus-/);
    }
  });

  it('"First" is absent', () => {
    expect(PRACTICE_FOCUS_SLUGS).not.toHaveProperty("First");
  });

  it("maps every option to its exact expected slug", () => {
    const EXPECTED_MAP: Record<string, string> = {
      "Relentless": "pp-focus-relentless",
      "Hungry": "pp-focus-hungry",
      "Head up every breakout": "pp-focus-head-up-every-breakout",
      "Feet always moving": "pp-focus-feet-always-moving",
      "Hard first pass": "pp-focus-hard-first-pass",
      "Win every race to the puck": "pp-focus-win-every-race-to-the-puck",
      "Full reps, no glide": "pp-focus-full-reps-no-glide",
    };
    for (const [option, expectedSlug] of Object.entries(EXPECTED_MAP)) {
      expect(PRACTICE_FOCUS_SLUGS[option]).toBe(expectedSlug);
    }
  });

  it("keys exactly match PRACTICE_FOCUS_OPTIONS (no drift)", () => {
    expect(Object.keys(PRACTICE_FOCUS_SLUGS).sort()).toEqual([...PRACTICE_FOCUS_OPTIONS].sort());
  });
});

// ---------------------------------------------------------------------------
// 6. p6 hockey manifest — sport-keyed tail (FV-30 regression guard)
// ---------------------------------------------------------------------------

describe("resolvePracticePlaylist — p6 hockey sport-keyed manifest", () => {
  it('"dialed-in" resolves hockey tail correctly from p6 manifest', () => {
    const result = resolvePracticePlaylist(
      buildP6HockeyManifest(),
      "dialed-in",
      FOCUS_OPTION,
      HOCKEY_CONFIG,
    );
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toEqual([
      "pp-opener-dialed-in",
      "pp-name-standard",
      "pp-goal-fusion",
      "pp-choose-focus-lead",
      FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-be-vocal",
      "pp-see-it-go",
    ]);
  });

  it("p6 hockey: not-feeling-it swaps only the opener", () => {
    const result = resolvePracticePlaylist(
      buildP6HockeyManifest(),
      "not-feeling-it",
      FOCUS_OPTION,
      HOCKEY_CONFIG,
    );
    expect(result).not.toBeNull();
    expect(result![0]!.slug).toBe("pp-opener-get-to");
    expect(result!.map((c) => c.slug).slice(1)).toEqual([
      "pp-name-standard",
      "pp-goal-fusion",
      "pp-choose-focus-lead",
      FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-be-vocal",
      "pp-see-it-go",
    ]);
  });

  it("p6 hockey: unknown sport key in manifest → returns null (fail closed)", () => {
    // A manifest that has only basketball — hockey is missing.
    const manifest = buildP6FullManifest();
    delete (manifest.practiceState as Record<string, unknown>)["hockey"];
    const result = resolvePracticePlaylist(manifest, "dialed-in", FOCUS_OPTION, HOCKEY_CONFIG);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Basketball tail resolution (FV-30)
// ---------------------------------------------------------------------------

const BB_PRACTICE_FOCUS_OPTIONS = BASKETBALL_CONFIG.practiceFocusOptions;
const BB_PRACTICE_FOCUS_SLUGS = BASKETBALL_CONFIG.practiceFocusSlugs;

describe("resolvePracticePlaylist — basketball tail (p6, FV-30)", () => {
  it('"dialed-in" starts with pp-opener-dialed-in and uses basketball tail', () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      BB_FOCUS_OPTION,
      BASKETBALL_CONFIG,
    );
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toEqual([
      "pp-opener-dialed-in", // sport-neutral; reused
      "pp-bb-name-standard",
      "pp-bb-goal-fusion",
      "pp-choose-focus-lead",
      BB_FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-bb-be-vocal",
      "pp-bb-see-it-go",
    ]);
  });

  it('"not-feeling-it" uses pp-bb-opener-get-to (basketball-specific opener)', () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "not-feeling-it",
      BB_FOCUS_OPTION,
      BASKETBALL_CONFIG,
    );
    expect(result).not.toBeNull();
    expect(result![0]!.slug).toBe("pp-bb-opener-get-to");
    expect(result!.map((c) => c.slug).slice(1)).toEqual([
      "pp-bb-name-standard",
      "pp-bb-goal-fusion",
      "pp-choose-focus-lead",
      BB_FOCUS_SLUG,
      "pp-choose-focus-tail",
      "pp-bb-be-vocal",
      "pp-bb-see-it-go",
    ]);
  });

  it("injects the basketball focus clip immediately after pp-choose-focus-lead", () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      BB_FOCUS_OPTION,
      BASKETBALL_CONFIG,
    );
    const slugs = result!.map((c) => c.slug);
    const leadIdx = slugs.indexOf("pp-choose-focus-lead");
    expect(leadIdx).toBeGreaterThan(-1);
    expect(slugs[leadIdx + 1]).toBe(BB_FOCUS_SLUG);
  });

  it("null focus → basketball focus clip omitted, tail still flows", () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      null,
      BASKETBALL_CONFIG,
    );
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs.some((s) => s.startsWith("pp-bb-focus-"))).toBe(false);
    expect(slugs).toContain("pp-choose-focus-lead");
    expect(slugs).toContain("pp-choose-focus-tail");
  });

  it("unknown basketball focus string → focus clip dropped cleanly", () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      "Not A Real BB Focus",
      BASKETBALL_CONFIG,
    );
    expect(result).not.toBeNull();
    expect(result!.some((c) => c.slug.startsWith("pp-bb-focus-"))).toBe(false);
  });

  it("basketball tail absent from manifest → returns null (FV-31 not yet rendered)", () => {
    // p6 manifest that only has hockey — basketball not yet rendered.
    const manifest = buildP6HockeyManifest({ includeFocus: false });
    const result = resolvePracticePlaylist(manifest, "dialed-in", null, BASKETBALL_CONFIG);
    expect(result).toBeNull();
  });

  it("returns null when a required basketball structural slug is absent from catalog", () => {
    const manifest = buildP6FullManifest();
    delete manifest.clips["pp-bb-be-vocal"];
    const result = resolvePracticePlaylist(manifest, "dialed-in", BB_FOCUS_OPTION, BASKETBALL_CONFIG);
    expect(result).toBeNull();
  });

  it("cache-busts every resolved basketball clip URL", () => {
    const result = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      BB_FOCUS_OPTION,
      BASKETBALL_CONFIG,
    );
    for (const clip of result!) {
      expect(clip.url).toContain("v=");
    }
  });

  it("hockey and basketball playlists share pp-choose-focus-lead and pp-choose-focus-tail", () => {
    const hockey = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      FOCUS_OPTION,
      HOCKEY_CONFIG,
    )!;
    const basketball = resolvePracticePlaylist(
      buildP6FullManifest(),
      "dialed-in",
      BB_FOCUS_OPTION,
      BASKETBALL_CONFIG,
    )!;
    const sharedSlugs = ["pp-choose-focus-lead", "pp-choose-focus-tail"];
    for (const s of sharedSlugs) {
      expect(hockey.map((c) => c.slug)).toContain(s);
      expect(basketball.map((c) => c.slug)).toContain(s);
    }
  });
});

// ---------------------------------------------------------------------------
// 8. BASKETBALL_CONFIG.practiceFocusOptions + practiceFocusSlugs (FV-30)
// ---------------------------------------------------------------------------

describe("BASKETBALL_CONFIG.practiceFocusOptions shape (FV-30)", () => {
  it("has exactly 7 options", () => {
    expect(BB_PRACTICE_FOCUS_OPTIONS).toHaveLength(7);
  });

  it("contains all 7 expected basketball options", () => {
    const EXPECTED = [
      "Relentless",
      "Hungry",
      "Talk every possession",
      "Guard your yard",
      "Hit the glass",
      "Sprint every transition",
      "Box out every shot",
    ];
    for (const option of EXPECTED) {
      expect(BB_PRACTICE_FOCUS_OPTIONS, `Expected "${option}"`).toContain(option);
    }
  });
});

describe("BASKETBALL_CONFIG.practiceFocusSlugs map (FV-30)", () => {
  it("has exactly 7 entries, one per focus option", () => {
    expect(Object.keys(BB_PRACTICE_FOCUS_SLUGS)).toHaveLength(7);
    for (const option of BB_PRACTICE_FOCUS_OPTIONS) {
      expect(BB_PRACTICE_FOCUS_SLUGS, `Missing slug for "${option}"`).toHaveProperty(option);
    }
  });

  it("every value is a pp-bb-focus-* slug", () => {
    for (const [option, slug] of Object.entries(BB_PRACTICE_FOCUS_SLUGS)) {
      expect(slug, `Slug for "${option}"`).toMatch(/^pp-bb-focus-/);
    }
  });

  it("maps every option to its exact expected slug", () => {
    const EXPECTED_MAP: Record<string, string> = {
      "Relentless": "pp-bb-focus-relentless",
      "Hungry": "pp-bb-focus-hungry",
      "Talk every possession": "pp-bb-focus-talk-every-possession",
      "Guard your yard": "pp-bb-focus-guard-your-yard",
      "Hit the glass": "pp-bb-focus-hit-the-glass",
      "Sprint every transition": "pp-bb-focus-sprint-every-transition",
      "Box out every shot": "pp-bb-focus-box-out-every-shot",
    };
    for (const [option, expectedSlug] of Object.entries(EXPECTED_MAP)) {
      expect(BB_PRACTICE_FOCUS_SLUGS[option]).toBe(expectedSlug);
    }
  });

  it("keys exactly match practiceFocusOptions (no drift)", () => {
    expect(Object.keys(BB_PRACTICE_FOCUS_SLUGS).sort()).toEqual(
      [...BB_PRACTICE_FOCUS_OPTIONS].sort(),
    );
  });
});
