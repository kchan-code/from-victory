import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * FV-483 regression guard.
 *
 * `appendUserAgent` is a TOP-LEVEL CapacitorConfig key (also available
 * per-platform under `android` / `ios`). It is NOT a key of `server`.
 * Capacitor silently ignores unknown keys inside `server`, so nesting it
 * there compiles, ships, and does nothing — which is exactly what happened
 * in FV-478: every server-side test passed while the shipped Android build
 * still rendered the marketing page with prices on its first screen.
 *
 * `apps/native` has no node_modules and no typecheck script, so nothing in
 * CI compiles capacitor.config.ts against Capacitor's real types.
 *
 * This reads the config as SOURCE TEXT rather than importing it. Importing
 * it would pull `apps/native` into Next's typecheck graph, and
 * `@capacitor/cli` is not installed in the web workspace — that breaks
 * `next build` on Vercel (it did, on the first attempt at this guard).
 */
describe("capacitor.config — native shell UA token (FV-483)", () => {
  const SHELL_TOKEN = "FVNativeShell/1";

  const configSource = readFileSync(
    resolve(__dirname, "../../native/capacitor.config.ts"),
    "utf8",
  );

  /** Character range of the `server: { ... }` block, via brace matching. */
  function serverBlockRange(source: string): { start: number; end: number } {
    const start = source.indexOf("server:");
    expect(start, "capacitor.config.ts should declare a `server` block").toBeGreaterThan(-1);
    const open = source.indexOf("{", start);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) return { start, end: i };
      }
    }
    throw new Error("unbalanced braces in capacitor.config.ts `server` block");
  }

  it("declares the shell token exactly once", () => {
    const hits = configSource.match(/appendUserAgent\s*:/g) ?? [];
    expect(hits).toHaveLength(1);
    expect(configSource).toContain(`appendUserAgent: "${SHELL_TOKEN}"`);
  });

  it("does NOT nest appendUserAgent inside `server`, where Capacitor ignores it", () => {
    const { start, end } = serverBlockRange(configSource);
    const at = configSource.indexOf("appendUserAgent");
    const nested = at > start && at < end;
    expect(
      nested,
      "appendUserAgent must sit at the top level of CapacitorConfig (or under android/ios), never inside `server` — nesting it there ships a silently inert build",
    ).toBe(false);
  });

  it("keeps the token in sync with the server-side detector", () => {
    // Two halves of one contract: the shell appends this token, the server
    // looks for it. Change one side only and detection silently dies.
    // Read the source rather than importing — lib/native-shell.ts is
    // `server-only` and throws in this environment.
    const detector = readFileSync(
      resolve(__dirname, "../lib/native-shell.ts"),
      "utf8",
    );
    expect(detector).toContain(SHELL_TOKEN);
  });

  it("still does not allow navigation to any Stripe domain", () => {
    const { start, end } = serverBlockRange(configSource);
    expect(configSource.slice(start, end).toLowerCase()).not.toContain("stripe.com");
  });
});
