/**
 * Unit tests for apps/web/lib/subscriptions/apple-lifecycle.ts.
 *
 * Covers:
 *   - mapAppleNotificationToStatus (pure) — the full FV-571 mapping table,
 *     including grace-entry / grace-exhaustion and the "recognized but not
 *     acted on" null branch.
 *   - mapAppleStatusEnum (pure) — the Get All Subscription Statuses numeric
 *     enum mapping used by reconciliation.
 *   - buildSnapshotFields (pure) — grace bound populated ONLY for
 *     in_grace_period, cleared for every other status.
 *   - deriveActionSubmissionStatus (pure) — the action-path (no
 *     notificationType) status derivation: revoked / in_grace_period
 *     (evidence-based, from the renewal payload) / expired / subscribed.
 *   - applyAppleSnapshot — supersession-safe upsert (locate by payer+env,
 *     never by OTID), watermark-guarded (stale/duplicate/equal-signedDate
 *     drop), token-preserving updates (record Section 4.7 — token
 *     continuity), insert-requires-token invariant.
 *   - reconcileAppleSubscription — callable + tested with a mocked
 *     ./apple-server client (no_row / no_data / applied paths), including
 *     environment-filtered, newest-signedDate selection across multiple
 *     candidates.
 *
 * ./apple-server is mocked so no `@apple/app-store-server-library` code
 * path (and no network call to Apple) is ever reached from this file.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getAllSubscriptionStatusesMock } = vi.hoisted(() => ({
  getAllSubscriptionStatusesMock: vi.fn(),
}));
vi.mock("@/lib/subscriptions/apple-server", () => ({
  getAllSubscriptionStatuses: getAllSubscriptionStatusesMock,
}));

import {
  mapAppleNotificationToStatus,
  mapAppleStatusEnum,
  buildSnapshotFields,
  applyAppleSnapshot,
  reconcileAppleSubscription,
  deriveActionSubmissionStatus,
} from "@/lib/subscriptions/apple-lifecycle";
import type { DecodedTransactionInfo, DecodedRenewalInfo } from "@/lib/subscriptions/apple-server";

const PAYER_ID = "aaaaaaaa-0000-4000-8000-000000000001";

function makeTransaction(overrides: Partial<DecodedTransactionInfo> = {}): DecodedTransactionInfo {
  return {
    originalTransactionId: "otid_1",
    transactionId: "txn_1",
    productId: "tier_1_1athlete",
    bundleId: "com.fromvictoryapp.app",
    expiresDate: 1_800_000_000_000,
    appAccountToken: "11111111-1111-4111-8111-111111111111",
    signedDate: 1_700_000_000_000,
    environment: "Production",
    revocationDate: null,
    revocationReason: null,
    ...overrides,
  };
}

function makeRenewal(overrides: Partial<DecodedRenewalInfo> = {}): DecodedRenewalInfo {
  return {
    originalTransactionId: "otid_1",
    autoRenewStatus: true,
    gracePeriodExpiresDate: null,
    signedDate: 1_700_000_000_000,
    environment: "Production",
    appAccountToken: "11111111-1111-4111-8111-111111111111",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mapAppleNotificationToStatus
// ---------------------------------------------------------------------------

describe("mapAppleNotificationToStatus", () => {
  it.each(["SUBSCRIBED", "DID_RENEW", "DID_CHANGE_RENEWAL_STATUS", "OFFER_REDEEMED"])(
    "%s -> subscribed",
    (type) => {
      expect(mapAppleNotificationToStatus(type, undefined)).toBe("subscribed");
    },
  );

  it("SUBSCRIBED with subtype UPGRADE (same-group upgrade) -> subscribed", () => {
    expect(mapAppleNotificationToStatus("SUBSCRIBED", "UPGRADE")).toBe("subscribed");
  });

  it("DID_FAIL_TO_RENEW + subtype GRACE_PERIOD -> in_grace_period", () => {
    expect(mapAppleNotificationToStatus("DID_FAIL_TO_RENEW", "GRACE_PERIOD")).toBe(
      "in_grace_period",
    );
  });

  it("DID_FAIL_TO_RENEW with no subtype -> in_billing_retry", () => {
    expect(mapAppleNotificationToStatus("DID_FAIL_TO_RENEW", undefined)).toBe(
      "in_billing_retry",
    );
  });

  it("DID_FAIL_TO_RENEW with an unrelated subtype -> in_billing_retry", () => {
    expect(mapAppleNotificationToStatus("DID_FAIL_TO_RENEW", "BILLING_RETRY")).toBe(
      "in_billing_retry",
    );
  });

  it("GRACE_PERIOD_EXPIRED -> in_billing_retry (demotes from grace)", () => {
    expect(mapAppleNotificationToStatus("GRACE_PERIOD_EXPIRED", undefined)).toBe(
      "in_billing_retry",
    );
  });

  it("EXPIRED -> expired", () => {
    expect(mapAppleNotificationToStatus("EXPIRED", undefined)).toBe("expired");
  });

  it.each(["REVOKE", "REFUND"])("%s -> revoked", (type) => {
    expect(mapAppleNotificationToStatus(type, undefined)).toBe("revoked");
  });

  it("returns null for a recognized-but-not-acted-on notificationType", () => {
    expect(mapAppleNotificationToStatus("DID_CHANGE_RENEWAL_PREF", undefined)).toBeNull();
    expect(mapAppleNotificationToStatus("PRICE_INCREASE", undefined)).toBeNull();
    expect(mapAppleNotificationToStatus("CONSUMPTION_REQUEST", undefined)).toBeNull();
  });

  it("returns null for a genuinely unknown notificationType", () => {
    expect(mapAppleNotificationToStatus("SOMETHING_NEW_APPLE_ADDED", undefined)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// mapAppleStatusEnum
// ---------------------------------------------------------------------------

describe("mapAppleStatusEnum", () => {
  it("maps the 5 Get All Subscription Statuses values", () => {
    expect(mapAppleStatusEnum(1)).toBe("subscribed");
    expect(mapAppleStatusEnum(2)).toBe("expired");
    expect(mapAppleStatusEnum(3)).toBe("in_billing_retry");
    expect(mapAppleStatusEnum(4)).toBe("in_grace_period");
    expect(mapAppleStatusEnum(5)).toBe("revoked");
  });

  it("fails closed to expired for an unknown numeric status", () => {
    expect(mapAppleStatusEnum(99)).toBe("expired");
  });
});

// ---------------------------------------------------------------------------
// buildSnapshotFields
// ---------------------------------------------------------------------------

describe("buildSnapshotFields", () => {
  it("populates the grace bound ONLY for in_grace_period", () => {
    const fields = buildSnapshotFields(
      "in_grace_period",
      makeTransaction(),
      makeRenewal({ gracePeriodExpiresDate: 1_750_000_000_000 }),
    );
    expect(fields.gracePeriodExpiresAt).toBe(1_750_000_000_000);
  });

  it("clears the grace bound for every other status, even if renewalInfo carries one", () => {
    const fields = buildSnapshotFields(
      "in_billing_retry",
      makeTransaction(),
      makeRenewal({ gracePeriodExpiresDate: 1_750_000_000_000 }),
    );
    expect(fields.gracePeriodExpiresAt).toBeNull();
  });

  it("defaults autoRenewStatus to true when there is no renewal payload", () => {
    const fields = buildSnapshotFields("subscribed", makeTransaction(), null);
    expect(fields.autoRenewStatus).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deriveActionSubmissionStatus — the FV-571 gap closed here: a client
// purchase/restore submission must not unconditionally write "subscribed".
// ---------------------------------------------------------------------------

describe("deriveActionSubmissionStatus", () => {
  const NOW = 1_750_000_000_000;

  it("live purchase (not revoked, not expired) writes subscribed", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW + 1_000 }),
      makeRenewal(),
      NOW,
    );
    expect(status).toBe("subscribed");
  });

  it("revoked-restore writes revoked (revocationDate present)", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW + 1_000, revocationDate: NOW - 1_000 }),
      makeRenewal(),
      NOW,
    );
    expect(status).toBe("revoked");
  });

  it("revoked-restore writes revoked on revocationReason alone (0 is a valid-but-falsy reason)", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({
        expiresDate: NOW + 1_000,
        revocationDate: null,
        revocationReason: 0,
      }),
      null,
      NOW,
    );
    expect(status).toBe("revoked");
  });

  it("lapsed-restore (expiresDate in the past, no grace evidence) writes expired, not subscribed", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW - 1_000 }),
      null,
      NOW,
    );
    expect(status).toBe("expired");
  });

  it("a lapsed transaction with LIVE grace evidence writes in_grace_period, not expired", () => {
    // expiresDate has already passed (grace, by definition, begins after
    // expiry — record Section 4.2), but the renewal payload's own
    // gracePeriodExpiresDate is still in the future.
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW - 1_000 }),
      makeRenewal({ gracePeriodExpiresDate: NOW + 5_000 }),
      NOW,
    );
    expect(status).toBe("in_grace_period");
  });

  it("a lapsed transaction with EXHAUSTED grace evidence writes expired, not in_grace_period", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW - 10_000 }),
      makeRenewal({ gracePeriodExpiresDate: NOW - 1_000 }),
      NOW,
    );
    expect(status).toBe("expired");
  });

  it("revoked wins over grace evidence — a definitively closed state is never re-opened", () => {
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW - 1_000, revocationDate: NOW - 500 }),
      makeRenewal({ gracePeriodExpiresDate: NOW + 5_000 }),
      NOW,
    );
    expect(status).toBe("revoked");
  });

  it("never infers in_billing_retry — that state needs a notificationType this path doesn't have", () => {
    // A lapsed transaction with NO grace evidence at all (auto-renew off, or
    // billing retry already exhausted its own window) still resolves to
    // "expired", never "in_billing_retry".
    const status = deriveActionSubmissionStatus(
      makeTransaction({ expiresDate: NOW - 1_000 }),
      makeRenewal({ gracePeriodExpiresDate: null }),
      NOW,
    );
    expect(status).not.toBe("in_billing_retry");
    expect(status).toBe("expired");
  });
});

// ---------------------------------------------------------------------------
// applyAppleSnapshot
// ---------------------------------------------------------------------------

type Row = {
  id: string;
  last_signed_date: string;
};

function makeServiceMock(existingRow: Row | null) {
  // Update chain mirrors production: .update(payload, {count:"exact"})
  // .eq("id", ...).lt("last_signed_date", ...) → { error, count } — the
  // atomic-watermark backstop (qa review, PR #515) re-checks the watermark
  // inside the UPDATE's WHERE clause, so the mock must surface `count`.
  const updateLt = vi.fn().mockResolvedValue({ error: null, count: 1 });
  const updateEq = vi.fn(() => ({ lt: updateLt }));
  const update = vi.fn(
    (_payload: Record<string, unknown>, _opts?: Record<string, unknown>) => ({
      eq: updateEq,
    }),
  );
  const insert = vi.fn((_payload: Record<string, unknown>) => Promise.resolve({ error: null }));
  const maybeSingle = vi.fn().mockResolvedValue({ data: existingRow, error: null });
  const eq2 = vi.fn(() => ({ maybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));

  return {
    from: vi.fn(() => ({ select, update, insert })),
    __spies: { update, updateEq, updateLt, insert, maybeSingle },
  };
}

describe("applyAppleSnapshot", () => {
  it("inserts a new row when none exists (first-seen)", async () => {
    const service = makeServiceMock(null);
    const result = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields("subscribed", makeTransaction(), makeRenewal()),
    });
    expect(result).toEqual({ applied: true, created: true });
    expect(service.__spies.insert).toHaveBeenCalledTimes(1);
    const insertedRow = service.__spies.insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertedRow.payer_id).toBe(PAYER_ID);
    expect(insertedRow.app_account_token).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("throws rather than inserting a new row with no app_account_token", async () => {
    const service = makeServiceMock(null);
    await expect(
      applyAppleSnapshot(service as never, {
        payerId: PAYER_ID,
        ...buildSnapshotFields(
          "subscribed",
          makeTransaction({ appAccountToken: null }),
          null,
        ),
      }),
    ).rejects.toThrow(/without an app_account_token/);
    expect(service.__spies.insert).not.toHaveBeenCalled();
  });

  it("supersession-safe UPDATE: locates the row by (payer, environment), never by OTID — a new OTID updates in place", async () => {
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(1_600_000_000_000).toISOString(),
    });
    const result = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "subscribed",
        makeTransaction({ originalTransactionId: "otid_NEW_after_upgrade" }),
        makeRenewal(),
      ),
    });
    expect(result).toEqual({ applied: true, created: false });
    expect(service.__spies.update).toHaveBeenCalledTimes(1);
    const updatedRow = service.__spies.update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(updatedRow.original_transaction_id).toBe("otid_NEW_after_upgrade");
    // Updated the EXISTING row (row-1), never inserted a second row.
    expect(service.__spies.updateEq).toHaveBeenCalledWith("id", "row-1");
  });

  it("WATERMARK: drops a stale payload (older signedDate) — no write, state unchanged", async () => {
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(1_700_000_000_000).toISOString(),
    });
    const result = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "revoked",
        makeTransaction({ signedDate: 1_600_000_000_000 }), // OLDER than stored
        null,
      ),
    });
    expect(result).toEqual({ applied: false, reason: "stale" });
    expect(service.__spies.update).not.toHaveBeenCalled();
  });

  it("WATERMARK: drops an equal-signedDate payload (duplicate redelivery)", async () => {
    const storedMs = 1_700_000_000_000;
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(storedMs).toISOString(),
    });
    const result = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "subscribed",
        makeTransaction({ signedDate: storedMs }), // EQUAL to stored
        makeRenewal(),
      ),
    });
    expect(result).toEqual({ applied: false, reason: "stale" });
    expect(service.__spies.update).not.toHaveBeenCalled();
  });

  it("MISORDERING: applies a newer payload, then drops an older one arriving after it — state unchanged", async () => {
    // Simulates the two-write sequence directly against the same mocked row
    // state: first write advances the watermark, second (older) write must
    // be dropped without touching status/expiry.
    let storedLastSignedDate = new Date(1_600_000_000_000).toISOString();
    const service = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { id: "row-1", last_signed_date: storedLastSignedDate },
                error: null,
              }),
            }),
          }),
        }),
        update: (payload: Record<string, unknown>) => ({
          eq: () => ({
            // Mirrors the production atomic guard: the "DB" applies the
            // write only when the incoming watermark is strictly newer.
            lt: async () => {
              if (
                (payload.last_signed_date as string) > storedLastSignedDate
              ) {
                storedLastSignedDate = payload.last_signed_date as string;
                return { error: null, count: 1 };
              }
              return { error: null, count: 0 };
            },
          }),
        }),
        insert: vi.fn(),
      })),
    };

    const newer = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "revoked",
        makeTransaction({ signedDate: 1_900_000_000_000 }),
        null,
      ),
    });
    expect(newer).toEqual({ applied: true, created: false });
    expect(storedLastSignedDate).toBe(new Date(1_900_000_000_000).toISOString());

    const older = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "subscribed",
        makeTransaction({ signedDate: 1_700_000_000_000 }), // older than 1.9e12
        makeRenewal(),
      ),
    });
    expect(older).toEqual({ applied: false, reason: "stale" });
    // Watermark (and therefore the applied status) is unchanged by the stale write.
    expect(storedLastSignedDate).toBe(new Date(1_900_000_000_000).toISOString());
  });

  it("RACE backstop (qa, PR #515): UPDATE matching 0 rows — a concurrent writer advanced the watermark between read and write — returns stale, never regresses", async () => {
    // The read-path check passes (stored watermark is older), but by the
    // time the UPDATE lands another writer has applied a newer payload: the
    // atomic .lt guard makes the UPDATE match 0 rows. Must surface as the
    // same stale drop as the read path — not applied, not a throw.
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(1_600_000_000_000).toISOString(),
    });
    service.__spies.updateLt.mockResolvedValueOnce({ error: null, count: 0 });

    const result = await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "subscribed",
        makeTransaction({ signedDate: 1_700_000_000_000 }),
        makeRenewal(),
      ),
    });

    expect(result).toEqual({ applied: false, reason: "stale" });
    expect(service.__spies.update).toHaveBeenCalledTimes(1);
    expect(service.__spies.insert).not.toHaveBeenCalled();
  });

  it("token continuity: preserves the existing app_account_token on UPDATE when the incoming payload omits one (record §4.7 — the token is a durable audit trail, immutable on Apple's side; a payload that omits it is a defensive anomaly, never grounds to null it out)", async () => {
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(1_600_000_000_000).toISOString(),
    });
    await applyAppleSnapshot(service as never, {
      payerId: PAYER_ID,
      ...buildSnapshotFields(
        "subscribed",
        makeTransaction({ appAccountToken: null }),
        makeRenewal(),
      ),
    });
    const updatedRow = service.__spies.update.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(updatedRow).not.toHaveProperty("app_account_token");
  });
});

// ---------------------------------------------------------------------------
// reconcileAppleSubscription
// ---------------------------------------------------------------------------

describe("reconcileAppleSubscription", () => {
  beforeEach(() => {
    getAllSubscriptionStatusesMock.mockReset();
  });

  it("returns no_row when the payer has no apple_subscriptions row for this environment", async () => {
    const service = {
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
      })),
    };
    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");
    expect(result).toEqual({ ok: false, reason: "no_row" });
    expect(getAllSubscriptionStatusesMock).not.toHaveBeenCalled();
  });

  it("returns no_data when Apple returns nothing for the transaction id", async () => {
    getAllSubscriptionStatusesMock.mockResolvedValueOnce([]);
    const service = makeServiceMock({
      id: "row-1",
      last_signed_date: new Date(1_600_000_000_000).toISOString(),
    });
    // Override the initial read to return an existing row with an OTID.
    service.from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { original_transaction_id: "otid_1" },
              error: null,
            }),
          }),
        }),
      }),
    })) as never;

    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");
    expect(result).toEqual({ ok: false, reason: "no_data" });
  });

  it("applies the single matching item through the shared upsert path", async () => {
    getAllSubscriptionStatusesMock.mockResolvedValueOnce([
      { status: 1, transaction: makeTransaction(), renewal: makeRenewal() },
    ]);

    let selectCallCount = 0;
    const insert = vi.fn().mockResolvedValue({ error: null });
    const updateLt = vi.fn().mockResolvedValue({ error: null, count: 1 });
    const updateEq = vi.fn(() => ({ lt: updateLt }));
    const update = vi.fn(() => ({ eq: updateEq }));

    const service = {
      from: vi.fn(() => ({
        select: () => {
          selectCallCount += 1;
          const callNumber = selectCallCount;
          return {
            eq: () => ({
              eq: () => ({
                maybeSingle: async () =>
                  callNumber === 1
                    ? { data: { original_transaction_id: "otid_1" }, error: null }
                    : { data: null, error: null }, // apply's own existing-row read: none -> insert
              }),
            }),
          };
        },
        update,
        insert,
      })),
    };

    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");
    expect(result).toEqual({ ok: true, applied: true });
    expect(insert).toHaveBeenCalledTimes(1);
  });

  /**
   * Builds a service mock for a reconcile call whose initial read succeeds
   * (returns an existing row with the given OTID) and whose applyAppleSnapshot
   * upsert always inserts (no existing apple_subscriptions row) — isolates
   * these tests to SELECTION behavior, not upsert behavior (already covered
   * above).
   */
  function makeReconcileServiceMock(existingOtid: string) {
    let selectCallCount = 0;
    const insert = vi.fn().mockResolvedValue({ error: null });
    const service = {
      from: vi.fn(() => ({
        select: () => {
          selectCallCount += 1;
          const callNumber = selectCallCount;
          return {
            eq: () => ({
              eq: () => ({
                maybeSingle: async () =>
                  callNumber === 1
                    ? { data: { original_transaction_id: existingOtid }, error: null }
                    : { data: null, error: null },
              }),
            }),
          };
        },
        update: vi.fn(),
        insert,
      })),
    };
    return { service, insert };
  }

  it("SELECTION: two-item array with older-first ordering picks the NEWER signedDate item, not Apple's array order", async () => {
    const older = makeTransaction({ originalTransactionId: "otid_older", signedDate: 1_700_000_000_000 });
    const newer = makeTransaction({ originalTransactionId: "otid_newer", signedDate: 1_800_000_000_000 });
    getAllSubscriptionStatusesMock.mockResolvedValueOnce([
      { status: 3, transaction: older, renewal: makeRenewal({ signedDate: 1_700_000_000_000 }) }, // older, listed FIRST
      { status: 1, transaction: newer, renewal: makeRenewal({ signedDate: 1_800_000_000_000 }) }, // newer, listed SECOND
    ]);
    const { service, insert } = makeReconcileServiceMock("otid_older");

    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");

    expect(result).toEqual({ ok: true, applied: true });
    const insertedRow = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    // The newer item's status (1 -> subscribed) and OTID won, not the
    // first-listed older item's (3 -> in_billing_retry).
    expect(insertedRow.status).toBe("subscribed");
    expect(insertedRow.original_transaction_id).toBe("otid_newer");
  });

  it("SELECTION: ignores items whose verified environment does not match the requested environment", async () => {
    const wrongEnv = makeTransaction({
      originalTransactionId: "otid_sandbox",
      environment: "Sandbox",
      signedDate: 1_900_000_000_000, // newer, but wrong environment
    });
    const rightEnv = makeTransaction({
      originalTransactionId: "otid_production",
      environment: "Production",
      signedDate: 1_700_000_000_000,
    });
    getAllSubscriptionStatusesMock.mockResolvedValueOnce([
      { status: 1, transaction: wrongEnv, renewal: null },
      { status: 1, transaction: rightEnv, renewal: null },
    ]);
    const { service, insert } = makeReconcileServiceMock("otid_production");

    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");

    expect(result).toEqual({ ok: true, applied: true });
    const insertedRow = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(insertedRow.original_transaction_id).toBe("otid_production");
  });

  it("SELECTION: no_data when every candidate's environment mismatches the requested environment", async () => {
    getAllSubscriptionStatusesMock.mockResolvedValueOnce([
      { status: 1, transaction: makeTransaction({ environment: "Sandbox" }), renewal: null },
    ]);
    const { service } = makeReconcileServiceMock("otid_1");

    const result = await reconcileAppleSubscription(service as never, PAYER_ID, "Production");

    expect(result).toEqual({ ok: false, reason: "no_data" });
  });
});
