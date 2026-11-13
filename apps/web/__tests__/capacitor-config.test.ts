import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";
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
 * FV-664 adds a THIRD, env-gated key: `android.appendUserAgent` =
 * "FVNativeShell/1 (play)", present ONLY when FV_PLAY_BILLING=1 (the one Play
 * Billing build switch; Gradle reads the same variable). The source-text
 * guards below pin WHERE it may sit; the runtime guards at the bottom of this
 * describe evaluate the config under both env states and pin the values.
 *
 * Most guards read the config as SOURCE TEXT rather than importing it. Importing
 * it would pull `apps/native` into Next's typecheck graph, and
 * `@capacitor/cli` is not installed in the web workspace — that breaks
 * `next build` on Vercel (it did, on the first attempt at this guard).
 */
describe("capacitor.config — native shell UA token + iOS capability marker (FV-483 / FV-572)", () => {
  const BASE_TOKEN = "FVNativeShell/1";
  const IOS_TOKEN = "FVNativeShell/1 (ios)";
  const PLAY_TOKEN = "FVNativeShell/1 (play)";

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

  it("declares exactly three appendUserAgent keys: the global token, the env-gated Android Play marker, and the iOS-only capability marker", () => {
    expect(occurrences).toHaveLength(3);
  });

  it("pins the GLOBAL appendUserAgent to the exact, byte-identical legacy token — Android depends on this string never changing, forever (FV-478/489/492/493)", () => {
    const globalOccurrence = occurrences.find(
      (o) =>
        (o.index < iosRange.start || o.index > iosRange.end) &&
        (o.index < androidRange.start || o.index > androidRange.end),
    );
    expect(
      globalOccurrence,
      "expected exactly one appendUserAgent occurrence outside the `ios` and `android` blocks (the global/top-level key)",
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

  it("only declares an android-scoped appendUserAgent behind the FV_PLAY_BILLING switch, with the exact Play marker", () => {
    const androidOccurrence = occurrences.find(
      (o) => o.index > androidRange.start && o.index < androidRange.end,
    );
    expect(
      androidOccurrence,
      "expected the gated Play marker inside the `android` block",
    ).toBeDefined();
    expect(androidOccurrence?.value).toBe(PLAY_TOKEN);
    // The key must be a conditional spread on the switch — never unconditional,
    // or every Android build (incl. 1.0.x-equivalent ones) would claim `(play)`.
    const lineStart = configSource.lastIndexOf("\n", androidOccurrence?.index ?? 0) + 1;
    expect(configSource.slice(lineStart, androidOccurrence?.index)).toMatch(
      /\.\.\.\(playBilling \? \{\s*$/,
    );
    expect(configSource).toMatch(/const playBilling = process\.env\.FV_PLAY_BILLING === "1";/);
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
    // FV-659 classifier half of the FV-664 marker.
    expect(detector).toContain(PLAY_TOKEN);
  });

  it("still does not allow navigation to any Stripe domain", () => {
    expect(
      configSource.slice(serverRange.start, serverRange.end).toLowerCase(),
    ).not.toContain("stripe.com");
  });

  /**
   * Evaluates the real config under a given FV_PLAY_BILLING value. The source
   * is transpiled with the TypeScript compiler (already a web devDependency)
   * and run in isolation, so nothing from apps/native enters the module graph
   * (see the import note above) and `@capacitor/cli` types are never needed
   * (the only import is type-only and erased).
   */
  function evaluateConfig(playBilling: string | undefined): {
    appendUserAgent?: string;
    server?: { allowNavigation?: string[] };
    android?: { appendUserAgent?: string };
    ios?: { appendUserAgent?: string };
  } {
    const { outputText } = ts.transpileModule(configSource, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const sandboxEnv: Record<string, string | undefined> = {
      CAPACITOR_SERVER_URL: undefined,
      FV_PLAY_BILLING: playBilling,
    };
    const moduleShim: { exports: { default?: unknown } } = { exports: {} };
    // reason: evaluating a transpiled config module in isolation needs the
    // Function constructor; the source is a checked-in repo file, not input.
    new Function("module", "exports", "process", outputText)(moduleShim, moduleShim.exports, {
      env: sandboxEnv,
    });
    return moduleShim.exports.default as ReturnType<typeof evaluateConfig>;
  }

  it("switch UNSET: Android gets NO android.appendUserAgent — it keeps the bare top-level token", () => {
    for (const unset of [undefined, "", "0", "true"]) {
      const config = evaluateConfig(unset);
      expect(config.appendUserAgent).toBe(BASE_TOKEN);
      expect(config.android).toBeDefined();
      expect(config.android).not.toHaveProperty("appendUserAgent");
    }
  });

  it("switch FV_PLAY_BILLING=1: android.appendUserAgent is exactly the Play marker; base token untouched", () => {
    const config = evaluateConfig("1");
    expect(config.appendUserAgent).toBe(BASE_TOKEN);
    expect(config.android?.appendUserAgent).toBe(PLAY_TOKEN);
  });

  it("the iOS marker and the Stripe-free allowNavigation are identical under both switch states", () => {
    for (const state of [undefined, "1"]) {
      const config = evaluateConfig(state);
      expect(config.ios?.appendUserAgent).toBe(IOS_TOKEN);
      const hosts = config.server?.allowNavigation ?? [];
      expect(hosts.length).toBeGreaterThan(0);
      for (const host of hosts) expect(host.toLowerCase()).not.toContain("stripe");
    }
  });

  it("keeps the Gradle side of the switch wired to the same env var and marker", () => {
    const gradle = readFileSync(
      resolve(__dirname, "../../native/android/app/build.gradle"),
      "utf8",
    );
    expect(gradle).toContain("System.getenv('FV_PLAY_BILLING')");
    expect(gradle).toContain(`'${PLAY_TOKEN}'`);
    expect(gradle).toContain("verifyPlayBillingSwitch");
    // The verifier compares the EFFECTIVE Android token by prefix, so a later
    // feature token appended after the capability marker (FV-569 UA format:
    // "FVNativeShell/1 (play) FVAuth/1") neither trips nor defeats it.
    expect(gradle).toContain("effectiveUa.startsWith(playToken + ' ')");
    expect(gradle).toContain("effectiveUa.contains('(play)')");
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

  it("the real config gives the four agreed tokens across FV_PLAY_BILLING x FV_SSO_STAGING_BUILD (FV-664 + FV-675 combined)", async () => {
    // No simulation here: both real switches are set and the real module is evaluated.
    const cases = [
      { play: undefined, sso: undefined, android: BASE_TOKEN, ios: IOS_TOKEN },
      { play: "1", sso: undefined, android: "FVNativeShell/1 (play)", ios: IOS_TOKEN },
      { play: undefined, sso: "1", android: "FVNativeShell/1 FVAuth/1", ios: "FVNativeShell/1 (ios) FVAuth/1" },
      { play: "1", sso: "1", android: "FVNativeShell/1 (play) FVAuth/1", ios: "FVNativeShell/1 (ios) FVAuth/1" },
    ];
    for (const c of cases) {
      vi.stubEnv("FV_PLAY_BILLING", c.play);
      const config = await loadConfig({ FV_SSO_STAGING_BUILD: c.sso });
      // The top-level token never changes; Android's EFFECTIVE token is the android key or it.
      expect(config.appendUserAgent).toBe(BASE_TOKEN);
      expect(config.android?.appendUserAgent ?? config.appendUserAgent).toBe(c.android);
      expect(config.ios?.appendUserAgent).toBe(c.ios);
      // Capability marker first, feature token after (agreed UA format).
      if (c.play === "1" && c.sso === "1") {
        const ua = config.android?.appendUserAgent ?? "";
        expect(ua.indexOf("(play)")).toBeLessThan(ua.indexOf("FVAuth/1"));
      }
    }
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
