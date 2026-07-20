// FV-225 — Post-game debrief module registry tests.
//
// Pins:
//   1. All 19 modules present: 5 scenarios × 4 sports minus golf benching
//      (KC 2026-07-20: "there is no benching for golf"); slugs unique; every
//      module has title/ref/text/body.
//   2. Scripture byte-pins: each SCRIPTURE_TEXT matches exact expected NIV
//      strings (mirrors the FV-229 cue-word-verses.test.ts pattern).
//   3. Body word-count ceiling — ≤190 words for team sports; ≤220 for golf
//      (FV-294 individual-sport modules run longer; pending KC by-ear trim).
//   4. No "kid"/"kiddo"/"youngster"/"young person" in any module copy
//      (registry fields; page-level copy is reviewed, not scanned here).
//   5. Protect-lines verbatim: "not impressed by the ones who shrug it off"
//      (loss modules), "Don't fake being fine"; plus the praise-on-a-hard-night
//      protect-lines + anti-prosperity banned-pattern scan (highest-drift
//      module — praise must never read as a lever for a better outcome).
//   6. modulesForSport: hockey athlete gets 5 modules; basketball athlete gets 5;
//      golf athlete gets 5; unknown sport gets 0.
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
  it("contains exactly 19 modules", () => {
    // 5 scenarios × 4 sports − golf benching (removed per KC 2026-07-20).
    expect(POSTGAME_MODULES).toHaveLength(19);
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

  it("covers the expected scenario grid per sport (golf has no benching)", () => {
    const expected: Record<string, string[]> = {
      hockey: ["win", "loss", "benching", "bad-game", "praise"],
      basketball: ["win", "loss", "benching", "bad-game", "praise"],
      golf: ["win", "loss", "bad-game", "praise"], // no benching (KC 2026-07-20)
      football: ["win", "loss", "benching", "bad-game", "praise"],
    };
    for (const [sport, scenarios] of Object.entries(expected)) {
      const got = POSTGAME_MODULES.filter((m) => m.sport === sport).map((m) => m.scenario).sort();
      expect(got, sport).toEqual([...scenarios].sort());
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

  // Habakkuk 3:17-18 — the praise-on-a-hard-night anchor. Pinned FULL (v17 +
  // v18): the long list of failures is the theological engine — the "yet" only
  // works because every loss is named first. Do not abridge. NIV renders the
  // divine name "Lord" (house style), not the small-caps "LORD".
  it("Habakkuk 3:17-18 — exact NIV text (hockey praise)", () => {
    const mod = moduleBySlug("hockey-praise-anyway");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Habakkuk 3:17-18");
    expect(mod!.scriptureText).toBe(
      "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
    );
  });

  it("Habakkuk 3:17-18 — same exact text on basketball praise", () => {
    const mod = moduleBySlug("basketball-praise-anyway");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Habakkuk 3:17-18");
    expect(mod!.scriptureText).toBe(
      "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
    );
  });

  // Golf scripture byte-pins (FV-294)
  it("Psalm 34:18 — same exact text on golf loss", () => {
    const mod = moduleBySlug("golf-the-loss");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Psalm 34:18");
    expect(mod!.scriptureText).toBe(
      "The Lord is close to the brokenhearted and saves those who are crushed in spirit.",
    );
  });

  it("Lamentations 3:22-23 — same exact text on golf bad game (blow-up round)", () => {
    const mod = moduleBySlug("golf-the-blow-up-round");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Lamentations 3:22-23");
    expect(mod!.scriptureText).toBe(
      "Because of the Lord's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    );
  });

  it("James 1:17 — same exact text on golf win", () => {
    const mod = moduleBySlug("golf-after-the-win");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("James 1:17");
    expect(mod!.scriptureText).toBe(
      "Every good and perfect gift is from above, coming down from the Father of the heavenly lights, who does not change like shifting shadows.",
    );
  });

  it("Habakkuk 3:17-18 — same exact text on golf praise", () => {
    const mod = moduleBySlug("golf-praise-anyway");
    expect(mod).toBeDefined();
    expect(mod!.scriptureRef).toBe("Habakkuk 3:17-18");
    expect(mod!.scriptureText).toBe(
      "Though the fig tree does not bud and there are no grapes on the vines, though the olive crop fails and the fields produce no food, though there are no sheep in the pen and no cattle in the stalls, yet I will rejoice in the Lord, I will be joyful in God my Savior.",
    );
  });

  // Football (FV-431) — same five texts, cross-pinned to the hockey originals
  // so a drift in either sport's verse breaks loudly.
  it.each([
    ["football-the-loss", "hockey-the-loss"],
    ["football-glued-to-the-bench", "hockey-glued-to-the-bench"],
    ["football-the-bad-game", "hockey-the-bad-night"],
    ["football-after-the-win", "hockey-after-the-win"],
    ["football-praise-anyway", "hockey-praise-anyway"],
  ])("%s scripture text byte-matches %s", (ftbSlug, hockeySlug) => {
    const ftb = moduleBySlug(ftbSlug)!;
    const hky = moduleBySlug(hockeySlug)!;
    expect(ftb.scriptureRef).toBe(hky.scriptureRef);
    expect(ftb.scriptureText).toBe(hky.scriptureText);
  });
});

// ---------------------------------------------------------------------------
// 3. Body word-count ceiling
//
// Hockey + basketball postgame modules hold to ≤190 words (the FV-225
// postgame format, matching the FV-23 daily-session lock). Golf (FV-294)
// currently runs to ≤220: three of its five modules exceed 190 (loss 210,
// praise 205, win 202) because the individual-sport loneliness layer adds
// prose. The copy is KC-approved verbatim. If golf is later trimmed to the
// team-sport length (a by-ear call), restore a single ≤190 ceiling and drop
// the per-sport branch below.
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
    const ceiling = mod.sport === "golf" || mod.sport === "football" ? 220 : 190;
    it(`${mod.slug} body is ≤${ceiling} words`, () => {
      const count = countWords(mod.bodyMd);
      expect(
        count,
        `${mod.slug}: ${count} words — exceeds ${ceiling}-word ceiling`,
      ).toBeLessThanOrEqual(ceiling);
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

describe("KC-copy protect-lines (2026-07-20 re-author)", () => {
  // KC re-authored every module body in the 2026-07-20 postgame review bundle
  // (the content source of truth). The load-bearing anchors are now the reset
  // blockquotes — one per module, each doing the module's theological work.
  // A future edit that drops or rewrites a reset must come back through a KC
  // prose gate; this pin makes that mechanical.
  const normalize = (x: string) => x.replace(/\s+/g, " ").trim();

  const RESET_BLOCKQUOTES: Array<[string, string]> = [
    ["basketball-after-the-win", "Receive the win as a gift, not as proof that you have arrived."],
    ["basketball-glued-to-the-bench", "You cannot choose your minutes. You can be ready for every one you receive."],
    ["basketball-praise-anyway", "Trusting God does not mean becoming indifferent to the result."],
    ["basketball-the-cold-night", "Name the mistake. Take the correction. Do not make the mistake your name."],
    ["basketball-the-loss", "The result matters. It is not your standing before God."],
    ["football-after-the-win", "Enjoy the win. Give thanks. Stay teachable."],
    ["football-glued-to-the-bench", "You do not control how many reps you get. You control how you use them."],
    ["football-praise-anyway", "Faith in God's control is not indifference to the result."],
    ["football-the-bad-game", "Own the snap. Repair what you can. Learn the correction."],
    ["football-the-loss", "Face the score honestly. Take responsibility without taking condemnation."],
    ["golf-after-the-win", "Enjoy the score without asking it to justify you."],
    ["golf-praise-anyway", "Praise does not erase the card or purchase a better one."],
    ["golf-the-blow-up-round", "Be honest about the round, then make the next correction."],
    ["golf-the-loss", "Take the round seriously without making it ultimate."],
    ["hockey-after-the-win", "Enjoy the win without asking it to prove you are enough."],
    ["hockey-glued-to-the-bench", "You do not control the shifts you are given. You control what you do with them."],
    ["hockey-praise-anyway", "Praise is not pretending the loss did not matter."],
    ["hockey-the-bad-night", "Own the mistake without turning it into your name."],
    ["hockey-the-loss", "Care about the loss. Learn from it. Do not make it your identity."],
  ];

  it.each(RESET_BLOCKQUOTES)("%s keeps its KC reset blockquote", (slug, reset) => {
    const mod = moduleBySlug(slug);
    expect(mod, slug).toBeDefined();
    expect(normalize(mod!.bodyMd)).toContain(reset);
  });

  // Win modules must never read as evidence of God's favor. KC's re-authored
  // copy REFUTES the transaction explicitly ("The final score is not proof
  // that God favored you…") — mention-to-refute is the point of the module,
  // so each authorized refutation sentence is asserted present, stripped,
  // and THEN the banned patterns are scanned. Any new (non-refuting) use of
  // the pattern still fails.
  const WIN_AUTHORIZED_REFUTATIONS: Record<string, string[]> = {
    "hockey-after-the-win": [
      "The final score is not proof that God favored you over the other team or payment for having enough faith.",
    ],
    "basketball-after-the-win": [
      "The final score is not proof that God chose your side or rewarded your faith.",
    ],
    "golf-after-the-win": [
      "God did not reward your faith with a lower score.",
    ],
    "football-after-the-win": [
      "The final score is not evidence that God favored your team or rewarded you for having more faith.",
    ],
  };

  it("win modules: no prosperity-transaction language outside authorized refutations", () => {
    const banned = [
      /God('s)? favor/i,
      /God favored/i,
      /God showed up/i,
      /came through for (you|us)/i,
      /God (is |was )?on (your|our) side/i,
      /reward(ed)? your faith/i,
    ];
    for (const [slug, refutations] of Object.entries(WIN_AUTHORIZED_REFUTATIONS)) {
      let body = normalize(moduleBySlug(slug)!.bodyMd);
      for (const sentence of refutations) {
        expect(body, `${slug}: authorized refutation missing`).toContain(sentence);
        body = body.replace(sentence, "");
      }
      for (const re of banned) {
        expect(re.test(body), `${slug}: matches banned pattern ${re}`).toBe(false);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5b. Praise-on-a-hard-night modules ("The Hard Night" / "Praise Anyway")
//     The mirror of The Win. Highest anti-prosperity drift risk in the app:
//     praising God on a hard night must NEVER read as a lever for a better
//     outcome, a mood-fix, or God owing a turnaround. Protect-lines hold the
//     ache-first sequencing + the praise/outcome severance; the banned-pattern
//     scan guards future edits (full trio cycle + both sport experts).
// ---------------------------------------------------------------------------

describe("Praise-on-a-hard-night modules (The Hard Night)", () => {
  const PRAISE_SLUGS = [
    "hockey-praise-anyway",
    "basketball-praise-anyway",
    "golf-praise-anyway",
    "football-praise-anyway",
  ];

  const normalize = (x: string) => x.replace(/\s+/g, " ").trim();

  // KC's 2026-07-20 re-authored copy names the disappointment in
  // "What happened" BEFORE the Habakkuk turn in "What's true" — collapsing
  // them is the spiritual-bypassing failure the sports-psychologist flagged.
  // Per-module ache anchors are verbatim from the KC copy.
  const ACHE_ANCHORS: Record<string, string> = {
    "hockey-praise-anyway": "You do not have to call the night good.",
    "basketball-praise-anyway": "Let the disappointment be honest.",
    "golf-praise-anyway": "Do not call it good, and do not act like it did not matter.",
    "football-praise-anyway": "You wanted a different ending.",
  };

  // Mention-to-refute sentences (see the win-module guard note above).
  const PRAISE_AUTHORIZED_REFUTATIONS: Record<string, string[]> = {
    "golf-praise-anyway": [
      "You do not have to make yourself feel better before you finish the prayer.",
    ],
  };

  it.each(PRAISE_SLUGS)('%s: scenario "praise", title "Praise Anyway", Habakkuk anchor', (slug) => {
    const mod = moduleBySlug(slug)!;
    expect(mod.scenario).toBe("praise");
    expect(mod.title).toBe("Praise Anyway");
    expect(mod.scriptureRef).toBe("Habakkuk 3:17-18");
  });

  it.each(PRAISE_SLUGS)("%s: ache named before the Habakkuk turn (anti-bypassing)", (slug) => {
    const body = normalize(moduleBySlug(slug)!.bodyMd);
    const acheIdx = body.indexOf(ACHE_ANCHORS[slug]!);
    const turnIdx = body.indexOf("Habakkuk");
    expect(acheIdx, `${slug}: ache anchor missing`).toBeGreaterThan(-1);
    expect(turnIdx, `${slug}: Habakkuk turn missing`).toBeGreaterThan(acheIdx);
  });

  it.each(PRAISE_SLUGS)("%s: no prosperity-gospel / bypassing patterns", (slug) => {
    const banned = [
      /turn(ed|s)? it around/i,
      /turnaround/i,
      /bounce back/i,
      /next (game|night|time)\b.{0,40}\b(will|better|yours)/i,
      /claim it/i,
      /speak it/i,
      /declare (victory|it)/i,
      /God('s)? (will )?(bless|reward|repay)/i,
      /God('s)? favor/i,
      /God (is |was )?on (your|our) side/i,
      /everything happens for a reason/i,
      /silver lining/i,
      /look (on )?the bright side/i,
      /at least\b/i,
      /just be (thankful|grateful|positive)/i,
      /feel better/i,
      /lift your mood/i,
      /if you (just )?(praise|believe)/i,
    ];
    let body = normalize(moduleBySlug(slug)!.bodyMd);
    for (const sentence of PRAISE_AUTHORIZED_REFUTATIONS[slug] ?? []) {
      expect(body, `${slug}: authorized refutation missing`).toContain(sentence);
      body = body.replace(sentence, "");
    }
    for (const re of banned) {
      expect(re.test(body), `${slug}: matches banned pattern ${re}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. modulesForSport sport filtering
// ---------------------------------------------------------------------------

describe("modulesForSport", () => {
  it("returns 5 modules for hockey", () => {
    const mods = modulesForSport("hockey");
    expect(mods).toHaveLength(5);
    expect(mods.every((m) => m.sport === "hockey")).toBe(true);
  });

  it("returns 5 modules for basketball", () => {
    const mods = modulesForSport("basketball");
    expect(mods).toHaveLength(5);
    expect(mods.every((m) => m.sport === "basketball")).toBe(true);
  });

  it("returns 4 modules for golf (no benching — KC 2026-07-20)", () => {
    const mods = modulesForSport("golf");
    expect(mods).toHaveLength(4);
    expect(mods.every((m) => m.sport === "golf")).toBe(true);
  });

  it("returns 5 modules for football", () => {
    const mods = modulesForSport("football");
    expect(mods).toHaveLength(5);
    expect(mods.every((m) => m.sport === "football")).toBe(true);
  });

  it("hockey modules cover all 5 scenarios", () => {
    const scenarios = new Set(modulesForSport("hockey").map((m) => m.scenario));
    expect(scenarios.has("win")).toBe(true);
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
    expect(scenarios.has("praise")).toBe(true);
  });

  it("basketball modules cover all 5 scenarios", () => {
    const scenarios = new Set(modulesForSport("basketball").map((m) => m.scenario));
    expect(scenarios.has("win")).toBe(true);
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(true);
    expect(scenarios.has("bad-game")).toBe(true);
    expect(scenarios.has("praise")).toBe(true);
  });

  it("golf modules cover 4 scenarios — no benching (KC 2026-07-20)", () => {
    const scenarios = new Set(modulesForSport("golf").map((m) => m.scenario));
    expect(scenarios.has("win")).toBe(true);
    expect(scenarios.has("loss")).toBe(true);
    expect(scenarios.has("benching")).toBe(false);
    expect(scenarios.has("bad-game")).toBe(true);
    expect(scenarios.has("praise")).toBe(true);
  });

  it("football modules cover all 5 scenarios", () => {
    const scenarios = new Set(modulesForSport("football").map((m) => m.scenario));
    for (const scen of ["win", "loss", "benching", "bad-game", "praise"]) {
      expect(scenarios.has(scen as never), scen).toBe(true);
    }
  });

  // Pins the picker-order UX contract from the modulesForSport JSDoc:
  // the win LEADS (a good-night athlete finds theirs first) and "Praise
  // Anyway" (praise on a hard night) TRAILS as the chosen-posture capstone.
  // Membership/count tests alone would pass if a future edit reordered them.
  it.each(["hockey", "basketball", "golf", "football"] as const)(
    "%s modules keep win-first, praise-last order",
    (sport) => {
      const mods = modulesForSport(sport);
      expect(mods[0]!.scenario).toBe("win");
      expect(mods[mods.length - 1]!.scenario).toBe("praise");
    },
  );
});

// ---------------------------------------------------------------------------
// 7. moduleBySlug resolver
// ---------------------------------------------------------------------------

describe("moduleBySlug", () => {
  it("resolves every known slug", () => {
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

  it("no golf module appears in hockey results", () => {
    const golfSlugs = modulesForSport("golf").map((m) => m.slug);
    const hockeySlugs = modulesForSport("hockey").map((m) => m.slug);
    const overlap = golfSlugs.filter((s) => hockeySlugs.includes(s));
    expect(overlap).toHaveLength(0);
  });

  it("no golf module appears in basketball results", () => {
    const golfSlugs = modulesForSport("golf").map((m) => m.slug);
    const basketballSlugs = modulesForSport("basketball").map((m) => m.slug);
    const overlap = golfSlugs.filter((s) => basketballSlugs.includes(s));
    expect(overlap).toHaveLength(0);
  });

  it("no football module appears in hockey results", () => {
    const footballSlugs = modulesForSport("football").map((m) => m.slug);
    const hockeySlugs = modulesForSport("hockey").map((m) => m.slug);
    const overlap = footballSlugs.filter((sl) => hockeySlugs.includes(sl));
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

  it("golf loss slug resolves to sport=golf", () => {
    const mod = moduleBySlug("golf-the-loss");
    expect(mod!.sport).toBe("golf");
  });
});

// ---------------------------------------------------------------------------
// Golf eyebrow overrides (FV-294 — individual-sport framing, no "Bench"/"Game")
// The picker/detail pages render `mod.eyebrow ?? SCENARIO_EYEBROW[scenario]`;
// golf overrides the two scenarios whose default leaks team-sport framing.
// ---------------------------------------------------------------------------
describe("Golf eyebrow overrides", () => {
  it("golf bad-game ('The Blow-Up Round') overrides 'The Bad Game' (round, not game)", () => {
    expect(moduleBySlug("golf-the-blow-up-round")!.eyebrow).toBe("The Bad Round");
  });

  it("no golf eyebrow override leaks team-sport framing (bench/game)", () => {
    for (const mod of modulesForSport("golf")) {
      if (mod.eyebrow) expect(mod.eyebrow).not.toMatch(/bench|game/i);
    }
  });
});
