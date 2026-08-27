import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { SOFTWARE_APPLICATION_JSON_LD } from "@/components/landing/StructuredData";
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

describe("sitemap (FV-504)", () => {
  it("includes /hockey and 17 public URLs", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://www.fromvictoryapp.com/hockey");
    expect(urls).toHaveLength(17);
    expect(urls).not.toContain("https://www.fromvictoryapp.com/blog");
  });

  it("bumps lastmod on the refreshed marketing URLs to 2026-08-26", () => {
    const entries = sitemap();
    const hockey = entries.find((e) => e.url.endsWith("/hockey"));
    expect(hockey?.lastModified).toEqual(new Date("2026-08-26"));
    const home = entries.find((e) => e.url === "https://www.fromvictoryapp.com");
    expect(home?.lastModified).toEqual(new Date("2026-08-26"));
  });
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
    expect(layout).toMatch(/See the First Moment\. Compete From Victory/);
    expect(layout).toMatch(/athletes 13\+/);
    expect(hero).not.toMatch(/Christian athlete mindset app/i);
    expect(hero).toMatch(/See the first/);
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
