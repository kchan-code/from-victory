import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import {
  ORGANIZATION_JSON_LD,
  SOFTWARE_APPLICATION_JSON_LD,
  sportWebPageJsonLd,
} from "@/components/landing/StructuredData";
import {
  CHRISTIAN_ATHLETE_APPS_EXCERPT,
  CHRISTIAN_ATHLETE_APPS_TITLE,
} from "@/lib/gtm/page-titles";

describe("SoftwareApplication JSON-LD (FV-504)", () => {
  it("keeps LifestyleApplication and names the 14-day trial", () => {
    expect(SOFTWARE_APPLICATION_JSON_LD.applicationCategory).toBe(
      "LifestyleApplication",
    );
    const offers = SOFTWARE_APPLICATION_JSON_LD.offers;
    expect(offers.some((o) => o.price === "0")).toBe(true);
    expect(offers.some((o) => o.description?.includes("14-day"))).toBe(true);
    expect(offers.map((o) => o.price)).toEqual(
      expect.arrayContaining(["5.00", "49.00", "3.00", "29.00"]),
    );
  });

  it("does not invent ratings or store URLs", () => {
    expect(SOFTWARE_APPLICATION_JSON_LD).not.toHaveProperty("aggregateRating");
    const serialized = JSON.stringify(SOFTWARE_APPLICATION_JSON_LD);
    expect(serialized).not.toMatch(/apps\.apple\.com|play\.google\.com/);
  });
});

const SPORT_SLUGS = [
  "hockey",
  "basketball",
  "golf",
  "football",
  "baseball",
  "lacrosse",
  "soccer",
] as const;

describe("sitemap (FV-504 / FV-506)", () => {
  it("includes all seven sport pages and 25 public URLs", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    for (const sport of SPORT_SLUGS) {
      expect(urls).toContain(`https://www.fromvictoryapp.com/${sport}`);
    }
    expect(urls).toHaveLength(25);
    expect(urls).not.toContain("https://www.fromvictoryapp.com/blog");
  });

  it("bumps lastmod on the refreshed marketing URLs to 2026-08-26", () => {
    const entries = sitemap();
    const hockey = entries.find((e) => e.url.endsWith("/hockey"));
    expect(hockey?.lastModified).toEqual(new Date("2026-08-26"));
    const home = entries.find((e) => e.url === "https://www.fromvictoryapp.com");
    expect(home?.lastModified).toEqual(new Date("2026-08-26"));
  });

  it("stamps the six new sport pages with the 2026-08-27 lastmod", () => {
    const entries = sitemap();
    for (const sport of SPORT_SLUGS.filter((s) => s !== "hockey")) {
      const entry = entries.find((e) => e.url.endsWith(`/${sport}`));
      expect(entry?.lastModified).toEqual(new Date("2026-08-27"));
    }
  });
});

describe("sport landing pages (FV-506)", () => {
  for (const sport of SPORT_SLUGS) {
    const page = readFileSync(
      resolve(__dirname, `../app/${sport}/page.tsx`),
      "utf8",
    );
    it(`/${sport} holds the audience-language pin and the brand close`, () => {
      expect(page).not.toMatch(/\bkids?\b/i);
      expect(page).not.toMatch(/\bkiddos?\b|\byoungsters?\b/i);
      expect(page).toContain(`canonical: "/${sport}"`);
      expect(page).toContain("Compete From Victory");
      expect(page).toContain("Hebrews 12:1");
    });
  }
});

describe("sport WebPage JSON-LD", () => {
  it("emits WebPage with existing Organization name + url only", () => {
    const schema = sportWebPageJsonLd({
      name: "Hockey Visualization Training for Athletes",
      description:
        "See the first shift before the puck drops. Goalie tracks the first shot. Hard moment named. Ages 13+. Compete From Victory.",
      path: "/hockey",
    });
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("WebPage");
    expect(schema.url).toBe("https://www.fromvictoryapp.com/hockey");
    expect(schema.publisher).toEqual({
      "@type": "Organization",
      name: ORGANIZATION_JSON_LD.name,
      url: ORGANIZATION_JSON_LD.url,
    });
    expect(Object.keys(schema.publisher)).toEqual(["@type", "name", "url"]);
    expect(schema).not.toHaveProperty("headline");
    expect(schema).not.toHaveProperty("datePublished");
    expect(schema).not.toHaveProperty("dateModified");
    expect(JSON.stringify(schema)).not.toMatch(/Biblica|Crossway|grant/i);
  });

  for (const sport of SPORT_SLUGS) {
    const page = readFileSync(
      resolve(__dirname, `../app/${sport}/page.tsx`),
      "utf8",
    );
    it(`/${sport} mounts SportWebPageJsonLd and does not add Article`, () => {
      expect(page).toContain("SportWebPageJsonLd");
      expect(page).toContain(`path="/${sport}"`);
      expect(page).toContain("name={PAGE_TITLE}");
      expect(page).toContain("description={PAGE_DESCRIPTION}");
      expect(page).not.toMatch(/"@type": "Article"/);
    });
  }
});

describe("homepage title/meta (FV-504 Partner bound)", () => {
  const layout = readFileSync(
    resolve(__dirname, "../app/layout.tsx"),
    "utf8",
  );
  const hero = readFileSync(
    resolve(__dirname, "../components/landing/Hero.tsx"),
    "utf8",
  );
  const hockey = readFileSync(
    resolve(__dirname, "../app/hockey/page.tsx"),
    "utf8",
  );

  it("leads with visualization + compete from victory, not a mindset-app ad title", () => {
    expect(layout).not.toMatch(/Christian Athlete Mindset App/);
    expect(layout).toMatch(/Visualize and Compete From Victory/);
    expect(layout).toMatch(/athletes 13\+/);
    expect(hero).not.toMatch(/Christian athlete mindset app/i);
    expect(hero).toMatch(/Visualize and compete/);
    expect(hero).toMatch(/from victory/i);
  });

  it("does not invent first-shift gap and keeps identity off the H1", () => {
    expect(hockey).not.toMatch(/first-shift gap/);
    expect(hockey).toContain("Your line is called");
    expect(hockey).toContain("Make the first save");
    expect(hero).not.toMatch(/Your identity is&nbsp;secure/);
    expect(hockey).not.toMatch(/\bkids?\b/i);
  });
});

describe("comparison page copy pins (FV-504)", () => {
  it("names the three SERP apps and does not claim public stores", () => {
    expect(CHRISTIAN_ATHLETE_APPS_TITLE).toContain("Faithful Athlete");
    expect(CHRISTIAN_ATHLETE_APPS_TITLE).toContain("Playbook Devotional");
    expect(CHRISTIAN_ATHLETE_APPS_TITLE).toContain("Core IV");
    expect(CHRISTIAN_ATHLETE_APPS_EXCERPT).toMatch(/Not in stores yet/);
    expect(CHRISTIAN_ATHLETE_APPS_EXCERPT).toMatch(/compete from victory/i);
  });
});

describe("llms.txt (FV-504)", () => {
  const llms = readFileSync(
    resolve(__dirname, "../public/llms.txt"),
    "utf8",
  );

  it("names the LLC, hockey dad, and what it is not", () => {
    expect(llms).toContain("From Victory LLC");
    expect(llms).toMatch(/hockey dad/i);
    expect(llms).toContain("Not therapy");
    expect(llms).toContain("Not a daily devotional");
    expect(llms).toContain("Not for anyone under 13");
    expect(llms).toContain("Not listed on the App Store or Google Play yet");
    expect(llms).not.toMatch(/Crossway|Biblica grant/i);
  });

  it("has short lift-able answers for the named moments", () => {
    expect(llms).toMatch(/Slump:/);
    expect(llms).toMatch(/Playing injured:/);
    expect(llms).toMatch(/Other side bigger/);
    expect(llms).toMatch(/Tired:/);
    expect(llms).toMatch(/Jealousy:/);
    expect(llms).toMatch(/Favoritism:/);
    expect(llms).toContain("/hockey");
  });
});
