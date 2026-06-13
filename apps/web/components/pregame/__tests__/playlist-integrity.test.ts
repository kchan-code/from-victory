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
  resolveOpenerSlug,
} from "../audio-mapping";

import {
  RESET_ANCHORS,
  SELF_TALK_OPTIONS,
  CUE_WORDS,
} from "../types";

import { resolvePlaylist, type ClipManifest } from "../audio-playlist";
import {
  HOCKEY_CONFIG,
  BASKETBALL_CONFIG,
  SPORT_REGISTRY,
  type Sport,
} from "../sport-registry";
import { POSITIVE_PLAYS, positivePlaysFor } from "../positive-plays";

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
  // Baseball (FV-94 scripts; audio render = FV-95). 4 positions × 10 = 40 combos,
  // but Pitcher ships 9 — its "I make an error." redirects to bsb-pitcher-strikeout
  // in cellSlugFor (never shown in the picker), so the matrix dedups to 39 distinct
  // cells. (The 2 throwing-yips cells are authored but withheld from the picker.)
  // Excluded from the registry-parameterized loops below until its audio is rendered
  // (see RENDERED_SPORT_CONFIGS); FV-99 turns the full grid on once the clips land.
  baseball: {
    cellCount: 39,
    slugPrefix: "bsb-",
    cellLayout: "catalog",
    specialCase: {
      role: "Pitcher",
      adversity: "I get benched.",
      expectedSlug: "bsb-pitcher-pulled",
      forbiddenSlug: "bsb-pitcher-benched",
    },
  },
  // Golf (FV-265 scripts; audio render = FV-266). 3 profiles × 10 = 30 distinct
  // cells — golf has NO canonical-key reroute (every profile plays every hole),
  // so the matrix does not dedup. The 3 first-tee (shank/putting-yips) cells are
  // authored + rendered for grid parity but withheld from the picker via
  // roleAdversities. Golf is COMPOSITIONAL-ONLY: no baked glf-* composite
  // (unlike basketball's bb-*), so cellSlugFor returns the hm-glf-* hard-moment
  // clip directly — the slug the manifest templates reference and this grid
  // asserts. "specialCase" asserts the no-reroute property: a profile relabel
  // ("I hit it OB." → "I hit the big miss" for Bomber) does NOT fork the slug.
  // Activated in the rendered-grid loops once FV-266 lands golf in
  // manifest.practiceState (RENDERED_SPORT_CONFIGS).
  golf: {
    cellCount: 30,
    slugPrefix: "hm-glf-",
    cellLayout: "catalog",
    specialCase: {
      role: "Bomber",
      adversity: "I hit it OB.",
      expectedSlug: "hm-glf-bomber-ob",
      forbiddenSlug: "hm-glf-bomber-big-miss",
    },
  },
  // Football (v2 DORMANT — scripts authored, audio render deferred). 7 roles ×
  // 10 adversities, but QB drops trench-battle (reroute→qb-pick) and OL + DL
  // drop turnover (reroute→{ol,dl}-trench-battle), so the matrix dedups to 67
  // distinct cells. Compositional-only (golf model): cellSlugFor returns the
  // hm-ftb-* hard-moment clip directly. EXCLUDED from the registry-parameterized
  // file-existence loops (RENDERED_SPORT_CONFIGS) until the audio render lands
  // football in manifest.practiceState — this entry only satisfies the
  // Record<Sport, …> exhaustiveness type until then.
  football: {
    cellCount: 67,
    slugPrefix: "hm-ftb-",
    cellLayout: "catalog",
    specialCase: {
      role: "QB",
      adversity: "I get benched.",
      expectedSlug: "hm-ftb-qb-pulled",
      forbiddenSlug: "hm-ftb-qb-benched",
    },
  },
};

// FV-94/FV-99: the registry-parameterized integrity suites (sections 5 & 7) run
// only over sports whose audio is actually RENDERED into the manifest. Baseball
// ships its SCRIPTS (FV-94) before its audio render (FV-95); until then its cells
// and practiceState tails aren't in the catalog, so it is excluded here. This
// auto-includes baseball the moment FV-95 lands its tail in manifest.practiceState
// (FV-99 then asserts the full grid). Hockey + basketball are always covered.
const RENDERED_SPORT_CONFIGS = Object.values(SPORT_REGISTRY).filter(
  (c) => manifest.practiceState?.[c.sportKey] != null,
);

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

describe.each(RENDERED_SPORT_CONFIGS)(
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

  it("manifest has exactly 90 templates (3 compositional sports × 3 positions × 10 adversities)", () => {
    // 30 hockey (Forward/Defense/Goalie) + 30 basketball (Guard/Wing/Big)
    // + 30 golf (Bomber/Ballstriker/Scrambler) = 90.
    // FV-113 added the basketball arm; FV-266 added the golf arm.
    // NOTE: baseball is live but resolves cells directly (cellSlugFor → catalog),
    // NOT via the compositional templates array, so it contributes 0 templates here.
    expect(manifest.templates).toHaveLength(90);
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

describe.each(RENDERED_SPORT_CONFIGS)(
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

// ---------------------------------------------------------------------------
// 9. resolvePlaylist against the REAL manifest — version-drift guard (FV-112)
//    The clip player resolves the pregame playlist via resolvePlaylist(manifest).
//    A manifest version bump (→ p6) once fell through resolvePlaylist's version
//    check into the legacy three-way branch, which matches on a `need` field
//    p6 templates don't have → it returned null → "no template" → the player
//    fell back to the broken legacy two-<audio> path → audio died after the
//    verse on iOS, for EVERY athlete. The resolver unit tests used synthetic
//    p2/p3 fixtures and missed it. These run the resolver against the ACTUAL
//    committed manifest so a future version bump can't silently break it again.
// ---------------------------------------------------------------------------

describe("resolvePlaylist — real manifest (version-drift guard)", () => {
  it("resolves a real (need × position × adversity) to a non-null playlist", () => {
    const playlist = resolvePlaylist(
      "Compete level",
      "Forward",
      "I miss a scoring chance.",
      manifest,
      "Long exhale", // anchor
      "Breathe. Do your job.", // self-talk
      "Relentless", // cue word
    );

    expect(playlist).not.toBeNull();
    // Opener + viz + hard-moment + personalization + reset + prayer + sendoff.
    expect(playlist!.length).toBeGreaterThan(3);
    // The need opener is prepended.
    expect(playlist![0]!.slug).toBe("opener-compete-level");
    // Every sentinel was substituted — no {{...}} token survives to playback.
    expect(playlist!.every((c) => !c.slug.includes("{{"))).toBe(true);
  });

  it("resolves the FULL hockey matrix (every position × adversity) to a non-null playlist", () => {
    // 3 positions × 10 adversities = 30. Catches both a version-branch regression
    // (all null) and a catalog-miss on any single cell (that combo null).
    for (const position of HOCKEY_CONFIG.roles ?? []) {
      for (const adversity of HOCKEY_CONFIG.adversities) {
        const playlist = resolvePlaylist("Calm", position, adversity, manifest);
        expect(playlist, `${position} × "${adversity}"`).not.toBeNull();
      }
    }
  });

  it("resolves the FULL basketball matrix (every position × adversity) to a non-null playlist", () => {
    // 3 positions × 10 adversities = 30. Proves every basketball template is in
    // manifest.templates and every non-sentinel slug — viz-guard/wing/big,
    // hm-bb-*, shared-* — is in the catalog. A regression here means a basketball
    // athlete's pregame falls back to the legacy two-<audio> path (FV-113).
    for (const position of BASKETBALL_CONFIG.roles ?? []) {
      for (const adversity of BASKETBALL_CONFIG.adversities) {
        const playlist = resolvePlaylist("Calm", position, adversity, manifest);
        expect(playlist, `${position} × "${adversity}"`).not.toBeNull();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 10. Basketball compositional clips catalog presence (FV-116)
//     Asserts that every new basketball clip type produced by FV-116 is in the
//     manifest catalog and backed by a real non-zero file on disk. These slugs
//     are also covered by section 1 (the sweeping catalog-file check) after the
//     manifest is updated, but an explicit named section makes regressions
//     immediately attributable and confirms FV-116 intent.
// ---------------------------------------------------------------------------

describe("basketball compositional clip catalog presence (FV-116)", () => {
  it("viz-guard, viz-wing, viz-big are in the catalog with real files", () => {
    const broken: string[] = [];
    for (const slug of ["viz-guard", "viz-wing", "viz-big"]) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("all 30 hm-bb-* clips (Guard/Wing/Big × 10 adversities) are in the catalog with real files", () => {
    const broken: string[] = [];
    // Every adversity the basketball registry maps
    for (const role of BASKETBALL_CONFIG.roles ?? []) {
      for (const adversity of BASKETBALL_CONFIG.adversities) {
        // hm-bb-* slugs follow the cellSlugFor pattern for basketball cells:
        // bb-{role}-{frag}. The compositional hm-bb-* slugs follow a parallel
        // convention: hm-bb-{role}-{frag}. Derive by extracting the frag from
        // the cell slug (which is what the basketball-expert authored in clips.ts).
        const cellSlug = BASKETBALL_CONFIG.cellSlugFor(adversity, role);
        // Cell slug is bb-{role}-{frag} → hm-bb-{role}-{frag}
        const hmSlug = `hm-${cellSlug}`;
        const err = catalogFileErr(hmSlug);
        if (err) {
          broken.push(
            `hm-bb clip for [${role} × "${adversity}"] slug "${hmSlug}": ${err}`,
          );
        }
      }
    }
    expect(broken).toEqual([]);
    // Confirm we hit exactly 30 cells
    expect(
      (BASKETBALL_CONFIG.roles ?? []).length *
        BASKETBALL_CONFIG.adversities.length,
    ).toBe(30);
  });

  it("basketball anchor clips are in the catalog with real files", () => {
    const broken: string[] = [];
    for (const slug of [
      "anc-bounce-ball-twice",
      "anc-tap-floor",
      "anc-look-at-rim",
    ]) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("basketball self-talk clip st-bb-01 is in the catalog with a real file", () => {
    expect(catalogFileErr("st-bb-01")).toBeNull();
  });

  it("basketball opener clips are in the catalog with real files", () => {
    const broken: string[] = [];
    for (const slug of ["opener-bb-courage", "opener-bb-decisions"]) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("new basketball anchor + self-talk option-map entries resolve to catalog slugs", () => {
    const missing: string[] = [];
    const bbAnchors = [
      "Bounce ball twice",
      "Tap floor",
      "Look at rim",
    ] as const;
    for (const opt of bbAnchors) {
      // ANCHOR_OPTION_SLUGS is imported from audio-mapping
      const slug = ANCHOR_OPTION_SLUGS[opt];
      if (!slug) {
        missing.push(`anchor option "${opt}" not in ANCHOR_OPTION_SLUGS`);
      } else if (!(slug in catalog)) {
        missing.push(`anchor "${opt}" → slug "${slug}" not in catalog`);
      }
    }
    const bbSelfTalk = "You're okay. Next possession." as const;
    const stSlug = SELFTALK_OPTION_SLUGS[bbSelfTalk];
    if (!stSlug) {
      missing.push(`self-talk "${bbSelfTalk}" not in SELFTALK_OPTION_SLUGS`);
    } else if (!(stSlug in catalog)) {
      missing.push(`self-talk "${bbSelfTalk}" → slug "${stSlug}" not in catalog`);
    }
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 11. Basketball opener parity (FV-120) — the 6 new opener-bb-* clips are in
//     the catalog with real files, and resolveOpenerSlug returns them for
//     basketball. "Calm" intentionally absent (reuses opener-calm via fallback).
// ---------------------------------------------------------------------------

describe("basketball opener parity (FV-120)", () => {
  // The 6 needs that got basketball-specific openers in FV-120, plus their slugs.
  const BB_OPENER_120: Array<{ need: string; slug: string }> = [
    { need: "Confidence",           slug: "opener-bb-confidence" },
    { need: "Compete level",        slug: "opener-bb-compete-level" },
    { need: "Reset after mistakes", slug: "opener-bb-reset" },
    { need: "Leadership",           slug: "opener-bb-leadership" },
    { need: "Joy",                  slug: "opener-bb-joy" },
    { need: "Hope",                 slug: "opener-bb-hope" },
  ];

  it("all 6 opener-bb-* clips are in the catalog with real non-zero files", () => {
    const broken: string[] = [];
    for (const { slug } of BB_OPENER_120) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("resolveOpenerSlug returns the basketball-specific slug for each of the 6 needs", () => {
    const mismatches: string[] = [];
    for (const { need, slug } of BB_OPENER_120) {
      const resolved = resolveOpenerSlug(need, "basketball");
      if (resolved !== slug) {
        mismatches.push(
          `resolveOpenerSlug("${need}", "basketball") = "${resolved}", expected "${slug}"`,
        );
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("resolveOpenerSlug('Calm', 'basketball') falls back to opener-calm (no bb variant)", () => {
    // "Calm" intentionally has no basketball-specific opener — it reuses the
    // shared opener-calm clip. resolveOpenerSlug must NOT return a bb-calm slug
    // that doesn't exist.
    expect(resolveOpenerSlug("Calm", "basketball")).toBe("opener-calm");
  });

  it("opener-calm is in the catalog (the basketball Calm fallback must resolve)", () => {
    expect(catalogFileErr("opener-calm")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 12. Catalog count — multi-sport (FV-124 → FV-266)
//     The single-sport FV-124 baseline was 240 (hockey + basketball + the
//     FV-136 viz/cue-word additions). The catalog now spans four sports, so a
//     bare magic number would be both brittle and opaque. Instead assert a
//     documented per-category breakdown whose sum must equal the catalog size —
//     this catches orphaned/dropped clips (the sum diverges) AND stays legible.
//     Counts verified against manifest b5585589 (FV-266 golf render + #232 intros).
// ---------------------------------------------------------------------------

describe("catalog count (multi-sport, FV-266)", () => {
  it("catalog is fully categorized (no orphans) and totals 345 entries", () => {
    const keys = Object.keys(catalog);
    const n = (re: RegExp) => keys.filter((k) => re.test(k)).length;
    const breakdown = {
      viz: n(/^viz-/), //                          65 — profile + positive-play viz (all sports)
      hmHockey: n(/^hm-(forward|defense|goalie)-/), // 30 — hockey hard-moment cells
      hmBball: n(/^hm-bb-/), //                     30 — basketball compositional cells
      bbalBaked: n(/^bb-/), //                      30 — legacy baked basketball composites
      hmBaseball: n(/^hm-bsb-/), //                 39 — baseball cells (FV-94)
      hmGolf: n(/^hm-glf-/), //                     30 — golf cells (FV-266)
      practice: n(/^pp-/), //                       56 — pre-practice clips (all sports + variations)
      openers: n(/^opener-/), //                    19 — need openers (incl. basketball variants)
      cueWord: n(/^cw-/), //                        20 — cue-word reset/sendoff
      anchor: n(/^anc-/), //                         8 — reset-anchor clips
      selfTalk: n(/^st-/), //                        8 — self-talk clips
      shared: n(/^shared-/), //                     10 — shared scaffold clips (+3 section intros, #232)
    };
    const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const uncategorized = keys.filter(
      (k) => !/^(viz-|hm-|bb-|pp-|opener-|cw-|anc-|st-|shared-)/.test(k),
    );
    // Every catalog key falls into exactly one bucket — catches typos/orphans.
    expect(uncategorized, `uncategorized clips: ${uncategorized.join(", ")}`).toEqual([]);
    expect(sum).toBe(keys.length);
    expect(keys).toHaveLength(345);
  });
});

describe("FV-122 beats retired (FV-124)", () => {
  it("be-vocal is NOT in the catalog (retired from templates)", () => {
    expect(catalog["be-vocal"]).toBeUndefined();
  });

  it("bb-be-vocal is NOT in the catalog (retired from templates)", () => {
    expect(catalog["bb-be-vocal"]).toBeUndefined();
  });

  it("no template references 'be-vocal'", () => {
    for (const template of manifest.templates) {
      expect(template.clips).not.toContain("be-vocal");
    }
  });

  it("no template references 'bb-be-vocal'", () => {
    for (const template of manifest.templates) {
      expect(template.clips).not.toContain("bb-be-vocal");
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Be more Vocal openers (FV-124) — opener-be-vocal and opener-bb-be-vocal
//     are in the catalog with real files; resolveOpenerSlug returns them for
//     the correct sport; resolvePlaylist prepends opener-be-vocal for a hockey
//     "Be more Vocal" session and opener-bb-be-vocal for basketball.
// ---------------------------------------------------------------------------

describe("Be more Vocal openers (FV-124)", () => {
  it("opener-be-vocal is in the catalog with a real non-zero file", () => {
    expect(catalogFileErr("opener-be-vocal")).toBeNull();
  });

  it("opener-bb-be-vocal is in the catalog with a real non-zero file", () => {
    expect(catalogFileErr("opener-bb-be-vocal")).toBeNull();
  });

  it("resolveOpenerSlug('Be more Vocal', 'hockey') returns 'opener-be-vocal'", () => {
    expect(resolveOpenerSlug("Be more Vocal", "hockey")).toBe("opener-be-vocal");
  });

  it("resolveOpenerSlug('Be more Vocal', 'basketball') returns 'opener-bb-be-vocal'", () => {
    expect(resolveOpenerSlug("Be more Vocal", "basketball")).toBe("opener-bb-be-vocal");
  });

  it("resolvePlaylist for a 'Be more Vocal' hockey session prepends opener-be-vocal and contains no be-vocal beat", () => {
    const playlist = resolvePlaylist("Be more Vocal", "Forward", "I feel nervous.", manifest);
    expect(playlist).not.toBeNull();
    const slugs = playlist!.map((c) => c.slug);
    // opener-be-vocal leads
    expect(slugs[0]).toBe("opener-be-vocal");
    // no retired mid-session be-vocal beat
    expect(slugs).not.toContain("be-vocal");
    expect(slugs).not.toContain("bb-be-vocal");
  });

  it("resolvePlaylist for a 'Be more Vocal' basketball session prepends opener-bb-be-vocal and contains no be-vocal beat", () => {
    const playlist = resolvePlaylist(
      "Be more Vocal",
      "Guard",
      "I turn the ball over.",
      manifest,
      null, // anchor
      null, // selfTalk
      null, // cueWord
      "basketball",
    );
    expect(playlist).not.toBeNull();
    const slugs = playlist!.map((c) => c.slug);
    // opener-bb-be-vocal leads
    expect(slugs[0]).toBe("opener-bb-be-vocal");
    // no retired mid-session beats
    expect(slugs).not.toContain("be-vocal");
    expect(slugs).not.toContain("bb-be-vocal");
  });

  it("resolves the FULL hockey matrix for 'Be more Vocal' — every cell leads with opener-be-vocal, no beat", () => {
    // 3 positions × 10 adversities. Catches a future PHASE2_TEMPLATES edit that
    // drops the opener from a specific cell or lets a be-vocal beat back in.
    for (const position of HOCKEY_CONFIG.roles ?? []) {
      for (const adversity of HOCKEY_CONFIG.adversities) {
        const playlist = resolvePlaylist("Be more Vocal", position, adversity, manifest, null, null, null, "hockey");
        expect(playlist, `${position} × "${adversity}"`).not.toBeNull();
        const slugs = playlist!.map((c) => c.slug);
        expect(slugs[0], `${position} × "${adversity}" opener`).toBe("opener-be-vocal");
        expect(slugs, `${position} × "${adversity}" beat-free`).not.toContain("be-vocal");
      }
    }
  });

  it("resolves the FULL basketball matrix for 'Be more Vocal' — every cell leads with opener-bb-be-vocal, no beat", () => {
    for (const position of BASKETBALL_CONFIG.roles ?? []) {
      for (const adversity of BASKETBALL_CONFIG.adversities) {
        const playlist = resolvePlaylist("Be more Vocal", position, adversity, manifest, null, null, null, "basketball");
        expect(playlist, `${position} × "${adversity}"`).not.toBeNull();
        const slugs = playlist!.map((c) => c.slug);
        expect(slugs[0], `${position} × "${adversity}" opener`).toBe("opener-bb-be-vocal");
        expect(slugs, `${position} × "${adversity}" beat-free`).not.toContain("bb-be-vocal");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Hockey "Talk every shift" pre-practice focus (FV-121)
//     pp-focus-talk-every-shift is in the catalog with a real file.
//     (Registry checks covered in sport-registry.test.ts section 13.)
// ---------------------------------------------------------------------------

describe("hockey focus parity — pp-focus-talk-every-shift (FV-121)", () => {
  it("pp-focus-talk-every-shift is in the catalog with a real non-zero file", () => {
    expect(catalogFileErr("pp-focus-talk-every-shift")).toBeNull();
  });

  it("HOCKEY_CONFIG.practiceFocusSlugs maps 'Talk every shift' to 'pp-focus-talk-every-shift'", () => {
    expect(HOCKEY_CONFIG.practiceFocusSlugs["Talk every shift"]).toBe(
      "pp-focus-talk-every-shift",
    );
  });

  it("HOCKEY_CONFIG.practiceFocusOptions includes 'Talk every shift'", () => {
    expect(HOCKEY_CONFIG.practiceFocusOptions).toContain("Talk every shift");
  });
});

// ---------------------------------------------------------------------------
// 13. Positive-play picker library (FV-144) — every selectable play maps to a
//     real, playable clip, and picking plays swaps the flagship for real audio.
// ---------------------------------------------------------------------------

describe("positive-play library integrity (FV-144)", () => {
  it("all 52 selectable positive plays are in the catalog with real non-zero files", () => {
    const broken: string[] = [];
    for (const { slug } of POSITIVE_PLAYS) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("every play's declared role matches its slug prefix (viz-<role>-…)", () => {
    const mismatches: string[] = [];
    for (const { slug, role } of POSITIVE_PLAYS) {
      const expectedPrefix = `viz-${role.toLowerCase()}-`;
      if (!slug.startsWith(expectedPrefix)) {
        mismatches.push(`${slug} declares role "${role}" but is not "${expectedPrefix}…"`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("each role with positions exposes a non-empty play list", () => {
    const empty: string[] = [];
    for (const config of [HOCKEY_CONFIG, BASKETBALL_CONFIG]) {
      for (const role of config.roles ?? []) {
        if (positivePlaysFor(role).length === 0) empty.push(`${config.sportKey}/${role}`);
      }
    }
    expect(empty).toEqual([]);
  });

  it("the cue-word scaffold lead-in clips are in the catalog with real non-zero files (FV-153)", () => {
    const broken: string[] = [];
    for (const slug of ["shared-cue-word-intro-pre", "shared-cue-word-sendoff-pre"]) {
      const err = catalogFileErr(slug);
      if (err) broken.push(`${slug}: ${err}`);
    }
    expect(broken).toEqual([]);
  });

  it("a real cue-word session leads each cw clip with its scaffold lead-in (FV-153)", () => {
    // Resolve a real hockey template with a known cue word; assert the lead-in
    // clip immediately precedes the resolved cw-<word>-reset / -sendoff.
    const resolved = resolvePlaylist(
      "Confidence",
      "Forward",
      HOCKEY_CONFIG.adversities[0]!,
      manifest,
      null, null, "Steady",
    );
    expect(resolved).not.toBeNull();
    const slugs = resolved!.map((c) => c.slug);
    const intro = slugs.indexOf("shared-cue-word-intro-pre");
    expect(intro).toBeGreaterThanOrEqual(0);
    expect(slugs[intro + 1]).toBe("cw-steady-reset");
    const sendoff = slugs.indexOf("shared-cue-word-sendoff-pre");
    expect(sendoff).toBeGreaterThanOrEqual(0);
    expect(slugs[sendoff + 1]).toBe("cw-steady-sendoff");
  });

  it("picking plays for a real session swaps the flagship for the picked clips (every role, both sports)", () => {
    const failures: string[] = [];
    for (const config of [HOCKEY_CONFIG, BASKETBALL_CONFIG]) {
      const need = config.needs[0]!; // "Confidence" — has an opener in both sports
      const adversity = config.adversities[0]!;
      for (const role of config.roles ?? []) {
        const plays = positivePlaysFor(role);
        const picks = plays.slice(0, 2).map((p) => p.slug);

        const resolved = resolvePlaylist(
          need,
          role,
          adversity,
          manifest,
          null, null, null,
          config.sportKey,
          "guided",
          picks,
        );
        if (!resolved) {
          failures.push(`${config.sportKey}/${role}: resolvePlaylist returned null`);
          continue;
        }
        const slugs = resolved.map((c) => c.slug);
        for (const pick of picks) {
          if (!slugs.includes(pick)) failures.push(`${config.sportKey}/${role}: missing pick ${pick}`);
        }
        // The picked plays must appear in the order chosen.
        if (picks.length === 2 && slugs.indexOf(picks[0]!) >= slugs.indexOf(picks[1]!)) {
          failures.push(`${config.sportKey}/${role}: picks out of order`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
