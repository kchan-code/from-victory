// SW pregame bypass regression guard (FV-107).
//
// The service worker must NOT list /athlete/pregame in its all-network bypass
// (section "1c. NEVER cache — always network"). That path was moved to a
// dedicated network-first + cache strategy (section 1b) so the pregame UI can
// be served offline once the athlete has visited the route online.
//
// We read the REAL sw.js source and verify:
//   1. The 1c bypass section does NOT contain /athlete/pregame as a startsWith
//      argument — preventing accidental regression.
//   2. The 1c bypass section DOES still contain "/athlete" as a prefix
//      catch-all (other /athlete/* routes remain bypassed).
//   3. sw.js defines the PREGAME_PATH constant and pregameShellNetworkFirst
//      function (the dedicated offline strategy exists).
//   4. sw.js bumped CACHE_VERSION to fv-shell-v3 (stale v2 pregame cache
//      is evicted at activate).
//
// Node env, no browser APIs, no mocking.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// __dirname resolves to apps/web/__tests__
const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const source = fs.readFileSync(SW_PATH, "utf8");

// Extract section 1c (the "NEVER cache — always network" bypass block).
// The section starts at "1c. NEVER cache" and ends just before "---- 2."
const noCacheBlockMatch = source.match(
  /\/\/ ---- 1c\. NEVER cache[\s\S]*?(?=\/\/ ---- 2\.)/
);

describe("SW pregame bypass (FV-107)", () => {
  it("can find the 1c NEVER-cache bypass block in sw.js", () => {
    // If this fails, the section 1c marker changed — update the regex above.
    expect(noCacheBlockMatch).not.toBeNull();
  });

  it("bypass block does NOT include /athlete/pregame as a startsWith argument", () => {
    // If /athlete/pregame appears as a startsWith() call inside section 1c,
    // the FV-107 offline strategy has been accidentally reverted.
    if (!noCacheBlockMatch) return; // skip if block not found (prior test fails)
    const block = noCacheBlockMatch[0];

    // Only look at lines that call startsWith() — not comments.
    const startswithLines = block
      .split("\n")
      .filter((l) => l.includes("startsWith("))
      .join("\n");

    expect(startswithLines).not.toContain('"/athlete/pregame"');
    expect(startswithLines).not.toContain("'/athlete/pregame'");
  });

  it("bypass block still includes /athlete prefix (other athlete routes remain bypassed)", () => {
    if (!noCacheBlockMatch) return;
    const block = noCacheBlockMatch[0];
    // /athlete as a startsWith call must still exist to protect dashboard,
    // daily, practice, and other authenticated athlete pages.
    expect(block).toContain('startsWith("/athlete")');
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
});
