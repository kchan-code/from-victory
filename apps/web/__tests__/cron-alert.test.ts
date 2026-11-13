import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

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

import {
  CRON_FAILURE_ALERT_THRESHOLD,
  alertCronFailure,
  redactCronMessage,
} from "@/lib/monitoring/cron-alert";

beforeEach(() => {
  notifyErrorMock.mockClear();
});

describe("cron alerts (FV-730)", () => {
  it("treats any failure in the run as over the threshold", () => {
    expect(CRON_FAILURE_ALERT_THRESHOLD).toBe(0);
  });

  it("redacts ids and emails before they can reach the mailer", () => {
    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    expect(redactCronMessage(`parent=${id} athlete@example.com failed`)).toBe(
      "parent=[id] [email] failed",
    );
  });

  it("sends one notifyError and drops a context value that is not a count", () => {
    alertCronFailure("[cron/test] failures", "athlete@example.com blew up", {
      failed: "2",
      note: "athlete@example.com",
    });
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock).toHaveBeenCalledWith(
      "[cron/test] failures",
      "[email] blew up",
      { failed: "2", note: "[redacted]" },
    );
  });
});
