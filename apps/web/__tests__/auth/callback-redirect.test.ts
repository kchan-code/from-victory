/**
 * FV-725 — /auth/callback uses safeRedirectPath for `next`.
 *
 * After a successful code exchange the route redirects to `next`. The
 * reported payload `/\evil.com` used to leave the request origin. These
 * cases pin the route, not only the helper.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { exchangeCodeForSession },
  }),
}));

import { GET } from "@/app/auth/callback/route";

const ORIGIN = "https://www.fromvictoryapp.com";

function makeRequest(next: string | null, code: string | null = "code-123"): NextRequest {
  const url = new URL(`${ORIGIN}/auth/callback`);
  if (code !== null) url.searchParams.set("code", code);
  if (next !== null) url.searchParams.set("next", next);
  return { url: url.toString() } as NextRequest;
}

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  exchangeCodeForSession.mockResolvedValue({ error: null });
});

describe("GET /auth/callback next param", () => {
  it.each([
    ["reported backslash host", "/\\evil.com", `${ORIGIN}/`],
    ["protocol-relative", "//evil.com", `${ORIGIN}/`],
    ["encoded backslash", "/%5Cevil.com", `${ORIGIN}/`],
    ["normal internal path", "/reset-password", `${ORIGIN}/reset-password`],
  ])("after a successful exchange, %s → %s", async (_name, next, location) => {
    const res = await GET(makeRequest(next));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("code-123");
    expect(res.headers.get("location")).toBe(location);
    expect(new URL(res.headers.get("location") ?? "", ORIGIN).origin).toBe(ORIGIN);
  });

  it("does not follow next when the code is missing", async () => {
    const res = await GET(makeRequest("/\\evil.com", null));
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(`${ORIGIN}/signin?reset=invalid`);
  });

  it("does not follow next when the code exchange fails", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "bad code", status: 400, code: "bad" },
    });
    const res = await GET(makeRequest("/\\evil.com"));
    expect(res.headers.get("location")).toBe(`${ORIGIN}/signin?reset=invalid`);
  });
});
