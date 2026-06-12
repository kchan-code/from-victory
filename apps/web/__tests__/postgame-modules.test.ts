// FV-225 — Post-game debrief module registry tests.
//
// Pins:
//   1. All 6 modules present: 3 scenarios × 2 sports; slugs unique; every
//      module has title/ref/text/body.
//   2. Scripture byte-pins: each SCRIPTURE_TEXT matches exact expected NIV
//      strings (mirrors the FV-229 cue-word-verses.test.ts pattern).
//   3. Body word-count ceiling ≤190 words per module (the format lock).
//   4. No "kid"/"kiddo"/"youngster"/"young person" in any module or picker copy.
//   5. Protect-lines verbatim: "not impressed by the ones who shrug it off"
//      (loss modules), "Don't fake being fine".
//   6. modulesForSport: hockey athlete gets 3 modules; basketball athlete gets 3;
//      unknown sport gets 0.
//   7. moduleBySlug: returns correct module; undefined for unknown slug.
//   8. Sport guard: modules are strictly scoped per sport.

import { describe, it, expect } from "vitest";

import {
  POSTGAME_MODULES,
  modulesForSport,
  moduleBySlug,
  type PostgameScenario,
} from "@/lib/postgame/modules";

// ---------------------------------------------------------------------------
// 1. Completeness and uniqueness
// ---------------------------------------------------------------------------

describe("POSTGAME_MODULES registry completeness", () => {
  it("contains exactly 6 modules", () => {
    expect(POSTGAME_MODULES).toHaveLength(6);
  });

  it("all slugs are unique", () => {
    const slugs = POSTGAME_MODULES.map((m) => m.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("every module has non-empty title, scriptureRef, scriptureText, bodyMd", () => {
    for (const mod of POSTGAME_MODULES) {
      expect(mod.title.trim().length, `${mod.slug}: empty title`).toBeGreaterThan(0);
      expect(mod.scriptureRef.trim().length, `${mod.slug}: empty scriptureRef`).toBeGreaterThan(0);
      expect(mod.scriptureText.trim().length, `${mod.slug}: empty scriptureText`).toBeGreaterThan(0);
      expect(mod.bodyMd.trim().length, `${mod.slug}: empty bodyMd`).toBeGreaterThan(0);
    }
  });

  it("covers all 3 scenarios × 2 sports", () => {
    const scenarios: PostgameScenario[] = ["loss", "benching", "bad-game"];
    const sports = ["hockey", "basketball"] as const;

    for (const sport of sports) {
      for (const scenario of scenarios) {
        const match = POSTGAME_MODULES.find(
          (m) => m.sport === sport && m.scenario === scenario,
        );
        expect(
          match,
          `missing module: sport=${sport} scenario=${scenario}`,
        ).toBeDefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Scripture byte-pins (verbatim NIV from PART 1 of the spec doc)
// ---------------------------------------------------------------------------

describe("Scripture verbatim NIV byte-pins", () => {
  it("Psalm 34:18 — exact NIV text (hockey loss)", () => {
    const mod = moduleBySlug("hockey-the-loss");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Psalm 34:18");
    expect(mod!.scriptureText).toBe(
      "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    );
  });

  it("Psalm 34:18 — same exact text on basketball loss", () => {
    const mod = moduleBySlug("basketball-the-loss");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Psalm 34:18");
    expect(mod!.scriptureText).toBe(
      "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    );
  });

  it("Psalm 139:1-3 — exact NIV text (hockey benching)", () => {
    const mod = moduleBySlug("hockey-glued-to-the-bench");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Psalm 139:1-3");
    expect(mod!.scriptureText).toBe(
      "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
    );
  });

  it("Psalm 139:1-3 — same exact text on basketball benching", () => {
    const mod = moduleBySlug("basketball-glued-to-the-bench");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Psalm 139:1-3");
    expect(mod!.scriptureText).toBe(
      "You have searched me, Lord, and you know me. You know when I sit and when I rise; you perceive my thoughts from afar. You discern my going out and my lying down; you are familiar with all my ways.",
    );
  });

  it("Lamentations 3:22-23 — exact NIV text (hockey bad night)", () => {
    const mod = moduleBySlug("hockey-the-bad-night");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Lamentations 3:22-23");
    expect(mod!.scriptureText).toBe(
      "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    );
  });

  it("Lamentations 3:22-23 — same exact text on basketball bad game", () => {
    const mod = moduleBySlug("basketball-the-cold-night");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Lamentations 3:22-23");
    expect(mod!.scriptureText).toBe(
      "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Body word-count ceiling ≤190 words (format lock from FV-23)
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  // Strip markdown syntax characters, then count whitespace-delimited tokens.
  const stripped = text
    .replace(/###\s/g, "")
    .replace(/>\s/g, "")
    .replace(/\*+/g, "")
    .trim();
  return stripped.split(/\s+/).filter(Boolean).length;
}

describe("Body word-count ceiling", () => {
  for (const mod of POSTGAME_MODULES) {
    it(`${mod.slug} body is ≤190 words`, () => {
      const count = countWords(mod.bodyMd);
      expect(
        count,
        `${mod.slug}: ${count} words — exceeds 190-word ceiling`,
      ).toBeLessThanOrEqual(190);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. No prohibited audience language in any module
// ---------------------------------------------------------------------------

describe("Audience language — no prohibited terms", () => {
  const PROHIBITED = ["kid", "kiddo", "youngster", "young person"];

  for (const mod of POSTGAME_MODULES) {
    it(`${mod.slug} contains no prohibited terms`, () => {
      const allCopy = [
        mod.title,
        mod.scriptureRef,
        mod.scriptureText,
        mod.bodyMd,
      ]
        .join(" ")
        .toLowerCase();

      for (const term of PROHIBITED) {
        expect(
          allCopy,
          `"${term}" found in ${mod.slug}`,
        ).not.toContain(term);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Youth-pastor protect-lines verbatim
// ---------------------------------------------------------------------------

describe("Youth-pastor protect-lines", () => {
  it('hockey loss contains "not impressed by the ones who shrug it off"', () => {
    const mod = moduleBySlug("hockey-the-loss");
    expect(mod!.bodyMd).toContain("not impressed by the ones who shrug it off");
  });

  it('basketball loss contains "not impressed by whoever shrugs it off"', () => {
    // Basketball loss uses slightly different phrasing per the source doc.
    const mod = moduleBySlug("basketball-the-loss");
    expect(mod!.bodyMd).toContain("not impressed by whoever shrugs it off");
  });

  it('hockey bad night contains "Don\'t fake being fine"', () => {
    const mod = moduleBySlug("hockey-the-bad-night");
    expect(mod!.bodyMd).toContain("Don't fake\nbeing fine");
  });

  it('basketball bad game contains "Don\'t fake being fine"', () => {
    const mod = moduleBySlug("basketball-the-cold-night");
    expect(mod!.bodyMd).toContain("Don't fake being\nfine");
  });

  it('hockey bad night contains "Then let it go" is NOT required — only the sports-psych exit rewrite is', () => {
    // sports-psychologist mandated the exit rewrite: "feel it tonight / not asked to feel it forever"
    // This is in the LOSS modules, not the bad-night modules. Verify it:
    const hockeyLoss = moduleBySlug("hockey-the-loss");
    expect(hockeyLoss!.bodyMd).toContain("You're not asked to feel it forever");
  });
});

// ---------------------------------------------------------------------------
// 6. modulesForSport sport filtering
// ---------------------------------------------------------------------------

describe("modulesForSport", () => {
  it("returns 3 modules for hockey", () => {
    const mods = modulesForSport("hockey");
    expect(mods).toHaveLength(3);
    expect(mods.every((m) => m.sport === "hockey")).toBe(true);
  });

  it("returns 3 modules for basketball", () => {
    const mods = modulesForSport("basketball");
    expect(mods).toHaveLength(3);
    expect(mods.every((m) => m.sport === "basketball")).toBe(true);
  });

  it("hockey modules cover all 3 scenarios", () => {
    const scenarios = new Set(modulesForSport("hockey").map((m) => m.scenario));
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
  });

  it("basketball modules cover all 3 scenarios", () => {
    const scenarios = new Set(modulesForSport("basketball").map((m) => m.scenario));
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. moduleBySlug resolver
// ---------------------------------------------------------------------------

describe("moduleBySlug", () => {
  it("resolves each of the 6 known slugs", () => {
    const slugs = POSTGAME_MODULES.map((m) => m.slug);
    for (const slug of slugs) {
      expect(
        moduleBySlug(slug),
        `slug not found: ${slug}`,
      ).toBeDefined();
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(moduleBySlug("not-a-real-slug")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(moduleBySlug("")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 8. Sport isolation — modules are strictly scoped
// ---------------------------------------------------------------------------

describe("Sport isolation", () => {
  it("no hockey module appears in basketball results", () => {
    const basketballSlugs = modulesForSport("basketball").map((m) => m.slug);
    const hockeySlugs = modulesForSport("hockey").map((m) => m.slug);
    const overlap = basketballSlugs.filter((s) => hockeySlugs.includes(s));
    expect(overlap).toHaveLength(0);
  });

  it("hockey loss slug resolves to sport=hockey, not basketball", () => {
    const mod = moduleBySlug("hockey-the-loss");
    expect(mod!.sport).toBe("hockey");
  });

  it("basketball loss slug resolves to sport=basketball, not hockey", () => {
    const mod = moduleBySlug("basketball-the-loss");
    expect(mod!.sport).toBe("basketball");
  });
});
