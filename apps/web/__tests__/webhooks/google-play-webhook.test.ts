/**
 * Tests for POST /api/webhooks/google-play (FV-662).
 *
 * Push authentication runs for real (the real `verifyPubSubPush`) against a
 * fake `google-auth-library`. Google's subscription API is simulated at the
 * `fetch` layer with hand-built fixtures (the real Play API module and parser
 * run), and Supabase is an in-memory fake. No live Google or database calls.
 *
 * afterEach runs the leak check on EVERY test: no purchase token, obfuscated
 * id, payer id, JWT or message body may appear in any console output, alert or
 * response body, success or failure.
 */

import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/subscriptions/google-play-auth", async (importOriginal) => {
  // Keep the REAL push verifier; replace only the Play access-token source.
  const actual = await importOriginal<typeof import("@/lib/subscriptions/google-play-auth")>();
  return { ...actual, getPlayAccessToken: async () => "FAKE_ACCESS_TOKEN" };
});

import {
  SENTINEL_LINKED_TOKEN,
  SENTINEL_TOKEN,
  subscriptionV2Fixture,
  type FixtureOptions,
} from "../fixtures/google-play-fixtures";
import { googleSubscriptionAccessLevel } from "@/lib/subscriptions/google-access-level";

const PAYER = "bbbbbbbb-0000-4000-8000-000000000002";
const OTHER_PAYER = "cccccccc-0000-4000-8000-000000000003";
const BINDING_ID = "5b2e5b2e-0000-4000-8000-00000000aaaa";
const OTHER_BINDING = "9d9d9d9d-0000-4000-8000-00000000bbbb";
const AUDIENCE = "https://fv.example/api/webhooks/google-play";
const SERVICE_ACCOUNT = "push@proj.iam.gserviceaccount.example";
const JWT_OK = "JWT_SENTINEL_OK_41ce";
const PACKAGE = "com.fromvictoryapp.app";
const FUTURE = "2099-01-01T00:00:00.000Z";
const PAST = "2020-01-01T00:00:00.000Z";

// ---------------------------------------------------------------------------
// Fake google-auth-library (push JWT verification)
// ---------------------------------------------------------------------------

type JwtScenario = { claims: Record<string, unknown>; aud?: string } | "bad_signature";
let jwts: Map<string, JwtScenario>;

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    async verifyIdToken(opts: { idToken: string; audience: string }) {
      const s = jwts.get(opts.idToken);
      if (!s || s === "bad_signature") throw new Error(`bad signature ${opts.idToken}`);
      if ((s.aud ?? AUDIENCE) !== opts.audience) throw new Error("wrong audience");
      return { getPayload: () => s.claims };
    }
  },
}));

const GOOD_CLAIMS = { iss: "https://accounts.google.com", email: SERVICE_ACCOUNT, email_verified: true };

// ---------------------------------------------------------------------------
// Fake Supabase service client
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let events: string[];
let nextRowId: number;
let createServiceCalls: number;
let dbFault: { table: string; op: string } | null;
let rowAtAck: Row | null;

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => {
    createServiceCalls += 1;
    return {
      from: (table: string) => {
        if (!(table in tables)) throw new Error(`unexpected table: ${table}`);
        return builder(table);
      },
    };
  },
}));

function builder(table: string) {
  let op: "select" | "insert" | "update" = "select";
  let payload: Row = {};
  const filters: Array<[string, unknown]> = [];
  const matches = (r: Row) => filters.every(([c, v]) => r[c] === v);

  function exec(): { data: unknown; error: { code?: string; message: string } | null } {
    if (dbFault && dbFault.table === table && dbFault.op === op) {
      return {
        data: null,
        error: {
          code: "XX000",
          message: `internal error near ${SENTINEL_TOKEN} for ${BINDING_ID} payer ${PAYER}`,
        },
      };
    }
    const rows = tables[table] as Row[];
    if (op === "select") {
      const r = rows.find(matches);
      return { data: r ? { ...r } : null, error: null };
    }
    if (op === "insert") {
      if (table === "google_subscriptions" && rows.some((r) => r.purchase_token === payload.purchase_token)) {
        return { data: null, error: { code: "23505", message: "duplicate key" } };
      }
      const row = { id: `row-${nextRowId++}`, ...payload };
      rows.push(row);
      if (table === "google_subscriptions") events.push("row_written");
      return { data: { ...row }, error: null };
    }
    const hits = rows.filter(matches);
    for (const h of hits) Object.assign(h, payload);
    if (hits.length > 0 && table === "google_subscriptions") events.push("row_updated");
    return { data: hits[0] ? { ...hits[0] } : null, error: null };
  }

  const api = {
    select: () => api,
    eq: (c: string, v: unknown) => {
      filters.push([c, v]);
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
    maybeSingle: async () => exec(),
    single: async () => exec(),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(exec()).then(resolve, reject),
  };
  return api;
}

// ---------------------------------------------------------------------------
// Alerts, Google
// ---------------------------------------------------------------------------

let alerts: unknown[][];
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: () => {} }));
vi.mock("@/lib/monitoring/notify", () => ({
  notifyError: (...args: unknown[]) => {
    alerts.push(args);
    return Promise.resolve();
  },
}));

let googleByToken: Map<string, { status: number; body?: unknown }>;
let ackStatus: number;
let fetchCalls: string[];

function fakeFetch(input: unknown): Promise<Response> {
  const url = String(input);
  fetchCalls.push(url);
  if (url.endsWith(":acknowledge")) {
    events.push("ack");
    const tok = decodeURIComponent(url.split("/tokens/")[1] ?? "").replace(/:acknowledge$/, "");
    const r = tables.google_subscriptions!.find((x) => x.purchase_token === tok);
    rowAtAck = r ? { ...r } : null;
    return Promise.resolve(new Response("{}", { status: ackStatus }));
  }
  const token = decodeURIComponent(url.split("/tokens/")[1] ?? "");
  const hit = googleByToken.get(token);
  if (!hit) return Promise.resolve(new Response("{}", { status: 404 }));
  return Promise.resolve(new Response(JSON.stringify(hit.body ?? {}), { status: hit.status }));
}

const googleReturns = (token: string, o: FixtureOptions = {}) =>
  googleByToken.set(token, { status: 200, body: subscriptionV2Fixture(o) });

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/webhooks/google-play/route";

let logged: string[];
let responseTexts: string[];
let sentData: string[];

function b64(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64");
}

function makeRequest(auth: string | null, body: string) {
  let read = false;
  const req = {
    headers: { get: (n: string) => (n.toLowerCase() === "authorization" ? auth : null) },
    text: async () => {
      read = true;
      return body;
    },
    json: async () => {
      read = true;
      return JSON.parse(body);
    },
  } as unknown as NextRequest;
  return { req, bodyRead: () => read };
}

function envelope(notification: unknown) {
  const data = b64(notification);
  sentData.push(data);
  return JSON.stringify({ message: { data, messageId: "m-1", publishTime: "2026-11-12T00:00:00Z" }, subscription: "projects/p/subscriptions/s" });
}

const subNote = (token = SENTINEL_TOKEN, type = 4, extra: Record<string, unknown> = {}) => ({
  version: "1.0",
  packageName: PACKAGE,
  eventTimeMillis: "1",
  subscriptionNotification: { version: "1.0", notificationType: type, purchaseToken: token, subscriptionId: "family.1" },
  ...extra,
});
const voidNote = (token = SENTINEL_TOKEN, refundType = 1, productType = 1) => ({
  version: "1.0",
  packageName: PACKAGE,
  eventTimeMillis: "1",
  voidedPurchaseNotification: { purchaseToken: token, orderId: "GPA.1", productType, refundType },
});

async function push(notification: unknown, auth: string | null = `Bearer ${JWT_OK}`) {
  const { req } = makeRequest(auth, envelope(notification));
  const res = await POST(req);
  responseTexts.push(await res.text());
  return res.status;
}
async function pushRaw(body: string, auth: string | null = `Bearer ${JWT_OK}`) {
  const { req } = makeRequest(auth, body);
  const res = await POST(req);
  responseTexts.push(await res.text());
  return res.status;
}

const subRows = () => tables.google_subscriptions!;
const rowFor = (token: string) => subRows().find((r) => r.purchase_token === token);
const seedRow = (o: Row = {}) => {
  const row = {
    id: "row-seed",
    payer_id: PAYER,
    purchase_token: SENTINEL_TOKEN,
    product_id: "family.1",
    base_plan_id: "monthly",
    status: "active",
    expires_at: FUTURE,
    acknowledged: true,
    ...o,
  };
  subRows().push(row);
  return row;
};
const levelOf = (token: string) => {
  const r = rowFor(token);
  return googleSubscriptionAccessLevel(r?.status as never, (r?.expires_at as string) ?? null, new Date());
};

beforeEach(() => {
  process.env.GOOGLE_PLAY_CATALOG_ACTIVE = "1";
  process.env.GOOGLE_PLAY_PUBSUB_AUDIENCE = AUDIENCE;
  process.env.GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT = SERVICE_ACCOUNT;
  jwts = new Map([[JWT_OK, { claims: { ...GOOD_CLAIMS } }]]);
  tables = {
    google_subscriptions: [],
    google_purchase_bindings: [{ payer_id: PAYER, binding_id: BINDING_ID }],
    google_license_testers: [],
    profiles: [
      { id: PAYER, role: "parent" },
      { id: OTHER_PAYER, role: "parent" },
    ],
  };
  events = [];
  nextRowId = 1;
  createServiceCalls = 0;
  dbFault = null;
  rowAtAck = null;
  alerts = [];
  logged = [];
  responseTexts = [];
  sentData = [];
  googleByToken = new Map();
  ackStatus = 200;
  fetchCalls = [];
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => {
      logged.push(a.map((x) => (x instanceof Error ? x.message : String(x))).join(" "));
    });
  }
});

afterEach(() => {
  const haystack = JSON.stringify({ logged, alerts, responseTexts });
  const secrets = [
    SENTINEL_TOKEN,
    SENTINEL_LINKED_TOKEN,
    BINDING_ID,
    OTHER_BINDING,
    PAYER,
    OTHER_PAYER,
    JWT_OK,
    "FAKE_ACCESS_TOKEN",
    ...sentData,
  ];
  for (const secret of secrets) expect(haystack, `leaked ${secret}`).not.toContain(secret);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  for (const k of ["GOOGLE_PLAY_CATALOG_ACTIVE", "GOOGLE_PLAY_PUBSUB_AUDIENCE", "GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT"]) {
    delete process.env[k];
  }
});

// ---------------------------------------------------------------------------
// AC1 + AC6: authentication before the body is read; unsigned cannot change state
// ---------------------------------------------------------------------------

describe("push authentication (AC1)", () => {
  const cases: Array<[string, () => string | null, number]> = [
    ["no Authorization header", () => null, 401],
    ["a non-Bearer header", () => "Basic abc", 401],
    ["an unknown / wrongly signed JWT", () => "Bearer JWT_WRONG_SIGNATURE", 401],
    [
      "a JWT minted for a different audience",
      () => {
        jwts.set("JWT_OTHER_AUD", { claims: { ...GOOD_CLAIMS }, aud: "https://elsewhere.example" });
        return "Bearer JWT_OTHER_AUD";
      },
      401,
    ],
    [
      "a JWT from a different service account",
      () => {
        jwts.set("JWT_OTHER_SA", { claims: { ...GOOD_CLAIMS, email: "other@proj.iam.gserviceaccount.example" } });
        return "Bearer JWT_OTHER_SA";
      },
      403,
    ],
    [
      "a JWT whose email is unverified",
      () => {
        jwts.set("JWT_UNVERIFIED", { claims: { ...GOOD_CLAIMS, email_verified: false } });
        return "Bearer JWT_UNVERIFIED";
      },
      403,
    ],
    [
      "a JWT with a non-Google issuer",
      () => {
        jwts.set("JWT_ISS", { claims: { ...GOOD_CLAIMS, iss: "https://evil.example" } });
        return "Bearer JWT_ISS";
      },
      401,
    ],
  ];

  for (const [name, auth, status] of cases) {
    it(`rejects ${name} before reading the body; state unchanged; no Google or database call`, async () => {
      seedRow({ status: "active" });
      googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST });
      const { req, bodyRead } = makeRequest(auth(), envelope(subNote()));
      const res = await POST(req);
      responseTexts.push(await res.text());
      expect(res.status).toBe(status);
      expect(bodyRead()).toBe(false);
      expect(fetchCalls).toEqual([]);
      expect(createServiceCalls).toBe(0);
      expect(rowFor(SENTINEL_TOKEN)?.status).toBe("active");
    });
  }

  for (const missing of ["GOOGLE_PLAY_PUBSUB_AUDIENCE", "GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT"]) {
    it(`fails closed with ${missing} unset, even with an otherwise valid token`, async () => {
      delete process.env[missing];
      const { req, bodyRead } = makeRequest(`Bearer ${JWT_OK}`, envelope(subNote()));
      const res = await POST(req);
      responseTexts.push(await res.text());
      expect(res.status).toBe(403);
      expect(bodyRead()).toBe(false);
      expect(fetchCalls).toEqual([]);
      expect(createServiceCalls).toBe(0);
    });
  }

  it("a valid push is accepted and the body is read", async () => {
    seedRow();
    googleReturns(SENTINEL_TOKEN, { acknowledged: true });
    const { req, bodyRead } = makeRequest(`Bearer ${JWT_OK}`, envelope(subNote()));
    const res = await POST(req);
    responseTexts.push(await res.text());
    expect(res.status).toBe(200);
    expect(bodyRead()).toBe(true);
  });
});

describe("middleware and unsigned requests (AC6)", () => {
  it("middleware.ts matcher excludes /api/webhooks/google-play (and is otherwise unchanged in shape)", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "..", "..", "middleware.ts"), "utf8");
    const literal = source.match(/"(\/\(\(\?![^"]*)"/);
    expect(literal).not.toBeNull();
    const matcher = new RegExp(`^${JSON.parse(literal![0]) as string}$`);
    expect(matcher.test("/api/webhooks/google-play")).toBe(false);
    expect(matcher.test("/api/webhooks/stripe")).toBe(false);
    expect(matcher.test("/api/webhooks/apple")).toBe(false);
    // Session refresh still runs everywhere else.
    expect(matcher.test("/athlete")).toBe(true);
    expect(matcher.test("/api/cron/reap-pairings")).toBe(true);
  });

  it("a request without Google's signature cannot change state (valid-looking body, existing row)", async () => {
    const row = seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST });
    expect(await push(subNote(), null)).toBe(401);
    expect(await push(voidNote(), "Bearer forged")).toBe(401);
    expect(rowFor(SENTINEL_TOKEN)).toEqual(row);
    expect(events).toEqual([]);
    expect(subRows()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// AC7: dormant
// ---------------------------------------------------------------------------

describe("dormant unless GOOGLE_PLAY_CATALOG_ACTIVE is exactly \"1\" (AC7)", () => {
  for (const value of [undefined, "", "0", "true", "yes", " 1", "1 "]) {
    it(`authenticates, answers 2xx, makes no Google or database call (flag=${JSON.stringify(value)})`, async () => {
      if (value === undefined) delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
      else process.env.GOOGLE_PLAY_CATALOG_ACTIVE = value;
      googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID });
      const { req, bodyRead } = makeRequest(`Bearer ${JWT_OK}`, envelope(subNote()));
      const res = await POST(req);
      responseTexts.push(await res.text());
      expect(res.status).toBe(200);
      expect(bodyRead()).toBe(false);
      expect(fetchCalls).toEqual([]);
      expect(createServiceCalls).toBe(0);
      expect(subRows()).toEqual([]);
    });
  }

  it("dormant still rejects an unauthenticated push", async () => {
    delete process.env.GOOGLE_PLAY_CATALOG_ACTIVE;
    expect(await push(subNote(), null)).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Unparseable / irrelevant messages: 2xx, no write
// ---------------------------------------------------------------------------

describe("irrelevant or unparseable messages are 2xx with no write", () => {
  const noop = async () => {
    expect(fetchCalls).toEqual([]);
    expect(createServiceCalls).toBe(0);
    expect(subRows()).toEqual([]);
  };

  it("a Play test notification", async () => {
    expect(await push({ version: "1.0", packageName: PACKAGE, eventTimeMillis: "1", testNotification: { version: "1.0" } })).toBe(200);
    await noop();
  });
  it("a one-time product notification", async () => {
    expect(
      await push({
        version: "1.0",
        packageName: PACKAGE,
        eventTimeMillis: "1",
        oneTimeProductNotification: { version: "1.0", notificationType: 1, purchaseToken: SENTINEL_TOKEN, sku: "x" },
      }),
    ).toBe(200);
    await noop();
  });
  it("a voided ONE-TIME product", async () => {
    expect(await push(voidNote(SENTINEL_TOKEN, 1, 2))).toBe(200);
    await noop();
  });
  it("a different package name", async () => {
    expect(await push({ ...subNote(), packageName: "com.someone.else" })).toBe(200);
    await noop();
  });
  it("non-JSON, wrong-shape and bad-base64 bodies", async () => {
    expect(await pushRaw("not json")).toBe(200);
    expect(await pushRaw("")).toBe(200);
    expect(await pushRaw(JSON.stringify({ nope: true }))).toBe(200);
    expect(await pushRaw(JSON.stringify({ message: { data: "!!!not-base64-json!!!" } }))).toBe(200);
    expect(await pushRaw(JSON.stringify({ message: { data: b64({ packageName: PACKAGE }) } }))).toBe(200);
    expect(await pushRaw("x".repeat(200_000))).toBe(200);
    await noop();
  });
  it("a token over the length cap", async () => {
    expect(await push(subNote("t".repeat(5000)))).toBe(200);
    await noop();
  });
});

// ---------------------------------------------------------------------------
// AC3: Google state -> stored status -> access level (reuse of the existing mapping)
// ---------------------------------------------------------------------------

describe("each Google state is written as Google reports it and maps to the record's access level (AC3)", () => {
  const table: Array<[string, FixtureOptions, string, string, boolean]> = [
    // [name, fixture, stored status, expected access level, acknowledges?]
    ["ACTIVE", { state: "SUBSCRIPTION_STATE_ACTIVE" }, "active", "full", true],
    ["CANCELED, not yet expired", { state: "SUBSCRIPTION_STATE_CANCELED", autoRenew: false }, "canceled", "full", true],
    ["IN_GRACE_PERIOD", { state: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" }, "in_grace_period", "full", true],
    ["ON_HOLD (decision G3: degraded)", { state: "SUBSCRIPTION_STATE_ON_HOLD" }, "on_hold", "degraded", false],
    ["PAUSED", { state: "SUBSCRIPTION_STATE_PAUSED" }, "paused", "blocked", false],
    ["EXPIRED", { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST }, "expired", "blocked", false],
    ["PENDING", { state: "SUBSCRIPTION_STATE_PENDING", expiryTime: null }, "pending", "blocked", false],
    ["PENDING_PURCHASE_CANCELED", { state: "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED", expiryTime: null }, "pending_purchase_canceled", "blocked", false],
    ["CANCELED, past expiry", { state: "SUBSCRIPTION_STATE_CANCELED", expiryTime: PAST }, "canceled", "blocked", false],
  ];
  for (const [name, fixture, status, level, acks] of table) {
    it(`${name}: stores ${status}, access ${level}${acks ? ", acknowledges" : ", does not acknowledge"}`, async () => {
      seedRow({ status: "paused", expires_at: null, acknowledged: false });
      googleReturns(SENTINEL_TOKEN, fixture);
      expect(await push(subNote())).toBe(200);
      expect(rowFor(SENTINEL_TOKEN)?.status).toBe(status);
      expect(levelOf(SENTINEL_TOKEN)).toBe(level);
      expect(typeof rowFor(SENTINEL_TOKEN)?.last_verified_at).toBe("string");
      expect(events.includes("ack")).toBe(acks);
    });
  }

  it("on hold stays degraded even with an expiry in the past (no time gate), via the one existing mapping", async () => {
    seedRow();
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ON_HOLD", expiryTime: PAST });
    await push(subNote());
    expect(levelOf(SENTINEL_TOKEN)).toBe("degraded");
  });

  it("the notification type is never trusted: a 'canceled'-typed message with Google ACTIVE writes active", async () => {
    seedRow({ status: "canceled" });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", acknowledged: true });
    await push(subNote(SENTINEL_TOKEN, 3 /* SUBSCRIPTION_CANCELED */));
    expect(rowFor(SENTINEL_TOKEN)?.status).toBe("active");
  });
});

// ---------------------------------------------------------------------------
// AC2: duplicates and out-of-order
// ---------------------------------------------------------------------------

describe("duplicate and out-of-order messages leave the row correct (AC2)", () => {
  it("the same message delivered three times: one row, same result, acknowledged once", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID });
    expect(await push(subNote())).toBe(200);
    const first = { ...rowFor(SENTINEL_TOKEN) };
    // Google now reports the purchase acknowledged (as it would after our ack).
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, acknowledged: true });
    expect(await push(subNote())).toBe(200);
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toHaveLength(1);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ payer_id: PAYER, status: "active", acknowledged: true });
    expect(rowFor(SENTINEL_TOKEN)?.id).toBe(first.id);
    expect(events.filter((e) => e === "ack")).toHaveLength(1);
  });

  it("a stale 'active' message arriving after Google has expired the purchase writes expired, not active", async () => {
    seedRow({ status: "active", acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST, acknowledged: true });
    // Messages in the "wrong" order: expiry notice first, then a late renewal notice, then expiry again.
    expect(await push(subNote(SENTINEL_TOKEN, 13 /* EXPIRED */))).toBe(200);
    expect(await push(subNote(SENTINEL_TOKEN, 2 /* RENEWED */))).toBe(200);
    expect(await push(subNote(SENTINEL_TOKEN, 13))).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired" });
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("an out-of-order message cannot re-open a row that was closed (even if a later read says active)", async () => {
    seedRow({ status: "expired", expires_at: PAST, acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", acknowledged: true });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: PAST });
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
    expect(alerts.some((a) => a[0] === "[google-play-webhook] expired row not re-opened")).toBe(true);
  });

  it("two different-typed messages for the same token converge on Google's one state", async () => {
    seedRow({ status: "paused", expires_at: null, acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", acknowledged: true });
    await push(subNote(SENTINEL_TOKEN, 6));
    const a = { ...rowFor(SENTINEL_TOKEN) };
    await push(subNote(SENTINEL_TOKEN, 1));
    const b = { ...rowFor(SENTINEL_TOKEN) };
    expect({ ...b, last_verified_at: null }).toEqual({ ...a, last_verified_at: null });
  });
});

// ---------------------------------------------------------------------------
// AC4: refunds and chargebacks remove access
// ---------------------------------------------------------------------------

describe("voided purchases and revokes remove access (AC4)", () => {
  it("refund where Google still reports ACTIVE: row forced to expired with an expiry not in the future", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", acknowledged: true });
    expect(await push(voidNote(SENTINEL_TOKEN, 1 /* full refund */))).toBe(200);
    const row = rowFor(SENTINEL_TOKEN);
    expect(row?.status).toBe("expired");
    expect(new Date(row?.expires_at as string).getTime()).toBeLessThanOrEqual(Date.now());
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
    expect(alerts.some((a) => a[0] === "[google-play-webhook] voided purchase forced non-granting")).toBe(true);
  });

  it("chargeback (refundType differs) is handled the same way", async () => {
    seedRow({ status: "in_grace_period", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_IN_GRACE_PERIOD", acknowledged: true });
    expect(await push(voidNote(SENTINEL_TOKEN, 2 /* chargeback-ish */))).toBe(200);
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("an on-hold (degraded) row that is voided is closed too", async () => {
    seedRow({ status: "on_hold", expires_at: PAST });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ON_HOLD", expiryTime: PAST, acknowledged: true });
    await push(voidNote());
    expect(rowFor(SENTINEL_TOKEN)?.status).toBe("expired");
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("when Google already reports expired, the row stores Google's own state", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: "2026-11-01T00:00:00.000Z", acknowledged: true });
    expect(await push(voidNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "expired", expires_at: "2026-11-01T00:00:00.000Z" });
    expect(alerts).toEqual([]);
  });

  it("Google read FAILS for a void: access still removed, alert, and a retryable status", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleByToken.set(SENTINEL_TOKEN, { status: 503 });
    expect(await push(voidNote())).toBe(503);
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
    expect(rowFor(SENTINEL_TOKEN)?.status).toBe("expired");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.[2]).toEqual({ row_id: "row-seed", reason: "unavailable" });
  });

  it("Google does not recognise the token on a void: access still removed, retryable", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    expect(await push(voidNote())).toBe(503);
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("an unreadable Google answer on a void still removes access", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_SOMETHING_NEW" });
    expect(await push(voidNote())).toBe(503);
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("a void for a token we do not own: 2xx, no Google call, no write", async () => {
    expect(await push(voidNote())).toBe(200);
    expect(fetchCalls).toEqual([]);
    expect(subRows()).toEqual([]);
  });

  it("a void does not touch another payer's separate row", async () => {
    seedRow();
    subRows().push({ id: "row-other", payer_id: OTHER_PAYER, purchase_token: "OTHER_TOKEN_1", status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { acknowledged: true });
    await push(voidNote());
    expect(subRows().find((r) => r.id === "row-other")?.status).toBe("active");
  });

  it("a revoke (SUBSCRIPTION_REVOKED) re-read as EXPIRED removes access", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST, acknowledged: true });
    expect(await push(subNote(SENTINEL_TOKEN, 12))).toBe(200);
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });

  it("after a void, a later message cannot give access back even if Google still says ACTIVE", async () => {
    seedRow({ status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", acknowledged: true });
    await push(voidNote());
    await push(subNote(SENTINEL_TOKEN, 2));
    await push(subNote(SENTINEL_TOKEN, 4));
    expect(levelOf(SENTINEL_TOKEN)).toBe("blocked");
  });
});

// ---------------------------------------------------------------------------
// AC8: rules a to d
// ---------------------------------------------------------------------------

describe("rule a: a row already exists", () => {
  it("refreshes by row id, always sets last_verified_at, and acknowledges once it grants (pending -> active)", async () => {
    seedRow({ status: "pending", expires_at: null, acknowledged: false });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE", accountId: BINDING_ID });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ id: "row-seed", status: "active", acknowledged: true });
    expect(typeof rowFor(SENTINEL_TOKEN)?.last_verified_at).toBe("string");
    // Write first, then acknowledge.
    expect(events.indexOf("ack")).toBeGreaterThan(events.indexOf("row_updated"));
    expect(rowAtAck?.acknowledged).toBe(false);
    expect(rowAtAck?.status).toBe("active");
  });

  it("works with NO binding for the payer (the row is already ours)", async () => {
    tables.google_purchase_bindings = [];
    seedRow({ acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { acknowledged: true, accountId: null });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)?.status).toBe("active");
  });

  it("acknowledge failure: row stays unacknowledged, alert carries only the row id, status is retryable, redelivery finishes it", async () => {
    seedRow({ status: "pending", expires_at: null, acknowledged: false });
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_ACTIVE" });
    ackStatus = 500;
    expect(await push(subNote())).toBe(503);
    expect(events.filter((e) => e === "ack")).toHaveLength(3);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "active", acknowledged: false });
    expect(alerts.at(-1)?.[2]).toEqual({ row_id: "row-seed" });

    ackStatus = 200;
    events = [];
    expect(await push(subNote())).toBe(200);
    expect(events.filter((e) => e === "ack")).toHaveLength(1);
    expect(rowFor(SENTINEL_TOKEN)?.acknowledged).toBe(true);
  }, 10_000);

  it("a product outside the catalog refreshes the lifecycle only and alerts", async () => {
    seedRow({ product_id: "family.1" });
    googleReturns(SENTINEL_TOKEN, { productId: "family.9", state: "SUBSCRIPTION_STATE_CANCELED", acknowledged: true });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ product_id: "family.1", status: "canceled" });
    expect(alerts.some((a) => a[0] === "[google-play-webhook] unknown product on refresh")).toBe(true);
  });
});

describe("rule b: no row, account id equals a binding", () => {
  it("writes the row for the binding's payer, THEN acknowledges", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({
      payer_id: PAYER,
      product_id: "family.1",
      base_plan_id: "monthly",
      status: "active",
      acknowledged: true,
      is_test_purchase: false,
    });
    expect(events.indexOf("ack")).toBeGreaterThan(events.indexOf("row_written"));
    expect(rowAtAck?.acknowledged).toBe(false);
  });

  it("a pending (not full) bound purchase is written but not acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, state: "SUBSCRIPTION_STATE_PENDING", expiryTime: null });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ status: "pending", acknowledged: false });
    expect(events).not.toContain("ack");
  });

  it("an already-acknowledged bound purchase is written and not acknowledged again", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, acknowledged: true });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)).toBeDefined();
    expect(events).not.toContain("ack");
  });

  it("a product outside the catalog is not written or acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, productId: "family.9" });
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("a test purchase for a payer NOT on the allowlist is not written or acknowledged", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, testPurchase: true });
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("a test purchase for an allowlisted payer is written, flagged, and acknowledged", async () => {
    tables.google_license_testers = [{ payer_id: PAYER }];
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, testPurchase: true });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ payer_id: PAYER, is_test_purchase: true, acknowledged: true });
  });

  it("a binding whose profile is not a payer role (an athlete) is not written", async () => {
    tables.profiles = [{ id: PAYER, role: "athlete" }];
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID });
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("a binding whose profile no longer exists is not written", async () => {
    tables.profiles = [];
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID });
    await push(subNote());
    expect(subRows()).toEqual([]);
  });
});

describe("rule d: no row and no usable binding or owned linked token", () => {
  const unbound: Array<[string, FixtureOptions]> = [
    ["no account id", { accountId: null }],
    ["an account id matching no binding", { accountId: OTHER_BINDING }],
    ["a non-UUID account id", { accountId: "not-a-binding-id" }],
  ];
  for (const [name, fixture] of unbound) {
    it(`${name}: nothing written, never acknowledged, alert carries no identifiers, 2xx`, async () => {
      googleReturns(SENTINEL_TOKEN, fixture);
      expect(await push(subNote())).toBe(200);
      expect(subRows()).toEqual([]);
      expect(events).not.toContain("ack");
      expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.[2]).toBeUndefined();
    });
  }

  it("a linked token we do NOT own is not followed", async () => {
    googleReturns(SENTINEL_TOKEN, { accountId: null, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toEqual([]);
    expect(events).not.toContain("ack");
  });

  it("an unknown token Google does not recognise: 2xx, no write", async () => {
    expect(await push(subNote())).toBe(200);
    expect(subRows()).toEqual([]);
  });
});

describe("rule c: no row, linked token names a row we own (plan change)", () => {
  it("writes the new row for the SAME payer, refreshes the old row, and acknowledges", async () => {
    subRows().push({
      id: "row-old",
      payer_id: PAYER,
      purchase_token: SENTINEL_LINKED_TOKEN,
      status: "active",
      expires_at: FUTURE,
    });
    googleReturns(SENTINEL_LINKED_TOKEN, { state: "SUBSCRIPTION_STATE_EXPIRED", expiryTime: PAST });
    googleReturns(SENTINEL_TOKEN, { productId: "family.2", accountId: null, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({
      payer_id: PAYER,
      product_id: "family.2",
      linked_purchase_token: SENTINEL_LINKED_TOKEN,
      acknowledged: true,
    });
    expect(rowFor(SENTINEL_LINKED_TOKEN)).toMatchObject({ status: "expired", expires_at: PAST });
    expect(events.indexOf("ack")).toBeGreaterThan(events.indexOf("row_written"));
  });

  it("also works when the account id matches no binding", async () => {
    subRows().push({ id: "row-old", payer_id: PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_LINKED_TOKEN, { acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { accountId: OTHER_BINDING, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)).toMatchObject({ payer_id: PAYER });
  });

  it("a linked token owned by ANOTHER payer is refused even when the purchase is bound to this payer", async () => {
    subRows().push({ id: "row-old", payer_id: OTHER_PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toBeUndefined();
    expect(events).not.toContain("ack");
    expect(subRows()).toHaveLength(1);
  });

  it("with no binding, the new row goes to the linked row's own payer and to nobody else", async () => {
    subRows().push({ id: "row-old", payer_id: OTHER_PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_LINKED_TOKEN, { acknowledged: true });
    googleReturns(SENTINEL_TOKEN, { accountId: null, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)?.payer_id).toBe(OTHER_PAYER);
    expect(subRows().filter((r) => r.payer_id === PAYER)).toEqual([]);
  });

  it("a bound purchase naming a linked token whose payer has a different binding is refused (cross-payer)", async () => {
    tables.google_purchase_bindings!.push({ payer_id: OTHER_PAYER, binding_id: OTHER_BINDING });
    subRows().push({ id: "row-old", payer_id: PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active", expires_at: FUTURE });
    googleReturns(SENTINEL_TOKEN, { accountId: OTHER_BINDING, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    await push(subNote());
    expect(rowFor(SENTINEL_TOKEN)).toBeUndefined();
    expect(events).not.toContain("ack");
  });

  it("a failed refresh of the old row does not fail the new purchase (alert carries the row id only)", async () => {
    subRows().push({ id: "row-old", payer_id: PAYER, purchase_token: SENTINEL_LINKED_TOKEN, status: "active", expires_at: FUTURE });
    googleByToken.set(SENTINEL_LINKED_TOKEN, { status: 503 });
    googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, linkedPurchaseToken: SENTINEL_LINKED_TOKEN });
    expect(await push(subNote())).toBe(200);
    expect(rowFor(SENTINEL_TOKEN)).toBeDefined();
    expect(alerts.some((a) => JSON.stringify(a[2]) === JSON.stringify({ row_id: "row-old" }))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// HTTP semantics: temporary failures retry
// ---------------------------------------------------------------------------

describe("temporary failures return 5xx so Pub/Sub redelivers", () => {
  it("Google unavailable for a non-void message: 503, row untouched, alert", async () => {
    const row = seedRow();
    googleByToken.set(SENTINEL_TOKEN, { status: 503 });
    expect(await push(subNote())).toBe(503);
    expect(rowFor(SENTINEL_TOKEN)).toEqual(row);
    expect(alerts).toHaveLength(1);
  });

  it("an unreadable Google answer (unknown state): 503 and nothing written", async () => {
    googleReturns(SENTINEL_TOKEN, { state: "SUBSCRIPTION_STATE_SOMETHING_NEW", accountId: BINDING_ID });
    expect(await push(subNote())).toBe(503);
    expect(subRows()).toEqual([]);
  });

  it("Google rejecting an OWNED token (404/410) is not retried (2xx) but alerts", async () => {
    seedRow();
    expect(await push(subNote())).toBe(200);
    expect(alerts.some((a) => a[0] === "[google-play-webhook] owned token unknown to Google")).toBe(true);
    expect(rowFor(SENTINEL_TOKEN)?.status).toBe("active");
  });

  it("a failed forced-non-granting write on a void is a 500 (retry) and alerts", async () => {
    seedRow();
    googleByToken.set(SENTINEL_TOKEN, { status: 503 });
    dbFault = { table: "google_subscriptions", op: "update" };
    expect(await push(voidNote())).toBe(500);
    expect(alerts.some((a) => a[0] === "[google-play-webhook] handler error")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC5: injected database errors whose message carries the token
// ---------------------------------------------------------------------------

describe("database failures: 500, alert, and nothing sensitive in logs, alerts or responses (AC5)", () => {
  const faults: Array<[string, { table: string; op: string }, () => void, () => void]> = [
    ["row read", { table: "google_subscriptions", op: "select" }, () => {}, () => googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID })],
    ["owned-row refresh", { table: "google_subscriptions", op: "update" }, () => seedRow(), () => googleReturns(SENTINEL_TOKEN, { acknowledged: true })],
    ["binding lookup", { table: "google_purchase_bindings", op: "select" }, () => {}, () => googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID })],
    ["payer read", { table: "profiles", op: "select" }, () => {}, () => googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID })],
    ["license-tester read", { table: "google_license_testers", op: "select" }, () => {}, () => googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID, testPurchase: true })],
    ["row insert", { table: "google_subscriptions", op: "insert" }, () => {}, () => googleReturns(SENTINEL_TOKEN, { accountId: BINDING_ID })],
  ];
  for (const [name, fault, arrange, google] of faults) {
    it(`${name} fails: 500, never acknowledged, only the Postgres code is logged`, async () => {
      arrange();
      google();
      dbFault = fault;
      expect(await push(subNote())).toBe(500);
      expect(fetchCalls.some((u) => u.includes(":acknowledge"))).toBe(false);
      expect(logged.join("\n")).toContain("XX000");
      expect(alerts.some((a) => a[0] === "[google-play-webhook] handler error")).toBe(true);
    });
  }

  it("a fetch that throws (message carries the token) is treated as Google unavailable: 503, nothing leaked", async () => {
    seedRow();
    googleReturns(SENTINEL_TOKEN);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error(`boom ${SENTINEL_TOKEN}`);
      }),
    );
    // getSubscriptionPurchaseV2 swallows fetch errors into "unavailable".
    expect(await push(subNote())).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// AC10: nothing here depends on the calendar
// ---------------------------------------------------------------------------

describe("fixtures do not depend on the calendar (AC10)", () => {
  it("active fixtures use the far-future default expiry; past dates are fixed history", () => {
    const body = subscriptionV2Fixture() as { lineItems: Array<{ expiryTime: string }> };
    expect(body.lineItems[0]?.expiryTime.startsWith("2099-")).toBe(true);
    expect(PAST.startsWith("2020-")).toBe(true);
  });
});
