import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hasAnyAppleSubscriptionHistory } from "@/lib/subscriptions/apple";

function makeServiceResult(params: {
  count: number | null;
  error: { message: string } | null;
}) {
  const chain = {
    eq: vi.fn(),
  };
  chain.eq
    .mockImplementationOnce(() => chain)
    .mockResolvedValueOnce({ count: params.count, error: params.error });

  const select = vi.fn(() => chain);
  const from = vi.fn(() => ({ select }));
  return { service: { from }, select, chain };
}

describe("hasAnyAppleSubscriptionHistory", () => {
  it("filters by payer and Production environment, returns true when count > 0", async () => {
    const { service, chain } = makeServiceResult({ count: 2, error: null });

    const result = await hasAnyAppleSubscriptionHistory(
      service as never,
      "payer-123",
    );

    expect(result).toBe(true);
    expect(chain.eq).toHaveBeenNthCalledWith(1, "payer_id", "payer-123");
    expect(chain.eq).toHaveBeenNthCalledWith(2, "environment", "Production");
  });

  it("returns false when count is zero", async () => {
    const { service } = makeServiceResult({ count: 0, error: null });

    const result = await hasAnyAppleSubscriptionHistory(
      service as never,
      "payer-123",
    );

    expect(result).toBe(false);
  });

  it("throws when the read fails", async () => {
    const { service } = makeServiceResult({
      count: null,
      error: { message: "boom" },
    });

    await expect(
      hasAnyAppleSubscriptionHistory(service as never, "payer-123"),
    ).rejects.toThrow(
      "[subscriptions/apple] hasAnyAppleSubscriptionHistory read failed (payer=payer-123): boom",
    );
  });
});
