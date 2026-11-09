/**
 * FV-630 — readable invite codes: generation, normalization, hashing.
 */
import { createHash } from "crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  INVITE_CODE_ALPHABET,
  formatInviteCode,
  isReadableInviteCode,
  normalizeInviteCode,
} from "@/lib/invites/code";
import { generateInviteCode, hashInviteCode } from "@/lib/invites/code-server";

describe("generateInviteCode", () => {
  it("is 16 symbols from the Crockford alphabet (80 bits)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(code).toHaveLength(16);
      for (const ch of code) expect(INVITE_CODE_ALPHABET).toContain(ch);
      expect(normalizeInviteCode(code)).toBe(code);
    }
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[ILOU]/);
  });

  it("does not repeat across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateInviteCode());
    expect(seen.size).toBe(5000);
  });

  it("uses every symbol (no modulo-bias hole)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      for (const ch of generateInviteCode()) counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    expect(counts.size).toBe(32);
  });
});

describe("normalizeInviteCode", () => {
  const canonical = "7KQ2M9XD4HTRPW3B";

  it.each([
    ["7KQ2-M9XD-4HTR-PW3B"],
    ["7kq2-m9xd-4htr-pw3b"],
    [" 7KQ2 M9XD 4HTR PW3B "],
    ["7KQ2M9XD4HTRPW3B"],
  ])("accepts %j", (input) => {
    expect(normalizeInviteCode(input)).toBe(canonical);
  });

  it("forgives O→0 and I/L→1", () => {
    expect(normalizeInviteCode("O1OO-IIII-LLLL-0000")).toBe("0100111111110000");
  });

  it.each([
    [""],
    ["7KQ2-M9XD-4HTR"], // too short
    ["7KQ2-M9XD-4HTR-PW3B-X"], // too long
    ["7KQ2-M9XD-4HTR-PW3U"], // U is not in the alphabet
    ["7KQ2_M9XD_4HTR_PW3B"],
    ["x".repeat(65)],
    // a legacy base64url pairing code is never mistaken for a readable one
    ["Q2xhdWRlIGlzIGhlbHBmdWwgYW5kIGtp"],
  ])("rejects %j", (input) => {
    expect(normalizeInviteCode(input)).toBeNull();
    expect(isReadableInviteCode(input)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
    expect(normalizeInviteCode(12345)).toBeNull();
  });
});

describe("formatInviteCode / hashInviteCode", () => {
  it("formats in groups of four", () => {
    expect(formatInviteCode("7KQ2M9XD4HTRPW3B")).toBe("7KQ2-M9XD-4HTR-PW3B");
  });

  it("hash is sha256 hex of the canonical code, so every spelling hashes the same", () => {
    const expected = createHash("sha256").update("7KQ2M9XD4HTRPW3B").digest("hex");
    expect(hashInviteCode("7KQ2M9XD4HTRPW3B")).toBe(expected);
    expect(hashInviteCode(normalizeInviteCode("7kq2-m9xd-4htr-pw3b")!)).toBe(expected);
    expect(expected).toMatch(/^[0-9a-f]{64}$/);
  });
});
