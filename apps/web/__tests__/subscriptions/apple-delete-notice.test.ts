import { describe, it, expect } from "vitest";

import { appleSubscriptionNoticeFor } from "@/lib/subscriptions/apple-delete-notice";

describe("appleSubscriptionNoticeFor (FV-652)", () => {
  it("an active Apple product → 'active'", () => {
    expect(
      appleSubscriptionNoticeFor({
        productId: "com.fromvictoryapp.app.family.1.monthly",
        readError: false,
      }),
    ).toBe("active");
  });

  it("no Apple product and a clean read → no notice", () => {
    expect(
      appleSubscriptionNoticeFor({ productId: null, readError: false }),
    ).toBeNull();
  });

  it("read error → 'unknown' (fail toward warning, hedged wording)", () => {
    expect(
      appleSubscriptionNoticeFor({ productId: null, readError: true }),
    ).toBe("unknown");
  });

  it("a product id wins over a read-error flag", () => {
    expect(
      appleSubscriptionNoticeFor({
        productId: "com.fromvictoryapp.app.family.2.yearly",
        readError: true,
      }),
    ).toBe("active");
  });
});
