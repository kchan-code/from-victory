import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getGoogleCancelableSubscriptionsForPayer,
  hasEverHeldGoogleEntitlement,
} from "@/lib/subscriptions/google";

const PAYER_ID = "eeeeeeee-0000-4000-8000-000000000005";

afterEach(() => {
  delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
});

describe("getGoogleCancelableSubscriptionsForPayer", () => {
  it("returns rows that Google may still bill (active, grace, on_hold, paused, null expiry, canceled paid-through)", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    const rows = [
      { product_id: "family.1", purchase_token: "a", status: "active", expires_at: "2099-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "b", status: "in_grace_period", expires_at: "2099-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "c", status: "on_hold", expires_at: "2099-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "d", status: "paused", expires_at: "2099-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "e", status: "expired", expires_at: null },
      { product_id: "family.1", purchase_token: "f", status: "canceled", expires_at: "2099-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "g", status: "expired", expires_at: "2020-01-01T00:00:00.000Z" },
      { product_id: "family.1", purchase_token: "h", status: "canceled", expires_at: "2020-01-01T00:00:00.000Z" },
    ];
    const service = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: test double only
    } as any;

    const result = await getGoogleCancelableSubscriptionsForPayer(
      service,
      PAYER_ID,
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(result.readError).toBe(false);
    expect(result.rows.map((r) => r.purchase_token)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  });

  it("returns readError on query failure", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    const service = {
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: "db down" } }),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: test double only
    } as any;

    const result = await getGoogleCancelableSubscriptionsForPayer(service, PAYER_ID);
    expect(result).toEqual({ rows: [], readError: true });
  });
});

describe("hasEverHeldGoogleEntitlement", () => {
  it("uses acknowledged, non-test, non-pending rows only", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    const eq = vi.fn().mockReturnThis();
    const not = vi.fn().mockResolvedValue({ count: 1, error: null });
    const service = {
      from: () => ({
        select: () => ({
          eq,
          not,
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reason: test double only
    } as any;

    const result = await hasEverHeldGoogleEntitlement(service, PAYER_ID);
    expect(result).toBe(true);
    expect(eq).toHaveBeenCalledWith("payer_id", PAYER_ID);
    expect(eq).toHaveBeenCalledWith("is_test_purchase", false);
    expect(eq).toHaveBeenCalledWith("acknowledged", true);
    expect(not).toHaveBeenCalledWith(
      "status",
      "in",
      "(pending,pending_purchase_canceled)",
    );
  });
});
