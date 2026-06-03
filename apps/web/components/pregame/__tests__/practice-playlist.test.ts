// FRO-22 unit tests for the state-aware pre-practice "Lock In" playlist:
// resolvePracticePlaylist(manifest, state, focus) + PRACTICE_FOCUS_SLUGS +
// PRACTICE_FOCUS_OPTIONS.
//
// Playlist order (per docs/pre-practice-rewrite-FRO-22/01-NEW-script-FINAL.md):
//   [state opener] → pp-name-standard → pp-goal-fusion →
//   pp-choose-focus-lead → [pp-focus-<slug>?] → pp-choose-focus-tail →
//   pp-be-vocal → pp-see-it-go
//   - "dialed-in"      → opener pp-opener-dialed-in (DEFAULT)
//   - "not-feeling-it" → opener pp-opener-get-to
//
// Run narrowly: npx vitest run components/pregame/__tests__/practice-playlist.test.ts

import { describe, it, expect } from "vitest";

import {
  resolvePracticePlaylist,
  type ClipManifest,
} from "../audio-playlist";

import { type PracticeState } from "../types";
import { HOCKEY_CONFIG } from "../sport-registry";

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
const SHARED_TAIL = [
  "pp-name-standard",
  "pp-goal-fusion",
  "pp-choose-focus-lead",
  "pp-choose-focus-tail",
  "pp-be-vocal",
  "pp-see-it-go",
];

const FOCUS_OPTION = "Relentless";
const FOCUS_SLUG = "pp-focus-relentless";

/** Build a p5 state-aware practice manifest matching the real schema
 *  (manifest.practiceState keyed by state, each value the shared tail). */
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
