/**
 * Regression test for the "Not {name}? Sign in as someone else" bug: on
 * /signin, forgetDevice() calls clearDeviceAthleteId() to clear the
 * __Host-fv_device_athlete_id device-pairing cookie, but Next.js's bare
 * `cookies().delete(name)` only sets `value: ''` + an expired date — it does
 * NOT add `secure`/`path`/`sameSite`. Because the cookie name carries the
 * `__Host-` prefix, EVERY Set-Cookie for that name (including a deletion)
 * must carry Secure + Path=/ + no Domain or a spec-conforming browser
 * (WebKit/Safari, Chrome, Firefox) silently drops the whole header and the
 * existing cookie survives — so the athlete could never reach a different
 * sign-in form on that device.
 *
 * This test locks in the fix: clearDeviceAthleteId() must delete the
 * __Host- cookie via `.set(name, "", { ...same attributes as creation,
 * maxAge: 0 })` so the deletion Set-Cookie mirrors setDeviceAthleteId()'s
 * creation attributes exactly.
 *
 * Mocking strategy mirrors __tests__/pairings/username-sign-in.test.ts (same
 * next/headers `cookies()` mock shape) since lib/auth/device.ts is
 * `server-only` and wraps next/headers directly — there's no lighter-weight
 * pattern in this codebase for testing a module like this.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const cookiesMock = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: () => cookiesMock,
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: vi.fn(),
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: vi.fn(async () => {}),
}));

import { clearDeviceAthleteId } from "@/lib/auth/device";

const COOKIE_NAME_PROD = "__Host-fv_device_athlete_id";
const COOKIE_NAME_DEV = "fv_device_athlete_id";

beforeEach(() => {
  cookiesMock.get.mockReset().mockReturnValue(undefined);
  cookiesMock.set.mockReset();
  cookiesMock.delete.mockReset();
});

describe("clearDeviceAthleteId — __Host- cookie deletion parity", () => {
  it("clears the __Host- cookie via .set() (not the bare .delete()) so the Set-Cookie carries required attributes", () => {
    clearDeviceAthleteId();

    // The bare `.delete()` form silently drops secure/path/sameSite and gets
    // rejected by the browser for a __Host- cookie — it must not be used for
    // this cookie name.
    expect(cookiesMock.delete).not.toHaveBeenCalledWith(COOKIE_NAME_PROD);

    const call = cookiesMock.set.mock.calls.find(
      (args) => args[0] === COOKIE_NAME_PROD,
    );
    expect(call).toBeDefined();
  });

  it("the __Host- cookie deletion carries secure: true, path: '/', and no domain attribute", () => {
    clearDeviceAthleteId();

    const call = cookiesMock.set.mock.calls.find(
      (args) => args[0] === COOKIE_NAME_PROD,
    );
    expect(call).toBeDefined();
    const [, value, options] = call!;

    expect(value).toBe("");
    expect(options).toMatchObject({
      secure: true,
      path: "/",
      maxAge: 0,
    });
    expect(options).not.toHaveProperty("domain");
  });

  it("also clears the legacy/dev plain-name cookie", () => {
    clearDeviceAthleteId();

    const call = cookiesMock.set.mock.calls.find(
      (args) => args[0] === COOKIE_NAME_DEV,
    );
    expect(call).toBeDefined();
    const [, value, options] = call!;
    expect(value).toBe("");
    expect(options).toMatchObject({ path: "/", maxAge: 0 });
  });
});
