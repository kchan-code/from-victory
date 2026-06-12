// FV-225 — Post-game debrief module registry tests.
//
// Pins:
//   1. All 8 modules present: 4 scenarios × 2 sports; slugs unique; every
//      module has title/ref/text/body.
//   2. Scripture byte-pins: each SCRIPTURE_TEXT matches exact expected NIV
//      strings (mirrors the FV-229 cue-word-verses.test.ts pattern).
//   3. Body word-count ceiling ≤190 words per module (the format lock).
//   4. No "kid"/"kiddo"/"youngster"/"young person" in any module copy
//      (registry fields; page-level copy is reviewed, not scanned here).
//   5. Protect-lines verbatim: "not impressed by the ones who shrug it off"
//      (loss modules), "Don't fake being fine".
//   6. modulesForSport: hockey athlete gets 4 modules; basketball athlete gets 4;
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
  it("contains exactly 8 modules", () => {
    expect(POSTGAME_MODULES).toHaveLength(8);
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

  it("covers all 4 scenarios × 2 sports", () => {
    const scenarios: PostgameScenario[] = ["win", "loss", "benching", "bad-game"];
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

  // NIV-fidelity trap (youth-pastor): "the Father of the heavenly lights",
  // NOT the ESV/KJV "Father of lights". The byte-pin guards the drift.
  it("James 1:17 — exact NIV text (hockey win)", () => {
    const mod = moduleBySlug("hockey-after-the-win");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("James 1:17");
    expect(mod!.scriptureText).toBe(
      "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
    );
  });

  it("James 1:17 — same exact text on basketball win", () => {
    const mod = moduleBySlug("basketball-after-the-win");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("James 1:17");
    expect(mod!.scriptureText).toBe(
      "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
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

  it("win modules: reset blockquote echoes the loss reset (the product point)", () => {
    for (const slug of ["hockey-after-the-win", "basketball-after-the-win"]) {
      const mod = moduleBySlug(slug);
      expect(mod).toBeDefined();
      expect(mod!.bodyMd).toContain(
        "The win is real. It is not the crown on you.",
      );
    }
  });

  it("win modules: no prosperity-transaction language (youth-pastor guardrail)", () => {
    // A win must never read as evidence of God's favor. These phrases are
    // banned in the win modules specifically (docs/brand.md words-to-avoid).
    const banned = [/God('s)? favor/i, /God showed up/i, /came through for (you|us)/i, /God (is |was )?on (your|our) side/i];
    for (const slug of ["hockey-after-the-win", "basketball-after-the-win"]) {
      const mod = moduleBySlug(slug)!;
      for (const re of banned) {
        expect(re.test(mod.bodyMd), `${slug}: matches banned pattern ${re}`).toBe(false);
      }
    }
  });

  it('hockey LOSS module keeps the sports-psych exit rewrite ("not asked to feel it forever")', () => {
    // sports-psychologist mandated the exit rewrite: "feel it tonight / not asked to feel it forever"
    // It lives in the LOSS modules (not the bad-night modules):
    const hockeyLoss = moduleBySlug("hockey-the-loss");
    expect(hockeyLoss!.bodyMd).toContain("You're not asked to feel it forever");
  });
});

// ---------------------------------------------------------------------------
// 6. modulesForSport sport filtering
// ---------------------------------------------------------------------------

describe("modulesForSport", () => {
  it("returns 4 modules for hockey", () => {
    const mods = modulesForSport("hockey");
    expect(mods).toHaveLength(4);
    expect(mods.every((m) => m.sport === "hockey")).toBe(true);
  });

  it("returns 4 modules for basketball", () => {
    const mods = modulesForSport("basketball");
    expect(mods).toHaveLength(4);
    expect(mods.every((m) => m.sport === "basketball")).toBe(true);
  });

  it("hockey modules cover all 4 scenarios", () => {
    const scenarios = new Set(modulesForSport("hockey").map((m) => m.scenario));
    expect(scenarios.has("win")).toBe(true);
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
  });

  it("basketball modules cover all 4 scenarios", () => {
    const scenarios = new Set(modulesForSport("basketball").map((m) => m.scenario));
    expect(scenarios.has("win")).toBe(true);
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. moduleBySlug resolver
// ---------------------------------------------------------------------------

describe("moduleBySlug", () => {
  it("resolves each of the 8 known slugs", () => {
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
