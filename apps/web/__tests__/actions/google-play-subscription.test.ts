/**
 * Unit tests for beginGooglePlayPurchase / submitGooglePurchase
 * (apps/web/lib/actions/google-play-subscription.ts, FV-661).
 *
 * Google is simulated at the `fetch` layer with hand-built
 * `subscriptionsv2.get` fixtures, so the real Play API module and parser run.
 * Supabase is an in-memory fake. No live Google or database calls.
 *
 * Every test also runs the leak check in afterEach: neither the purchase token,
 * the linked token, nor the obfuscated account id may appear in any console
 * output, alert, or return value.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/subscriptions/google-play-auth", () => ({
  getPlayAccessToken: async () => "FAKE_ACCESS_TOKEN",
}));

import {
  SENTINEL_ACCOUNT_ID,
  SENTINEL_LINKED_TOKEN,
  SENTINEL_TOKEN,
  subscriptionV2Fixture,
  type FixtureOptions,
} from "../fixtures/google-play-fixtures";

const PAYER = "bbbbbbbb-0000-4000-8000-000000000002";
const OTHER_PAYER = "cccccccc-0000-4000-8000-000000000003";
const OTHER_ACCOUNT = "OTHER_ACCOUNT_SENTINEL_77aa";
const FUTURE = "2099-01-01T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Test state
// ---------------------------------------------------------------------------

let currentUser: { id: string } | null;
let profileRole: string | null;
let createClientCalls: number;
let createServiceCalls: number;

type Row = Record<string, unknown>;
let tables: {
  google_subscriptions: Row[];
  google_purchase_bindings: Map<string, string>;
  google_license_testers: Set<string>;
};
let events: string[];
let rowAtAck: Row | null;
let nextRowId: number;
let racePayer: string | null;
/** When set, the fake service client fails that (table, op) with a message that carries secrets. */
let dbFault: { table: string; op: string; skip?: number } | null;
let faultSeen: number;
let beforeExec: ((table: string, op: string) => void) | null;
let authThrows: boolean;

let googleByToken: Map<string, { status: number; body?: unknown }>;
let ackStatus: number;
let fetchCalls: string[];

let alerts: unknown[][];
let logged: string[];
let lastResults: unknown[];

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => {
    createClientCalls += 1;
    return {
      auth: {
        getUser: async () => {
          if (authThrows) throw new Error(`auth exploded for ${PAYER}`);
          return { data: { user: currentUser } };
        },
      },
      from: (table: string) => {
        if (table !== "profiles") throw new Error(`unexpected table on RLS client: ${table}`);
        return {
          select: () => ({
            eq: () => ({
              single: async () =>
                profileRole
                  ? { data: { role: profileRole }, error: null }
                  : { data: null, error: { message: "not found" } },
            }),
          }),
        };
      },
    };
  },
}));

function builder(table: keyof typeof tables) {
  let op: "select" | "insert" | "update" | "upsert" = "select";
  let payload: Row = {};
  let ignoreDuplicates = false;
  const filters: Array<[string, unknown]> = [];

  const notFilters: Array<[string, unknown]> = [];

  const matches = (r: Row) =>
    filters.every(([c, v]) => r[c] === v) && notFilters.every(([c, v]) => r[c] !== v);

  function exec(): { data: unknown; error: { code?: string; message: string } | null } {
    // Test hook: change the world between the action's read and its write.
    if (beforeExec) beforeExec(table, op);
    if (dbFault && dbFault.table === table && dbFault.op === op && faultSeen++ >= (dbFault.skip ?? 0)) {
      // A realistic driver error: the message quotes the row.
      return {
        data: null,
        error: {
          code: "XX000",
          message: `internal error near ${SENTINEL_TOKEN} for ${SENTINEL_ACCOUNT_ID} payer ${PAYER}`,
        },
      };
    }
    if (table === "google_license_testers") {
      const id = filters.find(([c]) => c === "payer_id")?.[1] as string;
      return { data: tables.google_license_testers.has(id) ? { payer_id: id } : null, error: null };
    }
    if (table === "google_purchase_bindings") {
      if (op === "select") {
        const id = filters.find(([c]) => c === "payer_id")?.[1] as string;
        const b = tables.google_purchase_bindings.get(id);
        return { data: b ? { binding_id: b } : null, error: null };
      }
      // upsert (mint)
      const id = payload.payer_id as string;
      if (tables.google_purchase_bindings.has(id) && ignoreDuplicates) return { data: null, error: null };
      const minted = `MINTED_BINDING_${tables.google_purchase_bindings.size + 1}`;
      tables.google_purchase_bindings.set(id, minted);
      events.push("binding_minted");
      return { data: { binding_id: minted }, error: null };
    }
    // google_subscriptions
    const rows = tables.google_subscriptions;
    if (op === "select") {
      const r = rows.find(matches);
      return { data: r ? { ...r } : null, error: null };
    }
    if (op === "insert") {
      if (racePayer) {
        rows.push({ id: `row-${nextRowId++}`, payer_id: racePayer, purchase_token: payload.purchase_token });
        racePayer = null;
        return { data: null, error: { code: "23505", message: "duplicate key" } };
      }
      if (rows.some((r) => r.purchase_token === payload.purchase_token)) {
        return { data: null, error: { code: "23505", message: "duplicate key" } };
      }
      const row = { id: `row-${nextRowId++}`, ...payload };
      rows.push(row);
      events.push("row_written");
      return { data: { ...row }, error: null };
    }
    // update
    const hit = rows.find(matches);
    if (hit) {
      Object.assign(hit, payload);
      events.push(`row_updated`);
    }
    return { data: hit ? { ...hit } : null, error: null };
  }

  const api = {
    select: () => api,
    eq: (c: string, v: unknown) => {
      filters.push([c, v]);
      return api;
    },
    neq: (c: string, v: unknown) => {
      notFilters.push([c, v]);
      return api;
    },
    insert: (p: Row) => {
      op = "insert";
      payload = p;
      return api;
    },
    update: (p: Row) => {
      op = "update";
      payload = p;
      return api;
    },
    upsert: (p: Row, opts?: { ignoreDuplicates?: boolean }) => {
      op = "upsert";
      payload = p;
      ignoreDuplicates = Boolean(opts?.ignoreDuplicates);
      return api;
    },
    maybeSingle: async () => exec(),
    single: async () => exec(),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(exec()).then(resolve, reject),
  };
  return api;
}

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    createServiceCalls += 1;
    return {
      from: (table: string) => {
        if (!(table in tables)) throw new Error(`unexpected table on service client: ${table}`);
        return builder(table as keyof typeof tables);
      },
    };
  },
}));

vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: () => {},
}));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => {
    alerts.push(args);
    return Promise.resolve();
  },
}));

import {
  beginGooglePlayPurchase,
  submitGooglePurchase,
} from "@/lib/actions/google-play-subscription";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function googleReturns(token: string, o: FixtureOptions = {}) {
  googleByToken.set(token, { status: 200, body: subscriptionV2Fixture(o) });
}

function fakeFetch(input: unknown): Promise<Response> {
  const url = String(input);
  fetchCalls.push(url);
  if (url.endsWith(":acknowledge")) {
    events.push("ack");
    rowAtAck = tables.google_subscriptions.find((r) => r.purchase_token === SENTINEL_TOKEN) ?? null;
    rowAtAck = rowAtAck ? { ...rowAtAck } : null;
    return Promise.resolve(new Response("{}", { status: ackStatus }));
  }
  const token = decodeURIComponent(url.split("/tokens/")[1] ?? "");
  const hit = googleByToken.get(token);
  if (!hit) return Promise.resolve(new Response("{}", { status: 404 }));
  return Promise.resolve(new Response(JSON.stringify(hit.body ?? {}), { status: hit.status }));
}

async function submit(token = SENTINEL_TOKEN, extra: Record<string, unknown> = {}) {
  const r = await submitGooglePurchase({ purchaseToken: token, ...extra } as { purchaseToken: string });
  lastResults.push(r);
  return r;
}

const subRows = () => tables.google_subscriptions;
const rowFor = (token: string) => subRows().find((r) => r.purchase_token === token);

beforeEach(() => {
  process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
  currentUser = { id: PAYER };
  profileRole = "parent";
  createClientCalls = 0;
  createServiceCalls = 0;
  tables = {
    google_subscriptions: [],
    google_purchase_bindings: new Map([[PAYER, SENTINEL_ACCOUNT_ID]]),
    google_license_testers: new Set(),
  };
  events = [];
  rowAtAck = null;
  nextRowId = 1;
  racePayer = null;
  dbFault = null;
  faultSeen = 0;
  beforeExec = null;
  authThrows = false;
  googleByToken = new Map();
  ackStatus = 200;
  fetchCalls = [];
  alerts = [];
  logged = [];
  lastResults = [];
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      logged.push(a.map((x) => (x instanceof Error ? x.message : String(x))).join(" "));
    });
  }
});

afterEach(() => {
  // Criterion 5: no sentinel in any console output, alert, or returned value.
  const haystack = JSON.stringify({ logged, alerts, results: lastResults });
  // Payer ids are covered too: the action promises not to log them.
  for (const secret of [SENTINEL_TOKEN, SENTINEL_LINKED_TOKEN, SENTINEL_ACCOUNT_ID, OTHER_ACCOUNT, PAYER, OTHER_PAYER]) {
    expect(haystack, `leaked ${secret}`).not.toContain(secret);
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
});

// ---------------------------------------------------------------------------
// Dormant behind GOOGLE_PLAY_CATALOG_ACTIVE (criterion 7)
// ---------------------------------------------------------------------------

describe("dormant unless GOOGLE_PLAY_CATALOG_ACTIVE is exactly \"1\"", () => {
  for (const value of [undefined, "", "0", "true", "yes", " 1", "1 "]) {
    it(`refuses before touching Google, auth or the database (flag=${JSON.stringify(value)})`, async () => {
      if (value === undefined) delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
      else process.env.GOOGLE_PLAY_CATALOG_ACTIVE = value;
      googleReturns(SENTINEL_TOKEN);

      expect(await submit()).toEqual({ ok: false, error: "unavailable" });
      expect(await beginGooglePlayPurchase()).toEqual({ ok: false, error: "unavailable" });

      expect(fetchCalls).toEqual([]);
      expect(createClientCalls).toBe(0);
      expect(createServiceCalls).toBe(0);
      expect(subRows()).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// beginGooglePlayPurchase
// ---------------------------------------------------------------------------

describe("beginGooglePlayPurchase", () => {
  it("returns the payer's binding id and mints one on first use, stable afterwards", async () => {
    tables.google_purchase_bindings.clear();
    const first = await beginGooglePlayPurchase();
    expect(first).toEqual({ ok: true, obfuscatedAccountId: "MINTED_BINDING_1" });
    expect(events).toContain("binding_minted");
    events = [];
    const second = await beginGooglePlayPurchase();
    expect(second).toEqual(first);
    expect(events).not.toContain("binding_minted");
  });

  it("refuses an athlete session before any write", async () => {
    tables.google_purchase_bindings.clear();
    profileRole = "athlete";
    expect(await beginGooglePlayPurchase()).toEqual({ ok: false, error: "not_authorized" });
    expect(createServiceCalls).toBe(0);
  });

  it("refuses when signed out", async () => {
    currentUser = null;
    expect(await beginGooglePlayPurchase()).toEqual({ ok: false, error: "unauthenticated" });
    expect(createServiceCalls).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// submitGooglePurchase: verification and grant (criteria 1, 3)
// ---------------------------------------------------------------------------

describe("submitGooglePurchase: nothing is granted before Google confirms", () => {
  it("Google does not recognise the token: no row, no acknowledge", async () => {
    expect(await submit()).toEqual({ ok: false, error: "verification_failed" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("Google unavailable: no row, no acknowledge, retryable error", async () => {
    googleByToken.set(SENTINEL_TOKEN, { status: 503 });
    expect(await submit()).toEqual({ ok: false, error: "verification_unavailable" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("an unreadable Google response (unknown state) grants nothing", async () => {
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_SOMETHING_NEW" });
    expect(await submit()).toEqual({ ok: false, error: "verification_failed" });
    expect(subRows()).toEqual([]);
  });

  it("rejects a missing or empty token before anything else", async () => {
    expect(await submit("")).toEqual({ ok: false, error: "invalid_input" });
    expect(fetchCalls).toEqual([]);
  });

  it("refuses an athlete session and a signed-out caller before calling Google", async () => {
    googleReturns(SENTINEL_TOKEN);
    profileRole = "athlete";
    expect(await submit()).toEqual({ ok: false, error: "not_authorized" });
    currentUser = null;
    expect(await submit()).toEqual({ ok: false, error: "unauthenticated" });
    expect(fetchCalls).toEqual([]);
    expect(subRows()).toEqual([]);
  });
});

describe("submitGooglePurchase: happy path", () => {
  it("writes the row FIRST, then acknowledges, then records the acknowledgement", async () => {
    googleReturns(SENTINEL_TOKEN, { offerId: "trial-7d" });
    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });

    expect(events.indexOf("row_written")).toBeGreaterThanOrEqual(0);
    expect(events.indexOf("ack")).toBeGreaterThan(events.indexOf("row_written"));
    // The row existed (unacknowledged) at the moment Google was asked to acknowledge.
    expect(rowAtAck).not.toBeNull();
    expect(rowAtAck?.acknowledged).toBe(false);

    const row = rowFor(SENTINEL_TOKEN);
    expect(row).toMatchObject({
      payer_id: PAYER,
      product_id: "family.1",
      base_plan_id: "monthly",
      status: "active",
      expires_at: "2099-12-12T12:00:00.000Z",
      auto_renewing: true,
      is_test_purchase: false,
      obfuscated_account_id: SENTINEL_ACCOUNT_ID,
      offer_id: "trial-7d",
      acknowledged: true,
    });
    expect(typeof row?.last_verified_at).toBe("string");
  });

  it("takes only the token from the client: a client-claimed product id is ignored", async () => {
    googleReturns(SENTINEL_TOKEN, { productId: "family.1" });
    await submit(SENTINEL_TOKEN, { productId: "family.5", basePlanId: "yearly", payerId: OTHER_PAYER });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ product_id: "family.1", payer_id: PAYER });
  });

  it("an already-acknowledged purchase is not acknowledged again; last_verified_at refreshes", async () => {
    googleReturns(SENTINEL_TOKEN, { acknowledged: true });
    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });
    expect(events).not.toContain("ack");
    const first = rowFor(SENTINEL_TOKEN)?.last_verified_at;
    await new Promise((r) => setTimeout(r, 5));
    await submit();
    expect(subRows()).toHaveLength(1);
    expect(rowFor(SENTINEL_TOKEN)?.last_verified_at).not.toBe(first);
  });

  it("a pending purchase is mirrored but neither entitled nor acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_PENDING", expiryTime: null });
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "pending", expires_at: null });
    expect(events).not.toContain("ack");
  });

  it("an expired (past-expiry) purchase grants nothing and is not acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: "2020-01-01T00:00:00.000Z" });
    expect(await submit()).toMatchObject({ ok: true, entitled: false });
    expect(events).not.toContain("ack");
  });
});

// ---------------------------------------------------------------------------
// Binding and ownership (criterion 2)
// ---------------------------------------------------------------------------

describe("submitGooglePurchase: a closed purchase stays closed", () => {
  it("re-submitting a token whose row is held as expired never restores access or acknowledges, even if Google still reports active", async () => {
    // e.g. a refund or chargeback forced the row to expired while Google lags.
    tables.google_subscriptions.push({
      id: "row-closed",
      payer_id: PAYER,
      purchase_token: SENTINEL_TOKEN,
      status: "expired",
      expires_at: "2020-01-01T00:00:00.000Z",
      acknowledged: true,
    });
    googleReturns(SENTINEL_TOKEN, { acknowledged: false });
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: "2020-01-01T00:00:00.000Z" });
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
    expect(JSON.stringify(alerts)).toContain("row-closed");
  });

  it("QA fix 1: the row is closed between the action's read and its write: the granting update matches nothing, stays closed, no acknowledge", async () => {
    tables.google_subscriptions.push({
      id: "row-race",
      payer_id: PAYER,
      purchase_token: SENTINEL_TOKEN,
      status: "active",
      expires_at: "2099-01-01T00:00:00.000Z",
      acknowledged: false,
    });
    googleReturns(SENTINEL_TOKEN, { acknowledged: false });
    beforeExec = (table, op) => {
      // The refund lands after ownership/read checks, right before the write.
      if (table === "google_subscriptions" && op === "update") {
        beforeExec = null;
        Object.assign(rowFor(SENTINEL_TOKEN)!, { status: "expired", expires_at: "2026-11-12T00:00:00.000Z" });
      }
    };
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: "2026-11-12T00:00:00.000Z" });
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
    expect(JSON.stringify(alerts)).toContain("row-race");
  });

  it("QA fix 1: a conditional update that matches nothing for a row that is not this payer's is a conflict", async () => {
    tables.google_subscriptions.push({ id: "row-x", payer_id: PAYER, purchase_token: SENTINEL_TOKEN, status: "active" });
    googleReturns(SENTINEL_TOKEN);
    beforeExec = (table, op) => {
      if (table === "google_subscriptions" && op === "update") {
        beforeExec = null;
        Object.assign(rowFor(SENTINEL_TOKEN)!, { payer_id: OTHER_PAYER });
      }
    };
    expect(await submit()).toEqual({ ok: false, error: "ownership_conflict" });
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
  });

  it("QA fix 2: a refund (void) written before the client submit leaves the token closed: entitled false, no acknowledge", async () => {
    // What the webhook writes for a void that arrived first.
    tables.google_subscriptions.push({
      id: "row-void-first",
      payer_id: PAYER,
      purchase_token: SENTINEL_TOKEN,
      status: "expired",
      expires_at: "2026-11-12T00:00:00.000Z",
      acknowledged: false,
    });
    googleReturns(SENTINEL_TOKEN); // Google still reports ACTIVE, unacknowledged
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired" });
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
  });

  it("an expired row is terminal: when Google also reports it as not granting, only last_verified_at moves and there is no alert", async () => {
    tables.google_subscriptions.push({
      id: "row-closed",
      payer_id: PAYER,
      purchase_token: SENTINEL_TOKEN,
      status: "expired",
      expires_at: "2020-01-01T00:00:00.000Z",
    });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: "2020-02-01T00:00:00.000Z" });
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: "2020-01-01T00:00:00.000Z" });
    expect(typeof rowFor(SENTINEL_TOKEN)?.last_verified_at).toBe("string");
    expect(alerts).toEqual([]);
  });

  it("an expired row never moves to an intermediate state (PAUSED) that a later submit could re-open", async () => {
    tables.google_subscriptions.push({
      id: "row-closed",
      payer_id: PAYER,
      purchase_token: SENTINEL_TOKEN,
      status: "expired",
      expires_at: "2020-01-01T00:00:00.000Z",
    });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_PAUSED" });
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired" });
    googleReturns(SENTINEL_TOKEN, { acknowledged: false });
    expect(await submit()).toEqual({ ok: true, entitled: false, acknowledged: false });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: "2020-01-01T00:00:00.000Z" });
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
  });
});

describe("submitGooglePurchase: binding and ownership", () => {
  it("refuses a purchase with NO account id: nothing written, never acknowledged, alert has no ids", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: null });
    expect(await submit()).toEqual({ ok: false, error: "account_mismatch" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.[2]).toBeUndefined();
  });

  it("refuses a MISMATCHED account id: nothing written, never acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: OTHER_ACCOUNT });
    expect(await submit()).toEqual({ ok: false, error: "account_mismatch" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("refuses when the payer has no binding yet (and mints nothing on a refused path)", async () => {
    tables.google_purchase_bindings.clear();
    googleReturns(SENTINEL_TOKEN);
    expect(await submit()).toEqual({ ok: false, error: "account_mismatch" });
    expect(tables.google_purchase_bindings.size).toBe(0);
    expect(subRows()).toEqual([]);
  });

  it("refuses a token already owned by a different payer: no re-link, no acknowledge", async () => {
    subRows().push({ id: "row-x", payer_id: OTHER_PAYER, purchase_token: SENTINEL_TOKEN, status: "active" });
    googleReturns(SENTINEL_TOKEN);
    expect(await submit()).toEqual({ ok: false, error: "ownership_conflict" });
    expect(subRows()).toHaveLength(1);
    expect(subRows()[0]?.payer_id).toBe(OTHER_PAYER);
    expect(events).not.toContain("ack");
  });

  it("a concurrent insert by another payer (unique violation) is a conflict, not an overwrite", async () => {
    googleReturns(SENTINEL_TOKEN);
    racePayer = OTHER_PAYER;
    expect(await submit()).toEqual({ ok: false, error: "ownership_conflict" });
    expect(subRows()).toHaveLength(1);
    expect(subRows()[0]?.payer_id).toBe(OTHER_PAYER);
    expect(events).not.toContain("ack");
  });

  it("refuses a product outside the catalog (fail closed)", async () => {
    googleReturns(SENTINEL_TOKEN, { productId: "family.9" });
    expect(await submit()).toEqual({ ok: false, error: "unknown_product" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });
});

// ---------------------------------------------------------------------------
// Test purchases (criterion 4)
// ---------------------------------------------------------------------------

describe("submitGooglePurchase: database and auth failures", () => {
  // The fake driver error's message carries the token, the account id and the
  // payer id. Only the Postgres code may reach a log; afterEach proves the rest.
  const faults: Array<[string, { table: string; op: string }, { testPurchase?: boolean; existingRow?: boolean }]> = [
    ["ownership read", { table: "google_subscriptions", op: "select" }, {}],
    ["binding read", { table: "google_purchase_bindings", op: "select" }, {}],
    ["license-tester read", { table: "google_license_testers", op: "select" }, { testPurchase: true }],
    ["row insert (not a unique violation)", { table: "google_subscriptions", op: "insert" }, {}],
    ["row update", { table: "google_subscriptions", op: "update" }, { existingRow: true }],
  ];
  for (const [name, fault, setup] of faults) {
    it(`${name} fails: internal_error, never acknowledged, only the Postgres code is logged`, async () => {
      googleReturns(SENTINEL_TOKEN, { testPurchase: setup.testPurchase });
      if (setup.existingRow) {
        tables.google_subscriptions.push({ id: "row-existing", payer_id: PAYER, purchase_token: SENTINEL_TOKEN });
      }
      dbFault = fault;
      expect(await submit()).toEqual({ ok: false, error: "internal_error" });
      expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
      expect(logged.join("\n")).toContain("XX000");
    });
  }

  // QA fix 7: the remaining queries (the 1st google_subscriptions select is the
  // ownership read; later ones are subscription_read / linked_read).
  it("subscription_read (inside the row write) fails: internal_error, never acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN);
    dbFault = { table: "google_subscriptions", op: "select", skip: 1 };
    expect(await submit()).toEqual({ ok: false, error: "internal_error" });
    expect(logged.join("\n")).toContain("subscription_read:XX000");
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
  });

  it("linked_read fails: internal_error, nothing written", async () => {
    googleReturns(SENTINEL_TOKEN, { linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    dbFault = { table: "google_subscriptions", op: "select", skip: 1 };
    expect(await submit()).toEqual({ ok: false, error: "internal_error" });
    expect(logged.join("\n")).toContain("linked_read:XX000");
    expect(tables.google_subscriptions).toEqual([]);
  });

  it("subscription_touch (closing an expired row) fails: internal_error, never acknowledged", async () => {
    tables.google_subscriptions.push({ id: "row-closed", payer_id: PAYER, purchase_token: SENTINEL_TOKEN, status: "expired", expires_at: "2020-01-01T00:00:00.000Z" });
    googleReturns(SENTINEL_TOKEN);
    dbFault = { table: "google_subscriptions", op: "update" };
    expect(await submit()).toEqual({ ok: false, error: "internal_error" });
    expect(logged.join("\n")).toContain("subscription_touch:XX000");
    expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
  });

  it("a thrown auth client is internal_error from both actions, not an unhandled rejection", async () => {
    authThrows = true;
    googleReturns(SENTINEL_TOKEN);
    expect(await submit()).toEqual({ ok: false, error: "internal_error" });
    expect(fetchCalls).toEqual([]);
    const b = await beginGooglePlayPurchase();
    lastResults.push(b);
    expect(b).toEqual({ ok: false, error: "internal_error" });
  });
});

describe("submitGooglePurchase: license-tester purchases", () => {
  it("a test purchase from a payer NOT on the allowlist grants nothing", async () => {
    googleReturns(SENTINEL_TOKEN, { testPurchase: true });
    expect(await submit()).toEqual({ ok: false, error: "test_purchase_rejected" });
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("a test purchase from an allowlisted payer is stored with is_test_purchase", async () => {
    tables.google_license_testers.add(PAYER);
    googleReturns(SENTINEL_TOKEN, { testPurchase: true });
    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ is_test_purchase: true });
  });
});

// ---------------------------------------------------------------------------
// Acknowledge failure (criterion 3)
// ---------------------------------------------------------------------------

describe("submitGooglePurchase: acknowledge failure", () => {
  it("retries (bounded), surfaces the failure, leaves the row unacknowledged, and a later submit finishes it", async () => {
    googleReturns(SENTINEL_TOKEN);
    ackStatus = 500;
    expect(await submit()).toEqual({ ok: false, error: "acknowledge_failed" });
    expect(events.filter((e) => e === "ack")).toHaveLength(3);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ acknowledged: false, status: "active" });
    // Alert identifies the row by internal id only.
    expect(alerts.at(-1)?.[2]).toEqual({ row_id: rowFor(SENTINEL_TOKEN)?.id });

    ackStatus = 200;
    events = [];
    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });
    expect(events.filter((e) => e === "ack")).toHaveLength(1);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ acknowledged: true });
    expect(subRows()).toHaveLength(1);
  }, 10_000);
});

// ---------------------------------------------------------------------------
// Linked purchase tokens (record 7.3, minimum for C3)
// ---------------------------------------------------------------------------

describe("submitGooglePurchase: linked purchase token", () => {
  it("refreshes the payer's older row from Google so it stops granting once Google says it ended", async () => {
    subRows().push({
      id: "row-old",
      payer_id: PAYER,
      purchase_token: SENTINEL_LINKED_TOKEN,
      status: "active",
      expires_at: FUTURE,
    });
    googleReturns(SENTINEL_LINKED_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: "2026-11-12T12:00:00.000Z" });
    googleReturns(SENTINEL_TOKEN, { productId: "family.2", linkedPurchaseToken: SENTINEL_LINKED_TOKEN });

    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });
    expect(rowFor(SENTINEL_LINKED_TOKEN)).toMatchObject({ status: "expired", expires_at: "2026-11-12T12:00:00.000Z" });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({
      product_id: "family.2",
      linked_purchase_token: SENTINEL_LINKED_TOKEN,
    });
  });

  it("never re-opens a linked older row that is already expired, even if Google still reports that token as active", async () => {
    // e.g. the old purchase was refunded (row forced to expired) and Google lags.
    subRows().push({
      id: "row-old",
      payer_id: PAYER,
      purchase_token: SENTINEL_LINKED_TOKEN,
      status: "expired",
      expires_at: "2020-01-01T00:00:00.000Z",
    });
    googleReturns(SENTINEL_LINKED_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE" });
    googleReturns(SENTINEL_TOKEN, { productId: "family.2", linkedPurchaseToken: SENTINEL_LINKED_TOKEN });

    expect(await submit()).toEqual({ ok: true, entitled: true, acknowledged: true });
    expect(rowFor(SENTINEL_LINKED_TOKEN)).toMatchObject({ status: "expired", expires_at: "2020-01-01T00:00:00.000Z" });
  });

  it("does not cut off a deferred downgrade early: the old row keeps what Google reports", async () => {
    subRows().push({ id: "row-old", payer_id: PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active" });
    googleReturns(SENTINEL_LINKED_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", expiryTime: FUTURE });
    googleReturns(SENTINEL_TOKEN, { productId: "family.1", linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    await submit();
    expect(rowFor(SENTINEL_LINKED_TOKEN)).toMatchObject({ status: "active", expires_at: FUTURE });
  });

  it("refuses a linked token owned by a different payer, writing nothing", async () => {
    subRows().push({ id: "row-old", payer_id: OTHER_PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active" });
    googleReturns(SENTINEL_TOKEN, { linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await submit()).toEqual({ ok: false, error: "ownership_conflict" });
    expect(rowFor(SENTINEL_TOKEN)).toBeUndefined();
    expect(events).not.toContain("ack");
  });

  it("a linked token we have no row for is just stored on the new row", async () => {
    googleReturns(SENTINEL_TOKEN, { linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await submit()).toMatchObject({ ok: true });
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ linked_purchase_token: SENTINEL_LINKED_TOKEN });
  });

  it("a failed refresh of the old row does not fail the new purchase (alert carries the row id only)", async () => {
    subRows().push({ id: "row-old", payer_id: PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active" });
    googleByToken.set(SENTINEL_LINKED_TOKEN, { status: 503 });
    googleReturns(SENTINEL_TOKEN, { linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await submit()).toMatchObject({ ok: true });
    expect(alerts.some((a) => JSON.stringify(a[2]) === JSON.stringify({ row_id: "row-old" }))).toBe(true);
  });
});
