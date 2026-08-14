#!/usr/bin/env node
// Google Play Console "App access" reviewer test account (Tier-2, KC-gated).
//
// Provisions ONE parent account + ONE linked 13-17 minor athlete account, and
// grants the parent a durable comp `access_grants` row so the account reads as
// fully entitled REGARDLESS of the ENFORCE_SUBSCRIPTION_GATING flag state —
// no Stripe checkout, no webhook, no `subscriptions` row required. This
// mirrors the exact mechanism already used to comp beta testers and to
// grandfather pre-enforcement parents (see docs/stripe-enforcement-comp.sql
// and apps/web/lib/actions/grants.ts / lib/subscriptions/grants.ts).
//
// WHY A SCRIPT AND NOT RAW SQL: creating a real Supabase Auth user (parent +
// athlete) MUST go through the Admin API (`auth.admin.createUser`). Hand-
// writing rows into `auth.users` is unsupported and unsafe — GoTrue owns the
// password hash format, `identities` rows, confirmation state machine, etc.
// This script uses `auth.admin.createUser({ email_confirm: true })`, which is
// the SAME call `createAthlete` (lib/actions/athletes.ts) already uses for
// every athlete in production — no confirmation email is ever sent, so this
// works with zero dependency on inbox access for either address. The
// `public.*` table writes below (profiles / parent_athlete_links /
// access_grants) are plain service-role inserts — see the companion
// docs/play-review-access-grant.sql for a SQL-only equivalent of the grant
// step alone (for KC to run directly in the Supabase SQL editor without
// touching auth.users).
//
// NEVER RUN THIS AGAINST PROD WITHOUT KC. This is a Tier-2, prod-user-data
// change (supabase/** class). KC executes (or explicitly approves someone
// else executing) this against the linked project.
//
// Usage (from apps/web/, Supabase project already linked — see
// reference_supabase-project memory for the ref):
//
//   node --experimental-strip-types scripts/provision-play-review-account.ts --dry-run
//   node --experimental-strip-types scripts/provision-play-review-account.ts
//
//   # Turn OFF the comp grant but leave both accounts intact (safe, reversible):
//   node --experimental-strip-types scripts/provision-play-review-account.ts --revoke-grant
//
//   # Full teardown — deletes BOTH accounts (auth.users cascade removes every
//   # row: profiles, parent_athlete_links, access_grants, athlete_sessions,
//   # journal_entries, safety_events). Same mechanism as deleteAccount()
//   # (lib/actions/account.ts). Irreversible.
//   node --experimental-strip-types scripts/provision-play-review-account.ts --teardown
//
// Requires apps/web/.env.local (or exported env) with:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (service role — never commit, never log)
//
// Idempotent: safe to re-run `provision` — it looks up the parent by email and
// the athlete by username before creating anything, and only inserts a fresh
// access_grants row if no active one already exists.
//
// Credentials block (what to type into Play Console's "App access" form) is
// reproduced in the PR / handoff notes that shipped this script — NOT printed
// in full by this script at runtime (stdout may end up in shell history /
// CI logs). The constants below ARE the source of truth for the values.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../lib/supabase/types.ts";

// ---------------------------------------------------------------------------
// Reviewer account constants — the credentials block.
//
// Passwords are intentionally static (not regenerated per run) because KC
// must transcribe them into the Play Console form once and have them keep
// working. Change here + re-run (idempotent) if they ever need rotating —
// re-running updates the password on the existing auth users via
// auth.admin.updateUserById, it does not create duplicates.
// ---------------------------------------------------------------------------

const PARENT_EMAIL = "play-review@fromvictoryapp.com";
const PARENT_PASSWORD = "FVReview-2026-Play!";
const PARENT_FIRST_NAME = "Alex";

// Mirrors lib/auth/athlete-email.ts ATHLETE_SYNTHETIC_EMAIL_DOMAIN. Kept as a
// literal here (not imported) because this script intentionally avoids
// pulling in "server-only"-guarded app modules (this runs under plain node,
// not the Next.js server runtime). Keep in sync if that constant ever moves.
const ATHLETE_SYNTHETIC_EMAIL_DOMAIN = "athletes.fromvictory.app";
const ATHLETE_USERNAME = "fvplayreview"; // any-device sign-in handle (FV-320); not "test" — reserved.
const ATHLETE_PASSWORD = "FVReview-2026-Athlete!";
const ATHLETE_FIRST_NAME = "Jordan";
// 13-17 minor floor. ~16 as of authoring (2026-08-14) — recompute if this
// script sits unrun for years; must stay >= 13 and < 18 (never backdate into
// the adult_athlete / 18+ path — that requires a different role + real email).
const ATHLETE_BIRTHDATE = "2010-06-01";
const ATHLETE_SPORT = "hockey"; // most content-complete launch sport — full 30-day catalog + pregame play library.

const GRANT_REASON =
  "Google Play Console reviewer account (App access form). Do not revoke " +
  "without confirming the Play review/appeal cycle is closed — see PR that " +
  "introduced this script for context.";

// ---------------------------------------------------------------------------
// Env loading (mirrors the tiny loader in generate-pregame-audio.ts — no
// dotenv dependency).
// ---------------------------------------------------------------------------

async function loadEnvLocal(): Promise<void> {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1] as string;
    if (key !== "NEXT_PUBLIC_SUPABASE_URL" && key !== "SUPABASE_SERVICE_ROLE_KEY") continue;
    let val = m[2] as string;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name} (set it in apps/web/.env.local or export it).`);
    process.exit(2);
  }
  return v;
}

type ServiceClient = SupabaseClient<Database>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function findAuthUserByEmail(service: ServiceClient, email: string) {
  // Mirrors resolveParentId() in lib/actions/grants.ts. perPage: 1000 is fine
  // at current + foreseeable prod user counts; revisit if that ever changes.
  const { data, error } = await service.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`auth.admin.listUsers failed: ${error.message}`);
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureParent(service: ServiceClient, dryRun: boolean): Promise<string> {
  const existingAuthUser = await findAuthUserByEmail(service, PARENT_EMAIL);

  let parentId: string;
  if (existingAuthUser) {
    parentId = existingAuthUser.id;
    console.log(`[parent] auth user already exists (id=${parentId}) — reusing.`);
    if (!dryRun) {
      const { error } = await service.auth.admin.updateUserById(parentId, { password: PARENT_PASSWORD });
      if (error) throw new Error(`auth.admin.updateUserById (parent) failed: ${error.message}`);
    }
  } else {
    console.log(`[parent] no existing auth user for ${PARENT_EMAIL}.`);
    if (dryRun) {
      console.log("[parent] (dry-run) would create auth user + profile.");
      return "dry-run-parent-id";
    }
    const { data, error } = await service.auth.admin.createUser({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
      email_confirm: true, // No confirmation email is ever sent — same call createAthlete() uses.
    });
    if (error || !data.user) throw new Error(`auth.admin.createUser (parent) failed: ${error?.message}`);
    parentId = data.user.id;
    console.log(`[parent] created auth user id=${parentId}.`);
  }

  if (dryRun) return parentId;

  // Idempotent profile upsert. Parent rows: birthdate must stay NULL
  // (birthdate_role_consistency); digest_opt_out=true keeps this inbox off
  // the weekly rhythm-digest send (this account has no real owner reading mail).
  const { data: existingProfile } = await service
    .from("profiles")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await service
      .from("profiles")
      .update({ role: "parent", first_name: PARENT_FIRST_NAME, digest_opt_out: true })
      .eq("id", parentId);
    if (error) throw new Error(`profiles update (parent) failed: ${error.message}`);
    console.log("[parent] profile row already existed — updated.");
  } else {
    const { error } = await service.from("profiles").insert({
      id: parentId,
      role: "parent",
      first_name: PARENT_FIRST_NAME,
      birthdate: null,
      digest_opt_out: true,
    });
    if (error) throw new Error(`profiles insert (parent) failed: ${error.message}`);
    console.log("[parent] profile row created.");
  }

  return parentId;
}

async function ensureAthlete(service: ServiceClient, dryRun: boolean): Promise<string> {
  const { data: existingByUsername, error: lookupError } = await service
    .from("profiles")
    .select("id")
    .eq("username", ATHLETE_USERNAME)
    .eq("role", "athlete")
    .maybeSingle();
  if (lookupError) throw new Error(`profiles lookup (athlete username) failed: ${lookupError.message}`);

  let athleteId: string;
  if (existingByUsername) {
    athleteId = existingByUsername.id;
    console.log(`[athlete] profile already exists for username=${ATHLETE_USERNAME} (id=${athleteId}) — reusing.`);
    if (!dryRun) {
      const { error } = await service.auth.admin.updateUserById(athleteId, { password: ATHLETE_PASSWORD });
      if (error) throw new Error(`auth.admin.updateUserById (athlete) failed: ${error.message}`);
    }
    return athleteId;
  }

  console.log(`[athlete] no existing profile for username=${ATHLETE_USERNAME}.`);
  if (dryRun) {
    console.log("[athlete] (dry-run) would create synthetic-email auth user + profile.");
    return "dry-run-athlete-id";
  }

  const syntheticEmail = `athlete-${randomUUID()}@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`;
  const { data, error } = await service.auth.admin.createUser({
    email: syntheticEmail,
    password: ATHLETE_PASSWORD,
    email_confirm: true, // synthetic address never receives mail regardless.
  });
  if (error || !data.user) throw new Error(`auth.admin.createUser (athlete) failed: ${error?.message}`);
  athleteId = data.user.id;
  console.log(`[athlete] created auth user id=${athleteId} (synthetic email, never real PII).`);

  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: ATHLETE_FIRST_NAME,
    birthdate: ATHLETE_BIRTHDATE,
    sport: ATHLETE_SPORT,
    // Pre-complete the first-run sport picker (FV-33) so the reviewer lands
    // straight on the Today hub with real training content, not the picker.
    sport_selected_at: new Date().toISOString(),
    created_as_adult_by_parent: false,
    username: ATHLETE_USERNAME,
  });
  if (profileError) {
    // Rollback the orphaned auth user, mirroring createAthlete()'s pattern.
    await service.auth.admin.deleteUser(athleteId);
    throw new Error(`profiles insert (athlete) failed (rolled back auth user): ${profileError.message}`);
  }
  console.log("[athlete] profile row created (role=athlete, 13-17 minor).");

  return athleteId;
}

async function ensureLink(service: ServiceClient, parentId: string, athleteId: string, dryRun: boolean) {
  if (dryRun) {
    console.log("[link] (dry-run) would ensure parent_athlete_links row.");
    return;
  }
  const { data: existing } = await service
    .from("parent_athlete_links")
    .select("parent_id")
    .eq("parent_id", parentId)
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (existing) {
    console.log("[link] parent_athlete_links row already exists.");
    return;
  }
  const { error } = await service.from("parent_athlete_links").insert({ parent_id: parentId, athlete_id: athleteId });
  if (error) throw new Error(`parent_athlete_links insert failed: ${error.message}`);
  console.log("[link] parent_athlete_links row created.");
}

async function ensureGrant(service: ServiceClient, parentId: string, dryRun: boolean) {
  if (dryRun) {
    console.log("[grant] (dry-run) would ensure an active access_grants row.");
    return;
  }
  const { data: activeGrants, error } = await service
    .from("access_grants")
    .select("id, expires_at")
    .eq("parent_id", parentId)
    .is("revoked_at", null);
  if (error) throw new Error(`access_grants lookup failed: ${error.message}`);

  const now = Date.now();
  const hasActive = (activeGrants ?? []).some(
    (g) => g.expires_at === null || new Date(g.expires_at).getTime() > now,
  );
  if (hasActive) {
    console.log("[grant] an active comp grant already exists — leaving it as-is.");
    return;
  }

  const { error: insertError } = await service.from("access_grants").insert({
    parent_id: parentId,
    granted_by: null,
    reason: GRANT_REASON,
    expires_at: null, // perpetual — see docs/play-review-access-grant.sql for the revoke path.
  });
  if (insertError) throw new Error(`access_grants insert failed: ${insertError.message}`);
  console.log("[grant] active comp grant created (perpetual — full access regardless of ENFORCE_SUBSCRIPTION_GATING).");
}

async function revokeGrant(service: ServiceClient, parentId: string) {
  const { data, error } = await service
    .from("access_grants")
    .update({ revoked_at: new Date().toISOString() })
    .eq("parent_id", parentId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(`access_grants revoke failed: ${error.message}`);
  console.log(`[grant] revoked ${data?.length ?? 0} active grant row(s) for parent=${parentId}. Both accounts are left intact.`);
}

async function teardown(service: ServiceClient, parentId: string, athleteId: string) {
  // Same cascade as deleteAccount()/deleteAthlete() in lib/actions/account.ts:
  // auth.admin.deleteUser cascades profiles -> parent_athlete_links,
  // access_grants, athlete_sessions -> journal_entries, safety_events.
  // Delete the athlete first (mirrors the app's own ordering) then the parent.
  if (athleteId !== "dry-run-athlete-id") {
    const { error } = await service.auth.admin.deleteUser(athleteId);
    if (error) console.error(`[teardown] athlete delete failed: ${error.message}`);
    else console.log(`[teardown] deleted athlete auth user + cascaded rows (id=${athleteId}).`);
  }
  if (parentId !== "dry-run-parent-id") {
    const { error } = await service.auth.admin.deleteUser(parentId);
    if (error) console.error(`[teardown] parent delete failed: ${error.message}`);
    else console.log(`[teardown] deleted parent auth user + cascaded rows (id=${parentId}).`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const revokeOnly = args.includes("--revoke-grant");
  const doTeardown = args.includes("--teardown");

  if ([dryRun, revokeOnly, doTeardown].filter(Boolean).length > 1) {
    console.error("Pass at most one of --dry-run, --revoke-grant, --teardown.");
    process.exit(2);
  }

  await loadEnvLocal();
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const service = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as ServiceClient;

  console.log(`[provision-play-review-account] target=${url} mode=${doTeardown ? "teardown" : revokeOnly ? "revoke-grant" : dryRun ? "dry-run" : "provision"}`);
  console.log("This is a Tier-2 prod-user-data operation — confirm with KC before running against prod.");

  if (revokeOnly) {
    const parentUser = await findAuthUserByEmail(service, PARENT_EMAIL);
    if (!parentUser) {
      console.log("[grant] no parent auth user found for that email — nothing to revoke.");
      return;
    }
    await revokeGrant(service, parentUser.id);
    return;
  }

  if (doTeardown) {
    const parentUser = await findAuthUserByEmail(service, PARENT_EMAIL);
    const { data: athleteProfile } = await service
      .from("profiles")
      .select("id")
      .eq("username", ATHLETE_USERNAME)
      .eq("role", "athlete")
      .maybeSingle();
    if (!parentUser && !athleteProfile) {
      console.log("[teardown] nothing found for this reviewer account — already clean.");
      return;
    }
    await teardown(service, parentUser?.id ?? "dry-run-parent-id", athleteProfile?.id ?? "dry-run-athlete-id");
    return;
  }

  const parentId = await ensureParent(service, dryRun);
  const athleteId = await ensureAthlete(service, dryRun);
  await ensureLink(service, parentId, athleteId, dryRun);
  await ensureGrant(service, parentId, dryRun);

  console.log("\nDone.");
  console.log(`Parent:  ${PARENT_EMAIL}  (id=${parentId})`);
  console.log(`Athlete: username=${ATHLETE_USERNAME}  (id=${athleteId})`);
  console.log("Passwords are the PARENT_PASSWORD / ATHLETE_PASSWORD constants at the top of this file.");
  console.log("See the PR / handoff notes for the transcribable Play Console credentials block.");
}

main().catch((err) => {
  console.error("[provision-play-review-account] FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
