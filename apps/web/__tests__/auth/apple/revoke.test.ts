import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn(async () => {}) }));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({}) }));

const rowsRef = vi.hoisted(() => ({ rows: [] as unknown[], listThrows: false }));
vi.mock("@/lib/auth/apple/store", async (orig) => {
  const actual = await orig<typeof import("@/lib/auth/apple/store")>();
  return {
    ...actual,
    listStoredTokens: async () => {
      if (rowsRef.listThrows) throw new Error("db");
      return rowsRef.rows as never;
    },
  };
});

import { revokeAppleTokens, revokeAppleTokensWithRetry } from "@/lib/auth/apple/revoke";
import { revokeAppleTokensForPendingDeletion } from "@/lib/auth/apple/revoke-pending";
import { encryptValue, tokenAad } from "@/lib/auth/apple/token-crypto";

import { installAppleFetch, setAppleEnv, SERVICES_ID, BUNDLE_ID } from "./helpers";

const UID = "22222222-2222-4222-8222-222222222222";
const row = (clientId: string, token: string) => ({ clientId, sub: "s", value: encryptValue(token, tokenAad(UID, clientId)) });

beforeEach(() => {
  setAppleEnv({ SSO_WEB: "off", SSO_IOS: "off", SSO_ANDROID: "off" }); // flags OFF: revoke must still work
  rowsRef.rows = [];
  rowsRef.listThrows = false;
  vi.unstubAllGlobals();
});

describe("revokeAppleTokens", () => {
  it("revokes each row with ITS OWN client_id and token, even with every SSO flag off", async () => {
    rowsRef.rows = [row(SERVICES_ID, "tok-web"), row(BUNDLE_ID, "tok-ios")];
    const mock = installAppleFetch();
    const r = await revokeAppleTokens(UID);
    expect(r.allOk).toBe(true);
    expect(mock.revokeBodies.map((b) => [b.get("client_id"), b.get("token")])).toEqual([
      [SERVICES_ID, "tok-web"],
      [BUNDLE_ID, "tok-ios"],
    ]);
    // the client secret is minted for the row's client (sub claim)
    for (const [i, cid] of [SERVICES_ID, BUNDLE_ID].entries()) {
      const secret = mock.revokeBodies[i]!.get("client_secret")!;
      expect(JSON.parse(Buffer.from(secret.split(".")[1]!, "base64url").toString()).sub).toBe(cid);
    }
    expect(mock.revokeBodies[0]!.get("token_type_hint")).toBe("refresh_token");
  });

  it("zero rows is success and makes no Apple call", async () => {
    const mock = installAppleFetch();
    expect(await revokeAppleTokens(UID)).toEqual({ rows: [], allOk: true });
    expect(mock.revokeBodies).toHaveLength(0);
  });

  it("reports per-row success; a failing row does not hide a succeeding one", async () => {
    rowsRef.rows = [row(SERVICES_ID, "a"), row(BUNDLE_ID, "b")];
    let n = 0;
    installAppleFetch({ revoke: () => new Response("", { status: n++ === 0 ? 500 : 200 }) });
    const r = await revokeAppleTokens(UID);
    expect(r.rows).toEqual([
      { clientId: SERVICES_ID, ok: false },
      { clientId: BUNDLE_ID, ok: true },
    ]);
    expect(r.allOk).toBe(false);
  });

  it("treats Apple's invalid_grant (already revoked) as success but other 400s as failure", async () => {
    rowsRef.rows = [row(SERVICES_ID, "a")];
    installAppleFetch({ revoke: () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }) });
    expect((await revokeAppleTokens(UID)).allOk).toBe(true);
    installAppleFetch({ revoke: () => new Response(JSON.stringify({ error: "invalid_client" }), { status: 400 }) });
    expect((await revokeAppleTokens(UID)).allOk).toBe(false);
  });

  it("an unreadable / undecryptable / unconfigured row counts as failed, never throws", async () => {
    rowsRef.listThrows = true;
    expect((await revokeAppleTokens(UID)).allOk).toBe(false);
    rowsRef.listThrows = false;
    rowsRef.rows = [{ ...row(SERVICES_ID, "a"), value: { ...row(SERVICES_ID, "a").value, tag: "AAAA" } }];
    installAppleFetch();
    expect((await revokeAppleTokens(UID)).allOk).toBe(false);
  });
});

describe("revokeAppleTokensWithRetry", () => {
  it("retries up to 3 times and stops early on success", async () => {
    rowsRef.rows = [row(SERVICES_ID, "a")];
    let n = 0;
    const mock = installAppleFetch({ revoke: () => new Response("", { status: ++n < 3 ? 503 : 200 }) });
    const r = await revokeAppleTokensWithRetry(UID, 3);
    expect(r.allOk).toBe(true);
    expect(mock.revokeBodies).toHaveLength(3);
  });

  it("gives up after 3 attempts", async () => {
    rowsRef.rows = [row(SERVICES_ID, "a")];
    const mock = installAppleFetch({ revoke: () => new Response("", { status: 503 }) });
    expect((await revokeAppleTokensWithRetry(UID, 3)).allOk).toBe(false);
    expect(mock.revokeBodies).toHaveLength(3);
  });
});

describe("revokeAppleTokensForPendingDeletion (FV-671 integration point)", () => {
  it("returns ok true/false from the real revoke path", async () => {
    rowsRef.rows = [row(SERVICES_ID, "a")];
    installAppleFetch();
    expect(await revokeAppleTokensForPendingDeletion(UID)).toEqual({ ok: true });
    installAppleFetch({ revoke: () => new Response("", { status: 500 }) });
    expect(await revokeAppleTokensForPendingDeletion(UID)).toEqual({ ok: false });
  });
});
