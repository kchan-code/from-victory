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
import { HOCKEY_CONFIG } from "../sport-registry";

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
// 5. Practice playlist integrity — manifest.practiceState (p5, FRO-22) exists
//    and each shared-tail slug resolves to a real non-zero file on disk.
// ---------------------------------------------------------------------------

describe("practice playlist integrity", () => {
  it("manifest.practiceState exists with non-empty state tails", () => {
    expect(manifest.practiceState).toBeDefined();
    expect(manifest.practiceState!["dialed-in"].length).toBeGreaterThan(0);
    expect(manifest.practiceState!["not-feeling-it"].length).toBeGreaterThan(0);
  });

  it("every slug in manifest.practiceState is in the catalog AND has a real non-zero file", () => {
    // Guard: if the block above failed, this would NPE — exit cleanly.
    if (!manifest.practiceState) {
      expect(manifest.practiceState).toBeDefined();
      return;
    }

    const broken: string[] = [];

    const stateSlugs = [
      ...manifest.practiceState["dialed-in"],
      ...manifest.practiceState["not-feeling-it"],
    ];

    for (const slug of stateSlugs) {
      // 1. Slug must exist in the catalog.
      const entry = catalog[slug];
      if (!entry) {
        broken.push(`practiceState slug "${slug}" not found in catalog`);
        continue;
      }

      // 2. File must exist on disk and be non-zero.
      const absPath = urlToAbsPath(entry.url);
      if (!fs.existsSync(absPath)) {
        broken.push(`practiceState slug "${slug}": file not found at ${absPath}`);
        continue;
      }
      const stat = fs.statSync(absPath);
      if (stat.size === 0) {
        broken.push(`practiceState slug "${slug}": file is zero bytes at ${absPath}`);
      }
    }

    expect(broken).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 6. Full matrix coverage: exactly (3 positions × 10 adversities) = 30 templates
// ---------------------------------------------------------------------------

describe("template matrix completeness", () => {
  const POSITIONS = ["Forward", "Defense", "Goalie"] as const;

  // Sourced from the registry — single source of truth so any adversity rename
  // is caught here without a separate edit.
  const ADVERSITIES = HOCKEY_CONFIG.adversities;

  it("manifest has exactly 30 templates (3 positions × 10 adversities)", () => {
    expect(manifest.templates).toHaveLength(30);
  });

  it("every (position × adversity) combination has exactly one template", () => {
    const missing: string[] = [];

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
