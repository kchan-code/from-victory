/**
 * @vitest-environment jsdom
 *
 * RTL tests for the subscribe page's price-paragraph framing (FV-442).
 *
 * The 13-25 expansion arc adds an adult_athlete self-serve checkout flow.
 * The page must branch the heading-block price paragraph on the existing
 * `profile.role === "adult_athlete"` check — parent copy stays byte-identical
 * (first-athlete + each-additional-athlete tiering), adult copy drops the
 * per-athlete tiering language entirely.
 *
 * SubscribeForm is mocked to a thin stub so these tests stay scoped to the
 * page's own paragraph and to the isAdult prop it passes through — the
 * SubscribeForm reminder copy itself is covered by subscribe-form.test.tsx.
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const {
  requireSubscriberMock,
  maybeSingleMock,
  athleteCountMock,
  enforcementEnabledMock,
  accessLevelMock,
  shellCapabilityMock,
  entitlementStateMock,
  activeAppleProductIdMock,
  capacityForAppleProductMock,
  getConfiguredAppleProductsMock,
} = vi.hoisted(() => ({
  requireSubscriberMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  // FV-574: the page's parent_athlete_links count read (banner trial gate).
  // Default: one athlete → trial-quantity-eligible, so pre-FV-574 tests see
  // the banner-eligible behavior they always did. Overridden per test in the
  // FV-574 describe block. (Return type widened so error-path overrides
  // typecheck.)
  athleteCountMock: vi.fn(
    async (): Promise<{
      count: number | null;
      error: { message: string } | null;
    }> => ({ count: 1, error: null }),
  ),
  enforcementEnabledMock: vi.fn(() => false),
  accessLevelMock: vi.fn(async () => "full"),
  // Default null (ordinary web/PWA request, no shell at all) — the FV-442
  // tests above must see today's unchanged behavior. The shell-capability
  // describe blocks below override this per test to "legacy-native" /
  // "ios-iap".
  shellCapabilityMock: vi.fn(
    (): "ios-iap" | "legacy-native" | null => null,
  ),
  // FV-581: default "not_entitled" so every pre-existing test in this file
  // (written before the duplicate-billing guard existed) sees the exact
  // purchase flow it always did. The FV-581 describe block below overrides
  // this per test across the entitled/unknown matrix.
  entitlementStateMock: vi.fn(
    async (): Promise<{
      status: "entitled" | "not_entitled" | "unknown";
      provider: "apple" | "stripe" | "comp" | null;
    }> => ({ status: "not_entitled", provider: null }),
  ),
  // FV-586 (KC decision D3): defaults preserve "no upgrade available" for
  // every test written before the upgrade wiring existed — not an Apple
  // payer / no mapped product / no configured product ever exceeds it.
  activeAppleProductIdMock: vi.fn(async (): Promise<string | null> => null),
  capacityForAppleProductMock: vi.fn((): number | null => null),
  getConfiguredAppleProductsMock: vi.fn(
    (): { productId: string; athleteCapacity: number; displayName?: string }[] => [],
  ),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSubscriber: requireSubscriberMock,
}));

// FV-581 duplicate-billing guard — mocked wholesale (its real implementation
// hits the service-role Supabase client) so this file stays scoped to the
// page's own branching logic on the returned status/provider.
vi.mock("@/lib/subscriptions/subscribe-guard", () => ({
  getSubscribeEntitlementState: entitlementStateMock,
}));

// Google Play "no in-app purchase" compliance + FV-572 iOS-IAP capability
// split. Mocked wholesale — not next/headers — so this file doesn't have to
// also stub "server-only" (lib/native-shell.ts imports it) just to exercise
// unrelated price-paragraph copy.
vi.mock("@/lib/native-shell", () => ({
  getRequestShellCapability: shellCapabilityMock,
}));

// AppleSubscribeSection is a client component with its own dedicated test
// file — stub it here so this page-level suite stays scoped to the page's
// own branching logic. The stub echoes the `mode` prop it was given
// (data-mode) so the FV-581 matrix below can assert purchase vs manage, and
// (FV-586) `currentAppleCapacity` so the D3 upgrade-wiring tests can assert
// the page computed the right ceiling. (FV-600) `currentAppleProductId` is
// echoed too, so the manage/upgrade wiring tests can assert the page passes
// the same current-product id it resolved down to both branches (needed for
// the component's "Current plan" block and its same-interval Change Plan
// filter).
vi.mock("@/components/subscribe/AppleSubscribeSection", () => ({
  AppleSubscribeSection: ({
    mode,
    currentAppleCapacity,
    currentAppleProductId,
  }: {
    mode?: "purchase" | "manage" | "upgrade";
    currentAppleCapacity?: number;
    currentAppleProductId?: string;
  }) => (
    <div
      data-testid="apple-subscribe-section-stub"
      data-mode={mode ?? "purchase"}
      data-current-apple-capacity={String(currentAppleCapacity ?? null)}
      data-current-apple-product-id={String(currentAppleProductId ?? null)}
    />
  ),
}));

// FV-586 (KC decision D3) upgrade-wiring reads — mocked wholesale, same
// rationale as the FV-581 duplicate-billing guard mock above.
vi.mock("@/lib/subscriptions/apple", () => ({
  getActiveAppleProductId: activeAppleProductIdMock,
}));
vi.mock("@/lib/subscriptions/apple-capacity", () => ({
  capacityForAppleProduct: capacityForAppleProductMock,
}));
vi.mock("@/lib/subscriptions/apple-products", () => ({
  getConfiguredAppleProducts: getConfiguredAppleProductsMock,
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({}),
}));

// FV-464: the page mirrors enforcement's bounce condition to avoid a dead
// Back-button loop. Defaults (enforcement off / full access) preserve the
// pre-FV-464 behavior for the FV-442 copy tests above.
vi.mock("@/lib/subscriptions/enforce", () => ({
  isSubscriptionEnforcementEnabled: enforcementEnabledMock,
}));

vi.mock("@/lib/subscriptions/access", () => ({
  getParentAccessLevel: accessLevelMock,
}));

vi.mock("@/lib/actions/subscription", () => ({
  createCheckoutSession: vi.fn(),
  createAdultCheckoutSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    // Table-aware (FV-574): the page now reads BOTH subscriptions
    // (maybeSingle) and parent_athlete_links (awaited head-count query).
    from: (table: string) =>
      table === "parent_athlete_links"
        ? { select: () => ({ eq: athleteCountMock }) }
        : {
            select: () => ({
              eq: () => ({
                maybeSingle: maybeSingleMock,
              }),
            }),
          },
  }),
}));

// Stub SubscribeForm — assert only that the page renders it and forwards
// isAdult + trialEligible correctly; its own copy is tested in
// subscribe-form.test.tsx.
vi.mock("@/components/subscribe/SubscribeForm", () => ({
  SubscribeForm: ({
    isAdult,
    trialEligible,
  }: {
    isAdult?: boolean;
    trialEligible?: boolean;
  }) => (
    <div data-testid="subscribe-form-stub">
      isAdult:{String(isAdult ?? false)};trialEligible:
      {String(trialEligible ?? false)}
    </div>
  ),
}));

import SubscribePage from "@/app/subscribe/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore the FV-464 /
  // shell-capability / FV-574 / FV-581 defaults so test order never matters.
  enforcementEnabledMock.mockReturnValue(false);
  accessLevelMock.mockResolvedValue("full");
  shellCapabilityMock.mockReturnValue(null);
  athleteCountMock.mockResolvedValue({ count: 1, error: null });
  entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });
  activeAppleProductIdMock.mockResolvedValue(null);
  capacityForAppleProductMock.mockReturnValue(null);
  getConfiguredAppleProductsMock.mockReturnValue([]);
});

describe("SubscribePage — price paragraph (parent vs adult)", () => {
  it("renders today's parent tiering copy unchanged for a parent profile", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const jsx = await SubscribePage({ searchParams: {} });
    const { container } = render(jsx);
    const text = container.textContent ?? "";

    expect(text).toContain(
      "$5/mo or $49/yr for your first athlete; $3/mo or $29/yr for each additional athlete.",
    );
    expect(text).toContain("isAdult:false");
  });

  it("renders individual framing for an adult_athlete profile, with no per-athlete tiering language", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "adult-1",
      profile: { id: "adult-1", role: "adult_athlete", first_name: "Jordan" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

    const jsx = await SubscribePage({ searchParams: {} });
    const { container } = render(jsx);
    const text = container.textContent ?? "";

    expect(text).toContain("$5/mo or $49/yr. Cancel any time.");
    expect(text).not.toMatch(/for your first athlete/i);
    expect(text).not.toMatch(/additional athlete/i);
    expect(text).toContain("isAdult:true");
  });
});

describe("SubscribePage — back-link loop guard (FV-464)", () => {
  const asAdult = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "adult-1",
      profile: { id: "adult-1", role: "adult_athlete", first_name: "Jordan" },
    });
  const asParent = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });

  it("sends a blocked adult's back links to the public home, not /athlete", async () => {
    asAdult();
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    enforcementEnabledMock.mockReturnValue(true);
    accessLevelMock.mockResolvedValue("blocked");

    const { container } = render(await SubscribePage({ searchParams: {} }));

    expect(container.querySelector('a[href="/athlete"]')).toBeNull();
    const home = container.querySelector('a[aria-label="Back to home"]');
    expect(home).not.toBeNull();
    expect(home).toHaveAttribute("href", "/");
  });

  it("sends a blocked parent's back links to the public home, not /dashboard", async () => {
    asParent();
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    enforcementEnabledMock.mockReturnValue(true);
    accessLevelMock.mockResolvedValue("blocked");

    const { container } = render(await SubscribePage({ searchParams: {} }));

    expect(container.querySelector('a[href="/dashboard"]')).toBeNull();
    expect(
      container.querySelector('a[aria-label="Back to home"]'),
    ).toHaveAttribute("href", "/");
  });

  it("keeps the role-aware target for an adult with active access", async () => {
    asAdult();
    maybeSingleMock.mockResolvedValue({
      data: { stripe_customer_id: "cus_1" },
      error: null,
    });
    enforcementEnabledMock.mockReturnValue(true);
    accessLevelMock.mockResolvedValue("full");

    const { container } = render(await SubscribePage({ searchParams: {} }));

    expect(
      container.querySelector('a[aria-label="Back to training"]'),
    ).toHaveAttribute("href", "/athlete");
    expect(container.querySelector('a[aria-label="Back to home"]')).toBeNull();
  });
});

describe("SubscribePage — legacy-native shell (Google Play compliance)", () => {
  it("shows no price, no SubscribeForm, and no Stripe mention when the shell capability is legacy-native", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    shellCapabilityMock.mockReturnValue("legacy-native");

    const { container, getByTestId, queryByTestId } = render(
      await SubscribePage({ searchParams: {} }),
    );
    const text = container.textContent ?? "";

    // Byte-identical pin (FV-572): this exact copy must never drift without
    // an explicit, reviewed change — it is the Google Play compliance notice.
    expect(
      getByTestId("native-shell-subscribe-notice").textContent,
    ).toBe(
      "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
    );
    expect(queryByTestId("subscribe-form-stub")).toBeNull();
    expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
    expect(text).not.toMatch(/\$5|\$49|\$3|\$29/);
    expect(text).not.toMatch(/stripe/i);
    expect(container.querySelector('[data-testid="subscribe-submit"]')).toBeNull();
  });

  it("renders the normal plan selector + price copy when the shell capability is null (ordinary web/PWA)", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    shellCapabilityMock.mockReturnValue(null);

    const { getByTestId, queryByTestId, container } = render(
      await SubscribePage({ searchParams: {} }),
    );

    expect(getByTestId("subscribe-form-stub")).toBeTruthy();
    expect(queryByTestId("native-shell-subscribe-notice")).toBeNull();
    expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
    expect(container.textContent ?? "").toMatch(/\$5\/mo or \$49\/yr/);
  });
});

describe("SubscribePage — ios-iap shell capability (FV-572)", () => {
  it("renders AppleSubscribeSection, not SubscribeForm or the legacy-native notice", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    shellCapabilityMock.mockReturnValue("ios-iap");

    const { getByTestId, queryByTestId, container } = render(
      await SubscribePage({ searchParams: {} }),
    );
    const text = container.textContent ?? "";

    expect(getByTestId("apple-subscribe-section-stub")).toBeTruthy();
    expect(queryByTestId("subscribe-form-stub")).toBeNull();
    expect(queryByTestId("native-shell-subscribe-notice")).toBeNull();
    // Same no-Stripe-pricing posture as legacy-native — the headline
    // paragraph must not promise Stripe's dollar amounts on an IAP shell.
    expect(text).not.toMatch(/\$5|\$49|\$3|\$29/);
    expect(text).not.toMatch(/stripe/i);
  });
});

describe("SubscribePage — 7-day trial banner gate (FV-574)", () => {
  const asParent = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
  const asAdult = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "adult-1",
      profile: { id: "adult-1", role: "adult_athlete", first_name: "Jordan" },
    });
  const noExistingSub = () =>
    maybeSingleMock.mockResolvedValue({ data: null, error: null });

  const renderedText = async () => {
    const { container } = render(await SubscribePage({ searchParams: {} }));
    return container.textContent ?? "";
  };

  it("first-time parent with one athlete → trialEligible:true", async () => {
    asParent();
    noExistingSub();
    athleteCountMock.mockResolvedValue({ count: 1, error: null });

    expect(await renderedText()).toContain("trialEligible:true");
  });

  it("first-time parent with zero athletes (floors to a 1-seat checkout) → trialEligible:true", async () => {
    asParent();
    noExistingSub();
    athleteCountMock.mockResolvedValue({ count: 0, error: null });

    expect(await renderedText()).toContain("trialEligible:true");
  });

  it("first-time parent with three athletes → trialEligible:false (banner must not promise a trial the action will not grant)", async () => {
    asParent();
    noExistingSub();
    athleteCountMock.mockResolvedValue({ count: 3, error: null });

    expect(await renderedText()).toContain("trialEligible:false");
  });

  it("athlete-count read error → trialEligible:false (fail closed, mirrors the action)", async () => {
    asParent();
    noExistingSub();
    athleteCountMock.mockResolvedValue({
      count: null,
      error: { message: "count read failed" },
    });

    expect(await renderedText()).toContain("trialEligible:false");
  });

  it("first-time adult (always one seat) → trialEligible:true and no athlete-count query", async () => {
    asAdult();
    noExistingSub();

    expect(await renderedText()).toContain("trialEligible:true");
    // Adults never have an athlete roster — the links table must not be read.
    expect(athleteCountMock).not.toHaveBeenCalled();
  });

  it("existing subscription row still hides the banner regardless of athlete count", async () => {
    asParent();
    maybeSingleMock.mockResolvedValue({
      data: { stripe_customer_id: "cus_1" },
      error: null,
    });
    athleteCountMock.mockResolvedValue({ count: 1, error: null });

    expect(await renderedText()).toContain("trialEligible:false");
  });
});

describe("SubscribePage — duplicate-billing guard (FV-581)", () => {
  const asParent = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
  const asAdult = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "adult-1",
      profile: { id: "adult-1", role: "adult_athlete", first_name: "Jordan" },
    });

  const renderPage = async () => {
    const { container, getByTestId, queryByTestId } = render(
      await SubscribePage({ searchParams: {} }),
    );
    return { container, getByTestId, queryByTestId, text: container.textContent ?? "" };
  };

  const expectNoBuyAffordances = (
    queryByTestId: (id: string) => HTMLElement | null,
    text: string,
  ) => {
    expect(queryByTestId("subscribe-form-stub")).toBeNull();
    expect(text).not.toMatch(/\$5|\$49|\$3|\$29/);
  };

  describe("status: unknown (an underlying read errored)", () => {
    it("shows a neutral status block on every shell — no buy affordance, no false 'subscribed'", async () => {
      asParent();
      entitlementStateMock.mockResolvedValue({ status: "unknown", provider: null });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-unknown").textContent).toBe(
        "We couldn’t load your subscription status. Please try again.",
      );
      expectNoBuyAffordances(queryByTestId, text);
      expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
      expect(queryByTestId("native-shell-subscribe-notice")).toBeNull();
      expect(text).not.toMatch(/you.re (already )?subscribed/i);
    });

    it("shows the same neutral status block even inside the ios-iap shell", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("ios-iap");
      entitlementStateMock.mockResolvedValue({ status: "unknown", provider: null });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-unknown")).toBeTruthy();
      expectNoBuyAffordances(queryByTestId, text);
      expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
    });
  });

  describe("status: entitled — ios-iap shell", () => {
    it("provider apple → AppleSubscribeSection in manage mode, no plan cards/Subscribe, no $", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("ios-iap");
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      const stub = getByTestId("apple-subscribe-section-stub");
      expect(stub).toHaveAttribute("data-mode", "manage");
      expectNoBuyAffordances(queryByTestId, text);
    });

    it("provider stripe → status copy pointing to the web, no in-shell Stripe link", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("ios-iap");
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-entitled").textContent).toBe(
        "You’re already subscribed. Manage your subscription from a web browser at fromvictoryapp.com.",
      );
      expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
      expectNoBuyAffordances(queryByTestId, text);
    });

    it("provider comp → nothing-to-manage status copy", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("ios-iap");
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "comp" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-entitled").textContent).toBe(
        "You’re subscribed to From Victory.",
      );
      expectNoBuyAffordances(queryByTestId, text);
    });
  });

  describe("status: entitled — web (no native shell)", () => {
    it("provider apple → 'manage it on your iPhone' status copy, no Stripe checkout", async () => {
      asParent();
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-entitled").textContent).toContain(
        "manage it on your iPhone",
      );
      expect(text).not.toMatch(/stripe/i);
      expect(queryByTestId("apple-subscribe-section-stub")).toBeNull();
      expectNoBuyAffordances(queryByTestId, text);
    });

    it("provider stripe (parent) → status copy + a real link to /dashboard/settings", async () => {
      asParent();
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      const card = getByTestId("subscribe-status-entitled");
      expect(card.textContent).toContain("You’re already subscribed.");
      const link = card.querySelector('a[href="/dashboard/settings"]');
      expect(link).not.toBeNull();
      expectNoBuyAffordances(queryByTestId, text);
    });

    it("provider stripe (adult_athlete) → the manage link targets /athlete/settings", async () => {
      asAdult();
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

      const { getByTestId } = await renderPage();

      const card = getByTestId("subscribe-status-entitled");
      expect(card.querySelector('a[href="/athlete/settings"]')).not.toBeNull();
      expect(card.querySelector('a[href="/dashboard/settings"]')).toBeNull();
    });

    it("provider comp → nothing-to-manage status copy", async () => {
      asParent();
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "comp" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-status-entitled").textContent).toBe(
        "You’re subscribed to From Victory.",
      );
      expectNoBuyAffordances(queryByTestId, text);
    });
  });

  // FV-584 (KC decision D1): a DEGRADED payer (e.g. past_due Stripe, or an
  // Apple row in in_billing_retry) now resolves to `status: "entitled"` too
  // — this page only ever branches on status/provider, never on the
  // underlying full-vs-degraded level (that fold lives in
  // subscribe-guard.ts, see subscribe-guard.test.ts), so a degraded payer
  // renders the exact same manage/status branch as a full one. This block
  // just pins that the page has no separate/missing branch for it.
  describe("status: entitled from a DEGRADED subscription (FV-584)", () => {
    it("provider stripe (degraded, e.g. past_due) → manage/status copy, not a buy form", async () => {
      asParent();
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      const card = getByTestId("subscribe-status-entitled");
      expect(card.textContent).toContain("You’re already subscribed.");
      expectNoBuyAffordances(queryByTestId, text);
    });

    it("provider apple (degraded, e.g. in_billing_retry) → AppleSubscribeSection in manage mode, no Subscribe button", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("ios-iap");
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      const stub = getByTestId("apple-subscribe-section-stub");
      expect(stub).toHaveAttribute("data-mode", "manage");
      expectNoBuyAffordances(queryByTestId, text);
    });
  });

  describe("status: entitled — legacy-native shell (any provider)", () => {
    it("shows the SAME unchanged compliance notice as a not_entitled legacy-native payer — no in-shell link added", async () => {
      asParent();
      shellCapabilityMock.mockReturnValue("legacy-native");
      entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

      const { getByTestId, queryByTestId, text } = await renderPage();

      expect(getByTestId("native-shell-subscribe-notice").textContent).toBe(
        "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
      );
      expect(queryByTestId("subscribe-status-entitled")).toBeNull();
      expectNoBuyAffordances(queryByTestId, text);
    });
  });

  describe("status: not_entitled (unaffected default)", () => {
    it("still renders the ordinary web purchase flow with price copy intact", async () => {
      asParent();
      maybeSingleMock.mockResolvedValue({ data: null, error: null });
      entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });

      const { getByTestId, text } = await renderPage();

      expect(getByTestId("subscribe-form-stub")).toBeTruthy();
      expect(text).toMatch(/\$5\/mo or \$49\/yr/);
    });
  });
});

describe("SubscribePage — Apple upgrade wiring (FV-586, KC decision D3)", () => {
  const asParent = () =>
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });

  const renderPage = async () => {
    const { container, getByTestId } = render(await SubscribePage({ searchParams: {} }));
    return { container, getByTestId, text: container.textContent ?? "" };
  };

  it("no mapped current product: stays in manage mode, never computes a capacity", async () => {
    asParent();
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });
    activeAppleProductIdMock.mockResolvedValue(null);

    const { getByTestId } = await renderPage();

    const stub = getByTestId("apple-subscribe-section-stub");
    expect(stub).toHaveAttribute("data-mode", "manage");
    expect(stub).toHaveAttribute("data-current-apple-capacity", "null");
    // No mapped product id either — the page must forward `null`, never
    // fabricate one.
    expect(stub).toHaveAttribute("data-current-apple-product-id", "null");
    expect(capacityForAppleProductMock).not.toHaveBeenCalled();
  });

  it("mapped product but no configured product exceeds it: stays in manage mode, still forwards the current product id", async () => {
    asParent();
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });
    activeAppleProductIdMock.mockResolvedValue("apple.tier3.monthly");
    capacityForAppleProductMock.mockReturnValue(3);
    getConfiguredAppleProductsMock.mockReturnValue([
      { productId: "apple.tier1.monthly", athleteCapacity: 1 },
      { productId: "apple.tier3.monthly", athleteCapacity: 3 },
    ]);

    const { getByTestId } = await renderPage();

    const stub = getByTestId("apple-subscribe-section-stub");
    expect(stub).toHaveAttribute("data-mode", "manage");
    // FV-600: the current product id is resolved regardless of whether an
    // upgrade exists (needed by "manage" mode's own Current Plan block), so
    // it's forwarded here even though there's no upgrade to offer.
    expect(stub).toHaveAttribute("data-current-apple-product-id", "apple.tier3.monthly");
  });

  it("mapped product with a strictly-higher configured product: renders upgrade mode with the current capacity", async () => {
    asParent();
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "apple" });
    activeAppleProductIdMock.mockResolvedValue("apple.tier1.monthly");
    capacityForAppleProductMock.mockReturnValue(1);
    getConfiguredAppleProductsMock.mockReturnValue([
      { productId: "apple.tier1.monthly", athleteCapacity: 1 },
      { productId: "apple.tier3.monthly", athleteCapacity: 3 },
    ]);

    const { getByTestId } = await renderPage();

    const stub = getByTestId("apple-subscribe-section-stub");
    expect(stub).toHaveAttribute("data-mode", "upgrade");
    expect(stub).toHaveAttribute("data-current-apple-capacity", "1");
    expect(stub).toHaveAttribute("data-current-apple-product-id", "apple.tier1.monthly");
  });

  it("stripe-provider entitled payers never trigger the Apple capacity reads", async () => {
    asParent();
    shellCapabilityMock.mockReturnValue("ios-iap");
    entitlementStateMock.mockResolvedValue({ status: "entitled", provider: "stripe" });

    await renderPage();

    expect(activeAppleProductIdMock).not.toHaveBeenCalled();
  });

  it("a not_entitled payer never triggers the Apple capacity reads", async () => {
    asParent();
    shellCapabilityMock.mockReturnValue("ios-iap");
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    entitlementStateMock.mockResolvedValue({ status: "not_entitled", provider: null });

    await renderPage();

    expect(activeAppleProductIdMock).not.toHaveBeenCalled();
  });
});
