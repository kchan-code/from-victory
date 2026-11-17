/**
 * FV-625 — the offline Pregame bound (KC policy 2026-11-09: "Until the last
 * verified subscription period ends").
 *
 * getParentOfflineEntitlementUntil returns the LATEST finite end across the
 * sources that currently grant access, or null (online-only). Pins:
 *   - Stripe: current_period_end when not blocked (trialing → trial end);
 *     canceled / incomplete_expired contribute nothing.
 *   - Comp grants: the latest dated active grant; an ACTIVE open-ended grant
 *     (expires_at null — the Play reviewer account) contributes now + 30 days
 *     (KC decision 2026-11-16, FV-757), best-of with the other sources. A
 *     revoked grant or a failed grants read contributes nothing.
 *   - Apple: subscribed → expires_at; in_grace_period → grace end; billing
 *     retry / expired / revoked → nothing; Sandbox only when allowlisted.
 *   - Best-of across sources; a bound at/before now → null; read errors drop
 *     that source (fail closed).
 *   - Payer resolution for the current user (parent / adult_athlete self /
 *     athlete via link).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const NOW = new Date("2026-11-09T12:00:00.000Z");
const iso = (days: number) => new Date(NOW.getTime() + days * 86_400_000).toISOString();

type GrantRow = { id: string; expires_at: string | null; revoked_at?: string | null };
type AppleRow = {
  environment: "Production" | "Sandbox";
  status: string;
  expires_at: string;
  grace_period_expires_at: string | null;
};

let grants: GrantRow[] = [];
let grantsError: { message: string } | null = null;
let sub: { status: string; current_period_end: string | null } | null = null;
let subError: { message: string } | null = null;
let apple: AppleRow[] = [];
let appleError: { message: string } | null = null;
let allowlisted = false;
let googleRows: Array<{
  product_id: string;
  purchase_token: string;
  status: string;
  expires_at: string | null;
}> = [];
let googleError: { message: string } | null = null;
const servicePayerIds: string[] = [];

function thenable<T>(value: T) {
  const b: Record<string, unknown> = {
    select: () => b,
    eq: (_f: string, v: string) => {
      servicePayerIds.push(v);
      return b;
    },
    is: () => b,
    then: (resolve: (v: T) => void) => resolve(value),
  };
  return b;
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    from: (table: string) => {
      if (table === "access_grants") {
        // Mirrors the real query's `.is("revoked_at", null)` filter so a
        // revoked row is dropped server-side, as in production.
        const b: Record<string, unknown> = {
          select: () => b,
          eq: () => b,
          is: () => b,
          then: (resolve: (v: unknown) => void) =>
            resolve({
              data: grants
                .filter((g) => (g.revoked_at ?? null) === null)
                .map((g) => ({ id: g.id, expires_at: g.expires_at })),
              error: grantsError,
            }),
        };
        return b;
      }
      if (table === "apple_subscriptions") return thenable({ data: apple, error: appleError });
      if (table === "subscriptions" || table === "apple_sandbox_testers") {
        const b: Record<string, unknown> = {
          select: () => b,
          eq: (_f: string, v: string) => {
            servicePayerIds.push(v);
            return b;
          },
          maybeSingle: async () =>
            table === "subscriptions"
              ? { data: sub, error: subError }
              : { data: allowlisted ? { payer_id: "p" } : null, error: null },
        };
        return b;
      }
      if (table === "google_subscriptions") {
        return thenable({ data: googleRows, error: googleError });
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

let sessionUser: string | null = null;
let sessionRole: string | null = null;
let linkParent: string | null = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: sessionUser ? { id: sessionUser } : null } }) },
    from: (table: string) => {
      const b: Record<string, unknown> = {
        select: () => b,
        eq: () => b,
        limit: () => b,
        single: async () => ({ data: sessionRole ? { role: sessionRole } : null, error: null }),
        maybeSingle: async () => ({
          data: table === "parent_athlete_links" && linkParent ? { parent_id: linkParent } : null,
          error: null,
        }),
      };
      return b;
    },
  }),
}));

import {
  OPEN_ENDED_GRANT_OFFLINE_DAYS,
  getOfflineEntitlementUntilForCurrentUser,
  getParentOfflineEntitlementUntil,
} from "@/lib/subscriptions/access";

beforeEach(() => {
  grants = [];
  grantsError = null;
  sub = null;
  subError = null;
  apple = [];
  appleError = null;
  allowlisted = false;
  googleRows = [];
  googleError = null;
  delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
  servicePayerIds.length = 0;
  sessionUser = null;
  sessionRole = null;
  linkParent = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

const until = (now = NOW) => getParentOfflineEntitlementUntil("payer-1", now);

describe("Stripe", () => {
  it.each(["active", "trialing", "past_due", "unpaid", "paused", "incomplete"])(
    "%s → current_period_end (trialing: Stripe's current period is the trial)",
    async (status) => {
      sub = { status, current_period_end: iso(20) };
      await expect(until()).resolves.toBe(iso(20));
    },
  );

  it.each(["canceled", "incomplete_expired"])(
    "%s → nothing, even with a period end still in the future (FV-623 case)",
    async (status) => {
      sub = { status, current_period_end: iso(20) };
      await expect(until()).resolves.toBeNull();
    },
  );

  it("active with no period end synced → null (no invented period)", async () => {
    sub = { status: "active", current_period_end: null };
    await expect(until()).resolves.toBeNull();
  });

  it("period end exactly now or in the past → null", async () => {
    sub = { status: "active", current_period_end: NOW.toISOString() };
    await expect(until()).resolves.toBeNull();
    sub = { status: "active", current_period_end: iso(-1) };
    await expect(until()).resolves.toBeNull();
  });

  it("a subscriptions read error drops Stripe (fail closed)", async () => {
    sub = { status: "active", current_period_end: iso(20) };
    subError = { message: "boom" };
    await expect(until()).resolves.toBeNull();
  });
});

describe("comp grants (incl. the perpetual Play reviewer grant)", () => {
  it("a perpetual grant alone → now + 30 days", async () => {
    grants = [{ id: "g1", expires_at: null }];
    await expect(until()).resolves.toBe(iso(30));
  });

  it("the open-ended window is the exported constant (30 days)", () => {
    expect(OPEN_ENDED_GRANT_OFFLINE_DAYS).toBe(30);
  });

  it("a dated grant → its expires_at", async () => {
    grants = [{ id: "g1", expires_at: iso(45) }];
    await expect(until()).resolves.toBe(iso(45));
  });

  it("perpetual + dated grant at +10 days → now + 30 days", async () => {
    grants = [
      { id: "g1", expires_at: null },
      { id: "g2", expires_at: iso(10) },
    ];
    await expect(until()).resolves.toBe(iso(30));
  });

  it("perpetual + dated grant at +45 days → the dated end", async () => {
    grants = [
      { id: "g1", expires_at: null },
      { id: "g2", expires_at: iso(45) },
    ];
    await expect(until()).resolves.toBe(iso(45));
  });

  it("perpetual + Stripe at +25 days → now + 30 days", async () => {
    grants = [{ id: "g1", expires_at: null }];
    sub = { status: "active", current_period_end: iso(25) };
    await expect(until()).resolves.toBe(iso(30));
  });

  it("perpetual + Stripe at +60 days → the Stripe end", async () => {
    grants = [{ id: "g1", expires_at: null }];
    sub = { status: "active", current_period_end: iso(60) };
    await expect(until()).resolves.toBe(iso(60));
  });

  it("perpetual + Apple at +60 days → the Apple end", async () => {
    grants = [{ id: "g1", expires_at: null }];
    apple = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: iso(60),
        grace_period_expires_at: null,
      },
    ];
    await expect(until()).resolves.toBe(iso(60));
  });

  it("perpetual + Apple at +5 days → now + 30 days", async () => {
    grants = [{ id: "g1", expires_at: null }];
    apple = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: iso(5),
        grace_period_expires_at: null,
      },
    ];
    await expect(until()).resolves.toBe(iso(30));
  });

  it("perpetual + Google at +60 days → the Google end", async () => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
    grants = [{ id: "g1", expires_at: null }];
    googleRows = [
      { product_id: "family.1", purchase_token: "t", status: "active", expires_at: iso(60) },
    ];
    await expect(until()).resolves.toBe(iso(60));
  });

  it("a revoked perpetual grant contributes nothing (null)", async () => {
    // The real query filters revoked rows server-side (`revoked_at is null`);
    // the mock mirrors that filter on `revoked_at`.
    grants = [{ id: "g1", expires_at: null, revoked_at: iso(-1) }];
    await expect(until()).resolves.toBeNull();
  });

  it("a revoked perpetual grant + an active dated grant → only the dated end", async () => {
    grants = [
      { id: "g1", expires_at: null, revoked_at: iso(-1) },
      { id: "g2", expires_at: iso(10) },
    ];
    await expect(until()).resolves.toBe(iso(10));
  });

  it("an already-expired dated grant contributes nothing", async () => {
    grants = [{ id: "g1", expires_at: iso(-3) }];
    await expect(until()).resolves.toBeNull();
  });

  it("a grants read error drops grants (fail closed)", async () => {
    grants = [{ id: "g1", expires_at: iso(45) }];
    grantsError = { message: "boom" };
    await expect(until()).resolves.toBeNull();
  });

  it("a grants read error with a perpetual grant → null (no window invented)", async () => {
    grants = [{ id: "g1", expires_at: null }];
    grantsError = { message: "boom" };
    await expect(until()).resolves.toBeNull();
  });

  it("a grants read error does not drop other sources", async () => {
    grants = [{ id: "g1", expires_at: null }];
    grantsError = { message: "boom" };
    sub = { status: "active", current_period_end: iso(5) };
    await expect(until()).resolves.toBe(iso(5));
  });
});

describe("Apple", () => {
  const row = (r: Partial<AppleRow>): AppleRow => ({
    environment: "Production",
    status: "subscribed",
    expires_at: iso(30),
    grace_period_expires_at: null,
    ...r,
  });

  it("subscribed → expires_at (no 6h skew added)", async () => {
    apple = [row({})];
    await expect(until()).resolves.toBe(iso(30));
  });

  it("in_grace_period → the grace end", async () => {
    apple = [row({ status: "in_grace_period", expires_at: iso(-2), grace_period_expires_at: iso(5) })];
    await expect(until()).resolves.toBe(iso(5));
  });

  it.each(["in_billing_retry", "expired", "revoked"])("%s → nothing", async (status) => {
    apple = [row({ status })];
    await expect(until()).resolves.toBeNull();
  });

  it("a Sandbox row counts only for an allowlisted payer", async () => {
    apple = [row({ environment: "Sandbox" })];
    await expect(until()).resolves.toBeNull();
    allowlisted = true;
    await expect(until()).resolves.toBe(iso(30));
  });

  it("an apple_subscriptions read error drops Apple (fail closed)", async () => {
    apple = [row({})];
    appleError = { message: "boom" };
    await expect(until()).resolves.toBeNull();
  });
});

describe("Google", () => {
  const row = (status: string, expiresAt: string | null) => ({
    product_id: "family.2",
    purchase_token: "tok_google",
    status,
    expires_at: expiresAt,
  });

  beforeEach(() => {
    process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
  });

  it("active -> contributes expires_at", async () => {
    googleRows = [row("active", iso(12))];
    await expect(until()).resolves.toBe(iso(12));
  });

  it("on_hold / expired contribute nothing", async () => {
    googleRows = [row("on_hold", iso(12))];
    await expect(until()).resolves.toBeNull();
    googleRows = [row("expired", iso(12))];
    await expect(until()).resolves.toBeNull();
  });

  it("a google_subscriptions read error drops Google (fail closed)", async () => {
    googleRows = [row("active", iso(12))];
    googleError = { message: "boom" };
    await expect(until()).resolves.toBeNull();
  });
});

describe("across sources", () => {
  it("returns the LATEST end among entitling sources", async () => {
    sub = { status: "active", current_period_end: iso(10) };
    grants = [{ id: "g", expires_at: iso(40) }];
    apple = [
      {
        environment: "Production",
        status: "subscribed",
        expires_at: iso(25),
        grace_period_expires_at: null,
      },
    ];
    await expect(until()).resolves.toBe(iso(40));
  });

  it("nothing at all → null", async () => {
    await expect(until()).resolves.toBeNull();
  });
});

describe("getOfflineEntitlementUntilForCurrentUser — payer resolution", () => {
  beforeEach(() => {
    sub = { status: "active", current_period_end: iso(20) };
  });

  it("no session → null", async () => {
    await expect(getOfflineEntitlementUntilForCurrentUser(NOW)).resolves.toBeNull();
  });

  it("minor athlete → the PARENT's period (via parent_athlete_links)", async () => {
    sessionUser = "kid-1";
    sessionRole = "athlete";
    linkParent = "parent-9";
    await expect(getOfflineEntitlementUntilForCurrentUser(NOW)).resolves.toBe(iso(20));
    expect(new Set(servicePayerIds)).toEqual(new Set(["parent-9"]));
  });

  it("minor athlete with no parent link → null (fail closed)", async () => {
    sessionUser = "kid-1";
    sessionRole = "athlete";
    await expect(getOfflineEntitlementUntilForCurrentUser(NOW)).resolves.toBeNull();
  });

  it("FV-636: adult_athlete → their OWN period (they are the payer)", async () => {
    sessionUser = "adult-1";
    sessionRole = "adult_athlete";
    await expect(getOfflineEntitlementUntilForCurrentUser(NOW)).resolves.toBe(iso(20));
    expect(new Set(servicePayerIds)).toEqual(new Set(["adult-1"]));
  });

  it("an unknown role → null", async () => {
    sessionUser = "x";
    sessionRole = "admin";
    await expect(getOfflineEntitlementUntilForCurrentUser(NOW)).resolves.toBeNull();
  });
});
