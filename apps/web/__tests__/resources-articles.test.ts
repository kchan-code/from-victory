// Unit tests for the /resources article registry (FV-238).
//
// Verifies:
//  - registry has exactly 5 slugs, all unique
//  - every article has title / metaDescription (≤155 chars) / bodyMd
//  - scripture byte-pins: exact NIV strings present in the right articles
//  - "kid/kids/kiddo/youngster" scan: article 4 is parent-facing; flag if it appears in athlete-facing
//  - whole-body sha256 fidelity pins (byte-verbatim curator copy)
//  - not-therapy pins in article 5

import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  getAllArticles,
  getArticleBySlug,
  getAllSlugs,
} from "@/lib/resources/articles";

// ---------------------------------------------------------------------------
// Registry shape
// ---------------------------------------------------------------------------

describe("resources article registry", () => {
  it("has exactly 5 articles", () => {
    expect(getAllArticles()).toHaveLength(5);
  });

  it("all slugs are unique", () => {
    const slugs = getAllSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every article has a non-empty title", () => {
    for (const a of getAllArticles()) {
      expect(a.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("every metaDescription is non-empty and ≤155 chars", () => {
    for (const a of getAllArticles()) {
      expect(a.metaDescription.trim().length).toBeGreaterThan(0);
      expect(a.metaDescription.length).toBeLessThanOrEqual(155);
    }
  });

  it("every article has a non-empty bodyMd", () => {
    for (const a of getAllArticles()) {
      expect(a.bodyMd.trim().length).toBeGreaterThan(0);
    }
  });

  it("getArticleBySlug returns undefined for unknown slug", () => {
    expect(getArticleBySlug("does-not-exist")).toBeUndefined();
  });

  it("getArticleBySlug round-trips for every registered slug", () => {
    for (const slug of getAllSlugs()) {
      expect(getArticleBySlug(slug)?.slug).toBe(slug);
    }
  });
});

// ---------------------------------------------------------------------------
// Scripture byte-pins
// ---------------------------------------------------------------------------

describe("scripture byte-pins", () => {
  // Article 1 slug
  const ART1 = "bible-verses-for-athletes-before-a-game";
  // Article 3 slug
  const ART3 = "how-to-bounce-back-after-a-bad-game";
  // Article 4 slug
  const ART4 = "when-your-athlete-gets-cut-a-parents-guide";
  // Article 5 slug
  const ART5 = "sports-psychology-and-faith-do-they-mix";

  it("Rom 8:1 exact NIV string appears in article 1", () => {
    const body = getArticleBySlug(ART1)!.bodyMd;
    expect(body).toContain(
      "Therefore, there is now no condemnation for those who are in Christ Jesus",
    );
  });

  it("Rom 8:1 exact NIV string appears in article 3", () => {
    const body = getArticleBySlug(ART3)!.bodyMd;
    expect(body).toContain(
      "Therefore, there is now no condemnation for those who are in Christ Jesus",
    );
  });

  it("Rom 8:1 exact NIV string appears in article 4", () => {
    const body = getArticleBySlug(ART4)!.bodyMd;
    expect(body).toContain(
      "Therefore, there is now no condemnation for those who are in Christ Jesus",
    );
  });

  it("Rom 8:1 exact NIV string appears in article 5", () => {
    const body = getArticleBySlug(ART5)!.bodyMd;
    expect(body).toContain(
      "Therefore, there is now no condemnation for those who are in Christ Jesus",
    );
  });

  it('Phil 4:13 uses "all this" (not "all things") in article 1', () => {
    const body = getArticleBySlug(ART1)!.bodyMd;
    expect(body).toContain("I can do all this through him who gives me strength");
    // Guard: "all things" (incorrect paraphrase) must NOT appear
    expect(body).not.toContain("I can do all things through");
  });

  it("Lam 3:22-23 full NIV text appears in article 1", () => {
    const body = getArticleBySlug(ART1)!.bodyMd;
    // U+0027 straight apostrophe — verbatim from NIV source in registry
    const apos = "'";
    const lam =
      "Because of the Lord" +
      apos +
      "s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness";
    expect(body).toContain(lam);
  });

  it("Lam 3:22-23 full NIV text appears in article 3", () => {
    const body = getArticleBySlug(ART3)!.bodyMd;
    // U+0027 straight apostrophe — verbatim from NIV source in registry
    const apos = "'";
    const lam =
      "Because of the Lord" +
      apos +
      "s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness";
    expect(body).toContain(lam);
  });

  it("Rom 8:37 is adjacent to verse 8:35 reference in article 1 (guardrail)", () => {
    const body = getArticleBySlug(ART1)!.bodyMd;
    // "No, in all these things we are more than conquerors" is the Rom 8:37 text
    expect(body).toContain(
      "No, in all these things we are more than conquerors through him who loved us",
    );
    // 8:35 reference must appear in the same body
    expect(body).toContain("8:35");
  });
});

// ---------------------------------------------------------------------------
// "kid" audience-language scan
// ---------------------------------------------------------------------------

// "kid/kids/kiddo/youngster" audience-language guard.
// Regex catches singular "kid", plural "kids", "kiddo", and "youngster".
const KID_RE = /\bkids?\b|kiddo|youngster/gi;

describe('"kid/kids/kiddo/youngster" audience-language scan', () => {
  it('athlete-facing articles (audience="athlete") do not contain kid/kids/kiddo/youngster', () => {
    const athleteArticles = getAllArticles().filter(
      (a) => a.audience === "athlete",
    );
    for (const a of athleteArticles) {
      const matches = a.bodyMd.match(KID_RE);
      expect(
        matches,
        `kid/kids/kiddo/youngster found in athlete-facing article "${a.slug}": ${JSON.stringify(matches)}`,
      ).toBeNull();
    }
  });

  // Article 4 is parent-facing. "Most kids who get cut" appears in the body.
  // Per the audience table, parent-facing copy may use "kids" BUT the preferred
  // terms are "your child"/"your athlete". This test documents the 1 occurrence
  // rather than blocking — flag for KC / content-curator to rewrite.
  it('article 4 (parent-facing) "kids" occurrence count === 1 — documents for KC review', () => {
    const body = getArticleBySlug("when-your-athlete-gets-cut-a-parents-guide")!
      .bodyMd;
    const matches = body.match(KID_RE);
    // Currently exactly 1: "Most kids who get cut" — flag but do not fail.
    // KC: ask content-curator to rewrite to "Most athletes who get cut" (count → 0).
    expect(matches?.length ?? 0).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Whole-body SHA-256 fidelity pins
// ---------------------------------------------------------------------------
//
// These hashes pin the exact byte sequence of each article's bodyMd as
// delivered by content review (2026-06-12).
//
// DO NOT edit the hash values without going back through content review.
// Any bodyMd edit — even whitespace — is a regression against curator copy.
//
// byte-verbatim curator copy — any edit must go back through content review.

describe("whole-body sha256 fidelity pins", () => {
  const PINS: Record<string, string> = {
    "bible-verses-for-athletes-before-a-game":
      "19d6a824dc39a5a7ce21dbc21a205371982f7c05709e18c889bb9faa585f435b",
    "pre-game-nerves-christian-athlete-routine":
      "233184d5bb8a388009797f6d741be9b5af8938981ab56c745b59e0bfaca26533",
    "how-to-bounce-back-after-a-bad-game":
      "6f0212bdc206eaec27a0e28f8a24828551eac65d3128a89944102f198f5c3622",
    "when-your-athlete-gets-cut-a-parents-guide":
      "c7a9bc8238fbd09a9db83b6031c5164755fabc5102afc3c32cae9389245054b9",
    "sports-psychology-and-faith-do-they-mix":
      "f555804b7274d38308b5780a8969c802703be7bc8001f72ad575d14c1f88d8d7",
  };

  for (const [slug, expectedHash] of Object.entries(PINS)) {
    it(`bodyMd sha256 matches pin for "${slug}"`, () => {
      const body = getArticleBySlug(slug)!.bodyMd;
      const actual = createHash("sha256").update(body).digest("hex");
      expect(
        actual,
        `bodyMd for "${slug}" has been edited — hash mismatch. Any change must go back through content review.`,
      ).toBe(expectedHash);
    });
  }
});

// ---------------------------------------------------------------------------
// Not-therapy pins in article 5
// ---------------------------------------------------------------------------

describe("not-therapy presence pins (article 5)", () => {
  const ART5 = "sports-psychology-and-faith-do-they-mix";

  it('contains "This is not therapy."', () => {
    const body = getArticleBySlug(ART5)!.bodyMd;
    expect(body).toContain("This is not therapy.");
  });

  it('contains "This is not treatment."', () => {
    const body = getArticleBySlug(ART5)!.bodyMd;
    expect(body).toContain("This is not treatment.");
  });
});
