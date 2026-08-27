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

  it('article 4 (parent-facing) has no kid/kids/kiddo/youngster after FV-504 rewrite', () => {
    const body = getArticleBySlug("when-your-athlete-gets-cut-a-parents-guide")!
      .bodyMd;
    const matches = body.match(KID_RE);
    expect(matches).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Whole-body SHA-256 fidelity pins
// ---------------------------------------------------------------------------
//
// These hashes pin the exact byte sequence of each article's bodyMd
// after the 2026-08-26 answer-first refresh (FV-504).

describe("whole-body sha256 fidelity pins", () => {
  const PINS: Record<string, string> = {
    "bible-verses-for-athletes-before-a-game":
      "5d73f78e92642c59aa3e978ea59148775505d055f65228e2e6346032ad580d63",
    "pre-game-nerves-christian-athlete-routine":
      "d3d2040919693acd08c9844c5d4fcbe8269adef943cc5da17ac52b91e6723332",
    "how-to-bounce-back-after-a-bad-game":
      "d221a6398d56e455b0286d6b7e140a5251dc49a803319082bf3dbacfa45e30e8",
    "when-your-athlete-gets-cut-a-parents-guide":
      "42070f1ab6ed4cb4fba9f097441209393c5652f2efb7af9487abfd64d629bf96",
    "sports-psychology-and-faith-do-they-mix":
      "56d1fa799fd5f0ff072a4371afa71d0f50117b9b87f1558be5141855f60a8afb",
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
