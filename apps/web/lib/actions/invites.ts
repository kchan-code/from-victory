"use server";

import { z } from "zod";

import { validateUsername } from "@/lib/auth/athlete-username";
import { requireParent } from "@/lib/auth/guards";
import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";
import {
  INVITE_TTL_HOURS,
  RECOVERY_TTL_HOURS,
  normalizeInviteCode,
} from "@/lib/invites/code";
import { generateInviteCode, hashInviteCode } from "@/lib/invites/code-server";
import {
  INVITE_UNUSABLE_MESSAGE,
  completeInviteClaim,
} from "@/lib/invites/claim-core";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Athlete invitations + recovery server actions (FV-630).
 *
 *   createAthleteInvite — parent issues (or replaces) an athlete's code.
 *   checkInvite         — athlete/app looks up a code before setup.
 *   claimAthleteInvite  — athlete finishes setup (or resets a password) and
 *                         lands in /athlete signed in.
 *
 * Every public (unauthenticated) action rate-limits BEFORE any lookup.
 * Raw codes and their hashes are never logged.
 */

/**
 * Legacy pairing codes (FV-177): 24 random bytes → 32 base64url chars. Still
 * accepted by claimAthleteInvite until the last legacy link expires so a
 * /pair?code= link already sent keeps working.
 */
const LEGACY_PAIRING_CODE_RE = /^[A-Za-z0-9_-]{32}$/;

function hashSubmittedCode(raw: unknown): string | null {
  const readable = normalizeInviteCode(raw);
  if (readable) return hashInviteCode(readable);
  if (typeof raw === "string" && LEGACY_PAIRING_CODE_RE.test(raw)) {
    return hashInviteCode(raw);
  }
  return null;
}

const TOO_MANY = "Too many tries. Give it a few minutes, then try again.";

// ---------------------------------------------------------------------------
// Parent: create / replace
// ---------------------------------------------------------------------------

export type CreateInviteState =
  | {
      ok: true;
      /** Canonical 16-symbol code. Shown once; never persisted client-side. */
      code: string;
      purpose: "invite" | "recovery";
      expiresAt: string;
    }
  | { ok: false; error: string }
  | null;

const AthleteIdSchema = z.string().uuid();

export async function createAthleteInvite(
  _prev: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const parsedId = AthleteIdSchema.safeParse(formData.get("athlete_id"));
  if (!parsedId.success) {
    return { ok: false, error: "Missing athlete." };
  }
  const athleteId = parsedId.data;

  const { userId: parentId } = await requireParent();

  // Keyed on the verified parent id (non-spoofable). Same bucket and limit as
  // the legacy pairing generator it replaces.
  const { limited } = await rateLimitGate("generate_pairing_code", parentId);
  if (limited) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const code = generateInviteCode();
  const now = Date.now();
  const inviteExpiresAt = new Date(
    now + INVITE_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const recoveryExpiresAt = new Date(
    now + RECOVERY_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const service = createServiceClient();
  // One transaction: verify link, revoke every prior unconsumed code for the
  // athlete, insert this one. Purpose comes from the athlete's state.
  const { data, error } = await service.rpc("issue_athlete_invite", {
    p_parent_id: parentId,
    p_athlete_id: athleteId,
    p_code_sha256: hashInviteCode(code),
    p_invite_expires_at: inviteExpiresAt,
    p_recovery_expires_at: recoveryExpiresAt,
  });

  if (error) {
    if (error.code === "42501") {
      return { ok: false, error: "You can't invite this athlete." };
    }
    console.error(
      `[invites.create] issue rpc failed (parentId=${parentId} athleteId=${athleteId}): ${error.message} (code=${error.code ?? "n/a"})`,
    );
    return { ok: false, error: "Couldn't create a code. Try again." };
  }

  const issued = data?.[0];
  if (!issued) {
    console.error(
      `[invites.create] issue rpc returned no row (parentId=${parentId} athleteId=${athleteId})`,
    );
    return { ok: false, error: "Couldn't create a code. Try again." };
  }

  return {
    ok: true,
    code,
    purpose: issued.purpose,
    expiresAt: issued.expires_at,
  };
}

// ---------------------------------------------------------------------------
// Athlete: check a code
// ---------------------------------------------------------------------------

export type CheckInviteState =
  | {
      ok: true;
      code: string;
      firstName: string;
      mode: "invite" | "recovery";
      /** Only for recovery: the athlete's own, unchanged username. */
      username: string | null;
    }
  | { ok: false; error: string }
  | null;

export async function checkInvite(
  _prev: CheckInviteState,
  formData: FormData,
): Promise<CheckInviteState> {
  // Rate-limit FIRST — before any parsing-dependent branch or DB lookup.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("preview_invite", ip);
  if (limited) return { ok: false, error: TOO_MANY };

  const code = normalizeInviteCode(formData.get("code"));
  if (!code) {
    return {
      ok: false,
      error: "That code doesn't look right. It's 16 letters and numbers.",
    };
  }

  const service = createServiceClient();
  const { data: pairing, error: lookupError } = await service
    .from("device_pairings")
    .select("athlete_id")
    .eq("code_sha256", hashInviteCode(code))
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (lookupError) {
    console.error(`[invites.check] lookup failed: ${lookupError.message}`);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if (!pairing) return { ok: false, error: INVITE_UNUSABLE_MESSAGE };

  const { data: athlete, error: profileError } = await service
    .from("profiles")
    .select("first_name, username, role")
    .eq("id", pairing.athlete_id)
    .maybeSingle();

  if (profileError || !athlete || athlete.role !== "athlete") {
    return { ok: false, error: INVITE_UNUSABLE_MESSAGE };
  }

  const mode = athlete.username ? "recovery" : "invite";
  return {
    ok: true,
    code,
    firstName: athlete.first_name,
    mode,
    username: mode === "recovery" ? athlete.username : null,
  };
}

// ---------------------------------------------------------------------------
// Athlete: finish setup / reset password
// ---------------------------------------------------------------------------

export type ClaimInviteState =
  | { ok: false; error: string; field?: string; suggestions?: string[] }
  | null;

const ClaimSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password is too long."),
    password_confirm: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
  });

export async function claimAthleteInvite(
  _prev: ClaimInviteState,
  formData: FormData,
): Promise<ClaimInviteState> {
  // Rate-limit FIRST, before validation or the atomic claim, so a throttled
  // request can never burn a single-use code.
  const ip = await getRequestIp();
  const { limited } = await rateLimitGate("claim_pairing", ip);
  if (limited) return { ok: false, error: TOO_MANY };

  const codeHash = hashSubmittedCode(formData.get("code"));
  if (!codeHash) return { ok: false, error: INVITE_UNUSABLE_MESSAGE };

  const parsed = ClaimSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  // Username is only sent on first setup. Recovery forms omit it entirely;
  // the DB also ignores it whenever the athlete already has one.
  const rawUsername = formData.get("username");
  let username: string | null = null;
  if (typeof rawUsername === "string" && rawUsername.trim() !== "") {
    const result = validateUsername(rawUsername);
    if (!result.ok) {
      return { ok: false, error: result.error, field: "username" };
    }
    username = result.normalized;
  }

  return completeInviteClaim({
    codeHash,
    username,
    password: parsed.data.password,
  });
}
