import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { limitMock } = vi.hoisted(() => ({
  limitMock: vi.fn(async (..._args: unknown[]) => ({
    data: [] as unknown[],
    error: null as { code?: string; message?: string } | null,
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (column: string, options?: unknown) =>
        limitMock(table, column, options),
    }),
  }),
}));

import { GET } from "@/app/api/health/route";

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

beforeEach(() => {
  limitMock.mockClear();
  limitMock.mockResolvedValue({ data: [], error: null });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
});

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_URL;
  if (ORIGINAL_KEY === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL_KEY;
});

describe("GET /api/health (FV-729)", () => {
  it("returns ok and no row data when the database answers", async () => {
    limitMock.mockResolvedValueOnce({ data: [{ day_number: 1 }], error: null });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(limitMock).toHaveBeenCalledWith(
      "training_sessions_catalog",
      "day_number",
      { head: true, count: "exact" },
    );
  });

  it("returns 503 with no error text when the database is unreachable", async () => {
    limitMock.mockResolvedValueOnce({
      data: [],
      error: { code: "08006", message: "password=secret host=db.internal" },
    });
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ ok: false });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(JSON.stringify(body)).not.toContain("db.internal");
  });

  it("returns 503 when Supabase env is missing and does not query", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("does not reference the service-role key", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../app/api/health/route.ts"),
      "utf8",
    );
    expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).not.toContain("createServiceClient");
  });
});
