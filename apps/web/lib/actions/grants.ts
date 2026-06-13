"use server";

/**
 * Admin server actions for comp/free access grants (FV-69).
 *
 * All actions are gated by requireAdminParent(). Non-admin callers are
 * rejected the same way as createAthleteDirect (notFound → 404, plus an
 * explicit return for server-action callers).
 *
 * Grant model:
 *   - grantCompAccess: insert a fresh active grant row. Re-granting an already-
 *     comped parent is ALLOWED — inserting a new row is correct because the
 *     reader checks for ANY active row. This keeps the logic simple and gives
 *     KC an audit trail of every grant issued.
 *   - revokeCompAccess: set revoked_at = now() on ALL active grants for the
 *     parent (handles the multi-grant case).
 *   - listCompGrants: return active grants joined to parent profile info
 *     (email from auth.users + first_name from profiles) for the admin page.
 *
 * Privacy:
 *   - These actions run server-side only and are only accessible to admin
 *     parents (ADMIN_EMAILS list).
 *   - listCompGrants returns parent email and first name for the admin UI —
 *     acceptable because the caller is KC / admin, not a parent or athlete.
 *   - No journal content, no athlete PII, no billing identifiers are returned.
 *   - granted_by is set to the calling admin's profile id (audit trail).
 */

import { z } from "zod";

import { requireAdminParent, isAdminEmail } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const GrantInputSchema = z
  .object({
    // Resolve parent by email OR by id — exactly one must be provided.
    parentEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid parent email.")
      .optional(),
    parentId: z
      .string()
      .uuid("parentId must be a valid UUID.")
      .optional(),
    reason: z
      .string()
      .trim()
      .min(1, "Reason is required.")
      .max(500, "Reason must be 500 characters or fewer."),
    // ISO 8601 string or null/undefined → perpetual grant.
    expiresAt: z
      .string()
      .datetime({ message: "expiresAt must be an ISO 8601 datetime string." })
      .nullable()
      .optional(),
  })
  .refine(
    (d) => d.parentEmail !== undefined || d.parentId !== undefined,
    { message: "Provide either parentEmail or parentId." },
  );

const RevokeInputSchema = z.object({
  parentId: z.string().uuid("parentId must be a valid UUID."),
});

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type GrantActionState =
  | { ok: true; grantId: string }
  | { ok: false; error: string; field?: string }
  | null;

export type RevokeActionState =
  | { ok: true; revokedCount: number }
  | { ok: false; error: string }
  | null;

export type CompGrantRow = {
  id: string;
  parent_id: string;
  parent_first_name: string;
  parent_email: string | null;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
};

export type ListGrantsState =
  | { ok: true; grants: CompGrantRow[] }
  | { ok: false; error: string }
  | null;

// ---------------------------------------------------------------------------
// Helper: resolve parent id from email
// ---------------------------------------------------------------------------

async function resolveParentId(
  service: ReturnType<typeof createServiceClient>,
  parentEmail: string,
): Promise<string | null> {
  // Look up the auth user by email via admin API, then confirm a parent profile.
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error("[grants] auth.admin.listUsers failed:", error.message);
    return null;
  }
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === parentEmail.toLowerCase(),
  );
  if (!user) return null;

  // Confirm the profile exists and has role = 'parent'.
  const { data: profile } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") return null;
  return profile.id;
}

// ---------------------------------------------------------------------------
// grantCompAccess
// ---------------------------------------------------------------------------

/**
 * Issues a comp grant for a parent account. Resolves the parent by email or
 * by id. Inserting a new grant row for an already-comped parent is intentional
 * — the reader checks for ANY active row, and multiple rows give KC an audit
 * trail of each grant issued.
 *
 * @param input.parentEmail  Resolve by email (mutually exclusive with parentId).
 * @param input.parentId     Resolve by UUID directly.
 * @param input.reason       Human-readable note for the audit record.
 * @param input.expiresAt    ISO 8601 expiry, or null/undefined for perpetual.
 */
export async function grantCompAccess(input: {
  parentEmail?: string;
  parentId?: string;
  reason: string;
  expiresAt?: string | null;
}): Promise<GrantActionState> {
  const { userId: adminId } = await requireAdminParent();

  // Belt-and-suspenders: confirm caller email is admin.
  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = GrantInputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const service = createServiceClient();

  // Resolve parent id.
  let resolvedParentId: string;
  if (parsed.data.parentId) {
    // Confirm it's a parent profile.
    const { data: profile } = await service
      .from("profiles")
      .select("id, role")
      .eq("id", parsed.data.parentId)
      .single();
    if (!profile || profile.role !== "parent") {
      return {
        ok: false,
        error: `No parent account found for id "${parsed.data.parentId}".`,
        field: "parentId",
      };
    }
    resolvedParentId = profile.id;
  } else {
    // parentEmail is guaranteed present by the refine above.
    const found = await resolveParentId(service, parsed.data.parentEmail!);
    if (!found) {
      return {
        ok: false,
        error: `No parent account found for email "${parsed.data.parentEmail}".`,
        field: "parentEmail",
      };
    }
    resolvedParentId = found;
  }

  const { data: grant, error: insertError } = await service
    .from("access_grants")
    .insert({
      parent_id: resolvedParentId,
      granted_by: adminId,
      reason: parsed.data.reason,
      expires_at: parsed.data.expiresAt ?? null,
    })
    .select("id")
    .single();

  if (insertError || !grant) {
    console.error("[grants.grantCompAccess] insert failed:", insertError?.message);
    return { ok: false, error: "Failed to create grant. Please try again." };
  }

  return { ok: true, grantId: grant.id };
}

// ---------------------------------------------------------------------------
// revokeCompAccess
// ---------------------------------------------------------------------------

/**
 * Revokes all active grants for a parent by setting revoked_at = now().
 * Returns the count of rows that were revoked (0 = parent had no active grant).
 *
 * @param input.parentId  UUID of the parent profile.
 */
export async function revokeCompAccess(input: {
  parentId: string;
}): Promise<RevokeActionState> {
  await requireAdminParent();

  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = RevokeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await service
    .from("access_grants")
    .update({ revoked_at: now })
    .eq("parent_id", parsed.data.parentId)
    .is("revoked_at", null)
    .select("id");

  if (error) {
    console.error("[grants.revokeCompAccess] update failed:", error.message);
    return { ok: false, error: "Failed to revoke grant. Please try again." };
  }

  return { ok: true, revokedCount: data?.length ?? 0 };
}

// ---------------------------------------------------------------------------
// listCompGrants
// ---------------------------------------------------------------------------

/**
 * Returns all currently active comp grants for the admin page, joined to
 * parent display info (email from auth.users + first_name from profiles).
 *
 * Callers: admin UI only. Never exposed to parent or athlete sessions.
 *
 * Implementation: two separate queries (access_grants + profiles) rather than
 * a PostgREST join select, to keep the TypeScript types simple and avoid
 * relationship-name coupling in the query string.
 */
export async function listCompGrants(): Promise<ListGrantsState> {
  await requireAdminParent();

  const userClient = createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return { ok: false, error: "Not authorized." };
  }

  const service = createServiceClient();

  // 1. Fetch active grants.
  const { data: grants, error: grantsError } = await service
    .from("access_grants")
    .select("id, parent_id, reason, expires_at, created_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (grantsError) {
    console.error("[grants.listCompGrants] select failed:", grantsError.message);
    return { ok: false, error: "Failed to load grants." };
  }

  // Drop expired-but-not-revoked grants so the console shows only truly-active
  // grants (matches the entitlement logic in hasActiveCompGrant).
  const now = Date.now();
  const activeGrants = (grants ?? []).filter(
    (g) => g.expires_at === null || new Date(g.expires_at).getTime() > now,
  );

  if (activeGrants.length === 0) {
    return { ok: true, grants: [] };
  }

  // 2. Fetch parent first_names for the grant parent_ids.
  const parentIds = [...new Set(activeGrants.map((g) => g.parent_id))];
  const { data: profiles, error: profilesError } = await service
    .from("profiles")
    .select("id, first_name")
    .in("id", parentIds);

  if (profilesError) {
    console.error("[grants.listCompGrants] profiles select failed:", profilesError.message);
    return { ok: false, error: "Failed to load parent names." };
  }

  // 3. Fetch auth user emails via admin API.
  const { data: authUsers, error: authError } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error("[grants.listCompGrants] listUsers failed:", authError.message);
    return { ok: false, error: "Failed to load parent emails." };
  }

  const firstNameById = new Map(
    (profiles ?? []).map((p) => [p.id, p.first_name]),
  );
  const emailByUserId = new Map(
    authUsers.users.map((u) => [u.id, u.email ?? null]),
  );

  const rows: CompGrantRow[] = activeGrants.map((g) => ({
    id: g.id,
    parent_id: g.parent_id,
    parent_first_name: firstNameById.get(g.parent_id) ?? "(unknown)",
    parent_email: emailByUserId.get(g.parent_id) ?? null,
    reason: g.reason,
    expires_at: g.expires_at,
    created_at: g.created_at,
  }));

  return { ok: true, grants: rows };
}
