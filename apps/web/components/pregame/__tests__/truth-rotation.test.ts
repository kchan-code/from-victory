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
