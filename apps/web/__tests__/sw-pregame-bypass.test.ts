// SW pregame bypass regression guard (FV-107; updated for FV-126).
//
// The service worker must NOT list /athlete/pregame in its all-network bypass
// (the "1c. NEVER cache — always network" classification). That path has a
// dedicated network-first + cache strategy so the pregame UI can be served
// offline once the athlete has visited the route online.
//
// FV-126 extracted the route→strategy decision into a pure function
// (apps/web/lib/sw/route-strategy.ts) that sw.js mirrors. The bypass list is
// now the BYPASS_PREFIXES constant. We read the REAL sw.js source and verify:
//   1. BYPASS_PREFIXES does NOT contain "/athlete/pregame".
//   2. BYPASS_PREFIXES DOES still contain "/athlete" (other /athlete/* routes
//      remain bypassed / never cached).
//   3. sw.js defines the PREGAME_PATH constant and pregameShellNetworkFirst
//      function (the dedicated offline strategy exists).
//   4. sw.js bumped CACHE_VERSION to fv-shell-v3 (stale v2 pregame cache
//      is evicted at activate).
//
// We ALSO assert the behavior directly against the pure function so the intent
// (pregame is NOT bypassed; other /athlete/* IS) is pinned independent of how
// sw.js spells the bypass list.
//
// Node env, no browser APIs, no mocking.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { decideStrategy, BYPASS_PREFIXES } from "@/lib/sw/route-strategy";

// __dirname resolves to apps/web/__tests__
const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const source = fs.readFileSync(SW_PATH, "utf8");

// Extract the BYPASS_PREFIXES array literal from sw.js source. The decision is
// "1c. NEVER cache — always network": a logical OR of pathname.startsWith().
const bypassBlockMatch = source.match(
  /const BYPASS_PREFIXES = \[([\s\S]*?)\];/
);

describe("SW pregame bypass (FV-107 / FV-126)", () => {
  it("can find the BYPASS_PREFIXES array in sw.js", () => {
    // If this fails, the bypass list moved/renamed — update the regex above.
    expect(bypassBlockMatch).not.toBeNull();
  });

  it("BYPASS_PREFIXES does NOT include /athlete/pregame", () => {
    // If /athlete/pregame appears in the bypass list, the FV-107 offline
    // strategy has been accidentally reverted.
    if (!bypassBlockMatch) return; // skip if block not found (prior test fails)
    const block = bypassBlockMatch[1] ?? "";
    expect(block).not.toContain('"/athlete/pregame"');
    expect(block).not.toContain("'/athlete/pregame'");
  });

  it("BYPASS_PREFIXES still includes /athlete (other athlete routes remain bypassed)", () => {
    if (!bypassBlockMatch) return;
    const block = bypassBlockMatch[1] ?? "";
    // "/athlete" must still be present so dashboard, daily, practice, and other
    // authenticated athlete pages are never cached.
    expect(block).toContain('"/athlete"');
  });

  it("sw.js defines PREGAME_PATH constant (the dedicated offline strategy exists)", () => {
    // Guard against the new pregame-specific strategy being deleted in future edits.
    expect(source).toContain("PREGAME_PATH");
    expect(source).toContain("pregameShellNetworkFirst");
  });

  it("sw.js bumped CACHE_VERSION to fv-shell-v3 (stale v2 pregame cache is evicted)", () => {
    // The cache version must be bumped when adding new cached routes so stale
    // pregame shell entries from the v2 cache are evicted on the next deploy.
    expect(source).toContain('"fv-shell-v3"');
  });

  it("pregameShellNetworkFirst guards against Set-Cookie before caching", () => {
    // Verify the privacy backstop: the function must check for set-cookie
    // before writing to cache (prevents caching auth-bearing responses).
    const fnMatch = source.match(
      /async function pregameShellNetworkFirst[\s\S]*?^}/m
    );
    expect(fnMatch).not.toBeNull();
    if (!fnMatch) return;
    expect(fnMatch[0]).toContain("set-cookie");
  });

  // --- Behavior pinned against the pure function (FV-126) -------------------

  it("pregame route resolves to the dedicated shell strategy, NOT passthrough", () => {
    expect(
      decideStrategy({
        pathname: "/athlete/pregame",
        isSameOrigin: true,
        isNavigate: true,
      })
    ).toBe("pregame-shell-network-first");
  });

  it("other /athlete/* routes resolve to passthrough (never cached)", () => {
    for (const p of ["/athlete", "/athlete/daily", "/athlete/practice"]) {
      expect(
        decideStrategy({ pathname: p, isSameOrigin: true, isNavigate: true })
      ).toBe("passthrough");
    }
  });

  it("/athlete IS one of the exported bypass prefixes", () => {
    expect(BYPASS_PREFIXES).toContain("/athlete");
    expect(BYPASS_PREFIXES).not.toContain("/athlete/pregame");
  });
});
