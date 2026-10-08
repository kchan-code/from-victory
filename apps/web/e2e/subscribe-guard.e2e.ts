/**
 * subscribe-guard.e2e.ts — FV-587
 *
 * Covers the `/subscribe` duplicate-purchase guard (FV-581 "duplicate-billing
 * guard" + FV-584 / KC decision D1 "degraded payers are entitled too"):
 *
 *   - A payer with an ACTIVE Stripe subscription sees manage/status copy,
 *     never a fresh buy CTA.
 *   - A payer with a DEGRADED (`past_due`) Stripe subscription ALSO sees
 *     manage/status copy, never a fresh buy CTA (this is the D1 / FV-584
 *     extension — a degraded payer has a subscription to fix, not a reason
 *     to start a second one).
 *   - A payer with NO subscription row sees the ordinary choose-plan /
 *     checkout CTA.
 *
 * Each scenario is run under two User-Agents:
 *   - the default mobile-web UA (ordinary browser / installed PWA)
 *   - an `ios-iap` shell UA (`FVNativeShell/1 (ios)`) — the native-shell
 *     capability that renders `AppleSubscribeSection` instead of
 *     `SubscribeForm` for a not_entitled payer (see native-shell.ts).
 *
 * IMPORTANT — what this spec does NOT (and cannot) assert:
 *   `app/subscribe/page.tsx` only renders a `<form>` wired to
 *   `startSubscriptionCheckout` for a `not_entitled` payer (inside
 *   `SubscribeForm`). For an `entitled` (active/degraded) payer, NO `<form>`
 *   is rendered at all — there is no checkout submission path reachable
 *   from the client UI to even attempt. This spec asserts that absence
 *   (zero `<form>` elements) as the strongest UI-level proof the guard
 *   holds. It does NOT separately invoke `startSubscriptionCheckout`
 *   server-side (e.g. by POSTing Next.js's internal encoded server-action
 *   id) — that would require reverse-engineering non-public wire format
 *   rather than exercising the real UI, and isn't deterministic test
 *   infrastructure. The server-side refusal-before-Stripe-lookup behavior
 *   (`lib/actions/subscription.ts`'s `startSubscriptionCheckout`, guarded by
 *   `getSubscribeEntitlementState`) is covered by Vitest unit tests, not
 *   here — this spec's job is the UI-reachability guarantee.
 *
 * Seeding: three synthetic "e2e-sub-guard-*" parents (active / degraded /
 * no-sub) are created via service-role in `beforeAll`, one full trio PER
 * PROJECT (email suffixed with `testInfo.project.name`) so
 * chromium-mobile-parent and pixel7 can run this spec in parallel without
 * colliding on the same auth user or subscriptions row. `afterAll` deletes
 * everything this spec seeded (subscriptions row + profile + auth user).
 *
 * Auth: this spec signs in as its OWN seeded parents via the real /signin
 * UI (mirroring global-setup.ts's `createAndSignInParent`), so it does NOT
 * use the project's default FV-583 storageState (that fixture is a
 * DIFFERENT parent used by multi-athlete.e2e.ts). `test.use({ storageState:
 * ... })` below clears the project default for every test in this file.
 */

import { createClient } from "@supabase/supabase-js";
import { devices, expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Service client (seeding/cleanup only — never used in assertions)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- unparameterised client, mirrors global-setup.ts's ServiceClient
type ServiceClient = ReturnType<typeof createClient<any, any, any>>;

function makeServiceClient(): ServiceClient {
  const url = process.env.E2E_SUPABASE_URL ?? "";
  const key = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

type SubKind = "active" | "degraded" | "no-sub";

const SUB_KINDS: SubKind[] = ["active", "degraded", "no-sub"];

const PASSWORD = "e2e-TestSubGuard-2024!";

interface SeededParent {
  id: string;
  email: string;
}

/**
 * Deterministic, project-suffixed email so chromium-mobile-parent and pixel7
 * each seed (and later delete) their OWN trio of parents, never touching the
 * other project's rows even when both run concurrently.
 */
function emailFor(kind: SubKind, projectName: string): string {
  return `e2e-sub-guard-${kind}+${projectName}@fromvictory.test`;
}

async function findUserIdByEmail(
  service: ServiceClient,
  email: string,
): Promise<string | null> {
  const { data } = await service.auth.admin.listUsers();
  return data?.users?.find((u: { email?: string }) => u.email === email)?.id ?? null;
}

/** Idempotent cleanup for one seeded parent, by email. Safe to call even if
 * the parent was never created (e.g. a prior interrupted run). */
async function cleanupParent(
  service: ServiceClient,
  email: string,
): Promise<void> {
  const id = await findUserIdByEmail(service, email);
  if (!id) return;
  // subscriptions.parent_id -> profiles(id) and profiles.id -> auth.users(id)
  // both cascade on delete, but we delete explicitly first (defense in
  // depth / mirrors global-setup.ts's cleanupExistingTestParent pattern).
  await service.from("subscriptions").delete().eq("parent_id", id);
  await service.from("profiles").delete().eq("id", id);
  await service.auth.admin.deleteUser(id);
}

/**
 * Creates one seeded parent (auth user + profile), and for "active"/
 * "degraded" a matching `subscriptions` row with a synthetic Stripe
 * customer/subscription id. "no-sub" gets no subscriptions row at all.
 */
async function seedParent(
  service: ServiceClient,
  kind: SubKind,
  projectName: string,
): Promise<SeededParent> {
  const email = emailFor(kind, projectName);

  // Clean up any leftover row from a previous interrupted run first.
  await cleanupParent(service, email);

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });
  if (createError || !created.user) {
    throw new Error(
      `[subscribe-guard] Failed to create parent (${kind}/${projectName}): ${createError?.message ?? "unknown error"}`,
    );
  }
  const parentId = created.user.id;

  const { error: profileError } = await service.from("profiles").insert({
    id: parentId,
    role: "parent",
    first_name: `E2E-SubGuard-${kind}`,
  });
  if (profileError) {
    await service.auth.admin.deleteUser(parentId);
    throw new Error(
      `[subscribe-guard] Failed to insert profile (${kind}/${projectName}): ${profileError.message}`,
    );
  }

  if (kind !== "no-sub") {
    // "active" -> full access; "degraded" -> past_due (D1/FV-584 extends the
    // guard to this level too). See lib/subscriptions/access-level.ts.
    const status = kind === "active" ? "active" : "past_due";
    const futurePeriodEnd = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: subError } = await service.from("subscriptions").insert({
      parent_id: parentId,
      stripe_customer_id: `cus_e2e_subguard_${kind}_${projectName}`,
      stripe_subscription_id: `sub_e2e_subguard_${kind}_${projectName}`,
      status,
      price_id: "price_e2e_subguard_test",
      current_period_end: futurePeriodEnd,
    });
    if (subError) {
      await service.from("profiles").delete().eq("id", parentId);
      await service.auth.admin.deleteUser(parentId);
      throw new Error(
        `[subscribe-guard] Failed to insert subscription (${kind}/${projectName}): ${subError.message}`,
      );
    }
  }

  return { id: parentId, email };
}

// ---------------------------------------------------------------------------
// Sign-in helper — real /signin UI flow (parent tab is the default active
// tab in SignInChooser), mirroring global-setup.ts's createAndSignInParent.
// ---------------------------------------------------------------------------

async function signInAsParent(page: Page, email: string): Promise<void> {
  await page.goto("/signin");
  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Shared assertions
// ---------------------------------------------------------------------------

/** No buy/checkout affordance of any kind (web plan form OR Apple purchase
 * surface) — and, per the module doc above, no `<form>` at all, since the
 * checkout `<form>` only exists inside SubscribeForm, which never renders
 * for an entitled/degraded payer. */
async function expectNoBuyCta(page: Page): Promise<void> {
  await expect(page.getByTestId("subscribe-submit")).toHaveCount(0);
  await expect(page.getByTestId("plan-card-annual")).toHaveCount(0);
  await expect(page.getByTestId("plan-card-monthly")).toHaveCount(0);
  await expect(page.getByTestId("apple-purchase-submit")).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Subscribe duplicate-purchase guard (FV-581 / FV-584)", () => {
  // This spec signs in as its own seeded parents — never the shared FV-583
  // fixture parent the project's default storageState points at.
  test.use({ storageState: { cookies: [], origins: [] } });

  const parents: Partial<Record<SubKind, SeededParent>> = {};

  test.beforeAll(async ({}, testInfo) => {
    const service = makeServiceClient();
    const projectName = testInfo.project.name;
    for (const kind of SUB_KINDS) {
      parents[kind] = await seedParent(service, kind, projectName);
    }
  });

  test.afterAll(async ({}, testInfo) => {
    const service = makeServiceClient();
    const projectName = testInfo.project.name;
    for (const kind of SUB_KINDS) {
      await cleanupParent(service, emailFor(kind, projectName));
    }
  });

  // ------------------------------------------------------------------
  // Web (ordinary browser / installed PWA) User-Agent — no shell token.
  // ------------------------------------------------------------------
  test.describe("web user agent", () => {
    test("active subscriber sees manage/status copy, no buy CTA", async ({
      page,
    }) => {
      const parent = parents.active;
      if (!parent) throw new Error("active parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      await expect(page.getByTestId("subscribe-status-entitled")).toBeVisible();
      await expect(
        page.getByText(/you.re already subscribed/i),
      ).toBeVisible();
      await expect(page.getByTestId("subscribe-status-unknown")).toHaveCount(0);
      await expectNoBuyCta(page);
    });

    test("degraded (past_due) subscriber sees manage/status copy, no buy CTA (D1/FV-584)", async ({
      page,
    }) => {
      const parent = parents.degraded;
      if (!parent) throw new Error("degraded parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      await expect(page.getByTestId("subscribe-status-entitled")).toBeVisible();
      await expect(page.getByTestId("subscribe-status-unknown")).toHaveCount(0);
      await expectNoBuyCta(page);
    });

    test("parent with no subscription sees the choose-plan checkout CTA", async ({
      page,
    }) => {
      const parent = parents["no-sub"];
      if (!parent) throw new Error("no-sub parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      await expect(page.getByTestId("subscribe-submit")).toBeVisible();
      await expect(page.getByTestId("plan-card-annual")).toBeVisible();
      await expect(page.getByTestId("plan-card-monthly")).toBeVisible();
      await expect(page.getByTestId("subscribe-status-entitled")).toHaveCount(0);
      await expect(page.getByTestId("subscribe-status-unknown")).toHaveCount(0);
    });
  });

  // ------------------------------------------------------------------
  // ios-iap shell User-Agent (`FVNativeShell/1 (ios)`, see native-shell.ts).
  // All three seeded parents carry a STRIPE subscription (or none), so per
  // app/subscribe/page.tsx's branch order an entitled payer here renders the
  // SAME `subscribe-status-entitled` StatusCard as the plain-web case (the
  // `AppleSubscribeSection` "manage" branch is reached only when
  // `entitlementState.provider === "apple"`, which none of these fixtures
  // are) — asserted as such below, honestly, rather than assuming
  // AppleSubscribeSection renders for a Stripe payer.
  // ------------------------------------------------------------------
  test.describe("ios-iap user agent", () => {
    test.use({
      userAgent: `${devices["iPhone 14"].userAgent} FVNativeShell/1 (ios)`,
    });

    test("active (Stripe) subscriber sees manage/status copy, no buy CTA", async ({
      page,
    }) => {
      const parent = parents.active;
      if (!parent) throw new Error("active parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      await expect(page.getByTestId("subscribe-status-entitled")).toBeVisible();
      await expect(page.getByTestId("apple-manage-status")).toHaveCount(0);
      await expectNoBuyCta(page);
    });

    test("degraded (Stripe past_due) subscriber sees manage/status copy, no buy CTA", async ({
      page,
    }) => {
      const parent = parents.degraded;
      if (!parent) throw new Error("degraded parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      await expect(page.getByTestId("subscribe-status-entitled")).toBeVisible();
      await expectNoBuyCta(page);
    });

    test("parent with no subscription reaches the Apple purchase surface and is never shown as entitled", async ({
      page,
    }) => {
      const parent = parents["no-sub"];
      if (!parent) throw new Error("no-sub parent fixture not seeded");
      await signInAsParent(page, parent.email);

      await page.goto("/subscribe");
      await expect(page).toHaveURL(/\/subscribe/);

      // The invariant under test is the GUARD: a no-sub payer must never be
      // rendered as entitled. What AppleSubscribeSection shows for them
      // depends on the environment's product catalog (NEXT_PUBLIC_APPLE_PRODUCTS,
      // see lib/subscriptions/apple-products.ts): unset (shipped default / CI)
      // → the honest neutral "unavailable" state; configured (e.g. a local
      // test catalog) → the real purchase surface with its submit control.
      // Accept either purchase-reachable state — never a fabricated catalog —
      // and hard-assert the entitled card is absent.
      await expect(page.getByTestId("subscribe-status-entitled")).toHaveCount(0);
      await expect(page.getByTestId("subscribe-status-unknown")).toHaveCount(0);
      const unavailable = page.getByTestId("apple-subscribe-unavailable");
      const purchaseSubmit = page.getByTestId("apple-purchase-submit");
      await expect(unavailable.or(purchaseSubmit).first()).toBeVisible();
      const catalogConfigured = (await purchaseSubmit.count()) > 0;
      if (catalogConfigured) {
        await expect(unavailable).toHaveCount(0);
      } else {
        await expect(purchaseSubmit).toHaveCount(0);
      }
    });
  });
});
