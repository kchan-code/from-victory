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
vi.mock("@/lib/subscriptions/apple-lifecycle", () => ({
  applyAppleSnapshot: (...args: unknown[]) => applyAppleSnapshotMock(...args),
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

import { submitApplePurchase } from "@/lib/actions/apple-subscription";

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
    ...overrides,
  };
}

beforeEach(() => {
  currentUser = { id: PAYER_ID };
  profileRole = "parent";
  sandboxAllowlisted = false;
  existingOwnerPayerId = null;
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
