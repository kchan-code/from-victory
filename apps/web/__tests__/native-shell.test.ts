/**
 * Unit tests for lib/native-shell.ts — the Google Play "no in-app purchase"
 * compliance detector.
 *
 * Mocking strategy mirrors __tests__/rate-limit/actions.test.ts: server-only
 * is a no-op, and next/headers is stubbed with a mutable in-memory header
 * map so each test controls the inbound User-Agent.
 */

import { describe, it, expect, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

let headerMap: Record<string, string | null> = {};
vi.mock("next/headers", () => ({
  headers: () => ({
    get: (key: string) => headerMap[key] ?? null,
  }),
}));

import { isNativeShell } from "@/lib/native-shell";

describe("isNativeShell", () => {
  afterEach(() => {
    headerMap = {};
  });

  it("returns true when the User-Agent carries the native shell token", () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 FVNativeShell/1";
    expect(isNativeShell()).toBe(true);
  });

  it("returns false for an ordinary mobile browser User-Agent", () => {
    headerMap["user-agent"] =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    expect(isNativeShell()).toBe(false);
  });

  it("returns false when the User-Agent header is missing entirely", () => {
    // headerMap has no "user-agent" key at all.
    expect(isNativeShell()).toBe(false);
  });

  it("returns false for an empty User-Agent header", () => {
    headerMap["user-agent"] = "";
    expect(isNativeShell()).toBe(false);
  });
});
