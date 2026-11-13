/**
 * FV-710: getAppleBillingIssueForPayer — the payer-facing Apple payment-problem
 * read in the single centralized `apple_subscriptions` accessor.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

type Row = {
  environment: "Sandbox" | "Production";
  status: string;
  expires_at: string;
  grace_period_expires_at: string | null;
};

const PAYER_ID = "ffffffff-0000-4000-8000-000000000710";
const NOW = new Date("2026-11-13T12:00:00.000Z");
const FUTURE = "2099-01-01T00:00:00.000Z";
const PAST = "2026-01-01T00:00:00.000Z";

let rows: Row[] = [];
let rowsError: { message: string } | null = null;
let allowlisted = false;
let allowlistError: { message: string } | null = null;

beforeEach(() => {
  rows = [];
  rowsError = null;
  allowlisted = false;
  allowlistError = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function service() {
  return {
    from: (table: string) => {
      if (table === "apple_sandbox_testers") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: allowlisted ? { payer_id: PAYER_ID } : null,
                error: allowlistError,
              }),
            }),
          }),
        };
      }
      if (table === "apple_subscriptions") {
        const chain: Record<string, unknown> = {
          eq: () => chain,
          then: (resolve: (v: unknown) => void) =>
            resolve({ data: rows, error: rowsError }),
        };
        return { select: () => chain };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

import { getAppleBillingIssueForPayer } from "@/lib/subscriptions/apple";

async function read() {
  return getAppleBillingIssueForPayer(
    service() as never,
    PAYER_ID,
    NOW,
  );
}

const prod = (status: string, expires = FUTURE, grace: string | null = null): Row => ({
  environment: "Production",
  status,
  expires_at: expires,
  grace_period_expires_at: grace,
});

describe("getAppleBillingIssueForPayer", () => {
  it("no rows -> no issue", async () => {
    expect(await read()).toEqual({ stage: null, cleanlyPaid: false, readError: false });
  });

  it("in_grace_period still inside its bound -> grace", async () => {
    rows = [prod("in_grace_period", PAST, FUTURE)];
    expect(await read()).toEqual({ stage: "grace", cleanlyPaid: false, readError: false });
  });

  it("in_billing_retry -> lapsed", async () => {
    rows = [prod("in_billing_retry", PAST, null)];
    expect(await read()).toEqual({ stage: "lapsed", cleanlyPaid: false, readError: false });
  });

  it("in_grace_period past its bound plus skew (blocked) -> lapsed", async () => {
    rows = [prod("in_grace_period", PAST, PAST)];
    expect((await read()).stage).toBe("lapsed");
  });

  it("subscribed with non-blocked access -> no issue, cleanly paid (wins over a retry row)", async () => {
    rows = [prod("in_billing_retry", PAST, null), prod("subscribed", FUTURE)];
    expect(await read()).toEqual({ stage: null, cleanlyPaid: true, readError: false });
  });

  it("expired / revoked -> no issue (not a payment failure)", async () => {
    rows = [prod("expired", PAST), prod("revoked", PAST)];
    expect((await read()).stage).toBeNull();
  });

  it("a Sandbox row for a non-allowlisted payer is ignored", async () => {
    rows = [{ ...prod("in_billing_retry", PAST), environment: "Sandbox" }];
    expect((await read()).stage).toBeNull();
  });

  it("a Sandbox row for an allowlisted payer counts", async () => {
    allowlisted = true;
    rows = [{ ...prod("in_billing_retry", PAST), environment: "Sandbox" }];
    expect((await read()).stage).toBe("lapsed");
  });

  it("subscriptions read error -> readError, no stage", async () => {
    rowsError = { message: "boom" };
    expect(await read()).toEqual({ stage: null, cleanlyPaid: false, readError: true });
  });

  it("allowlist read error -> readError, no stage", async () => {
    allowlistError = { message: "boom" };
    rows = [prod("in_billing_retry", PAST)];
    expect(await read()).toEqual({ stage: null, cleanlyPaid: false, readError: true });
  });
});
