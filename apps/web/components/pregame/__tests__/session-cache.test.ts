// Unit tests for FV-223 — session-cache.ts + PregameFlow persistence layer.
//
// Four areas:
//   A. validatePregameSession — shape validation (all required fields, sport enum,
//      prayerStyle enum, role null handling, empty-string rejection).
//   B. readPregameSession / writePregameSession — round-trip, overwrite, SSR guard.
//   C. clearPregameSession — removes the key; no-op when absent; doesn't disturb
//      other keys; called via the same clearing semantics as clearAthleteCache.
//   D. Sport-mismatch invalidation — the PregameFlow reads the saved session and
//      rejects it when session.sport !== current athlete sport. Tested here as
//      pure logic against the validation helper.
//
// Run narrowly:
//   npx vitest run components/pregame/__tests__/session-cache.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import {
  readPregameSession,
  writePregameSession,
  clearPregameSession,
  validatePregameSession,
  PREGAME_SESSION_CACHE_KEY,
  type PregameSessionCache,
} from "../../../lib/pregame/session-cache";

// ---------------------------------------------------------------------------
// localStorage stub (same pattern as apps/web/__tests__/athlete-cache.test.ts)
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

beforeEach(() => {
  localStorageStub.clear();
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
// Shared fixture
// ---------------------------------------------------------------------------

/** A fully valid PregameSessionCache for hockey. */
function hockeySession(): PregameSessionCache {
  return {
    sport: "hockey",
    need: "Confidence",
    role: "Forward",
    positivePlays: ["viz-forward-win-the-wall", "viz-forward-give-and-go"],
    adversity: "I get benched",
    anchor: "Long exhale",
    selfTalk: "You are secure. Take the next faithful action.",
    cueWord: "Faithful",
    prayerStyle: "guided",
  };
}

/** A valid session for basketball with null role (for test coverage). */
function basketballNoRoleSession(): PregameSessionCache {
  return {
    sport: "basketball",
    need: "Calm",
    role: null,
    positivePlays: ["viz-guard-pull-up"],
    adversity: "I miss back-to-back shots",
    anchor: "Bounce ball twice",
    selfTalk: "Breathe. Do your job.",
    cueWord: "Steady",
    prayerStyle: "self-guided",
  };
}

// ---------------------------------------------------------------------------
// A. validatePregameSession
// ---------------------------------------------------------------------------

describe("validatePregameSession — happy paths", () => {
  it("accepts a valid hockey session", () => {
    const result = validatePregameSession(hockeySession());
    expect(result).toEqual(hockeySession());
  });

  it("accepts a valid basketball session with null role", () => {
    const result = validatePregameSession(basketballNoRoleSession());
    expect(result).toEqual(basketballNoRoleSession());
  });

  it("accepts a valid golf session (FV-265 — sport in the runtime allowlist)", () => {
    const session = { ...hockeySession(), sport: "golf" as const, role: "Ball-Striker" };
    expect(validatePregameSession(session)).toEqual(session);
  });

  it("accepts self-guided prayerStyle", () => {
    const session = { ...hockeySession(), prayerStyle: "self-guided" as const };
    expect(validatePregameSession(session)).toEqual(session);
  });

  it("accepts empty positivePlays array (backward compat)", () => {
    const session = { ...hockeySession(), positivePlays: [] };
    expect(validatePregameSession(session)).toEqual(session);
  });
});

describe("validatePregameSession — shape violations return null", () => {
  it("returns null for null input", () => {
    expect(validatePregameSession(null)).toBeNull();
  });

  it("returns null for a string", () => {
    expect(validatePregameSession("not an object")).toBeNull();
  });

  it("returns null when sport is missing", () => {
    const { sport: _omit, ...noSport } = hockeySession();
    expect(validatePregameSession(noSport)).toBeNull();
  });

  it("returns null when sport is an unknown value", () => {
    expect(validatePregameSession({ ...hockeySession(), sport: "football" })).toBeNull();
  });

  it("returns null when need is an empty string", () => {
    expect(validatePregameSession({ ...hockeySession(), need: "" })).toBeNull();
  });

  it("returns null when need is not a string", () => {
    expect(validatePregameSession({ ...hockeySession(), need: 42 })).toBeNull();
  });

  it("returns null when role is a number (not string or null)", () => {
    expect(validatePregameSession({ ...hockeySession(), role: 0 })).toBeNull();
  });

  it("returns null when positivePlays is not an array", () => {
    expect(validatePregameSession({ ...hockeySession(), positivePlays: "viz-x" })).toBeNull();
  });

  it("returns null when positivePlays contains a non-string entry", () => {
    expect(validatePregameSession({ ...hockeySession(), positivePlays: [42] })).toBeNull();
  });

  it("returns null when adversity is an empty string", () => {
    expect(validatePregameSession({ ...hockeySession(), adversity: "" })).toBeNull();
  });

  it("returns null when anchor is an empty string", () => {
    expect(validatePregameSession({ ...hockeySession(), anchor: "" })).toBeNull();
  });

  it("returns null when selfTalk is an empty string", () => {
    expect(validatePregameSession({ ...hockeySession(), selfTalk: "" })).toBeNull();
  });

  it("returns null when cueWord is an empty string", () => {
    expect(validatePregameSession({ ...hockeySession(), cueWord: "" })).toBeNull();
  });

  it("returns null when prayerStyle is an unknown value", () => {
    expect(validatePregameSession({ ...hockeySession(), prayerStyle: "open" })).toBeNull();
  });

  it("returns null when prayerStyle is missing", () => {
    const { prayerStyle: _omit, ...noPrayer } = hockeySession();
    expect(validatePregameSession(noPrayer)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// A2. Hardening — poisoned-store cases from the PR #194 review
// ---------------------------------------------------------------------------

describe("validatePregameSession — hardening (PR #194 review)", () => {
  it("returns null when a positivePlays entry is an empty string", () => {
    expect(
      validatePregameSession({ ...hockeySession(), positivePlays: [""] }),
    ).toBeNull();
  });

  it("returns null when a positivePlays entry is whitespace-only", () => {
    expect(
      validatePregameSession({ ...hockeySession(), positivePlays: ["   "] }),
    ).toBeNull();
  });

  it("CLAMPS over-cap positivePlays to 3 instead of rejecting", () => {
    const result = validatePregameSession({
      ...hockeySession(),
      positivePlays: ["viz-a", "viz-b", "viz-c", "viz-d", "viz-e"],
    });
    expect(result).not.toBeNull();
    expect(result?.positivePlays).toEqual(["viz-a", "viz-b", "viz-c"]);
  });

  it("returns null when any string field exceeds the length ceiling", () => {
    const huge = "x".repeat(10_000);
    expect(validatePregameSession({ ...hockeySession(), cueWord: huge })).toBeNull();
    expect(validatePregameSession({ ...hockeySession(), selfTalk: huge })).toBeNull();
    expect(validatePregameSession({ ...hockeySession(), role: huge })).toBeNull();
    expect(
      validatePregameSession({ ...hockeySession(), positivePlays: [huge] }),
    ).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// B. readPregameSession / writePregameSession — round-trip
// ---------------------------------------------------------------------------

describe("writePregameSession + readPregameSession", () => {
  it("round-trips a hockey session", () => {
    writePregameSession(hockeySession());
    expect(readPregameSession()).toEqual(hockeySession());
  });

  it("round-trips a basketball session with null role", () => {
    writePregameSession(basketballNoRoleSession());
    expect(readPregameSession()).toEqual(basketballNoRoleSession());
  });

  it("overwrites the previous session on a second write", () => {
    writePregameSession(hockeySession());
    writePregameSession(basketballNoRoleSession());
    expect(readPregameSession()).toEqual(basketballNoRoleSession());
  });

  it("returns null when no session has been written", () => {
    expect(readPregameSession()).toBeNull();
  });

  it("returns null when stored value is invalid JSON", () => {
    localStorageStub.setItem(PREGAME_SESSION_CACHE_KEY, "{bad json}");
    expect(readPregameSession()).toBeNull();
  });

  it("returns null when stored value is valid JSON but wrong shape", () => {
    localStorageStub.setItem(
      PREGAME_SESSION_CACHE_KEY,
      JSON.stringify({ sport: "hockey" }), // missing required fields
    );
    expect(readPregameSession()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// C. clearPregameSession
// ---------------------------------------------------------------------------

describe("clearPregameSession", () => {
  it("removes the key so readPregameSession returns null", () => {
    writePregameSession(hockeySession());
    expect(readPregameSession()).not.toBeNull();
    clearPregameSession();
    expect(readPregameSession()).toBeNull();
  });

  it("is a no-op when the key does not exist (never throws)", () => {
    expect(() => clearPregameSession()).not.toThrow();
    expect(readPregameSession()).toBeNull();
  });

  it("removes only fv_pregame_session, not other keys", () => {
    localStorageStub.setItem("other_key", "other_value");
    writePregameSession(hockeySession());
    clearPregameSession();
    expect(readPregameSession()).toBeNull();
    expect(localStorageStub.getItem("other_key")).toBe("other_value");
  });

  it("does not disturb fv_athlete_cache when both are present", () => {
    localStorageStub.setItem("fv_athlete_cache", JSON.stringify({ sport: "hockey", firstName: "Jordan" }));
    writePregameSession(hockeySession());
    clearPregameSession();
    expect(readPregameSession()).toBeNull();
    expect(localStorageStub.getItem("fv_athlete_cache")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// D. Sport-mismatch invalidation
// ---------------------------------------------------------------------------
//
// PregameFlow reads the saved session and rejects it when session.sport
// differs from the current athlete sport. This is the same logic that runs
// in the useEffect inside PregameFlow — tested here as pure validation so
// we don't need to mount the full component.

describe("sport-mismatch invalidation (as applied by PregameFlow)", () => {
  function isValidForSport(session: PregameSessionCache | null, currentSport: string): boolean {
    if (!session) return false;
    return session.sport === currentSport;
  }

  it("accepts a session whose sport matches the current athlete sport", () => {
    const session = hockeySession();
    expect(isValidForSport(session, "hockey")).toBe(true);
  });

  it("rejects a session whose sport differs from the current athlete sport", () => {
    const session = hockeySession(); // built for hockey
    expect(isValidForSport(session, "basketball")).toBe(false);
  });

  it("rejects a null session (no prior save)", () => {
    expect(isValidForSport(null, "hockey")).toBe(false);
  });

  it("after a sport change, writing a new session for the new sport is valid", () => {
    // Simulate: athlete switches sport hockey→basketball; next session is basketball.
    writePregameSession(basketballNoRoleSession());
    const stored = readPregameSession();
    expect(isValidForSport(stored, "basketball")).toBe(true);
    // The old hockey check is now false (stored is basketball).
    expect(isValidForSport(stored, "hockey")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SSR guard
// ---------------------------------------------------------------------------

describe("SSR guard (typeof window === undefined)", () => {
  function removeWindow() {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  }
  function restoreWindow() {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: localStorageStub },
      writable: true,
      configurable: true,
    });
  }

  it("readPregameSession returns null without window", () => {
    removeWindow();
    expect(readPregameSession()).toBeNull();
    restoreWindow();
  });

  it("writePregameSession does not throw without window", () => {
    removeWindow();
    expect(() => writePregameSession(hockeySession())).not.toThrow();
    restoreWindow();
    // Confirm nothing was written (the test store is still empty).
    expect(readPregameSession()).toBeNull();
  });

  it("clearPregameSession does not throw without window", () => {
    removeWindow();
    expect(() => clearPregameSession()).not.toThrow();
    restoreWindow();
  });
});
