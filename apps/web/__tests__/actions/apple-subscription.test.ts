/**
 * Unit tests for submitApplePurchase (apps/web/lib/actions/apple-subscription.ts).
 *
 * Covers the named FV-571 ACs:
 *   - role gate: an athlete-role session is refused BEFORE any write
 *   - JWS verify failure -> generic error, no write, no raw-payload logging
 *     (asserted by never passing the JWS string itself to console/notify mocks)
 *   - Sandbox non-allowlisted -> rejected; allowlisted -> persisted
 *   - token mismatch -> rejected, no auto-relink; missing token row -> minted
 *     then matched
 *   - restore with an OTID owned by a DIFFERENT live payer -> rejected
 *     (ownership never transfers)
 *   - duplicate-billing: active Stripe + Apple submission -> Apple row
 *     persisted AND the ops alert fires (never blocked)
 *
 * All Supabase clients, ./apple-server, and ./apple-lifecycle are mocked —
 * no real DB, no real JWS verification, no network call to Apple.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports of the module under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));

const PAYER_ID = "bbbbbbbb-0000-4000-8000-000000000002";

let currentUser: { id: string } | null = { id: PAYER_ID };
let profileRole: string | null = "parent";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: currentUser } }),
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () =>
                profileRole
                  ? { data: { role: profileRole }, error: null }
                  : { data: null, error: { message: "not found" } },
            }),
          }),
        };
      }
      throw new Error(`unexpected table on RLS-scoped client: ${table}`);
    },
  }),
}));

let sandboxAllowlisted = false;
let existingOwnerPayerId: string | null = null;
let mintedTokenExisting: string | null = "MINTED_TOKEN";
let mintedTokenAfterRace = "NEWLY_MINTED_TOKEN";
let stripeStatus: string | null = null;
// Counts ANY access to apple_purchase_tokens on the service client — the
// beginApplePurchase role-gate test asserts the gate precedes the mint write.
let tokenTableTouches = 0;

function makeServiceMock() {
  return {
    from: (table: string) => {
      if (table === "apple_sandbox_testers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: sandboxAllowlisted ? { payer_id: PAYER_ID } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "apple_subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: existingOwnerPayerId ? { payer_id: existingOwnerPayerId } : null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "apple_purchase_tokens") {
        tokenTableTouches += 1;
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: mintedTokenExisting ? { token: mintedTokenExisting } : null,
                error: null,
              }),
            }),
          }),
          upsert: () => ({
            select: () => ({
              maybeSingle: async () => ({
                data: { token: mintedTokenAfterRace },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: stripeStatus ? { status: stripeStatus } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      throw new Error(`unexpected table on service client: ${table}`);
    },
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => makeServiceMock(),
}));

const verifySignedTransactionMock = vi.fn();
const verifySignedRenewalInfoMock = vi.fn();
vi.mock("@/lib/subscriptions/apple-server", () => ({
  verifySignedTransaction: (...args: unknown[]) => verifySignedTransactionMock(...args),
  verifySignedRenewalInfo: (...args: unknown[]) => verifySignedRenewalInfoMock(...args),
}));

const applyAppleSnapshotMock = vi.fn();
// Mirrors the REAL apple-lifecycle.deriveActionSubmissionStatus (unit-tested
// independently in __tests__/subscriptions/apple-lifecycle.test.ts) so these
// higher-level action tests can assert the action passes the DERIVED status
// through to applyAppleSnapshot, not a hardcoded "subscribed".
const deriveActionSubmissionStatusMock = vi.fn(
  (
    transaction: { expiresDate: number; revocationDate: number | null; revocationReason?: number | null },
    renewal: { gracePeriodExpiresDate?: number | null } | null,
    now: number = Date.now(),
  ) => {
    if (transaction.revocationDate != null || (transaction.revocationReason ?? null) != null) {
      return "revoked";
    }
    if (renewal?.gracePeriodExpiresDate != null && now <= renewal.gracePeriodExpiresDate) {
      return "in_grace_period";
    }
    if (transaction.expiresDate < now) {
      return "expired";
    }
    return "subscribed";
  },
);
vi.mock("@/lib/subscriptions/apple-lifecycle", () => ({
  applyAppleSnapshot: (...args: unknown[]) => applyAppleSnapshotMock(...args),
  // A lazy wrapper (not a direct reference to `deriveActionSubmissionStatusMock`)
  // — vi.mock factories are hoisted above the `const` below, so the wrapper
  // body must only reference the mock when INVOKED, never at factory-object
  // construction time (TDZ). Typed via `Parameters<...>` (erased at runtime,
  // so no early evaluation) rather than `...args: unknown[]`, which can't be
  // spread into the mock's strongly-typed (non-`any`) parameter list (TS2556).
  deriveActionSubmissionStatus: (
    transaction: Parameters<typeof deriveActionSubmissionStatusMock>[0],
    renewal: Parameters<typeof deriveActionSubmissionStatusMock>[1],
    now?: Parameters<typeof deriveActionSubmissionStatusMock>[2],
  ) => deriveActionSubmissionStatusMock(transaction, renewal, now),
  buildSnapshotFields: (
    status: string,
    transaction: { environment: string; originalTransactionId: string; productId: string; expiresDate: number; appAccountToken: string | null; signedDate: number },
    renewal: { autoRenewStatus: boolean } | null,
  ) => ({
    environment: transaction.environment,
    status,
    originalTransactionId: transaction.originalTransactionId,
    productId: transaction.productId,
    expiresAt: transaction.expiresDate,
    gracePeriodExpiresAt: null,
    autoRenewStatus: renewal?.autoRenewStatus ?? true,
    appAccountToken: transaction.appAccountToken,
    signedDate: transaction.signedDate,
  }),
}));

const notifyErrorMock = vi.fn(async (..._args: unknown[]) => {});
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => notifyErrorMock(...args),
}));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => {
    void p;
  },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  submitApplePurchase,
  beginApplePurchase,
} from "@/lib/actions/apple-subscription";

function makeTransaction(overrides: Record<string, unknown> = {}) {
  return {
    originalTransactionId: "otid_1",
    transactionId: "txn_1",
    productId: "tier_1_1athlete",
    bundleId: "com.fromvictoryapp.app",
    expiresDate: 1_800_000_000_000,
    appAccountToken: "MINTED_TOKEN",
    signedDate: 1_700_000_000_000,
    environment: "Production",
    revocationDate: null,
    revocationReason: null,
    ...overrides,
  };
}

beforeEach(() => {
  currentUser = { id: PAYER_ID };
  profileRole = "parent";
  sandboxAllowlisted = false;
  existingOwnerPayerId = null;
  deriveActionSubmissionStatusMock.mockClear();
  mintedTokenExisting = "MINTED_TOKEN";
  mintedTokenAfterRace = "NEWLY_MINTED_TOKEN";
  stripeStatus = null;
  verifySignedTransactionMock.mockReset();
  verifySignedRenewalInfoMock.mockReset();
  applyAppleSnapshotMock.mockReset();
  notifyErrorMock.mockClear();
  verifySignedTransactionMock.mockResolvedValue(makeTransaction());
  applyAppleSnapshotMock.mockResolvedValue({ applied: true, created: true });
});

const VALID_INPUT = { signedTransactionInfo: "ey.fake.transaction" };

describe("submitApplePurchase", () => {
  it("rejects invalid input before touching auth", async () => {
    const result = await submitApplePurchase({ signedTransactionInfo: "" });
    expect(result).toEqual({ ok: false, error: "invalid_input" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("returns unauthenticated with no session", async () => {
    currentUser = null;
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("PRIVACY AC: refuses an athlete-role session BEFORE any write", async () => {
    profileRole = "athlete";
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: false, error: "not_authorized" });
    expect(verifySignedTransactionMock).not.toHaveBeenCalled();
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("accepts an adult_athlete payer role (self-serve)", async () => {
    profileRole = "adult_athlete";
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: true, applied: true });
  });

  it("JWS verification failure -> generic error, no write, never logs the raw JWS", async () => {
    verifySignedTransactionMock.mockRejectedValueOnce(new Error("VerificationException(1)"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: false, error: "verification_failed" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
    // The raw JWS string must never appear in any warn log line.
    const loggedText = warnSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(loggedText).not.toContain(VALID_INPUT.signedTransactionInfo);
    warnSpy.mockRestore();
  });

  it("rejects a Sandbox submission from a non-allowlisted payer — no row written", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ environment: "Sandbox" }),
    );
    sandboxAllowlisted = false;

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: false, error: "environment_rejected" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("persists a Sandbox submission from an ALLOWLISTED payer", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ environment: "Sandbox" }),
    );
    sandboxAllowlisted = true;

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
  });

  it("REORDERED restore: an OTID already linked to a DIFFERENT live payer is rejected — ownership never transfers", async () => {
    existingOwnerPayerId = "different-payer-uuid";

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: false, error: "ownership_conflict" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("allows restore when the existing OTID row belongs to the SAME payer", async () => {
    existingOwnerPayerId = PAYER_ID;

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
  });

  it("rejects a token mismatch — no auto-relink, ever", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ appAccountToken: "SOME_OTHER_TOKEN" }),
    );
    mintedTokenExisting = "MINTED_TOKEN";

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: false, error: "token_mismatch" });
    expect(applyAppleSnapshotMock).not.toHaveBeenCalled();
  });

  it("rejects a payload with NO appAccountToken at all", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ appAccountToken: null }),
    );

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: false, error: "token_mismatch" });
  });

  it("mints a token when the payer has none yet, then matches against it", async () => {
    mintedTokenExisting = null; // no existing row -> get-or-mint path
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ appAccountToken: mintedTokenAfterRace }),
    );

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
  });

  it("returns applied:false (not an error) when applyAppleSnapshot drops a stale payload", async () => {
    applyAppleSnapshotMock.mockResolvedValueOnce({ applied: false, reason: "stale" });
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: true, applied: false });
  });

  it("STATUS DERIVATION: a live purchase persists status subscribed", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ expiresDate: Date.now() + 100_000 }),
    );

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    // applyAppleSnapshot(service, { payerId, ...fields }) — fields are arg[1].
    const persisted = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(persisted.status).toBe("subscribed");
  });

  it("STATUS DERIVATION: restoring a LAPSED subscription persists status expired, not subscribed — and still persists", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ expiresDate: Date.now() - 100_000 }),
    );

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    const persisted = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(persisted.status).toBe("expired");
  });

  it("STATUS DERIVATION: restoring a REVOKED subscription persists status revoked — and still persists", async () => {
    verifySignedTransactionMock.mockResolvedValueOnce(
      makeTransaction({ expiresDate: Date.now() + 100_000, revocationDate: Date.now() - 1_000 }),
    );

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    const persisted = applyAppleSnapshotMock.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(persisted.status).toBe("revoked");
  });

  it("DUPLICATE BILLING: persists the Apple row AND fires the ops alert when an active Stripe row also exists — never blocks", async () => {
    stripeStatus = "active";

    const result = await submitApplePurchase(VALID_INPUT);

    expect(result).toEqual({ ok: true, applied: true });
    expect(applyAppleSnapshotMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
    expect(notifyErrorMock.mock.calls[0]?.[0]).toMatch(/[Dd]uplicate billing/);
  });

  it("does NOT fire the duplicate-billing alert when the Stripe row is canceled", async () => {
    stripeStatus = "canceled";
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: true, applied: true });
    expect(notifyErrorMock).not.toHaveBeenCalled();
  });

  it("maps an internal DB error to internal_error and alerts", async () => {
    applyAppleSnapshotMock.mockRejectedValueOnce(new Error("db exploded"));
    const result = await submitApplePurchase(VALID_INPUT);
    expect(result).toEqual({ ok: false, error: "internal_error" });
    expect(notifyErrorMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// beginApplePurchase (FV-572 token handoff)
// ---------------------------------------------------------------------------

describe("beginApplePurchase — sanctioned token handoff (FV-572)", () => {
  beforeEach(() => {
    currentUser = { id: PAYER_ID };
    profileRole = "parent";
    mintedTokenExisting = "MINTED_TOKEN";
  });

  it("returns the payer's own token for a parent session", async () => {
    const result = await beginApplePurchase();
    expect(result).toEqual({ ok: true, appAccountToken: "MINTED_TOKEN" });
  });

  it("adult_athlete is also a payer role", async () => {
    profileRole = "adult_athlete";
    const result = await beginApplePurchase();
    expect(result).toEqual({ ok: true, appAccountToken: "MINTED_TOKEN" });
  });

  it("PRIVACY AC: refuses an athlete-role session BEFORE the mint write", async () => {
    profileRole = "athlete";
    const result = await beginApplePurchaseWithMintSpy();
    expect(result.result).toEqual({ ok: false, error: "not_authorized" });
    expect(result.tokenTableTouched).toBe(false);
  });

  it("refuses an unauthenticated session", async () => {
    currentUser = null;
    const result = await beginApplePurchase();
    expect(result).toEqual({ ok: false, error: "unauthenticated" });
  });

  it("mints on first use (no existing row) and returns the new token", async () => {
    mintedTokenExisting = null; // no row yet -> upsert path mints
    const result = await beginApplePurchase();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.appAccountToken).toBe("string");
      expect(result.appAccountToken.length).toBeGreaterThan(0);
    }
  });
});

/**
 * Helper for the role-gate test: runs beginApplePurchase while watching
 * whether the service client's apple_purchase_tokens table was touched at
 * all (the gate must precede the mint write).
 */
async function beginApplePurchaseWithMintSpy(): Promise<{
  result: Awaited<ReturnType<typeof beginApplePurchase>>;
  tokenTableTouched: boolean;
}> {
  tokenTableTouches = 0;
  const result = await beginApplePurchase();
  return { result, tokenTableTouched: tokenTableTouches > 0 };
}
