// Unit tests for the pure functions in audio-playlist.ts.
//
// These tests use hand-built ClipManifest fixtures rather than loading the
// real manifest so they run offline, stay fast, and pin the exact contract
// the resolver promises.  Changes to NEED_OPENER_SLUGS or ANCHOR_OPTION_SLUGS
// in audio-mapping.ts will correctly break tests here — that's intentional.

import { describe, it, expect } from "vitest";

import {
  resolvePlaylist,
  buildAssembledTimeline,
  findActivePhase,
  type ClipManifest,
  type ResolvedClip,
  type AssembledTimeline,
} from "../audio-playlist";

import {
  NEED_OPENER_SLUGS,
  ANCHOR_OPTION_SLUGS,
  SELFTALK_OPTION_SLUGS,
  CUEWORD_OPTION_SLUGS,
  AUDIO_CACHE_BUST,
} from "../audio-mapping";

// ---------------------------------------------------------------------------
// Shared fixture helpers
// ---------------------------------------------------------------------------

/** Minimal catalog entry — enough for the resolver to produce a ResolvedClip. */
function catalogEntry(url: string, durationSec = 10) {
  return {
    url,
    durationSec,
    phases: [{ phase: "settle" as const, offsetSec: 0 }],
  };
}

/** Catalog entry with explicit phases so timeline tests can assert offsets. */
function catalogEntryWithPhases(
  url: string,
  durationSec: number,
  phases: Array<{ phase: "intro" | "settle" | "rink" | "prayer"; offsetSec: number; round?: number }>,
) {
  return { url, durationSec, phases };
}

// Real slug values pulled from audio-mapping so a rename shows up here.
// Non-null assertions: these are known keys in maps we own; if a key is
// removed the test fails at runtime, which is the intended regression signal.
// reason: noUncheckedIndexedAccess widens Record<string,string> lookups to
//   string|undefined; we assert presence here rather than loosening tsconfig.
const REAL_OPENER_CONFIDENCE = NEED_OPENER_SLUGS["Confidence"]!; // "opener-confidence"
const REAL_ANCHOR_EXHALE = ANCHOR_OPTION_SLUGS["Long exhale"]!;   // "anc-long-exhale"
const REAL_ST_01 = SELFTALK_OPTION_SLUGS["You're okay. Next shift."]!; // "st-01"
const REAL_CW_STEADY = CUEWORD_OPTION_SLUGS["Steady"]!; // "cw-steady"

// ---------------------------------------------------------------------------
// 1. resolvePlaylist
// ---------------------------------------------------------------------------

describe("resolvePlaylist", () => {
  // ── p1: exact three-way match ──────────────────────────────────────────────

  describe("p1 — exact (need × position × adversity) match", () => {
    const p1Manifest: ClipManifest = {
      version: "p1",
      clips: {
        "opener-confidence": catalogEntry("/audio/opener-confidence.mp3", 60),
        "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
      },
      templates: [
        {
          need: "Confidence",
          position: "Forward",
          adversity: "I turn the puck over.",
          clips: ["opener-confidence", "session-forward-turnover"],
        },
      ],
    };

    it("returns the resolved clip list on an exact three-way match", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p1Manifest,
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs).toEqual(["opener-confidence", "session-forward-turnover"]);
    });

    it("attaches cache-busted URLs to every resolved clip", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p1Manifest,
      );
      expect(result).not.toBeNull();
      for (const clip of result!) {
        expect(clip.url).toContain(`v=${AUDIO_CACHE_BUST}`);
      }
    });

    it("returns null when no template matches the three-way key", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Defense",           // wrong position
        "I turn the puck over.",
        p1Manifest,
      );
      expect(result).toBeNull();
    });
  });

  // ── p2: dimensional resolution ─────────────────────────────────────────────

  describe("p2 — opener prepended from NEED_OPENER_SLUGS; template keyed by (position × adversity)", () => {
    // The p2 manifest has NO `need` field on templates and does NOT include the
    // opener slug in the template's clips list.
    const p2Manifest: ClipManifest = {
      version: "p2",
      clips: {
        [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
        "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
      },
      templates: [
        {
          position: "Forward",
          adversity: "I turn the puck over.",
          clips: ["session-forward-turnover"],
        },
      ],
    };

    it("prepends the need-specific opener from NEED_OPENER_SLUGS", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p2Manifest,
      );
      expect(result).not.toBeNull();
      expect(result![0]!.slug).toBe(REAL_OPENER_CONFIDENCE);
    });

    it("appends the template clips after the opener", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p2Manifest,
      );
      expect(result).not.toBeNull();
      expect(result![1]!.slug).toBe("session-forward-turnover");
      expect(result!.length).toBe(2);
    });

    it("returns null when the need has no entry in NEED_OPENER_SLUGS", () => {
      const result = resolvePlaylist(
        "UnknownNeed",
        "Forward",
        "I turn the puck over.",
        p2Manifest,
      );
      expect(result).toBeNull();
    });

    it("returns null when no template matches the (position × adversity) pair", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Goalie",             // no template for this position
        "I turn the puck over.",
        p2Manifest,
      );
      expect(result).toBeNull();
    });
  });

  // ── p3: sentinel substitution ─────────────────────────────────────────────

  describe("p3 — sentinel substitution", () => {
    // Build a p3 manifest whose template clip list contains all four sentinel
    // types plus a real clip.
    const p3Manifest: ClipManifest = {
      version: "p3",
      clips: {
        [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
        "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
        [REAL_ANCHOR_EXHALE]: catalogEntry(`/audio/${REAL_ANCHOR_EXHALE}.mp3`, 5),
        [REAL_ST_01]: catalogEntry(`/audio/${REAL_ST_01}.mp3`, 4),
        [`${REAL_CW_STEADY}-reset`]: catalogEntry(`/audio/${REAL_CW_STEADY}-reset.mp3`, 3),
        [`${REAL_CW_STEADY}-sendoff`]: catalogEntry(`/audio/${REAL_CW_STEADY}-sendoff.mp3`, 3),
      },
      templates: [
        {
          position: "Forward",
          adversity: "I turn the puck over.",
          clips: [
            "session-forward-turnover",
            "{{anchor}}",
            "{{selfTalk}}",
            "{{cueReset}}",
            "{{cueSendoff}}",
          ],
        },
      ],
    };

    it("resolves {{anchor}} to the matching slug when a known anchor is supplied", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Long exhale",
        "You're okay. Next shift.",
        "Steady",
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs).toContain(REAL_ANCHOR_EXHALE);
    });

    it("drops {{anchor}} (no null, just shorter list) when anchor is 'Say cue word'", () => {
      // "Say cue word" is intentionally absent from ANCHOR_OPTION_SLUGS.
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Say cue word",
        "You're okay. Next shift.",
        "Steady",
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs).not.toContain("anc-say-cue-word");
      // Playlist is shorter but still valid — not null.
    });

    it("drops {{anchor}} (no null) when anchor is an unknown/custom string", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Some custom anchor",
        "You're okay. Next shift.",
        "Steady",
      );
      expect(result).not.toBeNull();
    });

    it("appends -reset suffix for {{cueReset}}", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Long exhale",
        "You're okay. Next shift.",
        "Steady",
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs).toContain(`${REAL_CW_STEADY}-reset`);
    });

    it("appends -sendoff suffix for {{cueSendoff}}", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Long exhale",
        "You're okay. Next shift.",
        "Steady",
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs).toContain(`${REAL_CW_STEADY}-sendoff`);
    });

    it("drops both {{cueReset}} and {{cueSendoff}} (no null) when cueWord is unknown/custom", () => {
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        p3Manifest,
        "Long exhale",
        "You're okay. Next shift.",
        "CustomCueWord",   // not in CUEWORD_OPTION_SLUGS
      );
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      expect(slugs.some((s) => s.includes("-reset"))).toBe(false);
      expect(slugs.some((s) => s.includes("-sendoff"))).toBe(false);
    });

    it("returns null when the template references an unknown non-sentinel slug", () => {
      const manifestWithMissingCatalogEntry: ClipManifest = {
        version: "p3",
        clips: {
          [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
          // "session-forward-turnover" intentionally absent from catalog
        },
        templates: [
          {
            position: "Forward",
            adversity: "I turn the puck over.",
            clips: ["session-forward-turnover"],
          },
        ],
      };
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        manifestWithMissingCatalogEntry,
      );
      expect(result).toBeNull();
    });

    it("does NOT return null when a sentinel is dropped at the slug-map stage (unknown option → no slug enters the catalog check)", () => {
      // Drop semantics apply at the slug-map lookup stage (ANCHOR_OPTION_SLUGS,
      // SELFTALK_OPTION_SLUGS, CUEWORD_OPTION_SLUGS). When an option has NO
      // entry in the map (e.g. "Say cue word", a custom string), no slug is
      // pushed into the resolved list and the catalog check is never reached for
      // that sentinel — so the whole resolution stays valid and just plays shorter.
      //
      // NOTE: If a sentinel DOES resolve to a slug via the slug-map but that slug
      // is absent from the catalog, the resolver treats it as a hard fail (same
      // as any missing non-sentinel slug). The drop semantic only applies to the
      // slug-map lookup, not the catalog lookup. This is intentional per the
      // jsdoc ("any non-sentinel slug in the assembled list is absent from the
      // catalog" → null). An audio engineer who ships a slug-map entry must also
      // ship the matching MP3 in the catalog.
      const manifestWithAllClipsPresent: ClipManifest = {
        version: "p3",
        clips: {
          [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
          "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
          [REAL_ST_01]: catalogEntry(`/audio/${REAL_ST_01}.mp3`, 4),
          [`${REAL_CW_STEADY}-reset`]: catalogEntry(`/audio/${REAL_CW_STEADY}-reset.mp3`, 3),
          [`${REAL_CW_STEADY}-sendoff`]: catalogEntry(`/audio/${REAL_CW_STEADY}-sendoff.mp3`, 3),
          // No anchor clip — and we pass "Say cue word" which has no slug-map
          // entry, so no anchor slug is pushed into the resolved list at all.
        },
        templates: [
          {
            position: "Forward",
            adversity: "I turn the puck over.",
            clips: [
              "session-forward-turnover",
              "{{anchor}}",     // will be dropped: "Say cue word" absent from ANCHOR_OPTION_SLUGS
              "{{selfTalk}}",
              "{{cueReset}}",
              "{{cueSendoff}}",
            ],
          },
        ],
      };
      const result = resolvePlaylist(
        "Confidence",
        "Forward",
        "I turn the puck over.",
        manifestWithAllClipsPresent,
        "Say cue word",             // intentionally absent from ANCHOR_OPTION_SLUGS → drop
        "You're okay. Next shift.",
        "Steady",
      );
      // The anchor sentinel was silently dropped at the slug-map stage.
      // All other clips are present in the catalog, so resolution succeeds.
      expect(result).not.toBeNull();
      const slugs = result!.map((c) => c.slug);
      // No anchor clip in the output.
      expect(slugs).not.toContain(REAL_ANCHOR_EXHALE);
      // Structural clips still present.
      expect(slugs).toContain("session-forward-turnover");
      expect(slugs).toContain(REAL_ST_01);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. buildAssembledTimeline
// ---------------------------------------------------------------------------

describe("buildAssembledTimeline", () => {
  it("returns zero totalDurationSec and empty phases for an empty clip list", () => {
    const timeline = buildAssembledTimeline([]);
    expect(timeline.totalDurationSec).toBe(0);
    expect(timeline.phases).toEqual([]);
  });

  it("accumulates each clip's duration into subsequent phase startSec values", () => {
    // Clip A: 30 s, has a phase at offsetSec 0 and offsetSec 10.
    // Clip B: 60 s, has a phase at offsetSec 5.
    // Expected: A's phases at 0 and 10, B's phase at 30+5 = 35.
    const clipA: ResolvedClip = {
      slug: "clip-a",
      url: "/audio/clip-a.mp3?v=7",
      durationSec: 30,
      phases: [
        { phase: "intro", offsetSec: 0 },
        { phase: "settle", offsetSec: 10 },
      ],
    };
    const clipB: ResolvedClip = {
      slug: "clip-b",
      url: "/audio/clip-b.mp3?v=7",
      durationSec: 60,
      phases: [{ phase: "rink", offsetSec: 5 }],
    };

    const timeline = buildAssembledTimeline([clipA, clipB]);

    expect(timeline.totalDurationSec).toBe(90);
    expect(timeline.phases).toEqual([
      { phase: "intro", startSec: 0 },
      { phase: "settle", startSec: 10 },
      { phase: "rink", startSec: 35 },
    ]);
  });

  it("propagates the round field when present on a phase mark", () => {
    const clipWithRound: ResolvedClip = {
      slug: "breath-clip",
      url: "/audio/breath-clip.mp3?v=7",
      durationSec: 20,
      phases: [
        { phase: "inhale", offsetSec: 0, round: 0 },
        { phase: "exhale", offsetSec: 4, round: 0 },
        { phase: "inhale", offsetSec: 8, round: 1 },
      ],
    };

    const timeline = buildAssembledTimeline([clipWithRound]);
    expect(timeline.phases[0]).toMatchObject({ phase: "inhale", startSec: 0, round: 0 });
    expect(timeline.phases[1]).toMatchObject({ phase: "exhale", startSec: 4, round: 0 });
    expect(timeline.phases[2]).toMatchObject({ phase: "inhale", startSec: 8, round: 1 });
  });
});

// ---------------------------------------------------------------------------
// 2b. resolvePlaylist — prayer-style transform
// ---------------------------------------------------------------------------

describe("resolvePlaylist — prayerStyle transform (Issue 2)", () => {
  // Build a p2 manifest that includes the prayer and sendoff slugs so we can
  // verify they are present/absent depending on the prayerStyle arg.
  const prayerManifest: ClipManifest = {
    version: "p2",
    clips: {
      [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
      "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
      "shared-prayer": catalogEntry("/audio/pregame/clips/shared-prayer.mp3", 30),
      "shared-prayer-selfguided": catalogEntry("/audio/pregame/clips/shared-prayer-selfguided.mp3", 50),
      "shared-sendoff": catalogEntry("/audio/pregame/clips/shared-sendoff.mp3", 10),
    },
    templates: [
      {
        position: "Forward",
        adversity: "I turn the puck over.",
        clips: ["session-forward-turnover", "shared-prayer", "shared-sendoff"],
      },
    ],
  };

  it('guided (default) → playlist contains shared-prayer and shared-sendoff, NOT shared-prayer-selfguided', () => {
    const result = resolvePlaylist(
      "Confidence",
      "Forward",
      "I turn the puck over.",
      prayerManifest,
      null, null, null,
      "hockey",
      "guided",
    );
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs).toContain("shared-prayer");
    expect(slugs).toContain("shared-sendoff");
    expect(slugs).not.toContain("shared-prayer-selfguided");
  });

  it('omitting prayerStyle (undefined) behaves as guided — contains shared-prayer and shared-sendoff', () => {
    const result = resolvePlaylist(
      "Confidence",
      "Forward",
      "I turn the puck over.",
      prayerManifest,
    );
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs).toContain("shared-prayer");
    expect(slugs).toContain("shared-sendoff");
    expect(slugs).not.toContain("shared-prayer-selfguided");
  });

  it('self-guided → contains shared-prayer-selfguided, NOT shared-prayer, NOT shared-sendoff', () => {
    const result = resolvePlaylist(
      "Confidence",
      "Forward",
      "I turn the puck over.",
      prayerManifest,
      null, null, null,
      "hockey",
      "self-guided",
    );
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs).toContain("shared-prayer-selfguided");
    expect(slugs).not.toContain("shared-prayer");
    expect(slugs).not.toContain("shared-sendoff");
  });

  it('self-guided is robust when template lacks shared-prayer or shared-sendoff (no crash, no null)', () => {
    // Manifest where the template only has the session cell — no prayer/sendoff in template.
    const sparseManifest: ClipManifest = {
      version: "p2",
      clips: {
        [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
        "session-forward-turnover": catalogEntry("/audio/session-forward-turnover.mp3", 240),
      },
      templates: [
        {
          position: "Forward",
          adversity: "I turn the puck over.",
          clips: ["session-forward-turnover"],
        },
      ],
    };
    const result = resolvePlaylist(
      "Confidence",
      "Forward",
      "I turn the puck over.",
      sparseManifest,
      null, null, null,
      "hockey",
      "self-guided",
    );
    // No prayer slugs in the template → transform is a no-op → still resolves.
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs).not.toContain("shared-prayer");
    expect(slugs).not.toContain("shared-prayer-selfguided");
    expect(slugs).not.toContain("shared-sendoff");
  });
});

describe("resolvePlaylist — positive-play swap (FV-144)", () => {
  // The matched template carries exactly ONE flagship viz slug
  // (viz-forward-win-the-wall here). The catalog also holds alternative viz
  // clips the athlete can pick, plus a non-viz cell and a non-viz catalog slug
  // used to prove only viz-* picks are ever injected.
  const vizManifest: ClipManifest = {
    version: "p2",
    clips: {
      [REAL_OPENER_CONFIDENCE]: catalogEntry("/audio/opener-confidence.mp3", 60),
      "viz-forward-win-the-wall": catalogEntry("/audio/pregame/clips/viz-forward-win-the-wall.aaaa1111.mp3", 60),
      "viz-forward-give-and-go": catalogEntry("/audio/pregame/clips/viz-forward-give-and-go.bbbb2222.mp3", 62),
      "viz-forward-net-front": catalogEntry("/audio/pregame/clips/viz-forward-net-front.cccc3333.mp3", 64),
      "hm-forward-turnover": catalogEntry("/audio/pregame/clips/hm-forward-turnover.dddd4444.mp3", 90),
      "shared-prayer": catalogEntry("/audio/pregame/clips/shared-prayer.eeee5555.mp3", 30),
    },
    templates: [
      {
        position: "Forward",
        adversity: "I turn the puck over.",
        clips: ["viz-forward-win-the-wall", "hm-forward-turnover", "shared-prayer"],
      },
    ],
  };

  const resolveWithPicks = (positivePlays: string[] | null | undefined) =>
    resolvePlaylist(
      "Confidence",
      "Forward",
      "I turn the puck over.",
      vizManifest,
      null, null, null,
      "hockey",
      "guided",
      positivePlays,
    );

  it("replaces the flagship viz with the picked plays, in order, at the viz position", () => {
    const result = resolveWithPicks(["viz-forward-give-and-go", "viz-forward-net-front"]);
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    // Flagship gone; both picks present.
    expect(slugs).not.toContain("viz-forward-win-the-wall");
    expect(slugs).toContain("viz-forward-give-and-go");
    expect(slugs).toContain("viz-forward-net-front");
    // Picks sit where the flagship was — before the hard-moment cell — in order.
    expect(slugs.indexOf("viz-forward-give-and-go")).toBeLessThan(slugs.indexOf("viz-forward-net-front"));
    expect(slugs.indexOf("viz-forward-net-front")).toBeLessThan(slugs.indexOf("hm-forward-turnover"));
    // Surrounding clips intact: [opener, give-and-go, net-front, hm, prayer].
    expect(slugs).toEqual([
      REAL_OPENER_CONFIDENCE,
      "viz-forward-give-and-go",
      "viz-forward-net-front",
      "hm-forward-turnover",
      "shared-prayer",
    ]);
  });

  it("keeps the flagship when no plays are picked (empty array)", () => {
    const result = resolveWithPicks([]);
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toContain("viz-forward-win-the-wall");
  });

  it("keeps the flagship when positivePlays is undefined (pre-FV-144 call sites unchanged)", () => {
    const result = resolveWithPicks(undefined);
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toContain("viz-forward-win-the-wall");
  });

  it("drops picks absent from the catalog and injects only the valid ones", () => {
    const result = resolveWithPicks(["viz-forward-give-and-go", "viz-forward-not-real"]);
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    expect(slugs).toContain("viz-forward-give-and-go");
    expect(slugs).not.toContain("viz-forward-not-real");
    expect(slugs).not.toContain("viz-forward-win-the-wall");
  });

  it("keeps the flagship (no viz-less session) when every pick is invalid", () => {
    const result = resolveWithPicks(["viz-forward-not-real", "viz-also-fake"]);
    expect(result).not.toBeNull();
    expect(result!.map((c) => c.slug)).toContain("viz-forward-win-the-wall");
  });

  it("never injects a non-viz slug even if it exists in the catalog", () => {
    // "hm-forward-turnover" is a real catalog slug but not a positive play.
    const result = resolveWithPicks(["hm-forward-turnover"]);
    expect(result).not.toBeNull();
    const slugs = result!.map((c) => c.slug);
    // Flagship retained (no valid viz pick); hm cell appears exactly once.
    expect(slugs).toContain("viz-forward-win-the-wall");
    expect(slugs.filter((s) => s === "hm-forward-turnover")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 3. findActivePhase
// ---------------------------------------------------------------------------

describe("findActivePhase", () => {
  const timeline: AssembledTimeline = {
    totalDurationSec: 100,
    phases: [
      { phase: "intro", startSec: 0 },
      { phase: "settle", startSec: 10 },
      { phase: "rink", startSec: 40 },
      { phase: "prayer", startSec: 90 },
    ],
  };

  it("returns null when currentSec is before the first phase", () => {
    // The first phase starts at 0, so there is no 'before' unless the phases
    // list started later.  Build a special timeline where first phase starts at 5.
    const lateStartTimeline: AssembledTimeline = {
      totalDurationSec: 60,
      phases: [{ phase: "settle", startSec: 5 }],
    };
    expect(findActivePhase(lateStartTimeline, 3)).toBeNull();
  });

  it("returns the phase whose startSec exactly equals currentSec", () => {
    expect(findActivePhase(timeline, 40)).toBe("rink");
  });

  it("returns the last phase whose startSec is <= currentSec (between phases)", () => {
    // currentSec = 25 is between settle (10) and rink (40); settle is active.
    expect(findActivePhase(timeline, 25)).toBe("settle");
  });

  it("returns the first phase when currentSec is exactly 0 and first phase starts at 0", () => {
    expect(findActivePhase(timeline, 0)).toBe("intro");
  });

  it("returns the last phase when currentSec is at or past the final phase's startSec", () => {
    expect(findActivePhase(timeline, 90)).toBe("prayer");
    expect(findActivePhase(timeline, 150)).toBe("prayer");
  });

  it("returns null for an empty phases list", () => {
    const emptyTimeline: AssembledTimeline = { totalDurationSec: 0, phases: [] };
    expect(findActivePhase(emptyTimeline, 50)).toBeNull();
  });
});
