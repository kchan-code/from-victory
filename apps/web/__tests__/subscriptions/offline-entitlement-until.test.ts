/**
 * FV-625 — the offline Pregame bound (KC policy 2026-11-09: "Until the last
 * verified subscription period ends").
 *
 * getParentOfflineEntitlementUntil returns the LATEST finite end across the
 * sources that currently grant access, or null (online-only). Pins:
 *   - Stripe: current_period_end when not blocked (trialing → trial end);
 *     canceled / incomplete_expired contribute nothing.
 *   - Comp grants: the latest dated active grant; a PERPETUAL grant
 *     (expires_at null — the Play reviewer account) contributes NOTHING, so a
 *     perpetual-only payer gets null (no invented period, no unbounded offline).
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

type GrantRow = { id: string; expires_at: string | null };
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
      if (table === "access_grants") return thenable({ data: grants, error: grantsError });
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
  it("a perpetual grant alone → null: online-only, no invented period", async () => {
    grants = [{ id: "g1", expires_at: null }];
    await expect(until()).resolves.toBeNull();
  });

  it("a dated grant → its expires_at", async () => {
    grants = [{ id: "g1", expires_at: iso(45) }];
    await expect(until()).resolves.toBe(iso(45));
  });

  it("perpetual + dated → the dated end (the perpetual one adds nothing)", async () => {
    grants = [
      { id: "g1", expires_at: null },
      { id: "g2", expires_at: iso(10) },
    ];
    await expect(until()).resolves.toBe(iso(10));
  });

  it("perpetual grant + active Stripe → the Stripe period end", async () => {
    grants = [{ id: "g1", expires_at: null }];
    sub = { status: "active", current_period_end: iso(25) };
    await expect(until()).resolves.toBe(iso(25));
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
