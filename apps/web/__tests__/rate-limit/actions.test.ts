/**
 * Behavioral tests for FV-13 rate limiting wired into the five auth/pairing
 * server actions: signIn, signUp, athleteSignIn, claimPairing,
 * generatePairingCode.
 *
 * Mocking strategy (mirrors webhook-route.test.ts):
 *   - server-only            → no-op (Next.js guard not available in vitest/node)
 *   - next/navigation        → redirect throws a sentinel Error so we can
 *                              detect successful-path completions
 *   - next/headers           → cookies() + headers() stubs
 *   - @/lib/supabase/service → configurable chainable stub
 *   - @/lib/supabase/server  → configurable chainable stub
 *   - @/lib/actions/rate-limit-store → controlled rateLimitGate + getRequestIp
 *   - @/lib/monitoring/notify → no-op
 *
 * Each action is tested for:
 *   1. Over-limit  → returns the throttle error; downstream auth call NOT made.
 *   2. Under-limit → proceeds; downstream auth call IS invoked (may then
 *                    return a credential error or throw the redirect sentinel).
 *   3. Fail-open   → rateLimitGate returns not-limited (simulates DB error
 *                    path); action proceeds to the downstream auth call.
 */

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (must be declared before the module-under-test is imported)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

// Redirect throws a sentinel so we can detect "action reached redirect()" in
// happy-path tests without a real Next.js router.
const REDIRECT_SENTINEL = new Error("__REDIRECT_SENTINEL__");
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw REDIRECT_SENTINEL;
  }),
}));

// next/headers stubs: cookies (used by getDeviceAthleteId/setDeviceAthleteId)
// and headers (used by getRequestIp).
let cookieStore: Record<string, string> = {};
const cookiesMock = {
  get: (name: string) =>
    cookieStore[name] ? { value: cookieStore[name] } : undefined,
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: () => cookiesMock,
  headers: () => headersMock,
}));
// headersMock defined after because it needs to be mutable.
let headersMap: Record<string, string | null> = {};
const headersMock = {
  get: (key: string) => headersMap[key] ?? null,
};

// Controlled rateLimitGate mock. Default: not limited. Tests override per case.
const rateLimitGateMock: Mock = vi.fn(async () => ({ limited: false }));
const getRequestIpMock: Mock = vi.fn(async () => "1.2.3.4");
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: (...args: unknown[]) => rateLimitGateMock(...args),
  getRequestIp: () => getRequestIpMock(),
}));

// notifyError — no-op in tests.
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: vi.fn(async () => {}),
}));

// Auth guards — requireParent()/requireAthlete() resolve to fixed UUIDs so the
// pairing actions run without a real Supabase session. Declared at the top
// level (vi.mock is hoisted regardless, but keeping it here reflects its real
// execution order and avoids the "nested vi.mock" warning).
vi.mock("@/lib/auth/guards", () => ({
  requireParent: vi.fn(async () => ({ userId: "parent-uuid-001" })),
  requireAthlete: vi.fn(async () => ({ userId: "athlete-uuid-001" })),
}));

// Supabase service client stub. Rebuilt per test via makeServiceMock().
let serviceMockImpl: ReturnType<typeof makeServiceMock>;
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => serviceMockImpl,
}));

// Supabase server (RLS-scoped) client stub.
let serverMockImpl: ReturnType<typeof makeServerMock>;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => serverMockImpl,
}));

// ---------------------------------------------------------------------------
// Import modules under test AFTER mocks are registered
// ---------------------------------------------------------------------------

import {
  signIn,
  signUp,
  requestPasswordReset,
  updatePassword,
} from "@/lib/actions/auth";
import {
  generatePairingCode,
  claimPairing,
  athleteSignIn,
} from "@/lib/actions/pairings";
// FV-13b added HMAC signing to device cookies; verifyDeviceValue rejects plain
// UUIDs. Use signDeviceValue with the well-known dev-fallback secret so the
// test helper stores a value the real verifyDeviceValue accepts in non-prod.
import { signDeviceValue } from "@/lib/auth/device-cookie";
const DEV_COOKIE_SECRET = "dev-only-device-cookie-hmac-secret-not-for-prod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Service-client stub. Supports the call patterns used by the five actions:
 *   - auth.admin.getUserById(id)    → { data: { user: { email } }, error }
 *   - auth.admin.updateUserById(id) → { error }
 *   - from(table).select(...).eq(...).maybeSingle() → { data, error }
 *   - from(table).insert({...})    → { error }
 *   - from(table).update({...}).eq(...).is(...).gt(...).select(...).maybeSingle()
 *                                  → { data, error }
 *
 * All operations default to success (null errors). Override per test.
 */
interface ServiceMockOptions {
  getUserByIdError?: { message: string } | null;
  getUserByIdEmail?: string | null;
  updateUserByIdError?: { message: string } | null;
  linkData?: { athlete_id: string } | null;
  linkError?: { message: string } | null;
  consumeData?: { athlete_id: string } | null;
  consumeError?: { message: string } | null;
  insertError?: { message: string } | null;
}

function makeServiceMock(opts: ServiceMockOptions = {}) {
  const {
    getUserByIdError = null,
    getUserByIdEmail = "athlete-fake@internal.fromvictoryapp.com",
    updateUserByIdError = null,
    linkData = { athlete_id: "athlete-uuid-001" },
    linkError = null,
    consumeData = { athlete_id: "athlete-uuid-001" },
    consumeError = null,
    insertError = null,
  } = opts;

  return {
    auth: {
      admin: {
        getUserById: vi.fn(async (_id: string) => ({
          data: {
            user: getUserByIdError
              ? null
              : { email: getUserByIdEmail ?? undefined },
          },
          error: getUserByIdError,
        })),
        updateUserById: vi.fn(async (_id: string, _opts: unknown) => ({
          error: updateUserByIdError,
        })),
      },
    },
    from: (table: string) => {
      // FV-320: profiles table handles username-taken check (SELECT) and
      // username UPDATE. Both succeed by default (username not taken, update ok).
      if (table === "profiles") {
        return {
          select: (_cols: string, _opts?: unknown) => ({
            eq: (_col: string, _val: unknown) => ({
              eq: (_col2: string, _val2: unknown) => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          update: (_row: unknown) => ({
            eq: (_col: string, _val: unknown) => ({
              eq: async (_col2: string, _val2: unknown) => ({ error: null }),
            }),
          }),
        };
      }

      // device_pairings + parent_athlete_links (pre-FV-320 behaviour preserved).
      // FV-320: peek (non-consuming SELECT on device_pairings) uses the same
      // is().gt() path as before but returns a valid athlete_id by default so
      // tests that set consumeData: null only affect the atomic consume step.
      const chainBase = {
        select: (_cols: string, _opts?: unknown) => ({
          eq: (_col: string, _val: unknown) => ({
            eq: (_col2: string, _val2: unknown) => ({
              maybeSingle: async () => ({ data: linkData, error: linkError }),
            }),
            maybeSingle: async () => ({ data: linkData, error: linkError }),
            is: (_col3: string, _val3: unknown) => ({
              gt: (_col4: string, _val4: unknown) => ({
                // device_pairings non-consuming peek: always returns a valid
                // athlete_id so the peek never blocks on consumeData: null.
                maybeSingle: async () => ({
                  data: { athlete_id: "athlete-uuid-001" },
                  error: null,
                }),
              }),
            }),
          }),
        }),
        insert: vi.fn(async (_row: unknown) => ({ error: insertError })),
        // FV-177: generatePairingCode now voids prior unconsumed codes via
        // delete().eq("athlete_id", …).is("consumed_at", null) before insert.
        delete: () => ({
          eq: (_col: string, _val: unknown) => ({
            is: async (_col2: string, _val2: unknown) => ({ error: null }),
          }),
        }),
        update: (_row: unknown) => ({
          eq: (_col: string, _val: unknown) => ({
            is: (_col2: string, _val2: unknown) => ({
              gt: (_col3: string, _val3: unknown) => ({
                select: (_cols2: string) => ({
                  maybeSingle: async () => ({
                    data: consumeData,
                    error: consumeError,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
      return chainBase;
    },
  };
}

/**
 * RLS-scoped server client stub. Covers signInWithPassword used by signIn,
 * claimPairing, and athleteSignIn.
 */
interface ServerMockOptions {
  signUpData?: { user: { id: string } } | null;
  signUpError?: { message: string; status?: number; code?: string } | null;
  signInError?: { message: string; status?: number; code?: string } | null;
  signInProfileRole?: string;
  profileInsertError?: { message: string } | null;
  resetPasswordError?: { message: string; status?: number; code?: string } | null;
  updateUserError?: { message: string; status?: number; code?: string } | null;
}

function makeServerMock(opts: ServerMockOptions = {}) {
  const {
    signUpData = { user: { id: "parent-uuid-new" } },
    signUpError = null,
    signInError = null,
    signInProfileRole = "parent",
    profileInsertError = null,
    resetPasswordError = null,
    updateUserError = null,
  } = opts;

  return {
    auth: {
      signUp: vi.fn(async (_opts: unknown) => ({
        data: signUpError ? null : signUpData,
        error: signUpError,
      })),
      signInWithPassword: vi.fn(async (_opts: unknown) => ({
        // Real Supabase returns data.user on success; signIn (FV-326) now reads
        // it to fetch the role for a role-aware landing redirect.
        data: signInError ? null : { user: { id: "signed-in-uuid" } },
        error: signInError,
      })),
      resetPasswordForEmail: vi.fn(async (_email: string, _opts?: unknown) => ({
        error: resetPasswordError,
      })),
      updateUser: vi.fn(async (_opts: unknown) => ({
        error: updateUserError,
      })),
    },
    from: (_table: string) => ({
      insert: vi.fn(async (_row: unknown) => ({ error: profileInsertError })),
      // signIn's role-aware landing (FV-326): .select("role").eq(...).single().
      // Default to a parent so the existing happy-path test lands on /dashboard.
      select: (_cols: string) => ({
        eq: (_col: string, _val: unknown) => ({
          single: async () => ({
            data: { role: signInProfileRole },
            error: null,
          }),
        }),
      }),
    }),
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  cookieStore = {};
  headersMap = {};
  rateLimitGateMock.mockReset();
  rateLimitGateMock.mockResolvedValue({ limited: false });
  getRequestIpMock.mockReset();
  getRequestIpMock.mockResolvedValue("1.2.3.4");
  serviceMockImpl = makeServiceMock();
  serverMockImpl = makeServerMock();
});

// ===========================================================================
// 1. signIn
// ===========================================================================

describe("signIn — rate limiting", () => {
  function makeFormData(email = "coach@example.com", password = "correct123") {
    const fields: Record<string, string> = { email, password };
    return { get: (key: string) => fields[key] ?? null } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling signInWithPassword", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await signIn(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    expect(serverMockImpl.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("under-limit: proceeds — signInWithPassword IS called (returns credential error)", async () => {
    serverMockImpl = makeServerMock({
      signInError: { message: "Invalid login credentials", status: 400 },
    });

    await signIn(null, makeFormData()).catch(() => {}); // may throw redirect

    expect(serverMockImpl.auth.signInWithPassword).toHaveBeenCalledOnce();
  });

  it("under-limit happy path: signInWithPassword called and redirect fires", async () => {
    serverMockImpl = makeServerMock({ signInError: null });

    let threw: Error | null = null;
    try {
      await signIn(null, makeFormData());
    } catch (e) {
      threw = e as Error;
    }

    expect(serverMockImpl.auth.signInWithPassword).toHaveBeenCalledOnce();
    expect(threw).toBe(REDIRECT_SENTINEL);
  });

  it("fail-open: rateLimitGate returns not-limited (simulates DB error) — signInWithPassword IS called", async () => {
    // rateLimitGate failing open is the default mock (limited: false),
    // but we name the intent explicitly for documentation.
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serverMockImpl = makeServerMock({
      signInError: { message: "Invalid login credentials", status: 400 },
    });

    await signIn(null, makeFormData()).catch(() => {});

    expect(serverMockImpl.auth.signInWithPassword).toHaveBeenCalledOnce();
  });

  it("keys on normalized email (lowercase) — rateLimitGate receives the email", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    await signIn(null, makeFormData("Coach@Example.COM"));

    expect(rateLimitGateMock).toHaveBeenCalledWith(
      "sign_in",
      "coach@example.com",
    );
  });
});

// ===========================================================================
// 2. signUp
// ===========================================================================

describe("signUp — rate limiting", () => {
  function makeFormData(
    email = "newparent@example.com",
    password = "password123",
    first_name = "Alex",
    consent = "on",
  ) {
    const fields: Record<string, string> = { email, password, first_name, consent };
    return { get: (key: string) => fields[key] ?? null } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling supabase.auth.signUp", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await signUp(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    expect(serverMockImpl.auth.signUp).not.toHaveBeenCalled();
  });

  it("under-limit: proceeds — supabase.auth.signUp IS called", async () => {
    serverMockImpl = makeServerMock({
      signUpError: { message: "over_email_send_rate_limit" },
    });

    await signUp(null, makeFormData()).catch(() => {});

    expect(serverMockImpl.auth.signUp).toHaveBeenCalledOnce();
  });

  it("under-limit happy path: signUp + profile insert complete and redirect fires", async () => {
    serverMockImpl = makeServerMock({
      signUpError: null,
      profileInsertError: null,
    });

    let threw: Error | null = null;
    try {
      await signUp(null, makeFormData());
    } catch (e) {
      threw = e as Error;
    }

    expect(serverMockImpl.auth.signUp).toHaveBeenCalledOnce();
    expect(threw).toBe(REDIRECT_SENTINEL);
  });

  it("fail-open: rateLimitGate returns not-limited — auth.signUp IS called", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serverMockImpl = makeServerMock({
      signUpError: { message: "over_email_send_rate_limit" },
    });

    await signUp(null, makeFormData()).catch(() => {});

    expect(serverMockImpl.auth.signUp).toHaveBeenCalledOnce();
  });

  it("keys on request IP (no stable identity at signup)", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    getRequestIpMock.mockResolvedValue("10.0.0.1");

    await signUp(null, makeFormData());

    expect(rateLimitGateMock).toHaveBeenCalledWith("sign_up", "10.0.0.1");
  });

  it("fails open when IP is null — still calls the gate with (sign_up, null), then proceeds", async () => {
    getRequestIpMock.mockResolvedValue(null);
    rateLimitGateMock.mockResolvedValue({ limited: false }); // fail-open behavior

    serverMockImpl = makeServerMock({
      signUpError: { message: "any error" },
    });

    await signUp(null, makeFormData()).catch(() => {});

    // Pin the call contract: the gate IS invoked with a null identifier (the
    // gate itself fails open on null) — guards against a future silent bypass
    // that skips the gate entirely when IP is unavailable.
    expect(rateLimitGateMock).toHaveBeenCalledWith("sign_up", null);
    expect(serverMockImpl.auth.signUp).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// 3. athleteSignIn
// ===========================================================================

describe("athleteSignIn — rate limiting", () => {
  const ATHLETE_ID = "athlete-cookie-uuid";

  function setAthleteCookie(id: string = ATHLETE_ID) {
    cookieStore["fv_device_athlete_id"] = signDeviceValue(id, DEV_COOKIE_SECRET);
  }

  function makeFormData(password = "mypassword") {
    return {
      get: (key: string) => (key === "password" ? password : null),
    } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling auth.admin.getUserById", async () => {
    setAthleteCookie();
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await athleteSignIn(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many tries/i),
    });
    expect(serviceMockImpl.auth.admin.getUserById).not.toHaveBeenCalled();
  });

  it("under-limit: proceeds — auth.admin.getUserById IS called", async () => {
    setAthleteCookie();
    rateLimitGateMock.mockResolvedValue({ limited: false });

    serverMockImpl = makeServerMock({
      signInError: { message: "Invalid login credentials" },
    });

    await athleteSignIn(null, makeFormData()).catch(() => {});

    expect(serviceMockImpl.auth.admin.getUserById).toHaveBeenCalledOnce();
  });

  it("under-limit happy path: getUserById + signInWithPassword + redirect fires", async () => {
    setAthleteCookie();
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serverMockImpl = makeServerMock({ signInError: null });

    let threw: Error | null = null;
    try {
      await athleteSignIn(null, makeFormData());
    } catch (e) {
      threw = e as Error;
    }

    expect(serviceMockImpl.auth.admin.getUserById).toHaveBeenCalledOnce();
    expect(threw).toBe(REDIRECT_SENTINEL);
  });

  it("fail-open: rateLimitGate not-limited — getUserById IS called", async () => {
    setAthleteCookie();
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serverMockImpl = makeServerMock({
      signInError: { message: "Invalid login credentials" },
    });

    await athleteSignIn(null, makeFormData()).catch(() => {});

    expect(serviceMockImpl.auth.admin.getUserById).toHaveBeenCalledOnce();
  });

  it("keys on device athlete ID from cookie", async () => {
    setAthleteCookie(ATHLETE_ID);
    rateLimitGateMock.mockResolvedValue({ limited: true });

    await athleteSignIn(null, makeFormData());

    expect(rateLimitGateMock).toHaveBeenCalledWith(
      "athlete_sign_in",
      ATHLETE_ID,
    );
  });

  it("returns not-paired error (before rate limit) when cookie is absent", async () => {
    // cookieStore is empty — no device cookie set
    const result = await athleteSignIn(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/paired|pair/i),
    });
    // Rate limit gate should not be called if the cookie guard fires first
    expect(rateLimitGateMock).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. claimPairing
// ===========================================================================

describe("claimPairing — rate limiting", () => {
  function makeFormData(
    code = "testcode123",
    password = "password123",
    password_confirm = "password123",
    username = "testuser7", // FV-320: ClaimSchema now requires username
  ) {
    const fields: Record<string, string> = { code, password, password_confirm, username };
    return { get: (key: string) => fields[key] ?? null } as FormData;
  }

  it("over-limit: returns throttle error BEFORE atomic consume (auth.admin NOT called)", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await claimPairing(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many tries/i),
    });
    // The service client's update chain (atomic consume) must not be called
    expect(serviceMockImpl.auth.admin.getUserById).not.toHaveBeenCalled();
    expect(serviceMockImpl.auth.admin.updateUserById).not.toHaveBeenCalled();
  });

  it("under-limit: proceeds past rate check — atomic consume IS attempted", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    // consumeData: null simulates an expired/invalid code (safe to trigger
    // without the full claim flow completing)
    serviceMockImpl = makeServiceMock({ consumeData: null });

    const result = await claimPairing(null, makeFormData());

    // The invalid-code error is fine — it means rate limit passed and the
    // request proceeded to the atomic consume step.
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid|expired|used/i),
    });
  });

  it("under-limit happy path: claim proceeds to redirect", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serviceMockImpl = makeServiceMock({
      consumeData: { athlete_id: "athlete-uuid-001" },
      consumeError: null,
    });
    serverMockImpl = makeServerMock({ signInError: null });

    let threw: Error | null = null;
    try {
      await claimPairing(null, makeFormData());
    } catch (e) {
      threw = e as Error;
    }

    // The action either redirects (sentinel) or reaches auth steps.
    expect(threw).toBe(REDIRECT_SENTINEL);
  });

  it("fail-open: rateLimitGate not-limited — request proceeds past rate check", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serviceMockImpl = makeServiceMock({ consumeData: null }); // invalid code = safe abort

    const result = await claimPairing(null, makeFormData());

    // Reached the consume step (invalid code aborts but rate limit passed).
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid|expired|used/i),
    });
  });

  it("keys on request IP", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    getRequestIpMock.mockResolvedValue("10.0.0.2");

    await claimPairing(null, makeFormData());

    expect(rateLimitGateMock).toHaveBeenCalledWith("claim_pairing", "10.0.0.2");
  });

  it("fails open when IP is null — still calls the gate with (claim_pairing, null), then proceeds to consume", async () => {
    getRequestIpMock.mockResolvedValue(null);
    rateLimitGateMock.mockResolvedValue({ limited: false }); // gate fails open on null
    serviceMockImpl = makeServiceMock({ consumeData: null }); // invalid code = safe abort

    const result = await claimPairing(null, makeFormData());

    // Pin the call contract: the gate IS invoked even when IP is unavailable,
    // and the request proceeds past the rate check to the atomic consume.
    expect(rateLimitGateMock).toHaveBeenCalledWith("claim_pairing", null);
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid|expired|used/i),
    });
  });
});

// ===========================================================================
// 5. generatePairingCode
// ===========================================================================

describe("generatePairingCode — rate limiting", () => {
  // requireParent() is mocked at the top level (see vi.mock above) to resolve
  // to a fixed parent UUID, so these tests exercise the rate-limit + link-check
  // path without a real Supabase session.

  function makeFormData(athleteId = "athlete-uuid-001") {
    return {
      get: (key: string) => (key === "athlete_id" ? athleteId : null),
    } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling the DB link check", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await generatePairingCode(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    // The service.from("parent_athlete_links")... chain should NOT be called
    // We verify this indirectly: if the throttle error is returned the link
    // check and insert could not have run.
  });

  it("under-limit: proceeds — link check IS consulted (no link row → error)", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    // No link row → "You can't pair this athlete."
    serviceMockImpl = makeServiceMock({ linkData: null });

    const result = await generatePairingCode(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/can't pair/i),
    });
  });

  it("under-limit happy path: link exists, code is generated and returned", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serviceMockImpl = makeServiceMock({
      linkData: { athlete_id: "athlete-uuid-001" },
      insertError: null,
    });

    const result = await generatePairingCode(null, makeFormData());

    expect(result).toMatchObject({ ok: true });
    if (result && result.ok) {
      expect(typeof result.code).toBe("string");
      expect(result.code.length).toBeGreaterThan(0);
    }
  });

  it("fail-open: rateLimitGate not-limited — proceeds to link check", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serviceMockImpl = makeServiceMock({ linkData: null }); // no link = safe abort

    const result = await generatePairingCode(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/can't pair/i),
    });
  });

  it("keys on parentId (from requireParent, non-spoofable)", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    await generatePairingCode(null, makeFormData());

    expect(rateLimitGateMock).toHaveBeenCalledWith(
      "generate_pairing_code",
      "parent-uuid-001",
    );
  });
});

// ===========================================================================
// 6. requestPasswordReset (FV-185)
// ===========================================================================

describe("requestPasswordReset — rate limiting (FV-185)", () => {
  function makeFormData(email = "parent@example.com") {
    const fields: Record<string, string> = { email };
    return { get: (key: string) => fields[key] ?? null } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling resetPasswordForEmail", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await requestPasswordReset(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    expect(serverMockImpl.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("under-limit: proceeds — resetPasswordForEmail IS called, returns ok:true", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });

    const result = await requestPasswordReset(null, makeFormData());

    expect(result).toMatchObject({ ok: true });
    expect(serverMockImpl.auth.resetPasswordForEmail).toHaveBeenCalledOnce();
  });

  it("keys on the normalized (lowercased/trimmed) email", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    await requestPasswordReset(null, makeFormData("  MixedCase@Example.COM  "));

    expect(rateLimitGateMock).toHaveBeenCalledWith(
      "password_reset",
      "mixedcase@example.com",
    );
  });

  it("synthetic athlete email short-circuits BEFORE the gate (no send, no gate call)", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });

    const result = await requestPasswordReset(
      null,
      makeFormData("someone@athletes.fromvictory.app"),
    );

    expect(result).toMatchObject({ ok: true });
    expect(rateLimitGateMock).not.toHaveBeenCalled();
    expect(serverMockImpl.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("fail-open: rateLimitGate not-limited — resetPasswordForEmail IS called", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });
    serverMockImpl = makeServerMock({
      resetPasswordError: { message: "smtp down" },
    });

    const result = await requestPasswordReset(null, makeFormData());

    // Anti-enumeration: still ok:true even on a downstream send error.
    expect(result).toMatchObject({ ok: true });
    expect(serverMockImpl.auth.resetPasswordForEmail).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// 7. updatePassword (FV-185)
// ===========================================================================

describe("updatePassword — rate limiting (FV-185)", () => {
  function makeFormData(password = "newpassword123") {
    const fields: Record<string, string> = { password };
    return { get: (key: string) => fields[key] ?? null } as FormData;
  }

  it("over-limit: returns throttle error WITHOUT calling updateUser", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });

    const result = await updatePassword(null, makeFormData());

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/too many attempts/i),
    });
    expect(serverMockImpl.auth.updateUser).not.toHaveBeenCalled();
  });

  it("under-limit happy path: updateUser IS called and redirect fires", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: false });

    let threw: Error | null = null;
    try {
      await updatePassword(null, makeFormData());
    } catch (e) {
      threw = e as Error;
    }

    expect(serverMockImpl.auth.updateUser).toHaveBeenCalledOnce();
    expect(threw).toBe(REDIRECT_SENTINEL);
  });

  it("keys on request IP", async () => {
    rateLimitGateMock.mockResolvedValue({ limited: true });
    getRequestIpMock.mockResolvedValue("9.9.9.9");

    await updatePassword(null, makeFormData());

    expect(rateLimitGateMock).toHaveBeenCalledWith("password_update", "9.9.9.9");
  });

  it("fails open when IP is null — gate invoked with (password_update, null), then proceeds", async () => {
    getRequestIpMock.mockResolvedValue(null);
    rateLimitGateMock.mockResolvedValue({ limited: false });

    await updatePassword(null, makeFormData()).catch(() => {});

    expect(rateLimitGateMock).toHaveBeenCalledWith("password_update", null);
    expect(serverMockImpl.auth.updateUser).toHaveBeenCalledOnce();
  });
});
