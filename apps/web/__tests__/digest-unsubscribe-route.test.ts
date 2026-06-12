/**
 * Tests for app/api/digest/unsubscribe/route.ts (FV-226).
 *
 * Pins the route wrapper around processUnsubscribeToken (the action itself
 * is tested in actions/digest-preferences.test.ts): success page renders the
 * first name escaped EXACTLY ONCE (PR #192 review caught a double-escape),
 * invalid/missing tokens return 400 with a generic, non-account-revealing
 * message, and no athlete data appears in any response.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/lib/actions/digest-preferences", () => ({
  processUnsubscribeToken: vi.fn(),
}));

import { GET } from "@/app/api/digest/unsubscribe/route";
import { processUnsubscribeToken } from "@/lib/actions/digest-preferences";

function makeReq(token?: string): NextRequest {
  const url = new URL(
    token === undefined
      ? "http://localhost/api/digest/unsubscribe"
      : `http://localhost/api/digest/unsubscribe?token=${encodeURIComponent(token)}`,
  );
  return { nextUrl: url } as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("digest unsubscribe route", () => {
  it("missing token → 400, no lookup attempted", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(400);
    expect(processUnsubscribeToken).not.toHaveBeenCalled();
  });

  it("invalid token → 400 with a generic message that does not leak account existence", async () => {
    vi.mocked(processUnsubscribeToken).mockResolvedValue({
      ok: false,
      reason: "invalid_token",
    } as Awaited<ReturnType<typeof processUnsubscribeToken>>);

    const res = await GET(makeReq("not-a-real-token"));
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain("invalid or has already been used");
    expect(body).not.toMatch(/parent|account found|no such/i);
  });

  it("valid token → 200 HTML containing the first name escaped exactly once", async () => {
    vi.mocked(processUnsubscribeToken).mockResolvedValue({
      ok: true,
      firstName: "O & Malley",
    } as Awaited<ReturnType<typeof processUnsubscribeToken>>);

    const res = await GET(makeReq("11111111-1111-4111-8111-111111111111"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const body = await res.text();
    // Escaped once: "&" → "&amp;". Double-escape would render "&amp;amp;".
    expect(body).toContain("O &amp; Malley");
    expect(body).not.toContain("&amp;amp;");
    // No athlete data on this surface.
    expect(body).not.toMatch(/athlete_id|birthdate|session/i);
  });
});
