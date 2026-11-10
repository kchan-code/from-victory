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
  hasUsableOfflineEntitlement,
  ATHLETE_CACHE_KEY,
  type AthleteCache,
} from "../lib/pregame/athlete-cache";

// FV-625 fixtures: a verified entry, checked at T0, valid until UNTIL.
const T0 = Date.parse("2026-11-09T12:00:00.000Z");
const UNTIL = "2026-12-09T12:00:00.000Z";
const UNTIL_MS = Date.parse(UNTIL);
const V = { offlineUntil: UNTIL, verifiedAt: T0 } as const;

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
    expect(readAthleteCache()).toEqual({
      sport: "hockey",
      firstName: "Jordan",
      offlineUntil: null,
      verifiedAt: null,
    });
  });

  it("returns the cached value for basketball", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "basketball", firstName: "Sam" }),
    );
    expect(readAthleteCache()).toEqual({
      sport: "basketball",
      firstName: "Sam",
      offlineUntil: null,
      verifiedAt: null,
    });
  });
});

// ---------------------------------------------------------------------------
// FV-625 offline entitlement (KC policy: until the last verified period ends)
// ---------------------------------------------------------------------------

describe("readAthleteCache — FV-625 offline entitlement fields", () => {
  it("a pre-FV-625 entry (no fields) reads as no offline window", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey", firstName: "Jordan" }),
    );
    const c = readAthleteCache();
    expect(c).toMatchObject({ offlineUntil: null, verifiedAt: null });
    expect(hasUsableOfflineEntitlement(c, T0)).toBe(false);
  });

  it("a legacy boolean-marker entry (entitlementVerified: true) is NOT usable offline", () => {
    localStorageStub.setItem(
      ATHLETE_CACHE_KEY,
      JSON.stringify({ sport: "hockey", firstName: "Jordan", entitlementVerified: true }),
    );
    const c = readAthleteCache();
    expect(c).toEqual({ sport: "hockey", firstName: "Jordan", offlineUntil: null, verifiedAt: null });
    expect(hasUsableOfflineEntitlement(c, T0)).toBe(false);
  });

  it("corrupted offlineUntil / verifiedAt values read as null (never usable)", () => {
    const badUntil = ["not-a-date", 123, true, {}, [], "", null];
    for (const v of badUntil) {
      localStorageStub.setItem(
        ATHLETE_CACHE_KEY,
        JSON.stringify({ sport: "hockey", firstName: "Jordan", offlineUntil: v, verifiedAt: T0 }),
      );
      const c = readAthleteCache();
      expect(c?.offlineUntil).toBeNull();
      expect(hasUsableOfflineEntitlement(c, T0 + 1)).toBe(false);
    }
    const badAt = ["1731153600000", null, {}, "NaN", true];
    for (const v of badAt) {
      localStorageStub.setItem(
        ATHLETE_CACHE_KEY,
        JSON.stringify({ sport: "hockey", firstName: "Jordan", offlineUntil: UNTIL, verifiedAt: v }),
      );
      const c = readAthleteCache();
      expect(c?.verifiedAt).toBeNull();
      expect(hasUsableOfflineEntitlement(c, T0 + 1)).toBe(false);
    }
  });

  it("stores only sport, firstName and the two timestamps — no level, status, plan or provider", () => {
    writeAthleteCache({ sport: "golf", firstName: "Riley", ...V });
    const raw = JSON.parse(localStorageStub.getItem(ATHLETE_CACHE_KEY) ?? "{}");
    expect(Object.keys(raw).sort()).toEqual(["firstName", "offlineUntil", "sport", "verifiedAt"]);
  });
});

describe("hasUsableOfflineEntitlement — clock / expiry boundaries", () => {
  const entry: AthleteCache = { sport: "hockey", firstName: "Jordan", ...V };

  it("usable at the moment of verification and just before the period end", () => {
    expect(hasUsableOfflineEntitlement(entry, T0)).toBe(true);
    expect(hasUsableOfflineEntitlement(entry, UNTIL_MS - 1)).toBe(true);
  });

  it("expired AT the period end and after it (no grace)", () => {
    expect(hasUsableOfflineEntitlement(entry, UNTIL_MS)).toBe(false);
    expect(hasUsableOfflineEntitlement(entry, UNTIL_MS + 1)).toBe(false);
    expect(hasUsableOfflineEntitlement(entry, UNTIL_MS + 365 * 86_400_000)).toBe(false);
  });

  it("a device clock set back to before the last online check is rejected", () => {
    expect(hasUsableOfflineEntitlement(entry, T0 - 1)).toBe(false);
    expect(hasUsableOfflineEntitlement(entry, T0 - 86_400_000)).toBe(false);
  });

  it("no end date (null offlineUntil — perpetual comp grant / gating off) is never usable", () => {
    const noEnd: AthleteCache = { ...entry, offlineUntil: null };
    expect(hasUsableOfflineEntitlement(noEnd, T0)).toBe(false);
    expect(hasUsableOfflineEntitlement(noEnd, T0 + 1)).toBe(false);
  });

  it("a window that had already ended when verified is never usable", () => {
    const past: AthleteCache = { ...entry, offlineUntil: new Date(T0 - 1).toISOString() };
    expect(hasUsableOfflineEntitlement(past, T0)).toBe(false);
  });

  it("null entry and a non-finite clock are not usable", () => {
    expect(hasUsableOfflineEntitlement(null, T0)).toBe(false);
    expect(hasUsableOfflineEntitlement(entry, Number.NaN)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// writeAthleteCache + readAthleteCache round-trip
// ---------------------------------------------------------------------------

describe("writeAthleteCache", () => {
  it("writes a value that readAthleteCache returns", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Taylor", ...V });
    expect(readAthleteCache()).toEqual({
      sport: "hockey",
      firstName: "Taylor",
      ...V,
    });
  });

  it("overwrites an existing cached value", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Jordan", ...V });
    writeAthleteCache({ sport: "basketball", firstName: "Alex", ...V });
    expect(readAthleteCache()).toEqual({
      sport: "basketball",
      firstName: "Alex",
      ...V,
    });
  });
});

// ---------------------------------------------------------------------------
// clearAthleteCache
// ---------------------------------------------------------------------------

describe("clearAthleteCache", () => {
  it("removes the key so readAthleteCache returns null", () => {
    writeAthleteCache({ sport: "hockey", firstName: "Jordan", ...V });
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
    writeAthleteCache({ sport: "hockey", firstName: "Jordan", ...V });
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
