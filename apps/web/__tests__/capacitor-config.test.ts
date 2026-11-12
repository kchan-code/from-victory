import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("keeps the Android WebView backgroundColor at brand onyx, Android-scoped", () => {
    // Inside the `android` block (CapConfig reads android.backgroundColor ??
    // backgroundColor): Bridge paints the WebView itself with this.
    const start = configSource.indexOf("\n  android: {");
    expect(start, "capacitor.config.ts should declare an `android` block").toBeGreaterThan(-1);
    const block = configSource.slice(start, configSource.indexOf("\n  },", start));
    expect(
      block,
      "android.backgroundColor must stay #050505 — with targetSdk 36 the status-bar strip shows what is behind it, and a missing WebView background falls back to white",
    ).toMatch(/\n {4}backgroundColor: "#050505",/);
  });

  it("does not set a top-level backgroundColor (would repaint the live iOS WebView)", () => {
    expect(configSource).not.toMatch(/\n {2}backgroundColor:/);
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

/**
 * FV-675 (SSO P0) staging switch guard.
 *
 * `FV_SSO_STAGING_BUILD=1` at `cap sync` time produces a STAGING shell that
 * advertises the FVAuth plugin (`FVAuth/1`), lets the WebView stay on the
 * staging site, and tells the native plugin to accept the staging hosts. With
 * the env unset — every production build — the exported config must be the
 * unchanged production config: no `FVAuth/1`, no `android` UA override, the
 * production allowNavigation list, no `plugins.FVAuth` (FV-620 C1 owns the
 * production Android override and lands first; FV-569 spec §13a).
 *
 * Unlike the source-text guards above, this EVALUATES the config, because the
 * switch is runtime logic. The import specifier is a variable so `tsc` does
 * not pull apps/native (and `@capacitor/cli`'s types) into the web typecheck
 * graph; the config's only import is `import type`, which the transform
 * erases, so nothing from `@capacitor/cli` is loaded at runtime either.
 */
describe("capacitor.config — FV_SSO_STAGING_BUILD switch (FV-675)", () => {
  interface EvaluatedConfig {
    appendUserAgent?: string;
    server?: { url?: string; allowNavigation?: string[] };
    plugins?: Record<string, unknown>;
    android?: { appendUserAgent?: string } & Record<string, unknown>;
    ios?: { appendUserAgent?: string } & Record<string, unknown>;
  }

  const BASE_TOKEN = "FVNativeShell/1";
  const IOS_TOKEN = "FVNativeShell/1 (ios)";
  const PRODUCTION_NAVIGATION = ["www.fromvictoryapp.com", "fromvictoryapp.com"];
  const configPath = resolve(__dirname, "../../native/capacitor.config.ts");

  async function loadConfig(env: { FV_SSO_STAGING_BUILD?: string }): Promise<EvaluatedConfig> {
    vi.resetModules();
    vi.stubEnv(
      "CAPACITOR_SERVER_URL",
      env.FV_SSO_STAGING_BUILD === "1" ? "https://fv-android-staging-web.vercel.app" : undefined,
    );
    vi.stubEnv("FV_SSO_STAGING_BUILD", env.FV_SSO_STAGING_BUILD);
    const mod = (await import(/* @vite-ignore */ configPath)) as { default: EvaluatedConfig };
    // Deep copy so one evaluation can never alias another's arrays/objects.
    return JSON.parse(JSON.stringify(mod.default)) as EvaluatedConfig;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("env=1 with a production server URL refuses to build (spec §13a)", async () => {
    vi.resetModules();
    vi.stubEnv("CAPACITOR_SERVER_URL", undefined);
    vi.stubEnv("FV_SSO_STAGING_BUILD", "1");
    await expect(import(/* @vite-ignore */ configPath)).rejects.toThrow(/requires CAPACITOR_SERVER_URL/);
    vi.resetModules();
    vi.stubEnv("CAPACITOR_SERVER_URL", "https://www.fromvictoryapp.com");
    await expect(import(/* @vite-ignore */ configPath)).rejects.toThrow(/requires CAPACITOR_SERVER_URL/);
  });

  it("env unset: the production config, unchanged", async () => {
    const config = await loadConfig({});
    expect(JSON.stringify(config)).not.toContain("FVAuth");
    expect(config.appendUserAgent).toBe(BASE_TOKEN);
    expect(config.ios?.appendUserAgent).toBe(IOS_TOKEN);
    expect(config.android?.appendUserAgent).toBeUndefined();
    expect(config.server?.url).toBe("https://www.fromvictoryapp.com");
    expect(config.server?.allowNavigation).toEqual(PRODUCTION_NAVIGATION);
    expect(config.plugins).not.toHaveProperty("FVAuth");
  });

  it.each(["0", "true", "yes", ""])(
    'only the exact value "1" flips the switch (%j → production)',
    async (value) => {
      const unset = await loadConfig({});
      expect(await loadConfig({ FV_SSO_STAGING_BUILD: value })).toEqual(unset);
    },
  );

  it("env=1: appends FVAuth/1 to each platform's effective UA; the top-level token never changes", async () => {
    const unset = await loadConfig({});
    const staging = await loadConfig({ FV_SSO_STAGING_BUILD: "1" });
    expect(staging.appendUserAgent).toBe(BASE_TOKEN);
    expect(staging.ios?.appendUserAgent).toBe("FVNativeShell/1 (ios) FVAuth/1");
    // Android's effective token + the marker. Today (before FV-620 C1) that is
    // the bare token; once C1's `(play)` override lands it becomes
    // "FVNativeShell/1 (play) FVAuth/1" with no change to the switch.
    expect(staging.android?.appendUserAgent).toBe(
      `${unset.android?.appendUserAgent ?? BASE_TOKEN} FVAuth/1`,
    );
    if (unset.android?.appendUserAgent === undefined) {
      expect(staging.android?.appendUserAgent).toBe("FVNativeShell/1 FVAuth/1");
    }
  });

  it("env=1: adds only the staging web host to allowNavigation — no Stripe, no Supabase", async () => {
    const staging = await loadConfig({ FV_SSO_STAGING_BUILD: "1" });
    expect(staging.server?.allowNavigation).toEqual([
      ...PRODUCTION_NAVIGATION,
      "fv-android-staging-web.vercel.app",
    ]);
    for (const host of staging.server?.allowNavigation ?? []) {
      expect(host.toLowerCase()).not.toContain("stripe");
      expect(host.toLowerCase()).not.toContain("supabase");
    }
  });

  it("env=1: selects the native staging allow-list via plugins.FVAuth", async () => {
    const staging = await loadConfig({ FV_SSO_STAGING_BUILD: "1" });
    expect(staging.plugins?.FVAuth).toEqual({ stagingHosts: true });
  });

  it("composes with a platform-token switch: appends FVAuth/1 to whatever Android/iOS token is in effect (FV-664 (play))", async () => {
    vi.resetModules();
    vi.stubEnv("FV_SSO_STAGING_BUILD", undefined);
    const mod = (await import(/* @vite-ignore */ configPath)) as {
      default: EvaluatedConfig;
      withSsoStagingBuild: (base: EvaluatedConfig) => EvaluatedConfig;
    };
    const base = JSON.parse(JSON.stringify(mod.default)) as EvaluatedConfig;
    // Simulates FV-664's FV_PLAY_BILLING branch having run first.
    const play: EvaluatedConfig = {
      ...base,
      android: { ...base.android, appendUserAgent: "FVNativeShell/1 (play)" },
    };
    const composed = mod.withSsoStagingBuild(play);
    expect(composed.android?.appendUserAgent).toBe("FVNativeShell/1 (play) FVAuth/1");
    expect(composed.ios?.appendUserAgent).toBe("FVNativeShell/1 (ios) FVAuth/1");
    expect(composed.appendUserAgent).toBe(BASE_TOKEN);
    // A platform with no override falls back to the global token.
    const noIos: EvaluatedConfig = { ...base, ios: { ...base.ios, appendUserAgent: undefined } };
    expect(mod.withSsoStagingBuild(noIos).ios?.appendUserAgent).toBe("FVNativeShell/1 FVAuth/1");
  });

  it("env=1: nothing else differs from the production config", async () => {
    const unset = await loadConfig({});
    const staging = await loadConfig({ FV_SSO_STAGING_BUILD: "1" });
    const stripped = JSON.parse(JSON.stringify(staging)) as EvaluatedConfig;
    delete stripped.plugins?.FVAuth;
    expect(staging.server?.url).toBe("https://fv-android-staging-web.vercel.app");
    if (stripped.server) {
      stripped.server.allowNavigation = unset.server?.allowNavigation;
      stripped.server.url = unset.server?.url; // the required staging server URL
    }
    if (stripped.ios) stripped.ios.appendUserAgent = unset.ios?.appendUserAgent;
    if (stripped.android) {
      if (unset.android?.appendUserAgent === undefined) delete stripped.android.appendUserAgent;
      else stripped.android.appendUserAgent = unset.android.appendUserAgent;
    }
    expect(stripped).toEqual(unset);
  });
});
