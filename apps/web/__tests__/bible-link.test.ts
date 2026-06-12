// Tests for the YouVersion/bible.com URL generator (FV-221).
// Verifies: NIV version ID, USFM book codes, chapter:verse, verse ranges,
// numbered books, and graceful null returns for unrecognised refs.

import { describe, it, expect } from "vitest";

import { bibleLink } from "@/lib/daily/bible-link";

const BASE = "https://www.bible.com/bible/111";

describe("bibleLink", () => {
  it("returns null for empty / blank input", () => {
    expect(bibleLink("")).toBeNull();
    expect(bibleLink("   ")).toBeNull();
  });

  it("returns null for refs missing chapter:verse", () => {
    expect(bibleLink("Romans")).toBeNull();
    expect(bibleLink("Romans 8")).toBeNull();
  });

  it("returns null for unknown books", () => {
    expect(bibleLink("Maccabees 1:1")).toBeNull();
    expect(bibleLink("Enoch 5:3")).toBeNull();
  });

  // Single-verse refs
  it("Romans 8:37 → ROM.8.37.NIV", () => {
    expect(bibleLink("Romans 8:37")).toBe(`${BASE}/ROM.8.37.NIV`);
  });

  it("John 21:21 → JHN.21.21.NIV", () => {
    expect(bibleLink("John 21:21")).toBe(`${BASE}/JHN.21.21.NIV`);
  });

  it("Hebrews 12:11 → HEB.12.11.NIV", () => {
    expect(bibleLink("Hebrews 12:11")).toBe(`${BASE}/HEB.12.11.NIV`);
  });

  // Verse ranges
  it("Hebrews 12:1-2 → HEB.12.1-2.NIV", () => {
    expect(bibleLink("Hebrews 12:1-2")).toBe(`${BASE}/HEB.12.1-2.NIV`);
  });

  it("Ephesians 1:4-5 → EPH.1.4-5.NIV", () => {
    expect(bibleLink("Ephesians 1:4-5")).toBe(`${BASE}/EPH.1.4-5.NIV`);
  });

  it("1 Corinthians 9:24-25 → 1CO.9.24-25.NIV", () => {
    expect(bibleLink("1 Corinthians 9:24-25")).toBe(`${BASE}/1CO.9.24-25.NIV`);
  });

  // Numbered books
  it("2 Timothy 1:7 → 2TI.1.7.NIV", () => {
    expect(bibleLink("2 Timothy 1:7")).toBe(`${BASE}/2TI.1.7.NIV`);
  });

  it("1 Peter 5:7 → 1PE.5.7.NIV", () => {
    expect(bibleLink("1 Peter 5:7")).toBe(`${BASE}/1PE.5.7.NIV`);
  });

  it("1 John 1:9 → 1JN.1.9.NIV", () => {
    expect(bibleLink("1 John 1:9")).toBe(`${BASE}/1JN.1.9.NIV`);
  });

  it("1 John 4:18 → 1JN.4.18.NIV", () => {
    expect(bibleLink("1 John 4:18")).toBe(`${BASE}/1JN.4.18.NIV`);
  });

  // Psalm / Psalms (both spellings)
  it("Psalm 139:1-3 → PSA.139.1-3.NIV", () => {
    expect(bibleLink("Psalm 139:1-3")).toBe(`${BASE}/PSA.139.1-3.NIV`);
  });

  it("Psalms 27:1 → PSA.27.1.NIV", () => {
    expect(bibleLink("Psalms 27:1")).toBe(`${BASE}/PSA.27.1.NIV`);
  });

  // Other seed refs
  it("Colossians 3:23-24 → COL.3.23-24.NIV", () => {
    expect(bibleLink("Colossians 3:23-24")).toBe(`${BASE}/COL.3.23-24.NIV`);
  });

  it("Zechariah 4:10 → ZEC.4.10.NIV", () => {
    expect(bibleLink("Zechariah 4:10")).toBe(`${BASE}/ZEC.4.10.NIV`);
  });

  it("Zephaniah 3:17 → ZEP.3.17.NIV", () => {
    expect(bibleLink("Zephaniah 3:17")).toBe(`${BASE}/ZEP.3.17.NIV`);
  });

  it("Philippians 4:6-7 → PHP.4.6-7.NIV", () => {
    expect(bibleLink("Philippians 4:6-7")).toBe(`${BASE}/PHP.4.6-7.NIV`);
  });

  it("Lamentations 3:22-23 → LAM.3.22-23.NIV", () => {
    expect(bibleLink("Lamentations 3:22-23")).toBe(
      `${BASE}/LAM.3.22-23.NIV`,
    );
  });

  it("Galatians 6:9 → GAL.6.9.NIV", () => {
    expect(bibleLink("Galatians 6:9")).toBe(`${BASE}/GAL.6.9.NIV`);
  });

  it("Joshua 1:9 → JOS.1.9.NIV", () => {
    expect(bibleLink("Joshua 1:9")).toBe(`${BASE}/JOS.1.9.NIV`);
  });

  it("Luke 16:10 → LUK.16.10.NIV", () => {
    expect(bibleLink("Luke 16:10")).toBe(`${BASE}/LUK.16.10.NIV`);
  });

  it("Mark 10:43-45 → MRK.10.43-45.NIV", () => {
    expect(bibleLink("Mark 10:43-45")).toBe(`${BASE}/MRK.10.43-45.NIV`);
  });
});
