/**
 * Unit tests for the pure HMAC sign/verify helpers in lib/auth/device-cookie.ts
 * (FV-13 Part B).
 *
 * No mocks needed — the module has zero side effects and no I/O.
 */

import { describe, it, expect } from "vitest";
import { signDeviceValue, verifyDeviceValue } from "@/lib/auth/device-cookie";

const SECRET = "test-secret-for-unit-tests";
const ATHLETE_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

// ---------------------------------------------------------------------------
// signDeviceValue output shape
// ---------------------------------------------------------------------------

describe("signDeviceValue", () => {
  it("produces exactly one dot separating the id and the sig", () => {
    const value = signDeviceValue(ATHLETE_ID, SECRET);
    const dots = value.split(".");
    // The UUID itself contains hyphens but no dots; base64url has no dots.
    expect(dots).toHaveLength(2);
    expect(dots[0]).toBe(ATHLETE_ID);
    expect(dots[1]!.length).toBeGreaterThan(0);
  });

  it("the sig segment is a non-empty base64url string (no +, /, or = padding)", () => {
    const value = signDeviceValue(ATHLETE_ID, SECRET);
    const sig = value.slice(ATHLETE_ID.length + 1);
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ---------------------------------------------------------------------------
// Round-trip: sign → verify
// ---------------------------------------------------------------------------

describe("verifyDeviceValue — round-trip", () => {
  it("returns the original athleteId when the signed value verifies correctly", () => {
    const signed = signDeviceValue(ATHLETE_ID, SECRET);
    expect(verifyDeviceValue(signed, SECRET)).toBe(ATHLETE_ID);
  });

  it("round-trips a minimal single-char id (edge case)", () => {
    const signed = signDeviceValue("x", SECRET);
    expect(verifyDeviceValue(signed, SECRET)).toBe("x");
  });
});

// ---------------------------------------------------------------------------
// Tampered values → null
// ---------------------------------------------------------------------------

describe("verifyDeviceValue — tampered values", () => {
  it("returns null when the signature is tampered", () => {
    const signed = signDeviceValue(ATHLETE_ID, SECRET);
    const tampered = signed.slice(0, -4) + "XXXX";
    expect(verifyDeviceValue(tampered, SECRET)).toBeNull();
  });

  it("returns null when a forged id is paired with a valid sig for a different id", () => {
    // Attacker crafts a cookie: OTHER_ID + sig_for_ATHLETE_ID
    const signedOriginal = signDeviceValue(ATHLETE_ID, SECRET);
    const legitSig = signedOriginal.slice(ATHLETE_ID.length + 1);
    const forged = `${OTHER_ID}.${legitSig}`;
    expect(verifyDeviceValue(forged, SECRET)).toBeNull();
  });

  it("returns null when both id and sig are swapped (classic replay attempt)", () => {
    const signedA = signDeviceValue(ATHLETE_ID, SECRET);
    const signedB = signDeviceValue(OTHER_ID, SECRET);
    // Take id from B, sig from A
    const sigA = signedA.slice(ATHLETE_ID.length + 1);
    const forged = `${OTHER_ID}.${sigA}`;
    expect(verifyDeviceValue(forged, SECRET)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Wrong secret → null
// ---------------------------------------------------------------------------

describe("verifyDeviceValue — wrong secret", () => {
  it("returns null when verifying with a different secret than the signing secret", () => {
    const signed = signDeviceValue(ATHLETE_ID, SECRET);
    expect(verifyDeviceValue(signed, "wrong-secret")).toBeNull();
  });

  it("returns null for a rotated secret even if the format is valid", () => {
    const oldSigned = signDeviceValue(ATHLETE_ID, "old-secret");
    expect(verifyDeviceValue(oldSigned, "new-rotated-secret")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Legacy unsigned bare-UUID (the oracle/graceful-degrade case — FV-13)
// ---------------------------------------------------------------------------

describe("verifyDeviceValue — legacy unsigned bare-UUID", () => {
  it("returns null for a raw UUID with no dot (legacy pre-FV-13 cookie)", () => {
    // This is the exact case the fix closes: a forged or legacy unsigned cookie
    // used to reach the service-role athlete name lookup. It must yield null.
    expect(verifyDeviceValue(ATHLETE_ID, SECRET)).toBeNull();
  });

  it("returns null for a bare UUID-like string even with a different secret", () => {
    expect(verifyDeviceValue(OTHER_ID, "any-secret")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Malformed inputs → null
// ---------------------------------------------------------------------------

describe("verifyDeviceValue — malformed inputs", () => {
  it("returns null for undefined", () => {
    expect(verifyDeviceValue(undefined, SECRET)).toBeNull();
  });

  it("returns null for null", () => {
    expect(verifyDeviceValue(null, SECRET)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyDeviceValue("", SECRET)).toBeNull();
  });

  it("returns null for id.<empty-sig> (trailing dot, no sig)", () => {
    expect(verifyDeviceValue(`${ATHLETE_ID}.`, SECRET)).toBeNull();
  });

  it("returns null for .<sig> (no id before dot)", () => {
    const signed = signDeviceValue(ATHLETE_ID, SECRET);
    const sig = signed.slice(ATHLETE_ID.length + 1);
    expect(verifyDeviceValue(`.${sig}`, SECRET)).toBeNull();
  });

  it("returns null for a plain dot with no id and no sig", () => {
    expect(verifyDeviceValue(".", SECRET)).toBeNull();
  });

  it("returns null for arbitrary garbage", () => {
    expect(verifyDeviceValue("not-a-valid-cookie-value", SECRET)).toBeNull();
  });

  it("returns null for a value that is just whitespace", () => {
    expect(verifyDeviceValue("   ", SECRET)).toBeNull();
  });

  it("returns null for a multi-dot value (split-on-FIRST-dot contract)", () => {
    // Guards the parse: verifyDeviceValue splits on the first dot, so a value
    // like "a.b.c.d" is parsed as id="a", sig="b.c.d" and fails the HMAC check.
    // base64url never contains dots, so a legitimate sig is single-segment;
    // this locks the behavior against a future refactor of the split logic.
    expect(verifyDeviceValue("a.b.c.d", SECRET)).toBeNull();
    expect(
      verifyDeviceValue(`${ATHLETE_ID}.extra.${"x".repeat(43)}`, SECRET),
    ).toBeNull();
  });
});
