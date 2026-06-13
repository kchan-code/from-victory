/**
 * Unit tests for admin grant server actions (FV-69).
 *
 * Covers:
 *   - grantCompAccess: non-admin rejected; valid grant inserts row with granted_by;
 *     unknown email errors cleanly; parentId path works.
 *   - revokeCompAccess: non-admin rejected; revoke sets revoked_at on active rows.
 *   - listCompGrants: non-admin rejected; returns active grants only.
 *
 * Non-admin rejection:
 *   requireAdminParent() calls notFound() for non-admin callers, which in
 *   Next.js throws a special NEXT_NOT_FOUND error. The test mocks notFound()
 *   to throw so the assertion simply checks that it threw — matching the real
 *   App Router behavior where the request terminates, not a `{ ok: false }` return.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

// Admin email list.
process.env.ADMIN_EMAILS = "admin@example.com";

// Mutable auth state — controls what requireAdminParent / isAdminEmail see.
const ADMIN_UUID = "a0000000-0000-4000-8000-000000000001";
let currentUserEmail = "admin@example.com";
let currentUserId = ADMIN_UUID;
let currentUserRole = "parent";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: { user: { id: currentUserId, email: currentUserEmail } } })
      ),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: currentUserId, role: currentUserRole, first_name: "Admin" },
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  }),
}));

// Tracked service-client calls.
let lastInsertRow: Record<string, unknown> | null = null;
let insertShouldFail = false;
let updateShouldFail = false;
let lastUpdateValues: Record<string, unknown> = {};
let mockActiveGrants: Array<{ id: string; parent_id: string; reason: string | null; expires_at: string | null; created_at: string }> = [];
const PARENT_UUID = "10000000-0000-4000-8000-000000000001";
let mockAuthUsers: Array<{ id: string; email: string }> = [
  { id: PARENT_UUID, email: "parent@example.com" },
];
let parentProfileExists = true;
let mockProfiles: Array<{ id: string; first_name: string }> = [
  { id: PARENT_UUID, first_name: "Alex" },
];

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    auth: {
      admin: {
        listUsers: vi.fn().mockImplementation(() => Promise.resolve({
          data: { users: mockAuthUsers },
          error: null,
        })),
      },
    },
    from: vi.fn((table: string) => {
      if (table === "access_grants") {
        return {
          insert: vi.fn((row: Record<string, unknown>) => {
            lastInsertRow = row;
            const resolvedValue = insertShouldFail
              ? { data: null, error: { message: "DB error" } }
              : { data: { id: "new-grant-id" }, error: null };
            const insertChain: Record<string, unknown> = {
              single: vi.fn().mockResolvedValue(resolvedValue),
            };
            insertChain.select = vi.fn().mockReturnValue(insertChain);
            return insertChain;
          }),
          update: vi.fn((values: Record<string, unknown>) => {
            lastUpdateValues = values;
            const resolvedValue = updateShouldFail
              ? { data: null, error: { message: "DB error" } }
              : { data: [{ id: "grant-1" }], error: null };
            const updateChain: Record<string, unknown> = {
              select: vi.fn().mockResolvedValue(resolvedValue),
            };
            updateChain.eq = vi.fn().mockReturnValue(updateChain);
            updateChain.is = vi.fn().mockReturnValue(updateChain);
            return updateChain;
          }),
          select: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: mockActiveGrants, error: null }),
        };
      }
      if (table === "profiles") {
        const profileChain: Record<string, unknown> = {
          in: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
          single: vi.fn().mockImplementation(() => {
            if (!parentProfileExists) {
              return Promise.resolve({ data: null, error: { message: "not found" } });
            }
            return Promise.resolve({ data: { id: PARENT_UUID, role: "parent" }, error: null });
          }),
        };
        // Make select() and eq() return the same chain object so .single() is reachable.
        profileChain.select = vi.fn().mockReturnValue(profileChain);
        profileChain.eq = vi.fn().mockReturnValue(profileChain);
        return profileChain;
      }
      const defaultChain: Record<string, unknown> = {
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      defaultChain.select = vi.fn().mockReturnValue(defaultChain);
      defaultChain.eq = vi.fn().mockReturnValue(defaultChain);
      return defaultChain;
    }),
  }),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { grantCompAccess, revokeCompAccess, listCompGrants } from "@/lib/actions/grants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asAdmin() {
  currentUserEmail = "admin@example.com";
  currentUserId = ADMIN_UUID;
  currentUserRole = "parent";
}

function asNonAdmin() {
  currentUserEmail = "notadmin@example.com";
  currentUserId = "b0000000-0000-4000-8000-000000000002";
  currentUserRole = "parent";
}

// ---------------------------------------------------------------------------
// grantCompAccess
// ---------------------------------------------------------------------------

describe("grantCompAccess", () => {
  beforeEach(() => {
    asAdmin();
    lastInsertRow = null;
    insertShouldFail = false;
    parentProfileExists = true;
    mockAuthUsers = [{ id: PARENT_UUID, email: "parent@example.com" }];
  });

  it("throws (notFound) for non-admin callers", async () => {
    // requireAdminParent() calls notFound() which throws NEXT_NOT_FOUND for
    // non-admin callers — matching App Router behavior.
    asNonAdmin();
    await expect(
      grantCompAccess({ parentEmail: "parent@example.com", reason: "test" })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("inserts a grant row with granted_by = admin id (email resolution)", async () => {
    const result = await grantCompAccess({
      parentEmail: "parent@example.com",
      reason: "beta tester",
    });
    expect(result).toMatchObject({ ok: true, grantId: "new-grant-id" });
    expect(lastInsertRow).toMatchObject({
      parent_id: PARENT_UUID,
      granted_by: ADMIN_UUID,
      reason: "beta tester",
    });
  });

  it("inserts a grant row via parentId directly", async () => {
    const result = await grantCompAccess({
      parentId: PARENT_UUID,
      reason: "team coach",
    });
    expect(result).toMatchObject({ ok: true, grantId: "new-grant-id" });
    expect(lastInsertRow).toMatchObject({
      parent_id: PARENT_UUID,
      granted_by: ADMIN_UUID,
      reason: "team coach",
    });
  });

  it("sets expires_at when provided", async () => {
    const expires = "2027-01-01T00:00:00.000Z";
    await grantCompAccess({
      parentEmail: "parent@example.com",
      reason: "trial",
      expiresAt: expires,
    });
    expect(lastInsertRow).toMatchObject({ expires_at: expires });
  });

  it("sets expires_at to null for perpetual grants", async () => {
    await grantCompAccess({
      parentEmail: "parent@example.com",
      reason: "permanent",
      expiresAt: null,
    });
    expect(lastInsertRow).toMatchObject({ expires_at: null });
  });

  it("returns an error for an unknown email", async () => {
    const result = await grantCompAccess({
      parentEmail: "nobody@example.com",
      reason: "test",
    });
    expect(result).toMatchObject({ ok: false });
    const errMsg = (result as { ok: false; error: string }).error;
    expect(errMsg).toMatch(/no parent account found/i);
  });

  it("returns an error when parentId does not exist as a parent profile", async () => {
    parentProfileExists = false;
    const result = await grantCompAccess({
      parentId: "00000000-0000-4000-8000-000000000000",
      reason: "test",
    });
    expect(result).toMatchObject({ ok: false });
  });

  it("returns an error when neither parentEmail nor parentId is provided", async () => {
    // The zod refine requires at least one of email/id.
    const result = await grantCompAccess({ reason: "test" } as never);
    expect(result).toMatchObject({ ok: false });
  });

  it("returns an error when DB insert fails", async () => {
    insertShouldFail = true;
    const result = await grantCompAccess({
      parentEmail: "parent@example.com",
      reason: "test",
    });
    expect(result).toMatchObject({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// revokeCompAccess
// ---------------------------------------------------------------------------

describe("revokeCompAccess", () => {
  beforeEach(() => {
    asAdmin();
    updateShouldFail = false;
    lastUpdateValues = {};
  });

  it("throws (notFound) for non-admin callers", async () => {
    asNonAdmin();
    await expect(
      revokeCompAccess({ parentId: PARENT_UUID })
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("sets revoked_at and returns revokedCount = 1", async () => {
    const result = await revokeCompAccess({ parentId: PARENT_UUID });
    expect(result).toMatchObject({ ok: true, revokedCount: 1 });
    // Confirm revoked_at was set to a date string.
    expect(typeof (lastUpdateValues as Record<string, string>).revoked_at).toBe("string");
  });

  it("returns an error on DB update failure", async () => {
    updateShouldFail = true;
    const result = await revokeCompAccess({ parentId: PARENT_UUID });
    expect(result).toMatchObject({ ok: false });
  });

  it("validates parentId is a UUID", async () => {
    const result = await revokeCompAccess({ parentId: "not-a-uuid" });
    expect(result).toMatchObject({ ok: false });
  });
});

// ---------------------------------------------------------------------------
// listCompGrants
// ---------------------------------------------------------------------------

describe("listCompGrants", () => {
  beforeEach(() => {
    asAdmin();
    mockAuthUsers = [{ id: PARENT_UUID, email: "parent@example.com" }];
    mockProfiles = [{ id: PARENT_UUID, first_name: "Alex" }];
    mockActiveGrants = [
      {
        id: "grant-1",
        parent_id: PARENT_UUID,
        reason: "beta tester",
        expires_at: null,
        created_at: "2026-06-13T00:00:00.000Z",
      },
    ];
  });

  it("throws (notFound) for non-admin callers", async () => {
    asNonAdmin();
    await expect(listCompGrants()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns active grants with parent display info", async () => {
    const result = await listCompGrants();
    expect(result).toMatchObject({ ok: true });
    const { grants } = result as { ok: true; grants: unknown[] };
    expect(grants).toHaveLength(1);
    expect(grants[0]).toMatchObject({
      id: "grant-1",
      parent_id: PARENT_UUID,
      parent_first_name: "Alex",
      parent_email: "parent@example.com",
      reason: "beta tester",
    });
  });

  it("does not expose billing identifiers or athlete PII in the response", async () => {
    const result = await listCompGrants();
    const { grants } = result as { ok: true; grants: Record<string, unknown>[] };
    for (const g of grants) {
      expect(g).not.toHaveProperty("stripe_customer_id");
      expect(g).not.toHaveProperty("price_id");
      expect(g).not.toHaveProperty("stripe_subscription_id");
      expect(g).not.toHaveProperty("athlete_id");
      expect(g).not.toHaveProperty("journal");
    }
  });

  it("returns empty grants array when no active grants exist", async () => {
    mockActiveGrants = [];
    const result = await listCompGrants();
    expect(result).toMatchObject({ ok: true, grants: [] });
  });
});
