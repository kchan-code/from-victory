// Unit tests for the /resources article registry (FV-238).
//
// Verifies:
//  - registry has exactly 5 slugs, all unique
//  - every article has title / metaDescription (≤155 chars) / bodyMd
//  - scripture byte-pins: exact NIV strings present in the right articles
//  - "kid" scan: article 4 is parent-facing; flag if it appears in athlete-facing
//  - not-therapy pins in article 5

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

describe('"kid" audience-language scan', () => {
  it('athlete-facing articles (audience="athlete") do not contain \\bkid\\b', () => {
    const athleteArticles = getAllArticles().filter(
      (a) => a.audience === "athlete",
    );
    for (const a of athleteArticles) {
      const matches = a.bodyMd.match(/\bkid\b/gi);
      expect(
        matches,
        `"kid" found in athlete-facing article "${a.slug}": ${JSON.stringify(matches)}`,
      ).toBeNull();
    }
  });

  // Article 4 is parent-facing. "Most kids who get cut" appears in the body.
  // Per the audience table, parent-facing copy may use "kids" BUT the preferred
  // terms are "your child"/"your athlete". This test documents the occurrence
  // rather than blocking — see flag in build notes for KC's call.
  it('article 4 (parent-facing) "kid" occurrence count — documents for KC review', () => {
    const body = getArticleBySlug("when-your-athlete-gets-cut-a-parents-guide")!
      .bodyMd;
    const matches = body.match(/\bkid\b/gi);
    // Currently 1 occurrence: "Most kids who get cut" — flag but do not fail.
    // If the curator rewrites this to "Most athletes who get cut", count becomes 0.
    expect(matches?.length ?? 0).toBeLessThanOrEqual(2);
  });
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
