// Unit tests for the positive-play taxonomy (FV-144) — pure data + helpers,
// no manifest/filesystem (the catalog-integrity guard lives in
// playlist-integrity.test.ts). These pin the per-role library shape and the
// lookup helpers the picker + Review row rely on.

import { describe, it, expect } from "vitest";

import {
  POSITIVE_PLAYS,
  MAX_POSITIVE_PLAYS,
  positivePlaysFor,
  positivePlayTitle,
} from "../positive-plays";
import { FLOW, INITIAL_STATE } from "../types";

// Expected counts per role, from FV-136 (docs/pregame-scripts.md §1) +
// FV-294 (golf roles: Bomber 7, Ball-Striker 7, Scrambler 7).
const EXPECTED_COUNTS: Record<string, number> = {
  Defense: 9,
  Forward: 10,
  Goalie: 9,
  Guard: 8,
  Wing: 8,
  Big: 8,
  Bomber: 7,
  "Ball-Striker": 7,
  Scrambler: 7,
  // Football (FV-423) — DORMANT until FV-206 wiring
  QB: 7,
  RB: 7,
  WR: 7,
  OL: 7,
  DL: 7,
  LB: 7,
  DB: 7,
};

describe("POSITIVE_PLAYS library", () => {
  it("has all 122 plays", () => {
    // 73 (hockey/basketball/golf) + 49 football (FV-423, dormant until FV-206)
    expect(POSITIVE_PLAYS).toHaveLength(122);
  });

  it("has no duplicate slugs", () => {
    const slugs = POSITIVE_PLAYS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every play has a non-empty title", () => {
    const blank = POSITIVE_PLAYS.filter((p) => p.title.trim().length === 0);
    expect(blank).toEqual([]);
  });

  it("matches the expected per-role counts", () => {
    const counts: Record<string, number> = {};
    for (const p of POSITIVE_PLAYS) counts[p.role] = (counts[p.role] ?? 0) + 1;
    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it("caps selection at 3 (KC by-ear, FV-144)", () => {
    expect(MAX_POSITIVE_PLAYS).toBe(3);
  });
});

describe("positivePlaysFor", () => {
  it("returns the role's plays in declared order", () => {
    const defense = positivePlaysFor("Defense");
    expect(defense).toHaveLength(9);
    expect(defense.every((p) => p.role === "Defense")).toBe(true);
    // First entry is the FV-136 flagship for Defense.
    expect(defense[0]!.slug).toBe("viz-defense-retrieval");
  });

  it("returns [] for a null role (no-position sports never reach the picker)", () => {
    expect(positivePlaysFor(null)).toEqual([]);
  });

  it("returns [] for an unknown role", () => {
    expect(positivePlaysFor("Striker")).toEqual([]);
  });
});

describe("positivePlayTitle", () => {
  it("returns the canonical title for a known slug", () => {
    expect(positivePlayTitle("viz-defense-walk-the-line")).toBe("Walk the blue line");
  });

  it("falls back to the slug itself for an unknown slug (never renders blank)", () => {
    expect(positivePlayTitle("viz-defense-not-real")).toBe("viz-defense-not-real");
  });
});

describe("FLOW — positivePlays step gating (FV-144)", () => {
  const step = FLOW.find((s) => s.id === "positivePlays");

  it("exists in the flow, slotted after Position and before Hard Moment", () => {
    expect(step).toBeDefined();
    const ids = FLOW.map((s) => s.id);
    expect(ids.indexOf("positivePlays")).toBeGreaterThan(ids.indexOf("position"));
    expect(ids.indexOf("positivePlays")).toBeLessThan(ids.indexOf("hardMoment"));
  });

  it("cannot advance with zero picks (none pre-picked → must choose ≥1)", () => {
    expect(step!.required(INITIAL_STATE)).toBe(false);
  });

  it("can advance once at least one play is picked", () => {
    expect(
      step!.required({ ...INITIAL_STATE, positivePlays: ["viz-forward-win-the-wall"] }),
    ).toBe(true);
  });
});
