/**
 * Unit tests for the athlete username validation helper (FV-320).
 *
 * validateUsername() is a pure function with no I/O — all cases are covered
 * without mocking anything. The test file follows the repo pattern of
 * `apps/web/__tests__/` and uses Vitest.
 */

import { describe, it, expect } from "vitest";

import {
  validateUsername,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  RESERVED_USERNAMES,
} from "@/lib/auth/athlete-username";

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("validateUsername — valid inputs", () => {
  it("accepts a simple lowercase alphanumeric username", () => {
    const result = validateUsername("jordan7");
    expect(result).toEqual({ ok: true, normalized: "jordan7" });
  });

  it("accepts usernames with underscores", () => {
    const result = validateUsername("ice_king_23");
    expect(result).toEqual({ ok: true, normalized: "ice_king_23" });
  });

  it("accepts a username at exactly the minimum length", () => {
    const result = validateUsername("abc");
    expect(result).toEqual({ ok: true, normalized: "abc" });
  });

  it("accepts a username at exactly the maximum length", () => {
    const twentyChars = "a".repeat(USERNAME_MAX_LENGTH);
    const result = validateUsername(twentyChars);
    expect(result).toEqual({ ok: true, normalized: twentyChars });
  });

  it("normalises uppercase input to lowercase", () => {
    const result = validateUsername("Jordan7");
    expect(result).toEqual({ ok: true, normalized: "jordan7" });
  });

  it("normalises mixed-case to lowercase", () => {
    const result = validateUsername("IcE_KiNg");
    expect(result).toEqual({ ok: true, normalized: "ice_king" });
  });

  it("trims leading and trailing whitespace before validation", () => {
    const result = validateUsername("  hockey99  ");
    expect(result).toEqual({ ok: true, normalized: "hockey99" });
  });

  it("accepts all-digit username (if at least min length)", () => {
    const result = validateUsername("123");
    expect(result).toEqual({ ok: true, normalized: "123" });
  });

  it("accepts all-underscore username of sufficient length", () => {
    const result = validateUsername("___");
    expect(result).toEqual({ ok: true, normalized: "___" });
  });
});

// ---------------------------------------------------------------------------
// Too short
// ---------------------------------------------------------------------------

describe("validateUsername — too short", () => {
  it("rejects an empty string", () => {
    const result = validateUsername("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/required/i);
  });

  it("rejects a string shorter than the minimum length", () => {
    const result = validateUsername("ab");
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toMatch(new RegExp(`${USERNAME_MIN_LENGTH}`));
  });

  it("rejects a single character", () => {
    const result = validateUsername("x");
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Too long
// ---------------------------------------------------------------------------

describe("validateUsername — too long", () => {
  it("rejects a username longer than the maximum length", () => {
    const tooLong = "a".repeat(USERNAME_MAX_LENGTH + 1);
    const result = validateUsername(tooLong);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toMatch(new RegExp(`${USERNAME_MAX_LENGTH}`));
  });

  it("rejects a username of 30 characters", () => {
    const result = validateUsername("a".repeat(30));
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bad characters
// ---------------------------------------------------------------------------

describe("validateUsername — bad characters", () => {
  it("rejects a username with a hyphen", () => {
    const result = validateUsername("ice-king");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/letter|number|underscore/i);
  });

  it("rejects a username with a space", () => {
    const result = validateUsername("ice king");
    expect(result.ok).toBe(false);
  });

  it("rejects a username with a dot", () => {
    const result = validateUsername("jordan.7");
    expect(result.ok).toBe(false);
  });

  it("rejects a username with an at-sign", () => {
    const result = validateUsername("player@hockey");
    expect(result.ok).toBe(false);
  });

  it("rejects a username with an exclamation mark", () => {
    const result = validateUsername("legend!");
    expect(result.ok).toBe(false);
  });

  it("rejects a username with emoji", () => {
    const result = validateUsername("player🏒");
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Uppercase normalisation (the normalised form must pass validation)
// ---------------------------------------------------------------------------

describe("validateUsername — uppercase normalisation then re-check", () => {
  it("ADMIN in any case is rejected (reserved)", () => {
    const result = validateUsername("ADMIN");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/available|taken/i);
  });

  it("Admin in mixed case is rejected (reserved after normalisation)", () => {
    const result = validateUsername("Admin");
    expect(result.ok).toBe(false);
  });

  it("Support in mixed case is rejected (reserved after normalisation)", () => {
    const result = validateUsername("SUPPORT");
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Reserved words
// ---------------------------------------------------------------------------

describe("validateUsername — reserved words", () => {
  const reserved = Array.from(RESERVED_USERNAMES);

  for (const word of reserved) {
    it(`rejects reserved word: "${word}"`, () => {
      const result = validateUsername(word);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/available|taken/i);
    });
  }

  it("rejects 'admin' (exact match)", () => {
    const result = validateUsername("admin");
    expect(result.ok).toBe(false);
  });

  it("rejects 'fromvictory' (exact match)", () => {
    const result = validateUsername("fromvictory");
    expect(result.ok).toBe(false);
  });

  it("does NOT reject a username that merely contains a reserved word", () => {
    // e.g. "admingoalie7" — the word 'admin' is a prefix but the full string
    // is NOT reserved. Athletes named something that starts with a reserved
    // word should not be blocked.
    const result = validateUsername("admingoalie7");
    expect(result).toEqual({ ok: true, normalized: "admingoalie7" });
  });
});

// ---------------------------------------------------------------------------
// Non-string inputs
// ---------------------------------------------------------------------------

describe("validateUsername — non-string inputs", () => {
  it("rejects null", () => {
    const result = validateUsername(null);
    expect(result.ok).toBe(false);
  });

  it("rejects undefined", () => {
    const result = validateUsername(undefined);
    expect(result.ok).toBe(false);
  });

  it("rejects a number", () => {
    const result = validateUsername(42);
    expect(result.ok).toBe(false);
  });

  it("rejects an object", () => {
    const result = validateUsername({});
    expect(result.ok).toBe(false);
  });
});
