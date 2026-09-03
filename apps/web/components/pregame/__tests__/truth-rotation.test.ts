// truth-rotation.test.ts — the {{truth}} slot's per-device rotation memory.
//
// Node env: `window` is undefined by default, which is exactly the SSR /
// storage-unavailable case the helpers must survive. A stubbed window with a
// fake localStorage covers the browser path.

import { afterEach, describe, expect, it, vi } from "vitest";

import { TRUTH_SLUGS } from "@/components/pregame/audio/truth-bank";
import {
  pickTruthIndex,
  readLastTruthSlug,
  rememberTruthSlug,
  truthSlugAtPlayhead,
} from "@/components/pregame/truth-rotation";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    _store: store,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pickTruthIndex", () => {
  it("always lands inside the bank", () => {
    for (const r of [0, 0.001, 0.5, 0.999, 0.9999999]) {
      const i = pickTruthIndex(() => r);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(TRUTH_SLUGS.length);
    }
  });

  it("clamps a random() that returns exactly 1", () => {
    expect(pickTruthIndex(() => 1)).toBe(TRUTH_SLUGS.length - 1);
  });
});

describe("last-truth memory", () => {
  it("is a no-op with no memory when window is undefined (SSR / node)", () => {
    expect(typeof window).toBe("undefined");
    expect(readLastTruthSlug()).toBeNull();
    expect(() => rememberTruthSlug("truth-03")).not.toThrow();
  });

  it("round-trips the slug through localStorage", () => {
    const ls = fakeStorage();
    vi.stubGlobal("window", { localStorage: ls });
    expect(readLastTruthSlug()).toBeNull();
    rememberTruthSlug("truth-07");
    expect(readLastTruthSlug()).toBe("truth-07");
    // Only the slug is persisted — no athlete data alongside it.
    expect([...ls._store.entries()]).toEqual([["fv_truth_last", "truth-07"]]);
  });

  it("ignores a stored value that is not a truth slug", () => {
    vi.stubGlobal("window", { localStorage: fakeStorage({ fv_truth_last: "garbage" }) });
    expect(readLastTruthSlug()).toBeNull();
  });

  it("swallows storage errors (blocked localStorage)", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("SecurityError");
      },
    });
    expect(readLastTruthSlug()).toBeNull();
    expect(() => rememberTruthSlug("truth-01")).not.toThrow();
  });
});

// FV-552 — rememberTruthSlug must fire on confirmed playback start of the
// truth clip, not at resolvePlaylist() time. truthSlugAtPlayhead is the pure
// decision helper the player's rAF loop consults each frame; these tests pin
// its behavior directly, with no localStorage/DOM/React involved.
describe("truthSlugAtPlayhead", () => {
  const CLIPS = [
    { slug: "opener-a", durationSec: 5 },
    { slug: "shared-opening", durationSec: 10 },
    { slug: "truth-07", durationSec: 4 },
    { slug: "identity-tail", durationSec: 20 },
  ];

  it("is null before the playhead reaches the truth clip's offset", () => {
    // Truth clip starts at 5 + 10 = 15s. Anything before that — including a
    // session that fails or is abandoned immediately after resolve (playhead
    // still at 0) — must not report the truth clip as played.
    expect(truthSlugAtPlayhead(CLIPS, 0)).toBeNull();
    expect(truthSlugAtPlayhead(CLIPS, 14.99)).toBeNull();
  });

  it("returns the truth slug once the playhead enters its segment", () => {
    expect(truthSlugAtPlayhead(CLIPS, 15)).toBe("truth-07");
    expect(truthSlugAtPlayhead(CLIPS, 17)).toBe("truth-07");
  });

  it("keeps returning the truth slug for the rest of the session (past its own clip)", () => {
    // Once played, later frames within the same session should still resolve
    // to the same slug — the caller's once-per-session guard is what stops
    // repeat writes, not this helper.
    expect(truthSlugAtPlayhead(CLIPS, 30)).toBe("truth-07");
  });

  it("is null for a session with no truth clip", () => {
    const noTruth = [
      { slug: "opener-a", durationSec: 5 },
      { slug: "shared-opening", durationSec: 10 },
    ];
    expect(truthSlugAtPlayhead(noTruth, 0)).toBeNull();
    expect(truthSlugAtPlayhead(noTruth, 100)).toBeNull();
  });

  it("is null for an empty clip list", () => {
    expect(truthSlugAtPlayhead([], 0)).toBeNull();
  });

  it("resolve-then-fail path: never advancing the playhead never yields a slug to remember", () => {
    // Models the bug: resolvePlaylist() succeeded (CLIPS exists) but the
    // session then failed (clip fetch/decode error, AudioContext unsupported,
    // timeout) before any audio played, so the playhead never left 0. The
    // caller (useClipPlayer's rAF loop) never runs — but even if it were
    // invoked once at t=0, the helper correctly reports "not yet" so
    // rememberTruthSlug is never called and fv_truth_last stays untouched.
    expect(truthSlugAtPlayhead(CLIPS, 0)).toBeNull();
  });
});
