/**
 * FV-680 — ci-alert must only report "dispatched" when Resend accepted the
 * email. The SDK returns API errors (e.g. 422 for a malformed `to`) instead
 * of throwing; that used to be logged as success.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { ciAlert } from "@/scripts/ci-alert";

const ENV = {
  RESEND_API_KEY: "re_test_key",
  ALERT_EMAIL_TO: "bad address value",
  ALERT_EMAIL_FROM: "alerts@example.test",
};

let logs: string[];
beforeEach(() => {
  Object.assign(process.env, ENV);
  sendMock.mockReset();
  logs = [];
  for (const m of ["log", "warn", "error"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      logs.push(a.map(String).join(" "));
    });
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const k of Object.keys(ENV)) delete process.env[k];
});

describe("ciAlert", () => {
  it("a returned Resend error (422) is a failure, not 'dispatched'", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { name: "validation_error", statusCode: 422, message: "Invalid `to` field." },
    });
    await expect(ciAlert("migration-drift", "drift=1")).resolves.toBe(false);
    expect(logs.join("\n")).not.toContain("dispatched");
    expect(logs.join("\n")).toContain("rejected by Resend (validation_error, status 422)");
    // Never echo configured values.
    for (const v of Object.values(ENV)) expect(logs.join("\n")).not.toContain(v);
  });

  it("an accepted send returns true and logs dispatched", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
    await expect(ciAlert("migration-drift", "drift=1")).resolves.toBe(true);
    expect(logs.join("\n")).toContain("Alert email dispatched: migration-drift");
  });

  it("a thrown network error is still a failure", async () => {
    sendMock.mockRejectedValue(new TypeError("fetch failed"));
    await expect(ciAlert("x", "y")).resolves.toBe(false);
    expect(logs.join("\n")).not.toContain("dispatched");
  });

  it("missing config is a no-op false (unchanged)", async () => {
    delete process.env.ALERT_EMAIL_TO;
    await expect(ciAlert("x", "y")).resolves.toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });
});
