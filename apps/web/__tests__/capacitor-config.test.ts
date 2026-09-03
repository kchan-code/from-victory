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

/**
 * FV-502 regression guard.
 *
 * With targetSdk 36 (Android 16, apps/native/android/variables.gradle) the OS
 * ignores `window.setStatusBarColor` entirely — the status-bar strip shows
 * whatever is drawn behind it. Capacitor 8's core SystemBars plugin paints
 * the decor from the active theme's `windowBackground` and styles the bar
 * icons from `plugins.SystemBars.style`; the legacy `StatusBar` keys no
 * longer control either on Android 15+. Both keys below are silent-failure
 * landmines of the same class as FV-478/FV-484: removing them compiles,
 * ships, and quietly renders a white status bar with invisible icons.
 */
describe("capacitor.config — Capacitor 8 system-bar keys (FV-502)", () => {
  const configSource = readFileSync(
    resolve(__dirname, "../../native/capacitor.config.ts"),
    "utf8",
  );

  it("keeps the top-level WebView backgroundColor at brand onyx", () => {
    // Top-level (not the SplashScreen/StatusBar copies): Bridge paints the
    // WebView itself with this. Match at line start to avoid the plugin
    // blocks' indented backgroundColor keys.
    expect(
      configSource,
      "top-level backgroundColor must stay #050505 — with targetSdk 36 the status-bar strip shows what is behind it, and a missing WebView background falls back to white",
    ).toMatch(/\n {2}backgroundColor: "#050505",/);
  });

  it("keeps SystemBars.style DARK so bar icons stay light on onyx", () => {
    const start = configSource.indexOf("SystemBars:");
    expect(start, "capacitor.config.ts should declare a `SystemBars` block").toBeGreaterThan(-1);
    const open = configSource.indexOf("{", start);
    let depth = 0;
    let end = -1;
    for (let i = open; i < configSource.length; i += 1) {
      if (configSource[i] === "{") depth += 1;
      else if (configSource[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    expect(end).toBeGreaterThan(-1);
    expect(
      configSource.slice(start, end),
      "plugins.SystemBars.style must be DARK — Capacitor 8's core SystemBars plugin (not the legacy StatusBar block) controls bar-icon appearance on Android 15+, and its default follows device day/night mode: dark icons, invisible against the onyx strip",
    ).toMatch(/style\s*:\s*"DARK"/);
  });
});
