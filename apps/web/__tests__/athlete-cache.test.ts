/**
 * Unit tests for lib/pregame/athlete-cache.ts (FV-154)
 *
 * Exercises: read, write, clear, and the typeof-window SSR guard.
 * Runs in Node (vitest default env) with a minimal localStorage stub.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  readAthleteCache,
  writeAthleteCache,
  clearAthleteCache,
  ATHLETE_CACHE_KEY,
} from "../lib/pregame/athlete-cache";

// ---------------------------------------------------------------------------
// Minimal localStorage stub for Node environment
// ---------------------------------------------------------------------------

const store: Record<string, string> = {};

const localStorageStub = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    for (const k of Object.keys(store)) {
      delete store[k];
    }
  },
};

// Attach localStorage stub to the global object so the module's
// `typeof window !== "undefined"` guard passes and the localStorage
// calls succeed.
beforeEach(() => {
  // Clear between tests
  localStorageStub.clear();
  // Attach window + localStorage stubs
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageStub },
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageStub,
    writable: true,
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// readAthleteCache
// ---------------------------------------------------------------------------

describe("readAthleteCache", () => {
  it("returns null when the key is absent", () => {
    expect(readAthleteCache()).toBeNull();
  });

  it("returns null when the stored value is invalid JSON", () => {
    localStorageStub.setItem(ATHLETE_CACHE_KEY, "{bad json}");
    expect(readAthleteCache()).toBeNull();
  });

  it("returns null when sport is an unrecognised value", () => {
    // "curling" is not (and is never expected to be) a Sport union member —
    // unlike "football", which went live in SUPPORTED_SPORTS via FV-206 and
    // would now be a valid cached value.
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "curling", firstName: "Alex" }),
    );
    expect(readAthleteCache()).toBeNull();
  });

  it("returns null when firstName is missing", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey" }),
    );
    expect(readAthleteCache()).toBeNull();
  });

  it("returns the cached value for hockey", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey", firstName: "Jordan" }),
    );
    expect(readAthleteCache()).toEqual({ sport: "hockey", firstName: "Jordan" });
  });

  it("returns the cached value for basketball", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "basketball", firstName: "Sam" }),
    );
    expect(readAthleteCache()).toEqual({ sport: "basketball", firstName: "Sam" });
  });
});

// ---------------------------------------------------------------------------
// writeAthleteCache + readAthleteCache round-trip
// ---------------------------------------------------------------------------

describe("writeAthleteCache", () => {
  it("writes a value that readAthleteCache returns", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Taylor" });
    expect(readAthleteCache()).toEqual({ sport: "hockey", firstName: "Taylor" });
  });

  it("overwrites an existing cached value", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Jordan" });
    writeAthleteCache({ sport: "basketball", firstName: "Alex" });
    expect(readAthleteCache()).toEqual({ sport: "basketball", firstName: "Alex" });
  });
});

// ---------------------------------------------------------------------------
// clearAthleteCache
// ---------------------------------------------------------------------------

describe("clearAthleteCache", () => {
  it("removes the key so readAthleteCache returns null", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Jordan" });
    // Confirm it's there
    expect(readAthleteCache()).not.toBeNull();
    // Clear
    clearAthleteCache();
    // Should be gone
    expect(readAthleteCache()).toBeNull();
  });

  it("is a no-op when the key does not exist", () => {
    // Should not throw even when nothing to clear
    expect(() => clearAthleteCache()).not.toThrow();
    expect(readAthleteCache()).toBeNull();
  });

  it("removes only the fv_athlete_cache key, not other keys", () => {
    localStorageStub.setItem("other_key", "other_value");
    writeAthleteCache({ sport: "hockey", firstName: "Jordan" });
    clearAthleteCache();
    // Athlete cache is gone
    expect(readAthleteCache()).toBeNull();
    // Other key is untouched
    expect(localStorageStub.getItem("other_key")).toBe("other_value");
  });
});

// ---------------------------------------------------------------------------
// SSR guard: functions must be no-ops when window is undefined
// ---------------------------------------------------------------------------

describe("SSR guard (typeof window === undefined)", () => {
  it("readAthleteCache returns null without window", () => {
    // Temporarily remove window
    const savedWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(readAthleteCache()).toBeNull();

    // Restore
    Object.defineProperty(globalThis, "window", {
      value: savedWindow,
      writable: true,
      configurable: true,
    });
  });

  it("clearAthleteCache does not throw without window", () => {
    const savedWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    expect(() => clearAthleteCache()).not.toThrow();

    Object.defineProperty(globalThis, "window", {
      value: savedWindow,
      writable: true,
      configurable: true,
    });
  });
});
