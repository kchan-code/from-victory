// Playlist integrity guard — runs against the COMMITTED manifest + real maps +
// real option lists so any renamed/removed clip breaks CI immediately.
//
// This is NOT a unit test of resolver logic (that lives in audio-playlist.test.ts).
// It is a structural integrity check: does every path through the system actually
// lead to a file that exists on disk?
//
// Node env, no browser APIs, no mocking.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

import {
  NEED_OPENER_SLUGS,
  ANCHOR_OPTION_SLUGS,
  SELFTALK_OPTION_SLUGS,
  CUEWORD_OPTION_SLUGS,
} from "../audio-mapping";

import {
  RESET_ANCHORS,
  SELF_TALK_OPTIONS,
  CUE_WORDS,
} from "../types";

import type { ClipManifest } from "../audio-playlist";
import {
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  SPORT_REGISTRY,
  type Sport,
} from "../sport-registry";

// ---------------------------------------------------------------------------
// Load committed manifest (real file, not a fixture)
// ---------------------------------------------------------------------------

// __dirname resolves to apps/web/components/pregame/__tests__
// Five levels up: __tests__ → pregame → components → web → apps → repo root
// Then we descend into apps/web/public.
const WEB_ROOT = path.resolve(__dirname, "..", "..", "..");
const PUBLIC_ROOT = path.join(WEB_ROOT, "public");
const MANIFEST_PATH = path.join(
  PUBLIC_ROOT,
  "audio",
  "pregame",
  "clips",
  "manifest.json",
);

const manifest: ClipManifest = JSON.parse(
  fs.readFileSync(MANIFEST_PATH, "utf8"),
) as ClipManifest;

const catalog = manifest.clips;

// ---------------------------------------------------------------------------
// Helper: resolve catalog URL to an absolute filesystem path
// ---------------------------------------------------------------------------

function urlToAbsPath(url: string): string {
  // Strip any ?v= query string before joining with PUBLIC_ROOT
  const cleanPath = url.split("?")[0]!;
  return path.join(PUBLIC_ROOT, cleanPath);
}

// Sentinel strings used in p3 templates — these are substituted at runtime
// and are NOT expected to be catalog slugs.
const SENTINELS = new Set([
  "{{anchor}}",
  "{{selfTalk}}",
  "{{cueReset}}",
  "{{cueSendoff}}",
]);

// ---------------------------------------------------------------------------
// Cell + slug resolvers — shared by the parameterized per-sport suites (FV-34)
// ---------------------------------------------------------------------------

// A pregame CELL can live in one of two layouts depending on the sport:
//   - a compositional catalog clip under clips/ (basketball bb-*, hockey hm-*)
//   - a baked top-level cell /audio/pregame/{slug}.mp3 (hockey legacy session-*)
// cellSlugFor returns the sport's slug; this resolver checks the catalog first,
// then the baked top-level path. Returns an error string, or null if the file
// exists and is non-zero.
function resolveCellFile(slug: string): string | null {
  const entry = catalog[slug];
  const absPath = entry
    ? urlToAbsPath(entry.url)
    : path.join(PUBLIC_ROOT, "audio", "pregame", `${slug}.mp3`);
  if (!fs.existsSync(absPath)) return `file not found at ${absPath}`;
  if (fs.statSync(absPath).size === 0) return `file is zero bytes at ${absPath}`;
  return null;
}

// A CATALOG clip (pre-practice pp-* + practiceState tails) MUST be in the
// catalog — catalog membership is the contract. Returns an error string or null.
function catalogFileErr(slug: string): string | null {
  const entry = catalog[slug];
  if (!entry) return "not found in catalog";
  const absPath = urlToAbsPath(entry.url);
  if (!fs.existsSync(absPath)) return `file not found at ${absPath}`;
  if (fs.statSync(absPath).size === 0) return `file is zero bytes at ${absPath}`;
  return null;
}

// Per-sport cell-matrix expectations for the parameterized integrity suite: the
// cell count (roles × adversities), the cell slug prefix, and the single
// position special case (hockey's goalie-pulled / basketball's big-fouled-out).
// Record<Sport, …> so adding a sport to the registry forces an entry here.
const SPORT_CELL_EXPECTATIONS: Record<
  Sport,
  {
    cellCount: number;
    slugPrefix: string;
    // How this sport's cells live on disk: "catalog" = compositional clip under
    // clips/ (membership required); "baked" = top-level /audio/pregame/*.mp3.
    // Drives which resolver the cell check uses, so a catalog-native sport
    // can't silently pass a catalog miss via the baked-path fallback.
    cellLayout: "catalog" | "baked";
    specialCase: {
      role: string;
      adversity: string;
      expectedSlug: string;
      forbiddenSlug: string;
    };
  }
> = {
  hockey: {
    cellCount: 30,
    slugPrefix: "session-",
    cellLayout: "baked",
    specialCase: {
      role: "Goalie",
      adversity: "I get benched.",
      expectedSlug: "session-goalie-pulled",
      forbiddenSlug: "session-goalie-benched",
    },
  },
  basketball: {
    cellCount: 30,
    slugPrefix: "bb-",
    cellLayout: "catalog",
    specialCase: {
      role: "Big",
      adversity: "I get benched.",
      expectedSlug: "bb-big-fouled-out",
      forbiddenSlug: "bb-big-benched",
    },
  },
};

// ---------------------------------------------------------------------------
// 1. Every catalog clip has a real, non-zero file on disk
// ---------------------------------------------------------------------------

describe("catalog clip files", () => {
  it("every clip in the catalog maps to a real non-zero file under public/", () => {
    const broken: string[] = [];

    for (const [slug, entry] of Object.entries(catalog)) {
      const absPath = urlToAbsPath(entry.url);
      if (!fs.existsSync(absPath)) {
        broken.push(`${slug}: file not found at ${absPath}`);
        continue;
      }
      const stat = fs.statSync(absPath);
      if (stat.size === 0) {
        broken.push(`${slug}: file is zero bytes at ${absPath}`);
      }
    }

    expect(broken).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Every template references only known catalog slugs (sentinels excepted)
// ---------------------------------------------------------------------------

describe("template slug references", () => {
  it("every non-sentinel slug in every template exists in the catalog", () => {
    const broken: string[] = [];

    for (const template of manifest.templates) {
      for (const slug of template.clips) {
        if (SENTINELS.has(slug)) continue;
        if (!(slug in catalog)) {
          broken.push(
            `template [${template.position} × "${template.adversity}"] references unknown slug "${slug}"`,
          );
        }
      }
    }

    expect(broken).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. Every personalization option map value exists in the catalog
// ---------------------------------------------------------------------------

describe("anchor option map", () => {
  it("every ANCHOR_OPTION_SLUGS value is in the catalog", () => {
    const missing: string[] = [];
    for (const [option, slug] of Object.entries(ANCHOR_OPTION_SLUGS)) {
      if (!(slug in catalog)) {
        missing.push(`anchor "${option}" → slug "${slug}" not in catalog`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("self-talk option map", () => {
  it("every SELFTALK_OPTION_SLUGS value is in the catalog", () => {
    const missing: string[] = [];
    for (const [option, slug] of Object.entries(SELFTALK_OPTION_SLUGS)) {
      if (!(slug in catalog)) {
        missing.push(`selfTalk "${option}" → slug "${slug}" not in catalog`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe("cue word option map", () => {
  it("every CUEWORD_OPTION_SLUGS value produces both -reset and -sendoff slugs in the catalog", () => {
    const missing: string[] = [];
    for (const [word, base] of Object.entries(CUEWORD_OPTION_SLUGS)) {
      const resetSlug = `${base}-reset`;
      const sendoffSlug = `${base}-sendoff`;
      if (!(resetSlug in catalog)) {
        missing.push(`cueWord "${word}" → "${resetSlug}" not in catalog`);
      }
      if (!(sendoffSlug in catalog)) {
        missing.push(`cueWord "${word}" → "${sendoffSlug}" not in catalog`);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Every UI option has a corresponding entry in its slug map
//    (so an added option without a clip is caught at CI, not at runtime)
// ---------------------------------------------------------------------------

describe("UI option coverage — RESET_ANCHORS", () => {
  it("every RESET_ANCHORS option (except 'Say cue word') is in ANCHOR_OPTION_SLUGS", () => {
    // "Say cue word" is intentionally skip-voiced — there is no clip for it.
    const intentionallySkipped = new Set(["Say cue word"]);
    const unmapped: string[] = [];

    for (const anchor of RESET_ANCHORS) {
      if (intentionallySkipped.has(anchor)) continue;
      if (!(anchor in ANCHOR_OPTION_SLUGS)) {
        unmapped.push(
          `RESET_ANCHORS option "${anchor}" has no entry in ANCHOR_OPTION_SLUGS`,
        );
      }
    }

    expect(unmapped).toEqual([]);
  });
});

describe("UI option coverage — SELF_TALK_OPTIONS", () => {
  it("every SELF_TALK_OPTIONS option is in SELFTALK_OPTION_SLUGS", () => {
    const unmapped: string[] = [];

    for (const phrase of SELF_TALK_OPTIONS) {
      if (!(phrase in SELFTALK_OPTION_SLUGS)) {
        unmapped.push(
          `SELF_TALK_OPTIONS phrase "${phrase}" has no entry in SELFTALK_OPTION_SLUGS`,
        );
      }
    }

    expect(unmapped).toEqual([]);
  });
});

describe("UI option coverage — CUE_WORDS", () => {
  it("every CUE_WORDS option is in CUEWORD_OPTION_SLUGS", () => {
    const unmapped: string[] = [];

    for (const word of CUE_WORDS) {
      if (!(word in CUEWORD_OPTION_SLUGS)) {
        unmapped.push(
          `CUE_WORDS option "${word}" has no entry in CUEWORD_OPTION_SLUGS`,
        );
      }
    }

    expect(unmapped).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. Practice playlist integrity — for EACH sport: manifest.practiceState (p6,
//    FV-30) carries that sport's tails, and every tail + pre-practice
//    (focus/opener) slug resolves to a real non-zero catalog file. Parameterized
//    over the registry (FV-34) so a new sport is covered with no test edit.
// ---------------------------------------------------------------------------

describe.each(Object.values(SPORT_REGISTRY))(
  "practice playlist integrity — $displayName",
  (config) => {
    const sportKey = config.sportKey;

    it("manifest.practiceState carries this sport's tails (p6 shape), non-empty", () => {
      expect(manifest.practiceState).toBeDefined();
      const entry = manifest.practiceState![sportKey];
      expect(entry).toBeDefined();
      // Guard against the p5 array shape — a p6 manifest is sport-keyed objects.
      expect(Array.isArray(entry)).toBe(false);
      if (entry && !Array.isArray(entry)) {
        expect(entry["dialed-in"].length).toBeGreaterThan(0);
        expect(entry["not-feeling-it"].length).toBeGreaterThan(0);
      }
    });

    it("every practiceState tail slug is in the catalog AND has a real non-zero file", () => {
      const entry = manifest.practiceState?.[sportKey];
      if (!entry || Array.isArray(entry)) {
        // Unexpected shape (missing, or p5 array) — fail loudly.
        expect(entry).toBeDefined();
        expect(Array.isArray(entry)).toBe(false);
        return;
      }

      const broken: string[] = [];
      // Deduplicate (both states share the same tail).
      const uniqueSlugs = [
        ...new Set([...entry["dialed-in"], ...entry["not-feeling-it"]]),
      ];
      for (const slug of uniqueSlugs) {
        const err = catalogFileErr(slug);
        if (err) broken.push(`practiceState ${sportKey} slug "${slug}": ${err}`);
      }
      expect(broken).toEqual([]);
    });

    it("every pre-practice focus + opener slug resolves to a real non-zero file", () => {
      const broken: string[] = [];
      for (const slug of Object.values(config.practiceFocusSlugs)) {
        const err = catalogFileErr(slug);
        if (err) broken.push(`practiceFocus ${sportKey} "${slug}": ${err}`);
      }
      for (const slug of Object.values(config.practiceOpenerSlugs)) {
        const err = catalogFileErr(slug);
        if (err) broken.push(`practiceOpener ${sportKey} "${slug}": ${err}`);
      }
      expect(broken).toEqual([]);
    });
  },
);

// ---------------------------------------------------------------------------
// 6. Hockey compositional template matrix (manifest.templates) — exactly
//    (3 positions × 10 adversities) = 30 templates. This is HOCKEY-SPECIFIC:
//    hockey's pregame cell is stitched at runtime from a manifest template,
//    whereas basketball plays a single baked bb-* cell (validated in section 7
//    via cellSlugFor). Positions + adversities are sourced from the registry so
//    a rename is caught here without a separate edit.
// ---------------------------------------------------------------------------

describe("hockey compositional template matrix", () => {
  // Sourced from the registry — single source of truth.
  const POSITIONS = HOCKEY_CONFIG.roles ?? [];
  const ADVERSITIES = HOCKEY_CONFIG.adversities;

  it("manifest has exactly 30 templates (3 positions × 10 adversities)", () => {
    expect(manifest.templates).toHaveLength(30);
  });

  it("every (position × adversity) combination has exactly one template", () => {
    const missing: string[] = [];

    // Guard against a vacuous pass if the registry roles axis is ever emptied.
    expect(POSITIONS.length).toBeGreaterThan(0);

    for (const position of POSITIONS) {
      for (const adversity of ADVERSITIES) {
        const matches = manifest.templates.filter(
          (t) => t.position === position && t.adversity === adversity,
        );
        if (matches.length === 0) {
          missing.push(`missing template for [${position} × "${adversity}"]`);
        } else if (matches.length > 1) {
          missing.push(
            `duplicate templates (${matches.length}) for [${position} × "${adversity}"]`,
          );
        }
      }
    }

    expect(missing).toEqual([]);
  });

  it("goalie × 'I get benched.' template uses the goalie-pulled clip (not goalie-benched)", () => {
    // The special case: a goalie isn't "benched," they're "pulled."
    // The template for Goalie × "I get benched." must reference hm-goalie-pulled,
    // not the non-existent hm-goalie-benched.
    const template = manifest.templates.find(
      (t) => t.position === "Goalie" && t.adversity === "I get benched.",
    );

    expect(template).toBeDefined();

    // hm-goalie-pulled must be in the clips list
    expect(template!.clips).toContain("hm-goalie-pulled");

    // hm-goalie-benched must NOT appear (it doesn't exist and would break resolution)
    expect(template!.clips).not.toContain("hm-goalie-benched");
  });
});

// ---------------------------------------------------------------------------
// 7. Cell slug → file integrity — for EACH sport, every cell the registry
//    produces via cellSlugFor (roles × adversities) resolves to a real non-zero
//    file, and the position special case is locked. Parameterized over the
//    registry (FV-34). resolveCellFile handles both layouts: basketball's
//    compositional catalog cells (bb-*) and hockey's baked top-level cells
//    (session-*). Replaces the FV-67 basketball-only block.
// ---------------------------------------------------------------------------

describe.each(Object.values(SPORT_REGISTRY))(
  "cell slug → file integrity — $displayName",
  (config) => {
    const expectations = SPORT_CELL_EXPECTATIONS[config.sportKey];

    it("every cell (cellSlugFor over roles × adversities) resolves to a real non-zero file", () => {
      // roles is optional on SportConfig; the launch sports declare it. Guard so
      // a removed roles axis fails with a clear message (0 cells ≠ expected count)
      // rather than throwing.
      expect(config.roles).toBeDefined();

      const broken: string[] = [];
      const slugs = new Set<string>();
      for (const role of config.roles ?? []) {
        for (const adversity of config.adversities) {
          const slug = config.cellSlugFor(adversity, role);
          slugs.add(slug);
          // Catalog sports must resolve THROUGH the catalog (strict); baked
          // sports resolve via catalog-or-baked. This prevents a catalog-native
          // sport from masking a catalog miss through the baked-path fallback.
          const err =
            expectations.cellLayout === "catalog"
              ? catalogFileErr(slug)
              : resolveCellFile(slug);
          if (err) {
            broken.push(`cell [${role} × "${adversity}"] slug "${slug}": ${err}`);
          }
        }
      }

      expect(broken).toEqual([]);
      // roles × adversities distinct cells.
      expect(slugs.size).toBe(expectations.cellCount);
      // Every cell slug uses the sport's expected prefix.
      expect(
        [...slugs].every((s) => s.startsWith(expectations.slugPrefix)),
      ).toBe(true);
    });

    it("position special case resolves correctly and the forbidden slug has no file", () => {
      const { role, adversity, expectedSlug, forbiddenSlug } =
        expectations.specialCase;
      // The special case fires (goalie → pulled, big → fouled-out).
      expect(config.cellSlugFor(adversity, role)).toBe(expectedSlug);
      // The forbidden slug (session-goalie-benched / bb-big-benched) must NOT
      // back a real file — it would break resolution if ever referenced.
      expect(resolveCellFile(forbiddenSlug)).not.toBeNull();
    });
  },
);

// ---------------------------------------------------------------------------
// 8. Basketball pre-practice clip count (FV-31) — documents the rendered count.
// ---------------------------------------------------------------------------

describe("basketball pre-practice clip count (FV-31)", () => {
  it("exactly 12 distinct pp-bb-* clips exist across the registry + manifest", () => {
    // 7 focus + 1 not-feeling-it opener + 4 shared tail (name-standard,
    // goal-fusion, be-vocal, see-it-go) = 12. The dialed-in opener
    // (pp-opener-dialed-in) and pp-choose-focus-* tails are sport-neutral and
    // intentionally not counted. CARDINALITY only — file presence is validated
    // by the parameterized practice + cell suites above.
    const ppBb = new Set<string>();
    const collect = (slug: string): void => {
      if (slug.startsWith("pp-bb-")) ppBb.add(slug);
    };

    Object.values(BASKETBALL_CONFIG.practiceFocusSlugs).forEach(collect);
    Object.values(BASKETBALL_CONFIG.practiceOpenerSlugs).forEach(collect);

    const bbEntry = manifest.practiceState?.["basketball"];
    if (bbEntry && !Array.isArray(bbEntry)) {
      bbEntry["dialed-in"].forEach(collect);
      bbEntry["not-feeling-it"].forEach(collect);
    }

    expect(ppBb.size).toBe(12);
  });
});
