import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const h = vi.hoisted(() => ({
  calls: [] as string[],
  candidates: [] as { user_id: string; tombstoned: boolean; attempts: number }[],
  mark: {} as Record<string, string>,
  finalize: {} as Record<string, string>,
  finalizeError: new Set<string>(),
  bumped: {} as Record<string, number>,
  revokeOk: {} as Record<string, boolean>,
  finderLimit: 0,
  purge: vi.fn(),
  alert: vi.fn(async (..._a: unknown[]) => {}),
}));

vi.mock("@/lib/monitoring/notify", () => ({ notifyError: h.alert }));
vi.mock("@/lib/monitoring/deliver", () => ({
  deliverInBackground: (p: Promise<unknown>) => void p.catch(() => {}),
}));
vi.mock("@/lib/auth/apple/handoff", () => ({
  purgeAppleHandoffs: async () => {
    h.calls.push("purge");
    return h.purge();
  },
}));
vi.mock("@/lib/auth/apple/revoke", () => ({
  revokeAppleTokensWithRetry: async (id: string, attempts: number) => {
    h.calls.push(`revoke:${id}:${attempts}`);
    return { rows: [], allOk: h.revokeOk[id] ?? true };
  },
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: async (fn: string, args: Record<string, unknown>) => {
      const id = args.p_user_id as string | undefined;
      h.calls.push(id ? `${fn}:${id}` : fn);
      switch (fn) {
        case "reaper_find_candidates":
          h.finderLimit = args.p_limit as number;
          return { data: h.candidates.slice(0, h.finderLimit), error: null };
        case "reaper_mark":
          return { data: h.mark[id!] ?? "marked", error: null };
        case "reaper_bump_attempts": {
          h.bumped[id!] = (h.bumped[id!] ?? h.candidates.find((c) => c.user_id === id)?.attempts ?? 0) + 1;
          return { data: h.bumped[id!], error: null };
        }
        case "finalize_pending_deletion":
          if (h.finalizeError.has(id!)) return { data: null, error: { code: "XX000" } };
          return { data: h.finalize[id!] ?? "deleted", error: null };
      }
      return { data: null, error: { code: "42883" } };
    },
  }),
}));

import { GET, POST } from "@/app/api/cron/reap-incomplete-signups/route";

const SECRET = "s3cret-value";
const req = (auth: string | null = `Bearer ${SECRET}`) =>
  new NextRequest("http://localhost/api/cron/reap-incomplete-signups", {
    headers: auth ? { authorization: auth } : {},
  });

const writes = () =>
  h.calls.filter((c) =>
    /^(reaper_mark|reaper_bump_attempts|finalize_pending_deletion|revoke|purge)/.test(c),
  );

beforeEach(() => {
  h.calls.length = 0;
  h.candidates = [];
  h.mark = {};
  h.finalize = {};
  h.finalizeError.clear();
  h.bumped = {};
  h.revokeOk = {};
  h.purge.mockReset().mockReturnValue({ purged: 1, kept: 2, forced: 3 });
  h.alert.mockClear();
  process.env.CRON_SECRET = SECRET;
  process.env.REAPER_DRY_RUN = "false";
  // flags off must not matter
  delete process.env.SSO_APPLE;
  delete process.env.SSO_GOOGLE;
  delete process.env.SSO_ENABLED;
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("auth", () => {
  it("500 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req())).status).toBe(500);
  });
  it("401 for a missing, wrong, or same-length wrong secret; nothing runs", async () => {
    expect((await GET(req(null))).status).toBe(401);
    expect((await GET(req("Bearer nope"))).status).toBe(401);
    expect((await GET(req(`Bearer ${"x".repeat(SECRET.length)}`))).status).toBe(401);
    expect(h.calls).toEqual([]);
  });
  it("POST works with the secret", async () => {
    expect((await POST(req())).status).toBe(200);
  });
});

describe("dry run", () => {
  it("is the default when REAPER_DRY_RUN is unset, empty or anything but 'false'", async () => {
    h.candidates = [{ user_id: "a", tombstoned: false, attempts: 0 }];
    for (const v of [undefined, "", "true", "0", "no"]) {
      h.calls.length = 0;
      if (v === undefined) delete process.env.REAPER_DRY_RUN;
      else process.env.REAPER_DRY_RUN = v;
      const body = await (await GET(req())).json();
      expect(body.dryRun).toBe(true);
      expect(writes()).toEqual([]);
    }
  });
  it("computes counts and writes nothing (no mark, revoke, bump, finalize, purge)", async () => {
    process.env.REAPER_DRY_RUN = "true";
    h.candidates = [
      { user_id: "a", tombstoned: false, attempts: 0 },
      { user_id: "b", tombstoned: true, attempts: 2 },
    ];
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ dryRun: true, candidates: 2, tombstoned: 1, wouldMark: 1, deleted: 0, marked: 0 });
    expect(h.calls).toEqual(["reaper_find_candidates"]);
    expect(h.purge).not.toHaveBeenCalled();
  });
  it("'false' (any case) goes live", async () => {
    process.env.REAPER_DRY_RUN = "FALSE";
    expect((await (await GET(req())).json()).dryRun).toBe(false);
  });
});

describe("live run", () => {
  it("asks the finder for at most 100 and never processes more than 100", async () => {
    h.candidates = Array.from({ length: 150 }, (_, i) => ({ user_id: `u${i}`, tombstoned: true, attempts: 0 }));
    const body = await (await GET(req())).json();
    expect(h.finderLimit).toBe(100);
    expect(body.candidates).toBe(100);
    expect(body.deleted).toBe(100);
  });

  it("untombstoned: mark -> revoke -> finalize, in that order, then purge", async () => {
    h.candidates = [{ user_id: "a", tombstoned: false, attempts: 0 }];
    const body = await (await GET(req())).json();
    expect(h.calls).toEqual([
      "reaper_find_candidates",
      "reaper_mark:a",
      "revoke:a:3",
      "finalize_pending_deletion:a",
      "purge",
    ]);
    expect(body).toMatchObject({ marked: 1, deleted: 1, purge: { purged: 1, kept: 2, forced: 3 } });
  });

  it("already tombstoned: no mark call", async () => {
    h.candidates = [{ user_id: "a", tombstoned: true, attempts: 1 }];
    await GET(req());
    expect(h.calls).not.toContain("reaper_mark:a");
    expect(h.calls).toContain("finalize_pending_deletion:a");
  });

  it("not_pending on mark: skipped, no revoke, no finalize", async () => {
    h.candidates = [{ user_id: "a", tombstoned: false, attempts: 0 }];
    h.mark.a = "not_pending";
    const body = await (await GET(req())).json();
    expect(body.skippedNotPending).toBe(1);
    expect(h.calls.some((c) => c.startsWith("revoke") || c.startsWith("finalize"))).toBe(false);
  });

  it("revoke failure: attempts bumped, tombstone kept, NOT finalized, no alert", async () => {
    h.candidates = [{ user_id: "a", tombstoned: true, attempts: 1 }];
    h.revokeOk.a = false;
    const body = await (await GET(req())).json();
    expect(h.calls).toContain("reaper_bump_attempts:a");
    expect(h.calls).not.toContain("finalize_pending_deletion:a");
    expect(body).toMatchObject({ revokeFailed: 1, deleted: 0, forced: 0 });
    expect(h.alert).not.toHaveBeenCalled();
  });

  it("5th failed run (attempts reaches 5): finalizes without a successful revoke and alerts with an id prefix only", async () => {
    h.candidates = [{ user_id: "abcdef12-0000-4000-8000-000000000000", tombstoned: true, attempts: 4 }];
    h.revokeOk["abcdef12-0000-4000-8000-000000000000"] = false;
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ revokeFailed: 1, forced: 1, deleted: 1 });
    const order = h.calls.filter((c) => /bump|finalize/.test(c));
    expect(order[0]).toMatch(/^reaper_bump_attempts/);
    expect(order[1]).toMatch(/^finalize_pending_deletion/);
    expect(h.alert).toHaveBeenCalledTimes(1);
    const ctx = JSON.stringify(h.alert.mock.calls[0]);
    expect(ctx).toContain("abcdef12");
    expect(ctx).not.toContain("abcdef12-0000");
  });

  it("attempts already >= 5 at the start: skips revoke and force-finalizes (still alerts)", async () => {
    h.candidates = [{ user_id: "a", tombstoned: true, attempts: 5 }];
    const body = await (await GET(req())).json();
    expect(h.calls.some((c) => c.startsWith("revoke"))).toBe(false);
    expect(body).toMatchObject({ forced: 1, deleted: 1 });
    expect(h.alert).toHaveBeenCalledTimes(1);
  });

  it("finalize re-check returning not_pending counts as a no-op, never an alert", async () => {
    h.candidates = [{ user_id: "a", tombstoned: true, attempts: 0 }];
    h.finalize.a = "not_pending";
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ deleted: 0, finalizeNoop: 1 });
    expect(h.alert).not.toHaveBeenCalled();
  });

  it("a finalize error keeps going with the next id and still purges", async () => {
    h.candidates = [
      { user_id: "a", tombstoned: true, attempts: 0 },
      { user_id: "b", tombstoned: true, attempts: 0 },
    ];
    h.finalizeError.add("a");
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ deleted: 1, errors: 1 });
    expect(h.calls).toContain("finalize_pending_deletion:b");
    expect(h.calls[h.calls.length - 1]).toBe("purge");
  });

  it("runs with every SSO flag unset/off (not gated by flags)", async () => {
    process.env.SSO_APPLE = "off";
    process.env.SSO_GOOGLE = "off";
    h.candidates = [{ user_id: "a", tombstoned: true, attempts: 0 }];
    const body = await (await GET(req())).json();
    expect(body.deleted).toBe(1);
    expect(h.purge).toHaveBeenCalled();
  });

  it("the response and logs carry counts only (no user ids)", async () => {
    h.candidates = [{ user_id: "11111111-2222-4333-8444-555555555555", tombstoned: true, attempts: 0 }];
    const res = await GET(req());
    const text = JSON.stringify(await res.json()) + JSON.stringify((console.info as ReturnType<typeof vi.fn>).mock.calls);
    expect(text).not.toContain("11111111");
  });
});
