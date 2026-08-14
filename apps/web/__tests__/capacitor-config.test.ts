import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import capacitorConfig from "../../native/capacitor.config";

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
 * CI compiles capacitor.config.ts against Capacitor's real types. These
 * assertions are the guard that does.
 */
describe("capacitor.config — native shell UA token (FV-483)", () => {
  const SHELL_TOKEN = "FVNativeShell/1";

  it("exposes appendUserAgent at the top level, where Capacitor reads it", () => {
    expect(capacitorConfig.appendUserAgent).toBe(SHELL_TOKEN);
  });

  it("does NOT nest appendUserAgent under `server`, where it is ignored", () => {
    const server = capacitorConfig.server as Record<string, unknown> | undefined;
    expect(server?.appendUserAgent).toBeUndefined();
  });

  it("keeps the token in sync with the server-side detector", () => {
    // Two halves of one contract: the shell appends this token, the server
    // looks for it. Change one side only and detection silently dies — with
    // no failing test anywhere, which is how FV-478 shipped inert.
    // Read the source rather than importing it: lib/native-shell.ts is
    // `server-only`, which throws in this test environment.
    const source = readFileSync(
      resolve(__dirname, "../lib/native-shell.ts"),
      "utf8",
    );
    expect(source).toContain(SHELL_TOKEN);
    expect(source).toContain(String(capacitorConfig.appendUserAgent));
  });

  it("still does not allow navigation to any Stripe domain", () => {
    const allow = capacitorConfig.server?.allowNavigation ?? [];
    expect(allow.some((d) => d.toLowerCase().includes("stripe"))).toBe(false);
  });
});
