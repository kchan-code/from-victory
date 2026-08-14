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
  enforcementEnabledMock,
  accessLevelMock,
  isNativeShellMock,
} = vi.hoisted(() => ({
  requireSubscriberMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  enforcementEnabledMock: vi.fn(() => false),
  accessLevelMock: vi.fn(async () => "full"),
  // Default false (ordinary web/PWA request) — the FV-442 tests above must
  // see today's unchanged behavior. The native-shell describe block below
  // overrides this per test.
  isNativeShellMock: vi.fn(() => false),
}));

vi.mock("@/lib/auth/guards", () => ({
  requireSubscriber: requireSubscriberMock,
}));

// Google Play "no in-app purchase" compliance (native-shell fix). Mocked
// wholesale — not next/headers — so this file doesn't have to also stub
// "server-only" (lib/native-shell.ts imports it) just to exercise unrelated
// price-paragraph copy.
vi.mock("@/lib/native-shell", () => ({
  isNativeShell: isNativeShellMock,
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
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: maybeSingleMock,
        }),
      }),
    }),
  }),
}));

// Stub SubscribeForm — assert only that the page renders it and forwards
// isAdult correctly; its own copy is tested in subscribe-form.test.tsx.
vi.mock("@/components/subscribe/SubscribeForm", () => ({
  SubscribeForm: ({ isAdult }: { isAdult?: boolean }) => (
    <div data-testid="subscribe-form-stub">
      isAdult:{String(isAdult ?? false)}
    </div>
  ),
}));

import SubscribePage from "@/app/subscribe/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // clearAllMocks keeps mockReturnValue overrides — restore the FV-464 /
  // native-shell defaults so test order never matters.
  enforcementEnabledMock.mockReturnValue(false);
  accessLevelMock.mockResolvedValue("full");
  isNativeShellMock.mockReturnValue(false);
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

describe("SubscribePage — native shell (Google Play compliance)", () => {
  it("shows no price, no SubscribeForm, and no Stripe mention when isNativeShell() is true", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    isNativeShellMock.mockReturnValue(true);

    const { container, getByTestId, queryByTestId } = render(
      await SubscribePage({ searchParams: {} }),
    );
    const text = container.textContent ?? "";

    expect(
      getByTestId("native-shell-subscribe-notice").textContent,
    ).toContain(
      "Subscribe to From Victory from a web browser at fromvictoryapp.com.",
    );
    expect(queryByTestId("subscribe-form-stub")).toBeNull();
    expect(text).not.toMatch(/\$5|\$49|\$3|\$29/);
    expect(text).not.toMatch(/stripe/i);
    expect(container.querySelector('[data-testid="subscribe-submit"]')).toBeNull();
  });

  it("renders the normal plan selector + price copy when isNativeShell() is false", async () => {
    requireSubscriberMock.mockResolvedValue({
      userId: "parent-1",
      profile: { id: "parent-1", role: "parent", first_name: "Kim" },
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    isNativeShellMock.mockReturnValue(false);

    const { getByTestId, queryByTestId, container } = render(
      await SubscribePage({ searchParams: {} }),
    );

    expect(getByTestId("subscribe-form-stub")).toBeTruthy();
    expect(queryByTestId("native-shell-subscribe-notice")).toBeNull();
    expect(container.textContent ?? "").toMatch(/\$5\/mo or \$49\/yr/);
  });
});
