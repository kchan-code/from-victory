// FV-126 — service-worker route → cache-strategy decision.
//
// Two responsibilities:
//   A) Unit-test the PURE function (apps/web/lib/sw/route-strategy.ts) across
//      every route class the SW distinguishes (audio clip, beds, pregame shell,
//      the bypass list, _next/static, icon/font, navigation, fall-through).
//   B) SYNC test: sw.js cannot import TS at runtime (static file, same reason
//      MANIFEST_VERSION is duplicated), so it carries a hand-mirrored copy of
//      decideStrategy. We extract that copy from the REAL sw.js source, execute
//      it, and assert it returns the IDENTICAL strategy as the TS source for
//      every case in a shared route table. This is what stops the two copies
//      from silently drifting.
//
// Node env, no browser APIs, no mocking.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  decideStrategy,
  type SwStrategy,
  type SwRouteInput,
  BYPASS_PREFIXES,
  PREGAME_PATH,
  ICON_OR_FONT_RE,
} from "@/lib/sw/route-strategy";

// ---------------------------------------------------------------------------
// Shared route table — the single set of cases both the TS function and the
// extracted sw.js copy are checked against. Each entry pins one route class.
//
// `expected` is the strategy the CURRENT sw.js produces (verified by reading
// the source in apps/web/public/sw.js). This is the behavior contract: a pure
// refactor, identical to the pre-FV-126 inline branch chain.
// ---------------------------------------------------------------------------
type Case = {
  name: string;
  input: SwRouteInput;
  expected: SwStrategy;
};

const CASES: Case[] = [
  // 0. cross-origin — never intercepted.
  {
    name: "cross-origin request → passthrough",
    input: { pathname: "/anything", isSameOrigin: false, isNavigate: false },
    expected: "passthrough",
  },
  {
    name: "cross-origin navigation → passthrough (origin checked first)",
    input: { pathname: "/", isSameOrigin: false, isNavigate: true },
    expected: "passthrough",
  },

  // 1a. /audio/pregame/* — audio cache-first.
  {
    name: "pregame clip mp3 → audio-cache-first",
    input: {
      pathname: "/audio/pregame/clips/viz-foo.ab12cd34.mp3",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "audio-cache-first",
  },
  {
    name: "pregame clips manifest json → audio-cache-first",
    input: {
      pathname: "/audio/pregame/manifest.json",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "audio-cache-first",
  },

  // 1a-ii. /audio/beds/* — same audio cache.
  {
    name: "music bed mp3 → audio-cache-first",
    input: {
      pathname: "/audio/beds/calm.deadbeef.mp3",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "audio-cache-first",
  },

  // 1b. /athlete/pregame — dedicated shell strategy (NOT bypassed).
  {
    name: "pregame shell navigation → pregame-shell-network-first",
    input: { pathname: "/athlete/pregame", isSameOrigin: true, isNavigate: true },
    expected: "pregame-shell-network-first",
  },
  {
    name: "pregame shell with trailing slash → pregame-shell-network-first",
    input: {
      pathname: "/athlete/pregame/",
      isSameOrigin: true,
      isNavigate: true,
    },
    expected: "pregame-shell-network-first",
  },
  {
    name: "pregame RSC fetch (not a navigation) → pregame-shell-network-first",
    input: {
      pathname: "/athlete/pregame",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "pregame-shell-network-first",
  },

  // 1c. bypass list — always network, never cached. One per prefix.
  {
    name: "/api/* → passthrough",
    input: { pathname: "/api/push/subscribe", isSameOrigin: true, isNavigate: false },
    expected: "passthrough",
  },
  {
    name: "/auth/* → passthrough",
    input: { pathname: "/auth/callback", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/athlete (bare) navigation → passthrough",
    input: { pathname: "/athlete", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/athlete/daily → passthrough (authenticated, never cached)",
    input: { pathname: "/athlete/daily", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/athlete/settings → passthrough",
    input: { pathname: "/athlete/settings", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/dashboard/* → passthrough",
    input: { pathname: "/dashboard/athletes", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/pair → passthrough",
    input: { pathname: "/pair", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/signin → passthrough",
    input: { pathname: "/signin", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/signup → passthrough",
    input: { pathname: "/signup", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/forgot-password → passthrough",
    input: { pathname: "/forgot-password", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/reset-password → passthrough",
    input: { pathname: "/reset-password", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "/subscribe → passthrough",
    input: { pathname: "/subscribe", isSameOrigin: true, isNavigate: true },
    expected: "passthrough",
  },
  {
    name: "non-pregame, non-beds /audio/* → passthrough (falls through)",
    input: { pathname: "/audio/other/file.mp3", isSameOrigin: true, isNavigate: false },
    expected: "passthrough",
  },

  // 2. /_next/static/* — cache-first.
  {
    name: "/_next/static/* chunk → cache-first",
    input: {
      pathname: "/_next/static/chunks/main-abc123.js",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "cache-first",
  },
  {
    name: "/_next/image (optimizer) is NOT cache-first — falls through",
    input: {
      pathname: "/_next/image",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "passthrough",
  },

  // 3. icon/font extensions — cache-first.
  {
    name: "icon png → cache-first",
    input: { pathname: "/icon-192.png", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },
  {
    name: "logo svg → cache-first",
    input: { pathname: "/logo-stacked.svg", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },
  {
    name: "favicon ico → cache-first",
    input: { pathname: "/favicon.ico", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },
  {
    name: "webmanifest → cache-first",
    input: {
      pathname: "/manifest.webmanifest",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "cache-first",
  },
  {
    name: "woff2 font → cache-first",
    input: {
      pathname: "/fonts/inter.woff2",
      isSameOrigin: true,
      isNavigate: false,
    },
    expected: "cache-first",
  },
  {
    name: "woff font → cache-first",
    input: { pathname: "/fonts/inter.woff", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },
  {
    name: "ttf font → cache-first",
    input: { pathname: "/fonts/inter.ttf", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },
  {
    name: "otf font → cache-first",
    input: { pathname: "/fonts/inter.otf", isSameOrigin: true, isNavigate: false },
    expected: "cache-first",
  },

  // 4. navigation — network-first + offline fallback.
  {
    name: "public navigation (/) → network-first-offline-fallback",
    input: { pathname: "/", isSameOrigin: true, isNavigate: true },
    expected: "network-first-offline-fallback",
  },
  {
    name: "privacy navigation → network-first-offline-fallback",
    input: { pathname: "/privacy", isSameOrigin: true, isNavigate: true },
    expected: "network-first-offline-fallback",
  },
  {
    name: "terms navigation → network-first-offline-fallback",
    input: { pathname: "/terms", isSameOrigin: true, isNavigate: true },
    expected: "network-first-offline-fallback",
  },
  {
    name: "offline navigation → network-first-offline-fallback",
    input: { pathname: "/offline", isSameOrigin: true, isNavigate: true },
    expected: "network-first-offline-fallback",
  },
  {
    name: "unknown navigation → network-first-offline-fallback",
    input: { pathname: "/some/new/page", isSameOrigin: true, isNavigate: true },
    expected: "network-first-offline-fallback",
  },

  // 5. everything else — passthrough.
  {
    name: "non-navigation, non-static, non-asset same-origin GET → passthrough",
    input: { pathname: "/some/data.js", isSameOrigin: true, isNavigate: false },
    expected: "passthrough",
  },
  {
    name: "root non-navigation request → passthrough (only navigations hit branch 4)",
    input: { pathname: "/", isSameOrigin: true, isNavigate: false },
    expected: "passthrough",
  },
];

// ---------------------------------------------------------------------------
// A) Pure function unit tests.
// ---------------------------------------------------------------------------
describe("decideStrategy (pure, lib/sw/route-strategy.ts)", () => {
  it.each(CASES)("$name", ({ input, expected }) => {
    expect(decideStrategy(input)).toBe(expected);
  });

  it("ordering: /athlete/pregame is decided before the /athlete bypass", () => {
    // Regression guard for the branch-order bug class: if the bypass loop ran
    // first, pregame would resolve to passthrough instead of its shell strategy.
    expect(
      decideStrategy({
        pathname: "/athlete/pregame",
        isSameOrigin: true,
        isNavigate: true,
      })
    ).toBe("pregame-shell-network-first");
    expect(
      decideStrategy({
        pathname: "/athlete",
        isSameOrigin: true,
        isNavigate: true,
      })
    ).toBe("passthrough");
  });

  it("ordering: /audio/pregame and /audio/beds are decided before the /audio/ bypass", () => {
    expect(
      decideStrategy({
        pathname: "/audio/pregame/x.mp3",
        isSameOrigin: true,
        isNavigate: false,
      })
    ).toBe("audio-cache-first");
    expect(
      decideStrategy({
        pathname: "/audio/beds/x.mp3",
        isSameOrigin: true,
        isNavigate: false,
      })
    ).toBe("audio-cache-first");
    expect(
      decideStrategy({
        pathname: "/audio/anything-else.mp3",
        isSameOrigin: true,
        isNavigate: false,
      })
    ).toBe("passthrough");
  });

  it("exported constants are the values the SW classification depends on", () => {
    expect(PREGAME_PATH).toBe("/athlete/pregame");
    expect(BYPASS_PREFIXES).toContain("/athlete");
    expect(BYPASS_PREFIXES).toContain("/audio/");
    expect(ICON_OR_FONT_RE.test("/icon-192.png")).toBe(true);
    expect(ICON_OR_FONT_RE.test("/_next/static/chunks/x.js")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// B) SYNC test — the sw.js runtime copy must match the TS source of truth.
//
// We pull the mirrored constants + decideStrategy function out of the real
// sw.js source and evaluate them in an isolated scope, producing a callable
// copy of the SW's decision logic. Then we run the SAME route table through
// both and assert byte-for-byte agreement.
// ---------------------------------------------------------------------------
const SW_PATH = path.resolve(__dirname, "..", "public", "sw.js");
const swSource = fs.readFileSync(SW_PATH, "utf8");

/** Pull a `const NAME = <...>;` declaration out of the sw.js source. */
function extractConst(name: string): string {
  // Matches `const NAME = ...;` up to the first semicolon that ends the value.
  // Our targets (BYPASS_PREFIXES array, ICON_OR_FONT_RE regex, PREGAME_PATH
  // string) all terminate cleanly at a `];` / `/;` / `";` so a non-greedy grab
  // to the first `;` at line-or-block end is safe.
  const re = new RegExp(`const ${name} =[\\s\\S]*?;\\n`, "m");
  const m = swSource.match(re);
  if (!m) throw new Error(`Could not extract const ${name} from sw.js`);
  return m[0];
}

/** Pull the `function decideStrategy(...) { ... }` block out of sw.js. */
function extractDecideStrategy(): string {
  const m = swSource.match(/function decideStrategy\([\s\S]*?\n}/m);
  if (!m) throw new Error("Could not extract decideStrategy from sw.js");
  return m[0];
}

/**
 * Build an executable copy of sw.js's decideStrategy. We inject the three
 * constants it closes over, then return the function. No SW globals are
 * referenced by decideStrategy, so this runs cleanly in node.
 */
function buildSwDecideStrategy(): (
  pathname: string,
  isSameOrigin: boolean,
  isNavigate: boolean
) => string {
  const body = [
    extractConst("PREGAME_PATH"),
    extractConst("BYPASS_PREFIXES"),
    extractConst("ICON_OR_FONT_RE"),
    extractDecideStrategy(),
    "return decideStrategy;",
  ].join("\n");
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  const factory = new Function(body) as () => (
    pathname: string,
    isSameOrigin: boolean,
    isNavigate: boolean
  ) => string;
  return factory();
}

describe("sw.js decideStrategy stays in sync with the TS source (FV-126)", () => {
  const swDecideStrategy = buildSwDecideStrategy();

  it("extracts a callable decideStrategy from the real sw.js source", () => {
    expect(typeof swDecideStrategy).toBe("function");
  });

  it.each(CASES)(
    "sw.js copy matches TS for: $name",
    ({ input, expected }) => {
      const fromSw = swDecideStrategy(
        input.pathname,
        input.isSameOrigin,
        input.isNavigate
      );
      // The sw.js copy and the TS function must BOTH return `expected`.
      expect(fromSw).toBe(expected);
      expect(fromSw).toBe(decideStrategy(input));
    }
  );

  it("sw.js BYPASS_PREFIXES equals the TS BYPASS_PREFIXES (same set, same order)", () => {
    // Reconstruct the array literal value from source and deep-compare.
    const decl = extractConst("BYPASS_PREFIXES");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const swArr = new Function(`${decl}\nreturn BYPASS_PREFIXES;`)() as string[];
    expect(swArr).toEqual([...BYPASS_PREFIXES]);
  });

  it("sw.js PREGAME_PATH equals the TS PREGAME_PATH", () => {
    const decl = extractConst("PREGAME_PATH");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const swVal = new Function(`${decl}\nreturn PREGAME_PATH;`)() as string;
    expect(swVal).toBe(PREGAME_PATH);
  });

  it("sw.js ICON_OR_FONT_RE source equals the TS ICON_OR_FONT_RE source", () => {
    const decl = extractConst("ICON_OR_FONT_RE");
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const swRe = new Function(`${decl}\nreturn ICON_OR_FONT_RE;`)() as RegExp;
    expect(swRe.source).toBe(ICON_OR_FONT_RE.source);
    expect(swRe.flags).toBe(ICON_OR_FONT_RE.flags);
  });
});
