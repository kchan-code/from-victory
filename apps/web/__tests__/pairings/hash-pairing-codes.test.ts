/**
 * Behavioral tests for FV-177 — pairing codes hashed at rest + prior codes
 * voided on regenerate + single-use claim preserved.
 *
 * Pairing codes are password-reset-class bearer tokens (claiming one sets the
 * athlete's password). These tests pin the security-critical guarantees:
 *
 *   1. Hash-at-rest          — generatePairingCode stores sha256(code), never
 *                              the raw code, and the raw code never appears in
 *                              any DB write payload.
 *   2. Claim-by-hash         — claimPairing hashes the inbound code and the
 *                              atomic consume matches on code_sha256 (= the
 *                              sha256 of the submitted code), never the raw code.
 *   3. Void-prior-on-regen   — generatePairingCode deletes prior UNCONSUMED
 *                              rows for the athlete before inserting the new one.
 *   4. Single-use idempotency— the atomic consume keeps its
 *                              .is(consumed_at, null).gt(expires_at, now)
 *                              guard, so a consumed/expired/unknown code yields
 *                              the single invalid-code error (no enumeration,
 *                              no password mutation).
 *
 * Mocking strategy mirrors __tests__/rate-limit/actions.test.ts (server-only,
 * next/navigation, next/headers, supabase service/server clients, guards,
 * rate-limit-store all stubbed). The service-client stub here additionally
 * RECORDS the insert payload, the void-delete filters, and the consume lookup
 * key so we can assert on what actually hit the DB.
 */

import { createHash } from "crypto";

import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (declared before the module-under-test is imported)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const REDIRECT_SENTINEL = new Error("__REDIRECT_SENTINEL__");
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw REDIRECT_SENTINEL;
  }),
}));

// next/headers — cookies() (device cookie set/clear) + headers() (getRequestIp).
const cookiesMock = {
  get: () => undefined,
  set: vi.fn(),
  delete: vi.fn(),
};
const headersMock = {
  get: () => null,
};
vi.mock("next/headers", () => ({
  cookies: () => cookiesMock,
  headers: () => headersMock,
}));

// Rate limiting — never limited in these tests (we're exercising the happy /
// security paths, not the throttle, which rate-limit/actions.test.ts covers).
const rateLimitGateMock: Mock = vi.fn(async () => ({ limited: false }));
const getRequestIpMock: Mock = vi.fn(async () => "1.2.3.4");
vi.mock("@/lib/actions/rate-limit-store", () => ({
  rateLimitGate: (...args: unknown[]) => rateLimitGateMock(...args),
  getRequestIp: () => getRequestIpMock(),
}));

vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: vi.fn(async () => {}),
}));

// Device cookie binding — no-op stub (we don't assert on it here).
vi.mock("@/lib/auth/device", () => ({
  setDeviceAthleteId: vi.fn(),
  getDeviceAthleteId: vi.fn(() => null),
  clearDeviceAthleteId: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireParent: vi.fn(async () => ({ userId: "parent-uuid-001" })),
  requireAthlete: vi.fn(async () => ({ userId: "athlete-uuid-001" })),
}));

let serviceMockImpl: ReturnType<typeof makeServiceMock>;
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => serviceMockImpl,
}));

let serverMockImpl: ReturnType<typeof makeServerMock>;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => serverMockImpl,
}));

// ---------------------------------------------------------------------------
// Import modules under test AFTER mocks are registered
// ---------------------------------------------------------------------------

import { generatePairingCode, claimPairing } from "@/lib/actions/pairings";

// ---------------------------------------------------------------------------
// Recording service-client stub
// ---------------------------------------------------------------------------

interface ServiceRecorder {
  insertPayloads: Record<string, unknown>[];
  voidDelete: { athleteEq?: unknown; consumedIsNull?: boolean } | null;
  consumeLookup: { column?: string; value?: unknown } | null;
}

interface ServiceMockOptions {
  linkData?: { athlete_id: string } | null;
  linkError?: { message: string } | null;
  // FV-320: peekData is the non-consuming device_pairings SELECT result.
  // Defaults to { athlete_id: "athlete-uuid-001" } so existing tests that
  // only set consumeData still get a valid peek (the peek always finds the
  // code; only the atomic consume can then fail). Set peekData: null to
  // simulate a code that is already expired/consumed at peek time.
  peekData?: { athlete_id: string } | null;
  consumeData?: { athlete_id: string } | null;
  consumeError?: { message: string } | null;
  insertError?: { message: string } | null;
  voidError?: { message: string } | null;
  getUserByIdEmail?: string | null;
  getUserByIdError?: { message: string } | null;
  updateUserByIdError?: { message: string } | null;
}

function makeServiceMock(opts: ServiceMockOptions = {}) {
  const {
    linkData = { athlete_id: "athlete-uuid-001" },
    linkError = null,
    peekData = { athlete_id: "athlete-uuid-001" }, // FV-320: separate from consumeData
    consumeData = { athlete_id: "athlete-uuid-001" },
    consumeError = null,
    insertError = null,
    voidError = null,
    getUserByIdEmail = "athlete-fake@internal.fromvictoryapp.com",
    getUserByIdError = null,
    updateUserByIdError = null,
  } = opts;

  const recorder: ServiceRecorder = {
    insertPayloads: [],
    voidDelete: null,
    consumeLookup: null,
  };

  const client = {
    __recorder: recorder,
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
        updateUserById: vi.fn(async (_id: string, _o: unknown) => ({
          error: updateUserByIdError,
        })),
      },
    },
    from: (table: string) => {
      // profiles table: handles (a) username-taken check SELECT and
      // (b) username UPDATE on the athlete's profile.
      // FV-320: claimPairing now also touches profiles for the username flow.
      if (table === "profiles") {
        return {
          // username-taken check: select("id").eq("username",...).eq("role","athlete").maybeSingle()
          // Returns null (not taken) by default so existing tests pass unchanged.
          select: (_cols: string) => ({
            eq: (_c: string, _v: unknown) => ({
              eq: (_c2: string, _v2: unknown) => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          // username SET: update({username}).eq("id",...).eq("role",...)
          update: (_row: unknown) => ({
            eq: (_c: string, _v: unknown) => ({
              eq: async (_c2: string, _v2: unknown) => ({ error: null }),
            }),
          }),
        };
      }

      // device_pairings + parent_athlete_links (original mock behaviour).
      return {
        // parent_athlete_links link check: select().eq().eq().maybeSingle()
        // device_pairings peek: select().eq().is().gt().maybeSingle()
        // Both resolve via the same chained select handler.
        select: (_cols: string, _o?: unknown) => ({
          eq: (_c: string, _v: unknown) => ({
            eq: (_c2: string, _v2: unknown) => ({
              maybeSingle: async () => ({ data: linkData, error: linkError }),
            }),
            is: (_c2: string, _v2: unknown) => ({
              gt: (_c3: string, _v3: unknown) => ({
                // device_pairings non-consuming peek (FV-320).
                // Uses peekData (not consumeData) so tests that set
                // consumeData: null still get a valid peek result.
                maybeSingle: async () => ({
                  data: peekData,
                  error: null,
                }),
              }),
            }),
            maybeSingle: async () => ({ data: linkData, error: linkError }),
          }),
        }),

        // Void-prior + (in claim) consume happen via delete()/update().
        delete: () => ({
          eq: (col: string, val: unknown) => {
            recorder.voidDelete = {
              ...(recorder.voidDelete ?? {}),
              athleteEq: { column: col, value: val },
            };
            return {
              is: async (_c: string, _v: unknown) => {
                recorder.voidDelete = {
                  ...(recorder.voidDelete ?? {}),
                  consumedIsNull: true,
                };
                return { error: voidError };
              },
            };
          },
        }),

        insert: vi.fn(async (row: Record<string, unknown>) => {
          recorder.insertPayloads.push(row);
          return { error: insertError };
        }),

        // Atomic consume: update().eq(code_sha256, hash).is().gt().select().maybeSingle()
        update: (_row: unknown) => ({
          eq: (col: string, val: unknown) => {
            recorder.consumeLookup = { column: col, value: val };
            return {
              is: (_c2: string, _v2: unknown) => ({
                gt: (_c3: string, _v3: unknown) => ({
                  select: (_cols2: string) => ({
                    maybeSingle: async () => ({
                      data: consumeData,
                      error: consumeError,
                    }),
                  }),
                }),
              }),
            };
          },
        }),
      };
    },
  };

  return client;
}

interface ServerMockOptions {
  signInError?: { message: string } | null;
}

function makeServerMock(opts: ServerMockOptions = {}) {
  const { signInError = null } = opts;
  return {
    auth: {
      signInWithPassword: vi.fn(async (_o: unknown) => ({ error: signInError })),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256Hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function genFormData(athleteId = "athlete-uuid-001") {
  return {
    get: (key: string) => (key === "athlete_id" ? athleteId : null),
  } as unknown as FormData;
}

function claimFormData(
  code = "raw-pairing-code-abc123",
  password = "password123",
  password_confirm = "password123",
  username = "testuser7", // FV-320: username is now required by ClaimSchema
) {
  const fields: Record<string, string> = { code, password, password_confirm, username };
  return { get: (key: string) => fields[key] ?? null } as unknown as FormData;
}

beforeEach(() => {
  rateLimitGateMock.mockReset();
  rateLimitGateMock.mockResolvedValue({ limited: false });
  getRequestIpMock.mockReset();
  getRequestIpMock.mockResolvedValue("1.2.3.4");
  serviceMockImpl = makeServiceMock();
  serverMockImpl = makeServerMock();
});

// ===========================================================================
// 1. Hash-at-rest
// ===========================================================================

describe("generatePairingCode — hash at rest (FV-177)", () => {
  it("stores code_sha256 and NEVER the raw code; returned code hashes to the stored value", async () => {
    const result = await generatePairingCode(null, genFormData());

    expect(result).toMatchObject({ ok: true });
    if (!result || !result.ok) throw new Error("expected ok result");

    const rawCode = result.code;
    const payloads = serviceMockImpl.__recorder.insertPayloads;
    expect(payloads).toHaveLength(1);
    const inserted = payloads[0]!;

    // The stored column is code_sha256, and there is NO plaintext `code` column.
    expect(inserted).toHaveProperty("code_sha256");
    expect(inserted).not.toHaveProperty("code");

    // The stored hash equals sha256(returned raw code).
    expect(inserted.code_sha256).toBe(sha256Hex(rawCode));

    // Defense-in-depth: the raw code is NOT present anywhere in the payload.
    const serialized = JSON.stringify(inserted);
    expect(serialized).not.toContain(rawCode);
  });

  it("stored hash is 64 hex chars (sha256 hex)", async () => {
    const result = await generatePairingCode(null, genFormData());
    if (!result || !result.ok) throw new Error("expected ok result");

    const inserted = serviceMockImpl.__recorder.insertPayloads[0]!;
    expect(typeof inserted.code_sha256).toBe("string");
    expect(inserted.code_sha256 as string).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ===========================================================================
// 2. Void-prior-on-regenerate
// ===========================================================================

describe("generatePairingCode — voids prior unused codes (FV-177)", () => {
  it("deletes prior UNCONSUMED rows for the athlete before inserting the new code", async () => {
    const result = await generatePairingCode(null, genFormData("athlete-uuid-001"));
    expect(result).toMatchObject({ ok: true });

    const voided = serviceMockImpl.__recorder.voidDelete;
    expect(voided).not.toBeNull();
    // Scoped to this athlete...
    expect(voided?.athleteEq).toEqual({
      column: "athlete_id",
      value: "athlete-uuid-001",
    });
    // ...and only UNCONSUMED rows (consumed_at IS NULL) — consumed rows are
    // an audit trail the reaper ages out, not deleted here.
    expect(voided?.consumedIsNull).toBe(true);
  });

  it("a void-delete failure is non-fatal — the new code is still issued", async () => {
    serviceMockImpl = makeServiceMock({ voidError: { message: "boom" } });

    const result = await generatePairingCode(null, genFormData());

    expect(result).toMatchObject({ ok: true });
    expect(serviceMockImpl.__recorder.insertPayloads).toHaveLength(1);
  });
});

// ===========================================================================
// 3. Claim-by-hash + single-use idempotency
// ===========================================================================

describe("claimPairing — claim by hash + single-use (FV-177)", () => {
  it("atomic consume matches on code_sha256 = sha256(submitted code), not the raw code", async () => {
    const rawCode = "raw-pairing-code-abc123";
    serverMockImpl = makeServerMock({ signInError: null });

    let threw: Error | null = null;
    try {
      await claimPairing(null, claimFormData(rawCode));
    } catch (e) {
      threw = e as Error;
    }

    // Happy path redirects to /athlete.
    expect(threw).toBe(REDIRECT_SENTINEL);

    const lookup = serviceMockImpl.__recorder.consumeLookup;
    expect(lookup?.column).toBe("code_sha256");
    expect(lookup?.value).toBe(sha256Hex(rawCode));
    // The raw code must NOT be the lookup value.
    expect(lookup?.value).not.toBe(rawCode);
  });

  it("preserves single-use: an already-consumed/expired/unknown code yields the single invalid error and no password mutation", async () => {
    // consumeData: null = the conditional UPDATE matched no row (consumed,
    // expired, or never existed). This is the PR #21 atomic-lock contract.
    serviceMockImpl = makeServiceMock({ consumeData: null });

    const result = await claimPairing(null, claimFormData("any-code"));

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/invalid|expired|used/i),
    });

    // No password change attempted when the lock did not grant the claim.
    expect(serviceMockImpl.auth.admin.updateUserById).not.toHaveBeenCalled();
    // And it WAS looked up by hash, not raw code.
    expect(serviceMockImpl.__recorder.consumeLookup?.column).toBe("code_sha256");
    expect(serviceMockImpl.__recorder.consumeLookup?.value).toBe(
      sha256Hex("any-code"),
    );
  });

  it("the raw submitted code is never used as the DB lookup value (defense-in-depth)", async () => {
    const rawCode = "another-raw-code-xyz789";
    serviceMockImpl = makeServiceMock({ consumeData: null });

    await claimPairing(null, claimFormData(rawCode));

    const serialized = JSON.stringify(
      serviceMockImpl.__recorder.consumeLookup,
    );
    expect(serialized).not.toContain(rawCode);
    expect(serialized).toContain(sha256Hex(rawCode));
  });
});
