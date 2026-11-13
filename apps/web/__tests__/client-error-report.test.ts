import { describe, it, expect, beforeEach } from "vitest";

import {
  isAllowedErrorOrigin,
  parseClientErrorReport,
  redactClientErrorMessage,
  sanitizeRoute,
} from "@/lib/monitoring/client-error-report";
import {
  claimClientErrorAlert,
  clientErrorAlertKey,
  resetClientErrorAlertWindow,
} from "@/lib/monitoring/client-error-rate-limit";

const ATHLETE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("client error payload (FV-729)", () => {
  it("keeps a normal route and drops the query string", () => {
    expect(sanitizeRoute("/athlete/pregame?next=/evil&token=abc")).toBe(
      "/athlete/pregame",
    );
  });

  it("replaces an athlete id in the path and ignores a userId field", () => {
    const report = parseClientErrorReport({
      route: `/dashboard/athletes/${ATHLETE_ID}`,
      userId: ATHLETE_ID,
      email: "athlete@example.com",
      shell: "ios-iap",
      digest: "abc_123",
    });
    expect(report).toEqual({
      route: "/dashboard/athletes/:id",
      digest: "abc_123",
    });
  });

  it("truncates the message and strips emails, ids, and tokens", () => {
    const message = redactClientErrorMessage(
      `Failed for athlete@example.com id ${ATHLETE_ID} bearer abcdef token=supersecret ${"x".repeat(400)}`,
    );
    expect(message).toBeDefined();
    expect(message!.length).toBeLessThanOrEqual(160);
    expect(message).not.toContain("athlete@example.com");
    expect(message).not.toContain(ATHLETE_ID);
    expect(message).not.toContain("supersecret");
    expect(message).toContain("[email]");
    expect(message).toContain("[id]");
  });

  it("rejects a route that is not a path", () => {
    expect(parseClientErrorReport({ route: "https://evil.example/athlete" })).toBe(
      null,
    );
    expect(parseClientErrorReport({ route: "athlete@example.com" })).toBe(null);
    expect(parseClientErrorReport(null)).toBe(null);
    expect(parseClientErrorReport(["/athlete"])).toBe(null);
  });

  it("drops a digest or build that is not an opaque token", () => {
    const report = parseClientErrorReport({
      route: "/athlete",
      digest: "has spaces",
      build: "not-a-sha",
      message: "Failed to find Server Action",
    });
    expect(report).toEqual({
      route: "/athlete",
      message: "Failed to find Server Action",
    });
  });

  it("allows the production host, localhost, and a configured site; blocks others", () => {
    expect(isAllowedErrorOrigin(null, undefined)).toBe(true);
    expect(
      isAllowedErrorOrigin("https://www.fromvictoryapp.com", undefined),
    ).toBe(true);
    expect(isAllowedErrorOrigin("http://localhost:3000", undefined)).toBe(true);
    expect(
      isAllowedErrorOrigin("https://preview.example", "https://preview.example"),
    ).toBe(true);
    expect(isAllowedErrorOrigin("https://evil.example", undefined)).toBe(false);
    expect(isAllowedErrorOrigin("not a url", undefined)).toBe(false);
  });
});

describe("client error alert rate limit (FV-729)", () => {
  beforeEach(() => {
    resetClientErrorAlertWindow();
  });

  it("sends one alert per key per window and caps the window at five", () => {
    const key = clientErrorAlertKey({ route: "/athlete", digest: "d1" }, "web");
    expect(claimClientErrorAlert(key)).toBe(true);
    expect(claimClientErrorAlert(key)).toBe(false);

    for (let i = 0; i < 4; i++) {
      expect(claimClientErrorAlert(`/other/${i}|`)).toBe(true);
    }
    expect(claimClientErrorAlert("/other/overflow|")).toBe(false);
  });
});
