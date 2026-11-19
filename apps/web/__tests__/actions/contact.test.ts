/**
 * FV-334: submitContact rate limiting (allowed / throttled / helper-failure).
 */
import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

vi.mock("server-only", () => ({}));

const rateLimitGateMock: Mock = vi.fn(async () => ({ limited: false }));
const getRequestIpMock: Mock = vi.fn(async () => "1.2.3.4");
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: (...a: unknown[]) => rateLimitGateMock(...a),
  getRequestIp: () => getRequestIpMock(),
}));

const sendMock: Mock = vi.fn(async () => ({ ok: true }));
vi.mock("@/lib/email/contact-notification", () => ({
  sendContactNotification: (...a: unknown[]) => sendMock(...a),
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    void p;
  },
}));

import { submitContact } from "@/lib/actions/contact";

function form(over: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const base = {
    name: "Jordan",
    email: "j@example.com",
    message: "Hello there",
    website: "",
    ...over,
  };
  for (const [k, v] of Object.entries(base)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  rateLimitGateMock.mockResolvedValue({ limited: false });
  getRequestIpMock.mockResolvedValue("1.2.3.4");
  sendMock.mockResolvedValue({ ok: true });
});

describe("submitContact rate limit (FV-334)", () => {
  it("allowed: gates on contact_form + IP, then sends", async () => {
    const res = await submitContact(null, form());
    expect(res).toEqual({ ok: true });
    expect(rateLimitGateMock).toHaveBeenCalledWith("contact_form", "1.2.3.4");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("throttled: polite error, no send", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    const res = await submitContact(null, form());
    expect(res).toEqual({
      ok: false,
      error:
        "You've sent several messages recently. Please wait a little while and try again.",
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("helper failure (fail-open result, null IP): still sends", async () => {
    getRequestIpMock.mockResolvedValue(null);
    rateLimitGateMock.mockResolvedValue({ limited: false });
    const res = await submitContact(null, form());
    expect(res).toEqual({ ok: true });
    expect(rateLimitGateMock).toHaveBeenCalledWith("contact_form", null);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("invalid input and honeypot do not consume the limit", async () => {
    await submitContact(null, form({ message: "" }));
    await submitContact(null, form({ website: "spam" }));
    expect(rateLimitGateMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
