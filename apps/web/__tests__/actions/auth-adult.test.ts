/**
 * Unit tests for signUpAdultAthlete (FV-326) — the 18+ self-serve signup action.
 *
 * Covers the flag gate + all input-validation paths, which return BEFORE any
 * Supabase / rate-limit call. The happy path (auth.signUp + profile self-insert
 * + session) is covered by the E2E in FV-328 rather than mocked end-to-end here.
 *
 * Runtime deps are mocked so the module imports cleanly under vitest's node env;
 * @/lib/age, @/lib/sports, and @/lib/flags are kept real (flags reads the env
 * var we toggle per test).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: vi.fn().mockResolvedValue({ limited: false }),
  getRequestIp: vi.fn().mockResolvedValue("1.2.3.4"),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { signUp: vi.fn() }, from: vi.fn() }),
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ auth: { admin: { deleteUser: vi.fn() } } }),
}));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: vi.fn() }));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn() }));

import { signUpAdultAthlete } from "@/lib/actions/auth-adult";

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}

// A fully-valid adult submission (born well before the 18-year cutoff).
const VALID: Record<string, string> = {
  email: "adult@example.com",
  password: "password123",
  first_name: "Sam",
  birthdate: "2000-01-01",
  sport: "hockey",
  age_attestation: "on",
  consent: "on",
};

describe("signUpAdultAthlete", () => {
  afterEach(() => {
    delete process.env.ENABLE_ADULT_SIGNUP;
  });

  it("refuses when ENABLE_ADULT_SIGNUP is off (the default)", async () => {
    delete process.env.ENABLE_ADULT_SIGNUP;
    const res = await signUpAdultAthlete(null, fd(VALID));
    expect(res).toMatchObject({ ok: false });
    expect(res && !res.ok && res.error).toMatch(/isn't available/i);
  });

  it("refuses when the flag is any value other than exactly 'true'", async () => {
    process.env.ENABLE_ADULT_SIGNUP = "1";
    const res = await signUpAdultAthlete(null, fd(VALID));
    expect(res).toMatchObject({ ok: false });
  });

  describe("with the flag on", () => {
    beforeEach(() => {
      process.env.ENABLE_ADULT_SIGNUP = "true";
    });

    it("rejects an under-18 birthdate (field: birthdate)", async () => {
      const res = await signUpAdultAthlete(
        null,
        fd({ ...VALID, birthdate: "2015-01-01" }),
      );
      expect(res).toMatchObject({ ok: false, field: "birthdate" });
    });

    it("requires the explicit 18+ attestation (field: age_attestation)", async () => {
      const f = fd(VALID);
      f.delete("age_attestation");
      const res = await signUpAdultAthlete(null, f);
      expect(res).toMatchObject({ ok: false, field: "age_attestation" });
    });

    it("requires a sport (field: sport)", async () => {
      const f = fd(VALID);
      f.delete("sport");
      const res = await signUpAdultAthlete(null, f);
      expect(res).toMatchObject({ ok: false, field: "sport" });
    });

    it("requires the terms/privacy consent (field: consent)", async () => {
      const f = fd(VALID);
      f.delete("consent");
      const res = await signUpAdultAthlete(null, f);
      expect(res).toMatchObject({ ok: false, field: "consent" });
    });

    it("rejects a malformed email (field: email)", async () => {
      const res = await signUpAdultAthlete(
        null,
        fd({ ...VALID, email: "not-an-email" }),
      );
      expect(res).toMatchObject({ ok: false, field: "email" });
    });

    it("rejects a too-short password (field: password)", async () => {
      const res = await signUpAdultAthlete(
        null,
        fd({ ...VALID, password: "short" }),
      );
      expect(res).toMatchObject({ ok: false, field: "password" });
    });
  });
});
