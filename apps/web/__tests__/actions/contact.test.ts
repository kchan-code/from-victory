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

const notifyErrorMock: Mock = vi.fn(async () => undefined);
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...a: unknown[]) => notifyErrorMock(...a),
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
  notifyErrorMock.mockResolvedValue(undefined);
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
      values: { name: "Jordan", email: "j@example.com", message: "Hello there" },
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

describe("submitContact send result (FV-770)", () => {
  const SEND_ERROR =
    "Your message did not go through. Please try again shortly, or email support@fromvictoryapp.com.";

  it("success: ok:true with no echoed values", async () => {
    const res = await submitContact(null, form());
    expect(res).toEqual({ ok: true });
  });

  it("send failure: honest error, values kept, reason-only log", async () => {
    sendMock.mockResolvedValue({
      ok: false,
      reason: "Resend error: bad address J@Example.com for Jordan: private words here",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitContact(
      null,
      form({ message: "private words here" }),
    );
    expect(res).toEqual({
      ok: false,
      error: SEND_ERROR,
      values: {
        name: "Jordan",
        email: "j@example.com",
        message: "private words here",
      },
    });
    const logged = JSON.stringify(errSpy.mock.calls);
    expect(logged).toContain("provider_error");
    expect(logged.toLowerCase()).not.toContain("j@example.com");
    expect(logged).not.toContain("private words here");
    expect(logged).not.toContain("Jordan");
    expect(logged).not.toContain("j@example.com");
    expect(JSON.stringify(notifyErrorMock.mock.calls)).not.toContain(
      "private words here",
    );
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });

  it("not configured: same honest error", async () => {
    sendMock.mockResolvedValue({
      ok: false,
      reason: "RESEND_API_KEY not configured",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitContact(null, form());
    expect(res).toMatchObject({ ok: false, error: SEND_ERROR });
    errSpy.mockRestore();
  });

  it("hung provider: honest error after the timeout, values kept", async () => {
    vi.useFakeTimers();
    sendMock.mockReturnValue(new Promise(() => {}));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const pending = submitContact(null, form());
    await vi.advanceTimersByTimeAsync(8000);
    const res = await pending;
    expect(res).toMatchObject({
      ok: false,
      error: SEND_ERROR,
      values: { name: "Jordan", email: "j@example.com", message: "Hello there" },
    });
    expect(JSON.stringify(errSpy.mock.calls)).toContain("timeout");
    errSpy.mockRestore();
    vi.useRealTimers();
  });

  it("validation error keeps what was typed", async () => {
    const res = await submitContact(null, form({ email: "nope" }));
    expect(res).toMatchObject({
      ok: false,
      field: "email",
      values: { name: "Jordan", email: "nope", message: "Hello there" },
    });
  });

  it("honeypot value never sends", async () => {
    await submitContact(null, form({ website: "spam" }));
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("rate-limit gate rejecting fails open and still sends", async () => {
    rateLimitGateMock.mockRejectedValue(new Error("db down"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitContact(null, form());
    expect(res).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });

  it("getRequestIp throwing fails open and still sends", async () => {
    getRequestIpMock.mockRejectedValue(new Error("no headers"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitContact(null, form());
    expect(res).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });
});
