// FV-396 — first-touch UTM attribution helpers.
//
// Covers the pure parse/sanitize functions shared by the client capture
// component (components/marketing/AttributionCapture.tsx) and the Stripe
// checkout server action (lib/actions/subscription.ts).

import { describe, expect, it } from "vitest";

import {
  ATTRIBUTION_ELIGIBLE_PATHS,
  hasUtmFields,
  isAttributionEligiblePath,
  parseAttributionCookieValue,
  parseUtmParams,
  sanitizeAttribution,
  UTM_KEYS,
} from "../attribution";

describe("parseUtmParams", () => {
  it("extracts all five known utm_* keys from URLSearchParams", () => {
    const params = new URLSearchParams(
      "utm_source=google&utm_medium=cpc&utm_campaign=summer&utm_content=ad1&utm_term=hockey+training",
    );
    expect(parseUtmParams(params)).toEqual({
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "summer",
      utm_content: "ad1",
      utm_term: "hockey training",
    });
  });

  it("returns an empty object when no utm params are present", () => {
    const params = new URLSearchParams("foo=bar&ref=friend");
    expect(parseUtmParams(params)).toEqual({});
  });

  it("only includes the keys actually present (partial UTM set)", () => {
    const params = new URLSearchParams("utm_source=instagram");
    expect(parseUtmParams(params)).toEqual({ utm_source: "instagram" });
  });

  it("ignores an empty-string utm value", () => {
    const params = new URLSearchParams("utm_source=");
    expect(parseUtmParams(params)).toEqual({});
  });

  it("ignores unknown query params", () => {
    const params = new URLSearchParams("utm_source=fb&gclid=abc123&fbclid=xyz");
    expect(parseUtmParams(params)).toEqual({ utm_source: "fb" });
  });

  it("also accepts a plain object of string values", () => {
    expect(
      parseUtmParams({ utm_source: "newsletter", utm_medium: "email", other: "ignored" }),
    ).toEqual({ utm_source: "newsletter", utm_medium: "email" });
  });
});

describe("sanitizeAttribution", () => {
  it("passes through a well-formed attribution payload unchanged", () => {
    const raw = {
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "summer-2026",
      landed_at: "2026-07-08T12:00:00.000Z",
    };
    expect(sanitizeAttribution(raw)).toEqual(raw);
  });

  it("drops unknown keys", () => {
    const raw = {
      utm_source: "google",
      evil_key: "drop-me",
      __proto__: "ignore",
    };
    const result = sanitizeAttribution(raw);
    expect(result).toEqual({ utm_source: "google" });
    expect(result).not.toHaveProperty("evil_key");
  });

  it("truncates a value to 100 characters", () => {
    const longValue = "a".repeat(500);
    const result = sanitizeAttribution({ utm_source: longValue });
    expect(result.utm_source).toHaveLength(100);
    expect(result.utm_source).toBe("a".repeat(100));
  });

  it("strips control characters from a value", () => {
    const dirty = "google\x00\x1F\x7Fcampaign\r\n";
    const result = sanitizeAttribution({ utm_campaign: dirty });
    expect(result.utm_campaign).toBe("googlecampaign");
  });

  it("drops a non-string value for a known key", () => {
    const result = sanitizeAttribution({ utm_source: 12345, utm_medium: null });
    expect(result).toEqual({});
  });

  it("drops an invalid landed_at timestamp", () => {
    const result = sanitizeAttribution({
      utm_source: "google",
      landed_at: "not-a-real-date",
    });
    expect(result).toEqual({ utm_source: "google" });
  });

  it("returns an empty object for null input", () => {
    expect(sanitizeAttribution(null)).toEqual({});
  });

  it("returns an empty object for a non-object input", () => {
    expect(sanitizeAttribution("just a string")).toEqual({});
    expect(sanitizeAttribution(42)).toEqual({});
    expect(sanitizeAttribution(undefined)).toEqual({});
  });

  it("returns an empty object for an array input", () => {
    // Arrays are typeof "object" — must not be treated as a valid payload
    // shape (Object.keys on an array would yield index keys like "0").
    expect(sanitizeAttribution(["utm_source", "google"])).toEqual({});
  });

  it("never throws on malicious/malformed shapes", () => {
    expect(() => sanitizeAttribution({ toString: () => "x" })).not.toThrow();
    expect(() => sanitizeAttribution({ utm_source: { nested: true } })).not.toThrow();
  });
});

describe("parseAttributionCookieValue", () => {
  it("parses a valid JSON cookie value", () => {
    const value = JSON.stringify({ utm_source: "google", landed_at: "2026-07-08T00:00:00.000Z" });
    expect(parseAttributionCookieValue(value)).toEqual({
      utm_source: "google",
      landed_at: "2026-07-08T00:00:00.000Z",
    });
  });

  it("returns an empty object for undefined/null/empty input", () => {
    expect(parseAttributionCookieValue(undefined)).toEqual({});
    expect(parseAttributionCookieValue(null)).toEqual({});
    expect(parseAttributionCookieValue("")).toEqual({});
  });

  it("never throws on malformed JSON — returns empty object instead", () => {
    expect(() => parseAttributionCookieValue("{not valid json")).not.toThrow();
    expect(parseAttributionCookieValue("{not valid json")).toEqual({});
  });

  it("never throws on a JSON value that isn't an object", () => {
    expect(parseAttributionCookieValue('"just a string"')).toEqual({});
    expect(parseAttributionCookieValue("42")).toEqual({});
    expect(parseAttributionCookieValue("null")).toEqual({});
  });
});

describe("isAttributionEligiblePath", () => {
  it("allows every documented public marketing route", () => {
    for (const path of ATTRIBUTION_ELIGIBLE_PATHS) {
      expect(isAttributionEligiblePath(path)).toBe(true);
    }
  });

  it("denies athlete/parent app surfaces by default", () => {
    expect(isAttributionEligiblePath("/athlete")).toBe(false);
    expect(isAttributionEligiblePath("/dashboard")).toBe(false);
    expect(isAttributionEligiblePath("/pair")).toBe(false);
    expect(isAttributionEligiblePath("/signin")).toBe(false);
    expect(isAttributionEligiblePath("/signup")).toBe(false);
    expect(isAttributionEligiblePath("/subscribe")).toBe(false);
  });

  it("denies an unknown path", () => {
    expect(isAttributionEligiblePath("/some/random/path")).toBe(false);
  });
});

describe("hasUtmFields", () => {
  it("is true when at least one utm_* key is present", () => {
    expect(hasUtmFields({ utm_source: "google" })).toBe(true);
  });

  it("is false for an empty attribution object", () => {
    expect(hasUtmFields({})).toBe(false);
  });

  it("is false when only landed_at is present (no utm fields)", () => {
    expect(hasUtmFields({ landed_at: "2026-07-08T00:00:00.000Z" })).toBe(false);
  });
});

describe("UTM_KEYS", () => {
  it("is exactly the five documented UTM parameters", () => {
    expect(UTM_KEYS).toEqual([
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]);
  });
});
