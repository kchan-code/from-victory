import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/monitoring/notify", () => ({ notifyError: vi.fn(async () => {}) }));
vi.mock("@/lib/monitoring/deliver", () => ({ deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({}) }));
// appleNativeSignIn reads the admin preview cookie; outside a request scope the
// real next/headers throws. Tests set `previewCookie.value` when they need one.
const previewCookie: { value: string | undefined } = { value: undefined };
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) =>
      name === "fv_sso_preview" && previewCookie.value !== undefined
        ? { name, value: previewCookie.value }
        : undefined,
  }),
}));
vi.mock("@/lib/auth/apple/rate-limit", () => ({ appleRateLimited: vi.fn(async () => false) }));

const store = vi.hoisted(() => ({
  storeAppleRefreshToken: vi.fn(async (..._a: unknown[]) => {}),
  createHandoff: vi.fn(async (..._a: unknown[]) => {}),
  listPurgeCandidates: vi.fn(async () => []),
}));
vi.mock("@/lib/auth/apple/store", async (orig) => ({ ...(await orig<object>()), ...store }));

const sb = vi.hoisted(() => ({
  signInWithIdToken: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  role: "parent" as string | null,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: { signInWithIdToken: sb.signInWithIdToken, getUser: sb.getUser, signOut: sb.signOut },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: sb.role ? { role: sb.role } : null, error: null }) }),
      }),
    }),
  }),
}));

import { appleHandoffComplete, appleNativeSignIn } from "@/lib/actions/apple-auth";
import { appleRateLimited } from "@/lib/auth/apple/rate-limit";
import { GET as startGET } from "@/app/auth/apple/start/route";
import { POST as callbackPOST } from "@/app/auth/apple/callback/route";
import { __resetAppleJwksCacheForTests } from "@/lib/auth/apple/verify";

import { BUNDLE_ID, goodClaims, idToken, installAppleFetch, okJson, setAppleEnv, sha256hex, SERVICES_ID } from "./helpers";

const RAW = "raw-nonce-for-route-tests-0123456789";
const STATE = "state-value-0123456789";
const SUB = "001234.abcdef.5678";
const REFRESH = "refresh-from-apple";
const SITE = "https://app.test";

function appleMock(over: { response?: Record<string, unknown> } = {}, clientId = SERVICES_ID) {
  return installAppleFetch({
    redeem: () =>
      okJson({
        id_token: idToken(goodClaims({ aud: clientId, nonce: sha256hex(RAW), ...(over.response ?? {}) })),
        refresh_token: REFRESH,
      }),
  });
}

function callbackReq(opts: { state?: string; cookieState?: string; challenge?: string; code?: string | null; clientId?: string; origin?: string } = {}) {
  const form = new URLSearchParams();
  form.set("state", opts.state ?? STATE);
  if (opts.code !== null) form.set("code", opts.code ?? "auth-code");
  form.set("id_token", idToken(goodClaims({ aud: opts.clientId ?? SERVICES_ID, nonce: sha256hex(RAW) })));
  const cookies = [`__Host-fv_apple_state=${opts.cookieState ?? STATE}`, `__Host-fv_apple_nonce=${RAW}`];
  if (opts.challenge) cookies.push(`__Host-fv_apple_challenge=${opts.challenge}`);
  return new NextRequest(`${SITE}/auth/apple/callback`, {
    method: "POST",
    body: form,
    headers: { cookie: cookies.join("; "), origin: opts.origin ?? "https://appleid.apple.com" },
  });
}

beforeEach(() => {
  vi.unstubAllGlobals();
  __resetAppleJwksCacheForTests();
  setAppleEnv();
  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  vi.clearAllMocks();
  sb.role = "parent";
  sb.signInWithIdToken.mockResolvedValue({ data: {}, error: null });
  sb.getUser.mockResolvedValue({ data: { user: { id: "u1", identities: [{ provider: "apple", id: SUB }] } }, error: null });
});

describe("flags off => no new sign-ins (rollback level 1)", () => {
  beforeEach(() => setAppleEnv({ SSO_WEB: "off", SSO_IOS: "off", SSO_ANDROID: "off" }));

  it("/auth/apple/start 404s on web and android, setting no cookies", async () => {
    for (const q of ["", "?app=android&challenge=" + "a".repeat(43)]) {
      const res = await startGET(new NextRequest(`${SITE}/auth/apple/start${q}`));
      expect(res.status).toBe(404);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
  });

  it("/auth/apple/callback 404s and never calls Apple", async () => {
    const f = appleMock();
    const res = await callbackPOST(callbackReq());
    expect(res.status).toBe(404);
    expect(f.redeemBodies).toHaveLength(0);
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("appleNativeSignIn and appleHandoffComplete refuse", async () => {
    const f = appleMock();
    const long = "x".repeat(40);
    expect(await appleNativeSignIn({ identityToken: long, authorizationCode: long, rawNonce: RAW })).toMatchObject({ ok: false });
    expect(await appleHandoffComplete({ handoff: "h".repeat(43), verifier: "v".repeat(43) })).toMatchObject({ ok: false });
    expect(f.redeemBodies).toHaveLength(0);
    expect(store.createHandoff).not.toHaveBeenCalled();
  });

  it("'preview' admits a new sign-in only with the admin preview cookie", async () => {
    const token = "p".repeat(40);
    setAppleEnv({ SSO_WEB: "preview" });
    process.env.SSO_PREVIEW_TOKEN = token;
    process.env.VERCEL_ENV = "production"; // the staging project is "production" to Vercel
    const req = (cookie?: string) =>
      new NextRequest(`${SITE}/auth/apple/start`, cookie ? { headers: { cookie: `fv_sso_preview=${cookie}` } } : undefined);
    expect((await startGET(req())).status).toBe(404);
    expect((await startGET(req("q".repeat(40)))).status).toBe(404);
    expect((await startGET(req(token))).status).toBe(303);
    process.env.SSO_PREVIEW_TOKEN = "short";
    expect((await startGET(req("short"))).status).toBe(404); // tokens under 32 chars never match
    delete process.env.SSO_PREVIEW_TOKEN;
    delete process.env.VERCEL_ENV;
  });
});

describe("android preview: the gate sits in the WebView, not the Auth Tab (FV-674)", () => {
  const token = "p".repeat(40);
  const handoffArgs = { handoff: "h".repeat(43), verifier: "v".repeat(43) };
  beforeEach(() => {
    setAppleEnv({ SSO_ANDROID: "preview" });
    process.env.SSO_PREVIEW_TOKEN = token;
    previewCookie.value = undefined;
  });

  it("/auth/apple/start?app=android redirects (303) without the cookie", async () => {
    const res = await startGET(new NextRequest(`${SITE}/auth/apple/start?app=android&challenge=${"a".repeat(43)}`));
    expect(res.status).toBe(303);
  });

  it("web start still needs the cookie under web preview", async () => {
    setAppleEnv({ SSO_WEB: "preview" });
    expect((await startGET(new NextRequest(`${SITE}/auth/apple/start`))).status).toBe(404);
  });

  it("appleHandoffComplete refuses without the cookie and proceeds past the gate with it", async () => {
    expect(await appleHandoffComplete(handoffArgs)).toMatchObject({ ok: false });
    expect(appleRateLimited).not.toHaveBeenCalled();
    previewCookie.value = token;
    await appleHandoffComplete(handoffArgs); // no such handoff: fails later, past the gate
    expect(appleRateLimited).toHaveBeenCalledWith("apple_handoff");
  });

  it("appleHandoffComplete with a wrong cookie refuses", async () => {
    previewCookie.value = "q".repeat(40);
    expect(await appleHandoffComplete(handoffArgs)).toMatchObject({ ok: false });
    expect(appleRateLimited).not.toHaveBeenCalled();
  });

  it("`on` needs no cookie and `off` always refuses", async () => {
    setAppleEnv({ SSO_ANDROID: "on" });
    await appleHandoffComplete(handoffArgs);
    expect(appleRateLimited).toHaveBeenCalledTimes(1);
    setAppleEnv({ SSO_ANDROID: "off" });
    previewCookie.value = token;
    expect(await appleHandoffComplete(handoffArgs)).toMatchObject({ ok: false });
    expect(appleRateLimited).toHaveBeenCalledTimes(1);
  });
});

describe("/auth/apple/start", () => {
  it("web: redirects to Apple with the documented params and sets single-use __Host- cookies", async () => {
    const res = await startGET(new NextRequest(`${SITE}/auth/apple/start`));
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe("https://appleid.apple.com/auth/authorize");
    expect(loc.searchParams.get("client_id")).toBe(SERVICES_ID);
    expect(loc.searchParams.get("response_type")).toBe("code id_token");
    expect(loc.searchParams.get("response_mode")).toBe("form_post");
    expect(loc.searchParams.get("scope")).toBe("email");
    expect(loc.searchParams.get("redirect_uri")).toBe(`${SITE}/auth/apple/callback`);

    const state = res.cookies.get("__Host-fv_apple_state")!;
    const nonce = res.cookies.get("__Host-fv_apple_nonce")!;
    expect(loc.searchParams.get("state")).toBe(state.value);
    expect(loc.searchParams.get("nonce")).toBe(sha256hex(nonce.value)); // hash to Apple, raw in the cookie
    expect(res.cookies.get("__Host-fv_apple_challenge")).toBeUndefined();
    for (const c of [state, nonce]) {
      expect(c).toMatchObject({ httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 600 });
    }
    expect(res.headers.get("set-cookie")).not.toMatch(/domain=/i);
  });

  it("android: validates and stores the challenge, using the Services ID", async () => {
    const challenge = "A".repeat(43);
    const res = await startGET(new NextRequest(`${SITE}/auth/apple/start?app=android&challenge=${challenge}`));
    expect(res.status).toBe(303);
    expect(res.cookies.get("__Host-fv_apple_challenge")!.value).toBe(challenge);
    const bad = await startGET(new NextRequest(`${SITE}/auth/apple/start?app=android&challenge=short`));
    expect(bad.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(bad.headers.get("set-cookie")).toBeNull();
  });

  it("refuses cleanly (no crash, no secret) when secrets are missing", async () => {
    setAppleEnv({ APPLE_SIGNIN_P8: undefined });
    const res = await startGET(new NextRequest(`${SITE}/auth/apple/start`));
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
  });
});

describe("/auth/apple/callback (web)", () => {
  it("success: signs in, checks the identity, stores the token, clears cookies, goes to the role home", async () => {
    const f = appleMock();
    const res = await callbackPOST(callbackReq());
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`${SITE}/dashboard`);
    expect(f.redeemBodies[0]!.get("client_id")).toBe(SERVICES_ID);
    expect(sb.signInWithIdToken).toHaveBeenCalledWith(expect.objectContaining({ provider: "apple", nonce: RAW }));
    expect(store.storeAppleRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1", clientId: SERVICES_ID, sub: SUB, refreshToken: REFRESH }));
    expect(f.revokeBodies).toHaveLength(0);
    for (const n of ["state", "nonce", "challenge"]) {
      expect(res.cookies.get(`__Host-fv_apple_${n}`)).toMatchObject({ value: "", maxAge: 0 });
    }
  });

  it("no profile -> /welcome (FV-672 will own this)", async () => {
    sb.role = null;
    appleMock();
    expect((await callbackPOST(callbackReq())).headers.get("location")).toBe(`${SITE}/welcome`);
  });

  it("a cross-origin POST with a missing/mismatched state is rejected before any Apple call", async () => {
    const f = appleMock();
    const res = await callbackPOST(callbackReq({ state: "attacker-state", cookieState: STATE }));
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.redeemBodies).toHaveLength(0);
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("a missing code (user cancelled) is a clean error redirect", async () => {
    const f = appleMock();
    const res = await callbackPOST(callbackReq({ code: null }));
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.redeemBodies).toHaveLength(0);
  });

  it("binding failure (sub mismatch): revoke the redeemed token, never sign in", async () => {
    const f = appleMock({ response: { sub: "someone-else" } });
    const res = await callbackPOST(callbackReq());
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.revokeBodies).toHaveLength(1);
    expect(f.revokeBodies[0]!.get("token")).toBe(REFRESH);
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
    expect(store.storeAppleRefreshToken).not.toHaveBeenCalled();
  });

  it("identity mismatch after sign-in: revoke + sign out", async () => {
    sb.getUser.mockResolvedValue({ data: { user: { id: "u1", identities: [{ provider: "apple", id: "different" }] } }, error: null });
    const f = appleMock();
    const res = await callbackPOST(callbackReq());
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.revokeBodies).toHaveLength(1);
    expect(sb.signOut).toHaveBeenCalled();
    expect(store.storeAppleRefreshToken).not.toHaveBeenCalled();
  });

  it("token-store failure: revoke + sign out", async () => {
    store.storeAppleRefreshToken.mockRejectedValueOnce(new Error("db"));
    const f = appleMock();
    const res = await callbackPOST(callbackReq());
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.revokeBodies).toHaveLength(1);
    expect(sb.signOut).toHaveBeenCalled();
  });

  it("redemption failure fails closed without a session", async () => {
    installAppleFetch({ redeem: () => new Response("{}", { status: 400 }) });
    const res = await callbackPOST(callbackReq());
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("never echoes credentials into the redirect or logs", async () => {
    const spies = [vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn")];
    appleMock({ response: { sub: "someone-else" } });
    const res = await callbackPOST(callbackReq());
    const logged = JSON.stringify(spies.flatMap((s) => s.mock.calls)) + (res.headers.get("location") ?? "");
    for (const secret of [REFRESH, RAW, SUB, "auth-code"]) expect(logged).not.toContain(secret);
    spies.forEach((s) => s.mockRestore());
  });
});

describe("/auth/apple/callback (android)", () => {
  it("writes a handoff and redirects to the app scheme WITHOUT creating a session", async () => {
    const challenge = "C".repeat(43);
    appleMock();
    const res = await callbackPOST(callbackReq({ challenge }));
    expect(res.status).toBe(303);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.protocol).toBe("com.fromvictoryapp.app:");
    expect(loc.host + loc.pathname).toBe("auth/callback");
    const handoff = loc.searchParams.get("handoff")!;
    expect(handoff.length).toBeGreaterThanOrEqual(43);
    expect(store.createHandoff).toHaveBeenCalledWith(
      expect.objectContaining({ id: handoff, challenge, clientId: SERVICES_ID, sub: SUB, refreshToken: REFRESH, rawNonce: RAW, oauthState: STATE }),
    );
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
  });

  it("handoff write failure revokes the redeemed token", async () => {
    store.createHandoff.mockRejectedValueOnce(new Error("db"));
    const f = appleMock();
    const res = await callbackPOST(callbackReq({ challenge: "C".repeat(43) }));
    expect(res.headers.get("location")).toBe(`${SITE}/signin?error=oauth`);
    expect(f.revokeBodies).toHaveLength(1);
  });

  it("SSO_ANDROID off 404s the android callback even if web is on", async () => {
    setAppleEnv({ SSO_ANDROID: "off" });
    expect((await callbackPOST(callbackReq({ challenge: "C".repeat(43) }))).status).toBe(404);
  });
});

describe("appleNativeSignIn (iOS)", () => {
  it("binds with the bundle id, signs in and returns the path", async () => {
    const f = appleMock({}, BUNDLE_ID);
    const identityToken = idToken(goodClaims({ aud: BUNDLE_ID, nonce: sha256hex(RAW) }));
    const r = await appleNativeSignIn({ identityToken, authorizationCode: "native-code-123", rawNonce: RAW });
    expect(r).toEqual({ ok: true, path: "/dashboard" });
    expect(f.redeemBodies[0]!.get("client_id")).toBe(BUNDLE_ID);
    expect(f.redeemBodies[0]!.get("redirect_uri")).toBeNull();
    expect(store.storeAppleRefreshToken).toHaveBeenCalledWith(expect.objectContaining({ clientId: BUNDLE_ID }));
  });

  it("a token for the Services ID is rejected on the iOS path (wrong client_id)", async () => {
    const f = appleMock();
    const identityToken = idToken(goodClaims({ aud: SERVICES_ID, nonce: sha256hex(RAW) }));
    const r = await appleNativeSignIn({ identityToken, authorizationCode: "native-code-123", rawNonce: RAW });
    expect(r).toMatchObject({ ok: false });
    expect(f.redeemBodies).toHaveLength(0);
  });

  it("binding failure revokes and does not sign in; errors are generic", async () => {
    const f = appleMock({ response: { sub: "other" } }, BUNDLE_ID);
    const identityToken = idToken(goodClaims({ aud: BUNDLE_ID, nonce: sha256hex(RAW) }));
    const r = await appleNativeSignIn({ identityToken, authorizationCode: "native-code-123", rawNonce: RAW });
    expect(r).toEqual({ ok: false, error: "Apple sign-in didn't work. Please try again." });
    expect(f.revokeBodies).toHaveLength(1);
    expect(sb.signInWithIdToken).not.toHaveBeenCalled();
  });
});

describe("middleware CSRF exemption", () => {
  it("passes the cross-origin Apple POST through untouched (no Origin gate; state is the defence)", async () => {
    vi.resetModules();
    vi.doMock("@/lib/supabase/middleware", () => ({
      updateSession: vi.fn(async () => (await import("next/server")).NextResponse.next()),
    }));
    vi.doMock("@/lib/native-shell", () => ({ isNativeShellUserAgent: () => false }));
    vi.doMock("@/lib/native-shell-router", () => ({ NATIVE_SHELL_ROUTED_PATHS: new Set<string>(), resolveNativeShellEntryTarget: vi.fn() }));
    const { middleware } = await import("@/middleware");
    const res = await middleware(callbackReq());
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("the matcher still runs middleware on /auth/apple/callback and the Apple routes accept no GET", async () => {
    const { config } = await import("@/middleware");
    const re = new RegExp(`^${config.matcher[0]}$`);
    expect(re.test("/auth/apple/callback")).toBe(true);
    const mod = await import("@/app/auth/apple/callback/route");
    expect(Object.keys(mod).filter((k) => ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(k))).toEqual(["POST"]);
  });
});
