/**
 * Unit tests for the comp-grant + entitlement resolver (FV-69 / FV-62 / FV-570).
 *
 * Tests cover:
 *   1. hasActiveCompGrant   — pure grant-table reader
 *   2. getParentAccessLevel — comp grant composition with subscription status
 *   3. isSubscriptionEnforcementEnabled — flag helper
 *   4. requireActiveAccess  — enforcement guard (flag on/off, roles, levels)
 *   5. Athlete enum-only path — getAccessForCurrentUser returns only AccessLevel
 *   6. getParentAccessLevel — Apple provider fold (FV-570): unless a test
 *      opts in via the `setApple*` helpers, the apple_subscriptions /
 *      apple_sandbox_testers mocks default to "no Apple entitlement", so all
 *      pre-existing tests above exercise the Stripe-only path unchanged.
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

// FV-585: seat-overlay tests need a controllable numeric Apple capacity,
// which the real (currently-empty) APPLE_PRODUCT_CAPACITY map can never
// produce. Override only these two named exports via importOriginal so
// every OTHER test in this file (e.g. the section-7 Apple provider fold,
// which exercises the real getAppleAccessLevelForPayer) is unaffected.
// Both default to "no active Apple product / no ceiling", so the seat
// overlay is dormant for every pre-existing test that never opts in.
const getActiveAppleProductIdMock = vi.fn(() => Promise.resolve<string | null>(null));
vi.mock("@/lib/subscriptions/apple", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/subscriptions/apple")>();
  return {
    ...actual,
    getActiveAppleProductId: (...args: unknown[]) =>
      getActiveAppleProductIdMock(...(args as [])),
  };
});

const payerCapacityCeilingMock = vi.fn(() => null as number | null);
vi.mock("@/lib/subscriptions/apple-capacity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/subscriptions/apple-capacity")>();
  return {
    ...actual,
    payerCapacityCeiling: (...args: unknown[]) =>
      payerCapacityCeilingMock(...(args as [])),
  };
});

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

// apple_subscriptions / apple_sandbox_testers state (FV-570 fold). Defaults
// to "no Apple entitlement at all" so every pre-existing test above (which
// never touches these helpers) exercises the Stripe-only path unchanged.
type AppleSubRow = {
  environment: "Sandbox" | "Production";
  status: string;
  expires_at: string;
  grace_period_expires_at: string | null;
};
let appleSubRows: AppleSubRow[] = [];
let appleSubSelectError: { message: string } | null = null;
let appleAllowlistRow: { payer_id: string } | null = null;
let appleAllowlistError: { message: string } | null = null;

// FV-585: parent_athlete_links rows as read by lib/subscriptions/seat-state.ts
// via the SERVICE-ROLE client (distinct from the RLS-scoped `rlsLinkParentId`
// single-row mock below, which access.ts's athlete branch reads via the
// session client). Defaults to empty, which makes
// getAthleteSeatStatusForCurrentUser() resolve "active" (fail open, no
// matching link row) for every pre-existing test that never opts in via
// `setSeatLinks` — the seat overlay is inert unless a test sets it.
type SeatLinkRow = { parent_id: string; athlete_id: string; seat_active: boolean };
let seatLinkRows: SeatLinkRow[] = [];
let seatLinkSelectError: { message: string } | null = null;
function resetSeatLinks() {
  seatLinkRows = [];
  seatLinkSelectError = null;
}
function setSeatLinks(rows: SeatLinkRow[]) {
  seatLinkRows = rows;
  seatLinkSelectError = null;
}

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
      if (table === "apple_subscriptions") {
        // getAppleAccessLevelForPayer reads via .select().eq() and awaits the
        // chain directly (array result) — same thenable pattern as
        // access_grants above.
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          then: (resolve: (v: { data: AppleSubRow[]; error: typeof appleSubSelectError }) => void) =>
            resolve({ data: appleSubRows, error: appleSubSelectError }),
        };
      }
      if (table === "apple_sandbox_testers") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: appleAllowlistRow,
            error: appleAllowlistError,
          }),
        };
      }
      if (table === "parent_athlete_links") {
        // Supports BOTH read shapes seat-state.ts uses against the
        // service-role client:
        //   - .select("parent_id").eq("athlete_id", x).limit(1).maybeSingle()
        //   - .select("athlete_id, seat_active").eq("parent_id", x)  (awaited
        //     directly as a list — no .maybeSingle())
        const filters: Record<string, string> = {};
        const filtered = () =>
          seatLinkRows.filter((row) =>
            Object.entries(filters).every(
              ([key, value]) => (row as Record<string, unknown>)[key] === value,
            ),
          );
        const builder: Record<string, unknown> = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string, value: string) => {
            filters[field] = value;
            return builder;
          }),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: filtered()[0] ?? null,
              error: seatLinkSelectError,
            }),
          ),
          then: (
            resolve: (v: { data: SeatLinkRow[]; error: typeof seatLinkSelectError }) => void,
          ) => resolve({ data: filtered(), error: seatLinkSelectError }),
        };
        return builder;
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
const OTHER_ATHLETE_ID = "bbbbbbbb-0000-4000-8000-000000000009";

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

// --- Apple fold helpers (FV-570) ---
function resetAppleState() {
  appleSubRows = [];
  appleSubSelectError = null;
  appleAllowlistRow = null;
  appleAllowlistError = null;
}
function setAppleNone() {
  appleSubRows = [];
  appleSubSelectError = null;
}
function setAppleProductionRow(status: string, opts?: { graceExpiresAt?: string | null }) {
  appleSubRows = [
    {
      environment: "Production",
      status,
      expires_at: FUTURE_ISO,
      grace_period_expires_at: opts?.graceExpiresAt ?? null,
    },
  ];
  appleSubSelectError = null;
}
function setAppleSandboxRow(status: string, allowlisted: boolean) {
  appleSubRows = [
    {
      environment: "Sandbox",
      status,
      expires_at: FUTURE_ISO,
      grace_period_expires_at: null,
    },
  ];
  appleSubSelectError = null;
  appleAllowlistRow = allowlisted ? { payer_id: PARENT_ID } : null;
  appleAllowlistError = null;
}
function setAppleError() {
  appleSubRows = [];
  appleSubSelectError = { message: "apple DB error" };
}

// File-level hook (runs before every test in this file, ahead of any
// describe-scoped beforeEach): keeps the Apple mock state from leaking
// between tests. Individual FV-570 fold tests opt into non-default Apple
// state inside their own `it()` body via the setApple* helpers above.
beforeEach(() => {
  resetAppleState();
  resetSeatLinks();
  getActiveAppleProductIdMock.mockReset();
  getActiveAppleProductIdMock.mockResolvedValue(null);
  payerCapacityCeilingMock.mockReset();
  payerCapacityCeilingMock.mockReturnValue(null);
});

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

  it("redirects a blocked adult_athlete to /subscribe (FV-328: self-payer)", async () => {
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    setGrantNone();
    setSubscriptionNone();
    await requireActiveAccess({ role: "adult_athlete" });
    expect(redirect).toHaveBeenCalledWith("/subscribe");
  });

  it("never sends a blocked adult_athlete to /athlete/paused", async () => {
    rlsUserId = ADULT_ATHLETE_ID;
    rlsProfileRole = "adult_athlete";
    setGrantNone();
    setSubscriptionNone();
    await requireActiveAccess({ role: "adult_athlete" });
    expect(redirect).not.toHaveBeenCalledWith("/athlete/paused");
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

// ---------------------------------------------------------------------------
// 7. getParentAccessLevel — Apple provider fold (FV-570)
//
// docs/fv210-ios-iap-decision-record.md Section 4.1: resolution order is
// access_grants -> Stripe mirror -> Apple mirror, returning the BEST level
// across providers. Section 4.9: a Sandbox row must never yield "full" for
// a non-allowlisted payer.
// ---------------------------------------------------------------------------

describe("getParentAccessLevel — Apple provider fold (FV-570)", () => {
  beforeEach(() => {
    setGrantNone();
    setSubscriptionNone();
    resetAppleState();
  });

  it("comp grant short-circuit is unchanged — full even with Apple state present", async () => {
    setGrantActive();
    setAppleError(); // would otherwise be irrelevant — grant wins first
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("stripe-blocked + apple-full (Production, subscribed) -> full", async () => {
    setSubscription("canceled"); // stripeLevel = blocked
    setAppleProductionRow("subscribed");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("stripe-full + apple-blocked (Production, revoked) -> full", async () => {
    setSubscription("active"); // stripeLevel = full
    setAppleProductionRow("revoked");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("both blocked -> blocked", async () => {
    setSubscriptionNone(); // stripeLevel = blocked
    setAppleNone(); // appleLevel = blocked
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("apple accessor DB error falls back to the Stripe level only", async () => {
    setSubscription("active"); // stripeLevel = full
    setAppleError();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("apple accessor DB error does not upgrade a blocked Stripe level", async () => {
    setSubscriptionNone(); // stripeLevel = blocked
    setAppleError();
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("a non-allowlisted payer's Sandbox row never yields full or degraded (record §4.9)", async () => {
    setSubscriptionNone(); // stripeLevel = blocked
    setAppleSandboxRow("subscribed", /* allowlisted */ false);
    expect(await getParentAccessLevel(PARENT_ID)).toBe("blocked");
  });

  it("an allowlisted payer's Sandbox row DOES grant access (record §4.9)", async () => {
    setSubscriptionNone(); // stripeLevel = blocked
    setAppleSandboxRow("subscribed", /* allowlisted */ true);
    expect(await getParentAccessLevel(PARENT_ID)).toBe("full");
  });

  it("degraded Apple (in_billing_retry, Production) folds with blocked Stripe to degraded", async () => {
    setSubscriptionNone(); // stripeLevel = blocked
    setAppleProductionRow("in_billing_retry");
    expect(await getParentAccessLevel(PARENT_ID)).toBe("degraded");
  });
});

// ---------------------------------------------------------------------------
// 8. Athlete return-boundary pin (FV-210 record §4.1 named AC): the athlete
//    path's RETURN VALUE is the bare AccessLevel string enum and nothing
//    else. The service-role read inside getParentAccessLevel necessarily
//    touches apple_subscriptions columns — what this pins is that none of
//    that row shape crosses the return boundary to the athlete caller. The
//    enum contract is also compile-time enforced (Promise<AccessLevel>);
//    this is the runtime pin against the signature being widened later.
// ---------------------------------------------------------------------------

describe("getAccessForCurrentUser — athlete path returns the bare AccessLevel enum (FV-570)", () => {
  beforeEach(() => {
    resetRlsState();
    setGrantNone();
    setSubscriptionNone();
    resetAppleState();
  });

  it("returns only the AccessLevel enum when access derives from an Apple row", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setAppleProductionRow("subscribed");
    const result = await getAccessForCurrentUser();
    expect(result).toBe("full");
    expect(typeof result).toBe("string");
    expect(result).not.toBeInstanceOf(Object);
  });
});

// ---------------------------------------------------------------------------
// 9. Seat overlay in requireActiveAccess (FV-585, KC decision D2) — layered
//    ON TOP of the existing billing gate. Only ever ADDS a redirect for a
//    minor athlete whose billing level is already full/degraded; never
//    applies to parent/adult_athlete, never fires when the flag is off, and
//    a fully-blocked athlete's redirect is unchanged (no `reason` param).
// ---------------------------------------------------------------------------

describe("requireActiveAccess — seat overlay (FV-585)", () => {
  beforeEach(() => {
    process.env.ENFORCE_SUBSCRIPTION_GATING = "true";
    vi.mocked(redirect).mockClear();
    resetRlsState();
    resetSeatLinks();
    setGrantNone();
    setSubscriptionNone();
    getActiveAppleProductIdMock.mockResolvedValue(null);
    payerCapacityCeilingMock.mockReturnValue(null);
  });

  afterEach(() => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
  });

  it("redirects a billing-entitled athlete to /athlete/paused?reason=seats when seats are over capacity with no selection", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantActive(); // billing level: full
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([
      { parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true },
      { parent_id: PARENT_ID, athlete_id: OTHER_ATHLETE_ID, seat_active: true },
    ]);

    await requireActiveAccess({ role: "athlete" });

    expect(redirect).toHaveBeenCalledWith("/athlete/paused?reason=seats");
  });

  it("does not redirect a billing-entitled athlete who is within capacity", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantActive();
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([{ parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true }]);

    const result = await requireActiveAccess({ role: "athlete" });

    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not redirect a billing-entitled athlete who was explicitly selected as active", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantActive();
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([
      { parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true },
      { parent_id: PARENT_ID, athlete_id: OTHER_ATHLETE_ID, seat_active: false },
    ]);

    const result = await requireActiveAccess({ role: "athlete" });

    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("does not apply the seat overlay to a parent, even if the family is seat-paused", async () => {
    rlsUserId = PARENT_ID;
    rlsProfileRole = "parent";
    setGrantActive();
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([
      { parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true },
      { parent_id: PARENT_ID, athlete_id: OTHER_ATHLETE_ID, seat_active: true },
    ]);

    const result = await requireActiveAccess({ role: "parent" });

    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("a fully-blocked athlete still redirects to /athlete/paused with NO reason param (unchanged behavior)", async () => {
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantNone();
    setSubscriptionNone(); // billing level: blocked
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([
      { parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true },
      { parent_id: PARENT_ID, athlete_id: OTHER_ATHLETE_ID, seat_active: true },
    ]);

    await requireActiveAccess({ role: "athlete" });

    expect(redirect).toHaveBeenCalledWith("/athlete/paused");
    expect(redirect).not.toHaveBeenCalledWith("/athlete/paused?reason=seats");
  });

  it("flag off -> seat overlay never fires, even when the family is seat-paused", async () => {
    delete process.env.ENFORCE_SUBSCRIPTION_GATING;
    rlsUserId = ATHLETE_ID;
    rlsProfileRole = "athlete";
    rlsLinkParentId = PARENT_ID;
    setGrantActive();
    getActiveAppleProductIdMock.mockResolvedValue("apple.tier.one");
    payerCapacityCeilingMock.mockReturnValue(1);
    setSeatLinks([
      { parent_id: PARENT_ID, athlete_id: ATHLETE_ID, seat_active: true },
      { parent_id: PARENT_ID, athlete_id: OTHER_ATHLETE_ID, seat_active: true },
    ]);

    const result = await requireActiveAccess({ role: "athlete" });

    expect(result).toBe("full");
    expect(redirect).not.toHaveBeenCalled();
  });
});
