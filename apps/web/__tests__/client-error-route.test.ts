import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: () => ({ get: () => null }),
}));

const { notifyErrorMock } = vi.hoisted(() => ({
  notifyErrorMock: vi.fn(async (..._args: unknown[]) => undefined),
}));

vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => notifyErrorMock(...args),
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (promise: Promise<unknown>) => {
    void promise;
  },
}));

import { POST } from "@/app/api/client-error/route";
import { resetClientErrorAlertWindow } from "@/lib/monitoring/client-error-rate-limit";

const ATHLETE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function makeReq(body: unknown, init?: { origin?: string; ua?: string }): NextRequest {
  const raw = JSON.stringify(body);
  const headers = new Headers({ "content-type": "application/json" });
  if (init?.origin) headers.set("origin", init.origin);
  if (init?.ua) headers.set("user-agent", init.ua);
  return {
    headers,
    text: async () => raw,
  } as unknown as NextRequest;
}

beforeEach(() => {
  notifyErrorMock.mockClear();
  resetClientErrorAlertWindow();
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("POST /api/client-error (FV-729)", () => {
  it("alerts with route, digest, shell, and build — no user id", async () => {
    const res = await POST(
      makeReq(
        {
          route: "/athlete",
          digest: "digest_1",
          build: "abc1234def",
          message: "Failed to find Server Action",
          userId: ATHLETE_ID,
        },
        {
          origin: "https://www.fromvictoryapp.com",
          ua: "Mozilla/5.0 FVNativeShell/1 (ios)",
        },
      ),
    );
    expect(res.status).toBe(204);
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    const [label, message, context] = notifyErrorMock.mock.calls[0] as unknown as [
      string,
      string,
      Record<string, string>,
    ];
    expect(label).toBe("[client-error] render error");
    expect(message).toBe("Failed to find Server Action");
    expect(context).toEqual({
      route: "/athlete",
      shell: "ios-iap",
      digest: "digest_1",
      build: "abc1234def",
    });
    expect(JSON.stringify(context)).not.toContain(ATHLETE_ID);
  });

  it("redacts an email in the message and an id in the route", async () => {
    const res = await POST(
      makeReq({
        route: `/dashboard/athletes/${ATHLETE_ID}`,
        message: "boom athlete@example.com",
      }),
    );
    expect(res.status).toBe(204);
    const [, message, context] = notifyErrorMock.mock.calls[0] as unknown as [
      string,
      string,
      Record<string, string>,
    ];
    expect(context.route).toBe("/dashboard/athletes/:id");
    expect(context.shell).toBe("web");
    expect(message).not.toContain("athlete@example.com");
    expect(message).toContain("[email]");
  });

  it("does not alert a foreign origin or a second copy of the same error", async () => {
    const blocked = await POST(
      makeReq(
        { route: "/athlete", message: "x" },
        { origin: "https://evil.example" },
      ),
    );
    expect(blocked.status).toBe(400);
    expect(notifyErrorMock).not.toHaveBeenCalled();

    const first = await POST(makeReq({ route: "/athlete", digest: "same" }));
    const second = await POST(makeReq({ route: "/athlete", digest: "same" }));
    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a body that is not a report", async () => {
    const res = await POST(makeReq({ message: "no route" }));
    expect(res.status).toBe(400);
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });
});
