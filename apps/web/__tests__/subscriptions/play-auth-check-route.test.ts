/**
 * Tests for app/api/internal/play-auth-check/route.ts (FV-782).
 *
 * Pins the secret gate, the pass/fail-only answer, and that neither the token
 * nor any error detail reaches the response or the logs.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { getPlayAccessTokenMock } = vi.hoisted(() => ({
  getPlayAccessTokenMock: vi.fn(),
}));

vi.mock("@/lib/subscriptions/google-play-auth", () => ({
  getPlayAccessToken: () => getPlayAccessTokenMock(),
}));

import * as route from "@/app/api/internal/play-auth-check/route";

const SECRET = "test-cron-secret-value";
const TOKEN = "ya29.fake-access-token-must-not-leak";
const ERROR_DETAIL = "provider projects/123/secret-detail subject_token=eyJleak";

function request(authorization?: string): NextRequest {
  const headers = new Headers();
  if (authorization !== undefined) headers.set("authorization", authorization);
  return new Request("https://example.test/api/internal/play-auth-check", {
    method: "POST",
    headers,
  }) as unknown as NextRequest;
}

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

function logged(): string {
  return JSON.stringify([...logSpy.mock.calls, ...errorSpy.mock.calls]);
}

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  getPlayAccessTokenMock.mockReset();
  getPlayAccessTokenMock.mockResolvedValue(TOKEN);
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CRON_SECRET;
  vi.restoreAllMocks();
});

describe("authorization", () => {
  it("rejects with 500 and makes no exchange when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const res = await route.POST(request(`Bearer ${SECRET}`));
    expect(res.status).toBe(500);
    expect(getPlayAccessTokenMock).not.toHaveBeenCalled();
  });

  it("rejects with 500 when CRON_SECRET is empty, even for a bare 'Bearer '", async () => {
    process.env.CRON_SECRET = "";
    const res = await route.POST(request("Bearer "));
    expect(res.status).toBe(500);
    expect(getPlayAccessTokenMock).not.toHaveBeenCalled();
  });

  it.each([
    ["no header", undefined],
    ["wrong secret, same length", `Bearer ${"x".repeat(SECRET.length)}`],
    ["wrong secret, different length", "Bearer nope"],
    ["secret without the Bearer prefix", SECRET],
    ["lowercase scheme", `bearer ${SECRET}`],
    ["trailing extra characters", `Bearer ${SECRET}x`],
  ])("rejects with 401 and makes no exchange: %s", async (_name, header) => {
    const res = await route.POST(request(header));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized." });
    expect(getPlayAccessTokenMock).not.toHaveBeenCalled();
  });
});

describe("success", () => {
  it("answers 200 { ok: true } and nothing else", async () => {
    const res = await route.POST(request(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: true });
    expect(text).not.toContain(TOKEN);
    expect(getPlayAccessTokenMock).toHaveBeenCalledTimes(1);
  });

  it("never logs the token or the secret", async () => {
    await route.POST(request(`Bearer ${SECRET}`));
    expect(logged()).not.toContain(TOKEN);
    expect(logged()).not.toContain(SECRET);
  });
});

describe("failure", () => {
  it("answers 503 { ok: false } with no error detail when the exchange throws", async () => {
    getPlayAccessTokenMock.mockRejectedValue(new Error(ERROR_DETAIL));
    const res = await route.POST(request(`Bearer ${SECRET}`));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: false });
    expect(text).not.toContain("secret-detail");
    expect(logged()).not.toContain("secret-detail");
    expect(logged()).not.toContain("eyJleak");
  });

  it("answers 503 { ok: false } when the token is empty", async () => {
    getPlayAccessTokenMock.mockResolvedValue("");
    const res = await route.POST(request(`Bearer ${SECRET}`));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
  });
});

describe("shape of the route", () => {
  const WEB_ROOT = path.resolve(__dirname, "../..");
  const src = readFileSync(
    path.join(WEB_ROOT, "app/api/internal/play-auth-check/route.ts"),
    "utf8",
  );

  it("exports POST only, so it cannot be prefetched or scheduled by GET", () => {
    expect(Object.keys(route).sort()).toEqual(["POST", "dynamic", "runtime"]);
  });

  it("is not scheduled in vercel.json", () => {
    const vercel = readFileSync(path.join(WEB_ROOT, "../../vercel.json"), "utf8");
    expect(vercel).not.toContain("play-auth-check");
  });

  it("does only the token exchange: no Play API, database, or billing-switch access", () => {
    const imports = [...src.matchAll(/from "([^"]+)"/g)].map((m) => m[1]).sort();
    expect(imports).toEqual([
      "@/lib/subscriptions/google-play-auth",
      "next/server",
      "next/server",
      "node:crypto",
    ]);
    expect(src).not.toMatch(/process\.env\.(?!CRON_SECRET\b)/);
  });
});
