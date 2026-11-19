import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  revoke: vi.fn(async () => ({ allOk: true, rows: [] })),
  state: vi.fn(),
}));

vi.mock("@/lib/auth/apple/revoke", () => ({ revokeAppleTokens: h.revoke }));
vi.mock("@/lib/auth/session-state-core", async (orig) => ({
  ...(await orig<object>()),
  resolveSessionState: () => h.state(),
}));

import { resolvePostSignInPath } from "@/lib/auth/apple/post-sign-in";

function client(userId = "u1") {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn(),
  };
}

describe("resolvePostSignInPath (Apple)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("pending -> /welcome; established roles -> their home", async () => {
    h.state.mockResolvedValue({ state: "pending" });
    // reason: minimal Supabase stand-in for a pure routing test
    expect(await resolvePostSignInPath(client() as never, "u1")).toBe("/welcome");
    h.state.mockResolvedValue({ state: "parent" });
    expect(await resolvePostSignInPath(client() as never, "u1")).toBe("/dashboard");
    h.state.mockResolvedValue({ state: "adult_athlete" });
    expect(await resolvePostSignInPath(client() as never, "u1")).toBe("/athlete");
  });

  it("a minor athlete never keeps an SSO session: revoke, sign out, fail (privacy #601)", async () => {
    h.state.mockResolvedValue({ state: "athlete" });
    const c = client();
    expect(await resolvePostSignInPath(c as never, "u1")).toBe("/signin?error=oauth");
    expect(h.revoke).toHaveBeenCalledWith("u1");
    expect(c.auth.signOut).toHaveBeenCalled();
  });

  it("error never routes to /welcome", async () => {
    h.state.mockResolvedValue({ state: "error" });
    expect(await resolvePostSignInPath(client() as never, "u1")).not.toBe("/welcome");
  });
});
