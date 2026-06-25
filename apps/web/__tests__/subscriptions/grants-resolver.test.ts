/**
 * Unit tests for the comp-grant + entitlement resolver (FV-69 / FV-62).
 *
 * Tests cover:
 *   1. hasActiveCompGrant   — pure grant-table reader
 *   2. getParentAccessLevel — comp grant composition with subscription status
 *   3. isSubscriptionEnforcementEnabled — flag helper
 *   4. requireActiveAccess  — enforcement guard (flag on/off, roles, levels)
 *   5. Athlete enum-only path — getAccessForCurrentUser returns only AccessLevel
 *
 * The `server-only` guard and all Supabase clients are mocked so these tests
 * run under vitest's node environment without a real Supabase instance.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks (hoisted before any imports of the modules under test)
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

// ---------------------------------------------------------------------------
// Grant table state — hasActiveCompGrant now selects an array (not maybeSingle)
// ---------------------------------------------------------------------------

type GrantRow = { id: string; expires_at: string | null };
let grantRows: GrantRow[] = [];
let grantSelectError: { message: string } | null = null;

// Subscription table state
let subscriptionRow: {
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
} | null = null;
let subscriptionSelectError: { message: string } | null = null;

// The service mock returns different query chains based on the table name.
function makeServiceMock() {
  return {
    from: vi.fn((table: string) => {
      if (table === "access_grants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          // hasActiveCompGrant calls .is() and then awaits the chain (array result)
          // vitest resolves the chain via Symbol.iterator or the Promise on the
          // last method in the chain. We need to make the chain thenable.
          then: (resolve: (v: { data: GrantRow[]; error: typeof grantSelectError }) => void) =>
            resolve({ data: grantRows, error: grantSelectError }),
        };
      }
      if (table === "subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: subscriptionRow,
            error: subscriptionSelectError,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => makeServiceMock(),
}));

// ---------------------------------------------------------------------------
// RLS-scoped client mock — used by getAccessForCurrentUser
// ---------------------------------------------------------------------------

let rlsUserId: string | null = null;
let rlsProfileRole: string | null = null;
let rlsLinkParentId: string | null = null;
let rlsLinkError: { message: string } | null = null;
let rlsProfileError: { message: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({
          data: { user: rlsUserId ? { id: rlsUserId } : null },
        })
      ),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: rlsProfileRole ? { role: rlsProfileRole } : null,
            error: rlsProfileError,
          }),
        };
      }
      if (table === "parent_athlete_links") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: rlsLinkParentId ? { parent_id: rlsLinkParentId } : null,
            error: rlsLinkError,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { hasActiveCompGrant } from "@/lib/subscriptions/grants";
import { getParentAccessLevel, getAccessForCurrentUser } from "@/lib/subscriptions/access";
import {
  isSubscriptionEnforcementEnabled,
  requireActiveAccess,
} from "@/lib/subscriptions/enforce";
import { redirect } from "next/navigation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PARENT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const ATHLETE_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const ADULT_ATHLETE_ID = "cccccccc-0000-4000-8000-000000000003";

const FUTURE_ISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const PAST_ISO   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

function setGrantActive(expiresAt: string | null = null) {
  grantRows = [{ id: "grant-id-1", expires_at: expiresAt }];
  grantSelectError = null;
}
function setGrantExpired() {
  grantRows = [{ id: "grant-id-2", expires_at: PAST_ISO }];
  grantSelectError = null;
}
function setGrantNone() {
  grantRows = [];
  grantSelectError = null;
}
function setGrantError() {
  grantRows = [];
  grantSelectError = { message: "DB error" };
}
function setSubscription(status: string) {
  subscriptionRow = { status, cancel_at_period_end: false, current_period_end: null };
  subscriptionSelectError = null;
}
function setSubscriptionNone() {
  subscriptionRow = null;
  subscriptionSelectError = null;
}

function resetRlsState() {
  rlsUserId = null;
  rlsProfileRole = null;
  rlsLinkParentId = null;
  rlsLinkError = null;
  rlsProfileError = null;
}

// ---------------------------------------------------------------------------
// 1. hasActiveCompGrant
// ---------------------------------------------------------------------------

describe("hasActiveCompGrant", () => {
  beforeEach(() => {
    setGrantNone();
  });

  it("returns true when an active perpetual grant exists", async () => {
    setGrantActive(null);
    const service = makeServiceMock();
    expect(await hasActiveCompGrant(service as never, PARENT_ID)).toBe(true);
  });

  it("returns true when a non-expired grant exists", async () => {
    setGrantActive(FUTURE_ISO);
    const service = makeServiceMock();
    expect(await hasActiveCompGrant(service as never, PARENT_ID)).toBe(true);
  });

  it("returns false when the only grant is expired", async () => {
    setGrantExpired();
    const service = makeServiceMock();
    expect(await hasActiveCompGrant(service as never, PARENT_ID)).toBe(false);
  });

  it("returns false when no grants exist", async () => {
    const service = makeServiceMock();
    expect(await hasActiveCompGrant(service as never, PARENT_ID)).toBe(false);
  });

  it("returns false (fail-closed) on DB error", async () => {
    setGrantError();
    const service = makeServiceMock();
    expect(await hasActiveCompGrant(service as never, PARENT_ID)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. getParentAccessLevel — comp grant composition
// ---------------------------------------------------------------------------

describe("getParentAccessLevel — with comp grants", () => {
  beforeEach(() => {
    setGrantNone();
    setSubscriptionNone();
  });

  it("returns 'full' when comp grant is active (perpetual, no sub)", async () => {
    setGrantActive();
    setSubscriptionNone();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("returns 'full' when comp grant is active even with a canceled subscription", async () => {
    setGrantActive();
    setSubscription("canceled");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("returns 'full' when comp grant is active and subscription is also active", async () => {
    setGrantActive();
    setSubscription("active");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("falls back to 'blocked' when grant is absent and no subscription", async () => {
    setGrantNone();
    setSubscriptionNone();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("falls back to 'full' when grant is absent but subscription is active", async () => {
    setGrantNone();
    setSubscription("active");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("falls back to 'full' when grant is absent but subscription is trialing", async () => {
    setGrantNone();
    setSubscription("trialing");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("falls back to 'degraded' when grant is absent and subscription is past_due", async () => {
    setGrantNone();
    setSubscription("past_due");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("degraded");
  });

  it("falls back to 'blocked' when grant is absent and subscription is canceled", async () => {
    setGrantNone();
    setSubscription("canceled");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("falls back to subscription when grant is expired (no valid active grant)", async () => {
    setGrantExpired();
    setSubscriptionNone();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("falls back to subscription when grant DB errors (fail-closed, no sub)", async () => {
    setGrantError();
    setSubscriptionNone();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("falls back to 'full' on grant DB error when subscription is active", async () => {
    setGrantError();
    setSubscription("active");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });
});

// ---------------------------------------------------------------------------
// 3. isSubscriptionEnforcementEnabled
// ---------------------------------------------------------------------------

describe("isSubscriptionEnforcementEnabled", () => {
  afterEach(() => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
  });

  it("returns false when env var is not set", () => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
    expect(isSubscriptionEnforcementEnabled()).toBe(false);
  });

  it("returns false when env var is 'false'", () => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "false";
    expect(isSubscriptionEnforcementEnabled()).toBe(false);
  });

  it("returns false when env var is '1'", () => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "1";
    expect(isSubscriptionEnforcementEnabled()).toBe(false);
  });

  it("returns true only when env var is exactly 'true'", () => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "true";
    expect(isSubscriptionEnforcementEnabled()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. requireActiveAccess — enforcement guard
// ---------------------------------------------------------------------------

describe("requireActiveAccess — flag off", () => {
  beforeEach(() => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
    vi.mocked(redirect).mockClear();
    resetRlsState();
    setGrantNone();
    setSubscriptionNone();
  });

  it("returns 'full' without calling redirect when flag is off (blocked parent)", async () => {
    // Even a blocked parent should NOT be redirected when flag is off.
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    const result = await requireActiveAccess({ role: "parent" });
    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns 'full' without redirect for blocked athlete when flag is off", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    const result = await requireActiveAccess({ role: "athlete" });
    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns 'full' without redirect for degraded when flag is off", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantNone();
    setSubscription("past_due");
    const result = await requireActiveAccess({ role: "parent" });
    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireActiveAccess — flag on", () => {
  beforeEach(() => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "true";
    vi.mocked(redirect).mockClear();
    resetRlsState();
    setGrantNone();
    setSubscriptionNone();
  });

  afterEach(() => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
  });

  it("does not redirect when level is 'full' (active subscription)", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantNone();
    setSubscription("active");
    const result = await requireActiveAccess({ role: "parent" });
    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not redirect when level is 'full' via active comp grant", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantActive();
    setSubscriptionNone();
    const result = await requireActiveAccess({ role: "parent" });
    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not redirect for 'degraded' (past_due) — returns 'degraded'", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantNone();
    setSubscription("past_due");
    const result = await requireActiveAccess({ role: "parent" });
    expect(result).toBe("degraded");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects blocked parent to /subscribe", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantNone();
    setSubscriptionNone();
    // redirect() is mocked to a vi.fn() (does NOT throw in this test env).
    await requireActiveAccess({ role: "parent" });
    expect(redirect).toHaveBeenCalledWith("/subscribe");
  });

  it("redirects blocked athlete to /athlete/paused (not /subscribe)", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantNone();
    setSubscriptionNone();
    await requireActiveAccess({ role: "athlete" });
    expect(redirect).toHaveBeenCalledWith("/athlete/paused");
  });

  it("never redirects athlete to /subscribe (athletes cannot buy)", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantNone();
    setSubscriptionNone();
    await requireActiveAccess({ role: "athlete" });
    expect(redirect).not.toHaveBeenCalledWith("/subscribe");
  });
});

// ---------------------------------------------------------------------------
// 5. Athlete enum-only path
// ---------------------------------------------------------------------------

describe("getAccessForCurrentUser — athlete path returns only AccessLevel enum", () => {
  beforeEach(() => {
    resetRlsState();
    setGrantNone();
    setSubscriptionNone();
  });

  it("returns 'full' for athlete when parent has an active comp grant", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantActive();
    setSubscriptionNone();
    const result = await getAccessForCurrentUser();
    // Result is a plain string — never an object with billing fields.
    expect(result).toBe("full");
    expect(typeof result).toBe("string");
    // Confirm no billing shape leaked (enum value is a primitive, not an Object).
    expect(result).not.toBeInstanceOf(Object);
  });

  it("returns 'blocked' for athlete when parent has no sub and no grant", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantNone();
    setSubscriptionNone();
    const result = await getAccessForCurrentUser();
    expect(result).toBe("blocked");
    expect(typeof result).toBe("string");
  });

  it("returns 'full' for athlete when parent has active subscription", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantNone();
    setSubscription("active");
    const result = await getAccessForCurrentUser();
    expect(result).toBe("full");
    expect(typeof result).toBe("string");
  });

  it("returns 'blocked' for athlete with no parent link", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = null;  // No link
    setGrantNone();
    setSubscriptionNone();
    const result = await getAccessForCurrentUser();
    expect(result).toBe("blocked");
  });

  it("returns 'blocked' with no session", async () => {
    rlsUserId = null;
    const result = await getAccessForCurrentUser();
    expect(result).toBe("blocked");
  });
});

// ---------------------------------------------------------------------------
// 6. adult_athlete path (FV-325) — 18+ self-serve. Access derives from the
//    adult's OWN subscription row (their id is the payer key), with NO
//    parent_athlete_links hop.
// ---------------------------------------------------------------------------

describe("getAccessForCurrentUser — adult_athlete (18+ self-serve) path", () => {
  beforeEach(() => {
    resetRlsState();
    setGrantNone();
    setSubscriptionNone();
  });

  it("returns 'full' for adult_athlete with an active subscription", async () => {
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    setSubscription("active");
    expect(await getAccessForCurrentUser()).toBe("full");
  });

  it("returns 'full' for adult_athlete with an active comp grant", async () => {
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    setGrantActive();
    setSubscriptionNone();
    expect(await getAccessForCurrentUser()).toBe("full");
  });

  it("returns 'blocked' for adult_athlete with no subscription and no grant", async () => {
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    expect(await getAccessForCurrentUser()).toBe("blocked");
  });

  it("derives access from own id, never via a parent_athlete_links hop", async () => {
    // Even with a stray link configured, the adult_athlete branch must resolve
    // via its own subscription (own id as payer key) — it returns before the
    // athlete branch that would read parent_athlete_links.
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    rlsLinkParentId = PARENT_ID; // would only matter on the athlete branch
    setSubscription("active");
    expect(await getAccessForCurrentUser()).toBe("full");
  });
});
