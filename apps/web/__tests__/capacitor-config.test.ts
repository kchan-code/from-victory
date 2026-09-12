import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * FV-483 / FV-572 regression guard.
 *
 * `appendUserAgent` is a TOP-LEVEL CapacitorConfig key (also available
 * per-platform under `android` / `ios`, where a per-platform value OVERRIDES
 * the top-level one for that platform only). It is NOT a key of `server`.
 * Capacitor silently ignores unknown keys inside `server`, so nesting it
 * there compiles, ships, and does nothing — which is exactly what happened
 * in FV-478: every server-side test passed while the shipped Android build
 * still rendered the marketing page with prices on its first screen. THAT
 * regression is what this file protects against, and it still applies with
 * two keys instead of one: either key nested inside `server` would silently
 * do nothing.
 *
 * FV-572 adds a SECOND, additive `ios.appendUserAgent` key — the iOS-only
 * StoreKit capability marker (FV-210 decision record §4.8). The ORIGINAL
 * FV-483 test asserted "exactly one `appendUserAgent` key"; that assertion
 * breaks BY DESIGN now that a second, intentionally-different, iOS-scoped
 * key exists. The fix is not to collapse back to one token (that would
 * silently break the whole iOS IAP capability signal) — it's to assert the
 * exact shape directly: two keys, pinned to their exact literal values, at
 * their exact locations, and nowhere else.
 *
 * `apps/native` has no node_modules and no typecheck script, so nothing in
 * CI compiles capacitor.config.ts against Capacitor's real types.
 *
 * This reads the config as SOURCE TEXT rather than importing it. Importing
 * it would pull `apps/native` into Next's typecheck graph, and
 * `@capacitor/cli` is not installed in the web workspace — that breaks
 * `next build` on Vercel (it did, on the first attempt at this guard).
 */
describe("capacitor.config — native shell UA token + iOS capability marker (FV-483 / FV-572)", () => {
  const BASE_TOKEN = "FVNativeShell/1";
  const IOS_TOKEN = "FVNativeShell/1 (ios)";

  const configSource = readFileSync(
    resolve(__dirname, "../../native/capacitor.config.ts"),
    "utf8",
  );

  /** Character range of a top-level `key: { ... }` block, via brace matching. */
  function blockRange(source: string, key: string): { start: number; end: number } {
    const start = source.indexOf(`${key}:`);
    expect(start, `capacitor.config.ts should declare a \`${key}\` block`).toBeGreaterThan(-1);
    const open = source.indexOf("{", start);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) return { start, end: i };
      }
    }
    throw new Error(`unbalanced braces in capacitor.config.ts \`${key}\` block`);
  }

  /** Every `appendUserAgent: "..."` occurrence, with its character offset. */
  function appendUserAgentOccurrences(
    source: string,
  ): Array<{ index: number; value: string }> {
    const results: Array<{ index: number; value: string }> = [];
    const pattern = /appendUserAgent\s*:\s*"([^"]*)"/g;
    for (const match of source.matchAll(pattern)) {
      const value = match[1];
      // reason: noUncheckedIndexedAccess — the regex's single capture group
      // always exists on a successful match, but TS can't know that.
      if (value === undefined) continue;
      expect(match.index, "regex match must report its offset").not.toBeUndefined();
      results.push({ index: match.index as number, value });
    }
    return results;
  }

  const serverRange = blockRange(configSource, "server");
  const iosRange = blockRange(configSource, "ios");
  const androidRange = blockRange(configSource, "android");
  const occurrences = appendUserAgentOccurrences(configSource);

  it("declares exactly two appendUserAgent keys: the global (Android + legacy-iOS) token and the iOS-only capability marker", () => {
    expect(occurrences).toHaveLength(2);
  });

  it("pins the GLOBAL appendUserAgent to the exact, byte-identical legacy token — Android depends on this string never changing, forever (FV-478/489/492/493)", () => {
    const globalOccurrence = occurrences.find(
      (o) => o.index < iosRange.start || o.index > iosRange.end,
    );
    expect(
      globalOccurrence,
      "expected exactly one appendUserAgent occurrence outside the `ios` block (the global/top-level key)",
    ).toBeDefined();
    expect(globalOccurrence?.value).toBe(BASE_TOKEN);
  });

  it("pins the iOS-scoped appendUserAgent override to the exact capability-marker string", () => {
    const iosOccurrence = occurrences.find(
      (o) => o.index > iosRange.start && o.index < iosRange.end,
    );
    expect(
      iosOccurrence,
      "expected an appendUserAgent occurrence inside the `ios` block",
    ).toBeDefined();
    expect(iosOccurrence?.value).toBe(IOS_TOKEN);
  });

  it("does NOT declare an android-scoped appendUserAgent override", () => {
    const androidOccurrence = occurrences.find(
      (o) => o.index > androidRange.start && o.index < androidRange.end,
    );
    expect(
      androidOccurrence,
      "android must keep receiving ONLY the top-level appendUserAgent — an android-scoped override is not part of this contract",
    ).toBeUndefined();
  });

  it("does NOT nest either appendUserAgent key inside `server`, where Capacitor ignores it (FV-478)", () => {
    for (const { index } of occurrences) {
      const nested = index > serverRange.start && index < serverRange.end;
      expect(
        nested,
        "appendUserAgent must sit at the top level of CapacitorConfig (or under android/ios), never inside `server` — nesting it there ships a silently inert build",
      ).toBe(false);
    }
  });

  it("keeps both tokens in sync with the server-side classifier", () => {
    // Three halves of one contract: the shell appends these tokens, the
    // server classifies on them. Change one side only and detection/
    // classification silently drifts. Read the source rather than
    // importing — lib/native-shell.ts is `server-only` and throws in this
    // environment.
    const detector = readFileSync(
      resolve(__dirname, "../lib/native-shell.ts"),
      "utf8",
    );
    expect(detector).toContain(BASE_TOKEN);
    expect(detector).toContain(IOS_TOKEN);
  });

  it("still does not allow navigation to any Stripe domain", () => {
    expect(
      configSource.slice(serverRange.start, serverRange.end).toLowerCase(),
    ).not.toContain("stripe.com");
  });
});

/**
 * FV-484 regression guard.
 *
 * On Android 15 (targetSdk 35, see apps/native/android/variables.gradle) the
 * OS enforces edge-to-edge windowing app-wide, so the Capacitor `StatusBar`
 * plugin's default (`overlaysWebView: true`) draws the WebView full-bleed
 * under the system status bar — the app header (logo, "Sign in" pill)
 * rendered underneath the clock/notification/battery icons. Explicitly
 * setting `overlaysWebView: false` tells Capacitor's Android bridge to pad
 * the WebView host view by the live system-bar inset instead, restoring a
 * reserved (non-overlaid) status bar strip on every device/cutout shape.
 *
 * This is deliberately a native-shell-only config key — no change to
 * apps/web's viewport meta or CSS was needed (or made), so browser and
 * installed-PWA rendering is unaffected. See capacitor.config.ts for the
 * full rationale.
 */
describe("capacitor.config — status bar does not overlay the WebView (FV-484)", () => {
  const configSource = readFileSync(
    resolve(__dirname, "../../native/capacitor.config.ts"),
    "utf8",
  );

  /** Character range of a top-level `key: { ... }` block, via brace matching. */
  function blockRange(source: string, key: string): { start: number; end: number } {
    const start = source.indexOf(`${key}:`);
    expect(start, `capacitor.config.ts should declare a \`${key}\` block`).toBeGreaterThan(-1);
    const open = source.indexOf("{", start);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") {
        depth -= 1;
        if (depth === 0) return { start, end: i };
      }
    }
    throw new Error(`unbalanced braces in capacitor.config.ts \`${key}\` block`);
  }

  it("sets StatusBar.overlaysWebView to false so the header clears the status bar", () => {
    const { start, end } = blockRange(configSource, "StatusBar");
    const block = configSource.slice(start, end);
    expect(
      block,
      "StatusBar.overlaysWebView must be false — the plugin default (true) lets the WebView draw under the Android system status bar once Android 15 edge-to-edge is enforced, colliding the app header with the clock/notification/battery icons (FV-484)",
    ).toMatch(/overlaysWebView\s*:\s*false/);
  });
});
