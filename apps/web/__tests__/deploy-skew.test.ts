import { describe, it, expect } from "vitest";

import {
  STALE_DEPLOYMENT_RELOAD_COOLDOWN_MS,
  isStaleDeploymentError,
  shouldReloadForStaleDeployment,
} from "@/lib/deploy-skew";

describe("stale deployment detection (FV-731)", () => {
  it("recognizes a missing server action from an older deployment", () => {
    expect(
      isStaleDeploymentError({
        message:
          'Failed to find Server Action "abc". This request might be from an older or newer deployment. https://nextjs.org/docs/messages/failed-to-find-server-action',
      }),
    ).toBe(true);
    expect(
      isStaleDeploymentError({
        message: 'Server Action "x" was not found on the server.',
      }),
    ).toBe(true);
  });

  it("does not treat an ordinary render error as deployment skew", () => {
    expect(
      isStaleDeploymentError({
        message:
          "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.",
      }),
    ).toBe(false);
    expect(isStaleDeploymentError({ message: "" })).toBe(false);
  });

  it("allows one reload per cooldown", () => {
    const now = 1_000_000;
    expect(shouldReloadForStaleDeployment(now, null)).toBe(true);
    expect(shouldReloadForStaleDeployment(now, now)).toBe(false);
    expect(
      shouldReloadForStaleDeployment(
        now + STALE_DEPLOYMENT_RELOAD_COOLDOWN_MS,
        now,
      ),
    ).toBe(true);
  });
});
