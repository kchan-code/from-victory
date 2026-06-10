/**
 * Playwright global-setup.
 *
 * Runs once before the entire test suite. Responsibilities:
 *   1. REFUSE to run against the production Supabase project.
 *   2. Create a confirmed test parent account (service-role, bypasses email
 *      verification) and persist its storageState so specs start already
 *      signed in.
 *   3. Create a test athlete account linked to the parent, claim it through
 *      the /pair browser flow, and persist athlete.storageState.json.
 *   4. Register a teardown that deletes the parent + all child athletes
 *      created during the run so the run is idempotent.
 *
 * All data created here is prefixed with "e2e-" so stray rows are
 * identifiable if cleanup ever fails mid-run.
 */

import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

import { chromium, type Browser, type FullConfig } from "@playwright/test";
import {
  createClient,
  type SupabaseClient as _SupabaseClient,
} from "@supabase/supabase-js";

// Unparameterised client type used by setup/teardown. The Database generic
// is only available via the generated app types (lib/supabase/types.ts), which
// import "server-only" and therefore can't be used here outside Next.js.
// We use `any` for the schema shape and cast query results explicitly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = _SupabaseClient<any, any, any>;

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[global-setup] Required env var "${name}" is not set.\n` +
        `Copy apps/web/.env.test.example → apps/web/.env.test and fill it in.`,
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Prod-guard — hard block if targeting the live project.
// ---------------------------------------------------------------------------

const PROD_REF = "kumrgeosgzdlxgljbyju";

export function assertNotProd(supabaseUrl: string): void {
  if (supabaseUrl.includes(PROD_REF)) {
    throw new Error(
      `[global-setup] REFUSED: E2E_SUPABASE_URL points at the PRODUCTION ` +
        `Supabase project (ref ${PROD_REF}). ` +
        `Set E2E_SUPABASE_URL to your local stack (http://127.0.0.1:54321) ` +
        `or a dedicated test project. Tests must never mutate production data.`,
    );
  }

  // Also refuse if the URL looks like it could be the prod project at any
  // Supabase-hosted domain.
  const url = new URL(supabaseUrl);
  if (
    url.hostname.endsWith(".supabase.co") &&
    !url.hostname.startsWith("127.") &&
    !url.hostname.startsWith("localhost")
  ) {
    throw new Error(
      `[global-setup] REFUSED: E2E_SUPABASE_URL appears to target a remote ` +
        `Supabase project (${url.hostname}). ` +
        `E2E tests are only permitted against a local Supabase stack or an ` +
        `explicit isolated test project. Set the URL to http://127.0.0.1:54321 ` +
        `for local runs, or to a test project URL and acknowledge it is ` +
        `isolated from production data.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Test-parent credentials  (deterministic so they can be cleaned up reliably)
// ---------------------------------------------------------------------------

export const TEST_PARENT_EMAIL = "e2e-parent@fromvictory.test";
export const TEST_PARENT_PASSWORD = "e2e-TestParent-2024!";
export const TEST_PARENT_FIRST_NAME = "E2E-Parent";

export const STORAGE_STATE_PATH = path.join(
  __dirname,
  ".auth",
  "parent.storageState.json",
);

// ---------------------------------------------------------------------------
// Test-athlete credentials  (linked to the test parent)
// ---------------------------------------------------------------------------

// Synthetic email domain matches what lib/auth/athlete-email.ts defines so
// cleanup helpers that filter by domain work correctly.
export const TEST_ATHLETE_EMAIL =
  "e2e-athlete@athletes.fromvictory.app";
export const TEST_ATHLETE_PASSWORD = "e2e-TestAthlete-2024!";
export const TEST_ATHLETE_FIRST_NAME = "E2E-Athlete";
const TEST_ATHLETE_BIRTHDATE = "2007-06-15"; // ~18 y/o — safely above 13+ floor

export const ATHLETE_STORAGE_STATE_PATH = path.join(
  __dirname,
  ".auth",
  "athlete.storageState.json",
);

// ---------------------------------------------------------------------------
// Global setup entry point
// ---------------------------------------------------------------------------

async function globalSetup(_config: FullConfig): Promise<void> {
  const supabaseUrl = requireEnv("E2E_SUPABASE_URL");
  const serviceRoleKey = requireEnv("E2E_SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = requireEnv("E2E_SUPABASE_ANON_KEY");
  const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

  assertNotProd(supabaseUrl);

  // Set env vars for the app server so it uses the test Supabase project.
  // `webServer` in playwright.config.ts inherits process.env, so these take
  // effect before the Next.js process starts.
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ------------------------------------------------------------------
  // 1. Clean up any leftover e2e data from a previous interrupted run.
  // ------------------------------------------------------------------
  await cleanupExistingTestAthlete(service);
  await cleanupExistingTestParent(service);

  // ------------------------------------------------------------------
  // 2. Create the test parent via auth.admin.createUser so the email is
  //    pre-confirmed — no inbox required.
  // ------------------------------------------------------------------
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: TEST_PARENT_EMAIL,
      password: TEST_PARENT_PASSWORD,
      email_confirm: true,
    });

  if (createError || !created.user) {
    throw new Error(
      `[global-setup] Failed to create test parent: ${createError?.message ?? "unknown error"}`,
    );
  }

  const parentId = created.user.id;

  // Insert the profile row (mirrors what the app's signup action does).
  const { error: profileError } = await service.from("profiles").insert({
    id: parentId,
    role: "parent",
    first_name: TEST_PARENT_FIRST_NAME,
  });

  if (profileError) {
    // Roll back the auth user so the DB stays clean.
    await service.auth.admin.deleteUser(parentId);
    throw new Error(
      `[global-setup] Failed to insert parent profile: ${profileError.message}`,
    );
  }

  // ------------------------------------------------------------------
  // 3. Sign in through the app UI and save parent storageState.
  //    Using the UI (not a direct Supabase token call) so the SSR cookie
  //    session is wired exactly as the app expects it.
  // ------------------------------------------------------------------
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();

  try {
    const parentPage = await browser.newPage();

    await parentPage.goto(`${baseUrl}/signin`);
    await parentPage.waitForSelector('input[name="email"]');

    await parentPage.fill('input[name="email"]', TEST_PARENT_EMAIL);
    await parentPage.fill('input[name="password"]', TEST_PARENT_PASSWORD);
    await parentPage.click('button[type="submit"]');

    // After sign-in the app redirects parents to /dashboard.
    await parentPage.waitForURL("**/dashboard", { timeout: 15_000 });

    await parentPage.context().storageState({ path: STORAGE_STATE_PATH });
    await parentPage.close();

    console.log("[global-setup] Test parent created and session saved.");

    // ------------------------------------------------------------------
    // 4. Provision test athlete and save athlete storageState.
    // ------------------------------------------------------------------
    await provisionTestAthlete(service, parentId, browser, baseUrl);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Athlete provisioner
//
// Creates the athlete auth user + profile + parent link, generates a
// one-time pairing code, then drives the /pair browser flow so the SSR
// session cookies and device cookie are written correctly — mirroring the
// real user path rather than bypassing it with direct token injection.
// ---------------------------------------------------------------------------

async function provisionTestAthlete(
  service: ServiceClient,
  parentId: string,
  browser: Browser,
  baseUrl: string,
): Promise<void> {
  // 1. Create athlete auth user (email pre-confirmed; initial password is a
  //    throwaway — claimPairing overwrites it with TEST_ATHLETE_PASSWORD).
  const tempPassword = randomBytes(24).toString("base64url");
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: TEST_ATHLETE_EMAIL,
      password: tempPassword,
      email_confirm: true,
    });

  if (createError || !created.user) {
    throw new Error(
      `[global-setup] Failed to create test athlete: ${createError?.message ?? "unknown error"}`,
    );
  }
  const athleteId = created.user.id;

  // 2. Insert athlete profile (mirrors createAthlete server action).
  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: TEST_ATHLETE_FIRST_NAME,
    birthdate: TEST_ATHLETE_BIRTHDATE,
    sport: "hockey",
    // Required: practice page (and /athlete) guard on sport_selected_at IS NULL
    // and redirects to /athlete/onboarding/sport if not set.
    sport_selected_at: new Date().toISOString(),
  });

  if (profileError) {
    await service.auth.admin.deleteUser(athleteId);
    throw new Error(
      `[global-setup] Failed to insert athlete profile: ${profileError.message}`,
    );
  }

  // 3. Link athlete to the test parent (required before device_pairings
  //    insert — the trigger checks created_by → parent_athlete_links).
  const { error: linkError } = await service
    .from("parent_athlete_links")
    .insert({ parent_id: parentId, athlete_id: athleteId });

  if (linkError) {
    await service.from("profiles").delete().eq("id", athleteId);
    await service.auth.admin.deleteUser(athleteId);
    throw new Error(
      `[global-setup] Failed to link test athlete to parent: ${linkError.message}`,
    );
  }

  // 4. Insert a one-time pairing code (24-hour TTL matches production default).
  const code = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: pairingError } = await service
    .from("device_pairings")
    .insert({
      code,
      athlete_id: athleteId,
      created_by: parentId,
      expires_at: expiresAt,
    });

  if (pairingError) {
    await service.from("profiles").delete().eq("id", athleteId);
    await service.auth.admin.deleteUser(athleteId);
    throw new Error(
      `[global-setup] Failed to insert test pairing code: ${pairingError.message}`,
    );
  }

  // 5. Claim the pairing code through the real browser flow.
  //    This runs the full claimPairing server action, which:
  //      - atomically consumes the code
  //      - updates the athlete's password to TEST_ATHLETE_PASSWORD
  //      - sets the fv_device_athlete_id cookie
  //      - calls signInWithPassword → sets Supabase session cookies
  //      - redirects to /athlete
  //
  //    A fresh context keeps the athlete session isolated from the parent.
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/pair?code=${code}`);

    // Wait for the claim form to be interactive.
    await page.waitForSelector('input[name="password"]', { timeout: 15_000 });

    await page.fill('input[name="password"]', TEST_ATHLETE_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_ATHLETE_PASSWORD);
    await page.click('button[type="submit"]');

    // claimPairing redirects to /athlete on success (may further redirect to
    // /athlete/today or similar — the regex matches any /athlete* URL).
    await page.waitForURL(/\/athlete/, { timeout: 15_000 });

    await context.storageState({ path: ATHLETE_STORAGE_STATE_PATH });

    console.log("[global-setup] Test athlete created and session saved.");
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Cleanup helpers (also exported for use in global-teardown)
// ---------------------------------------------------------------------------

export async function cleanupExistingTestParent(
  service: ServiceClient,
): Promise<void> {
  // Find the parent by email.
  const { data: users } = await service.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === TEST_PARENT_EMAIL);
  if (!existing) return;

  const parentId = existing.id;

  // Find all athletes linked to this parent.
  // Cast to a typed array because the unparameterised client returns `never[]`.
  const { data: linksRaw } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId);

  const links = (linksRaw ?? []) as Array<{ athlete_id: string }>;
  const athleteIds = links.map((l) => l.athlete_id);

  // Delete each athlete's profile + auth user.
  // device_pairings rows cascade-delete via the ON DELETE CASCADE FK on
  // athlete_id, so no explicit cleanup needed there.
  for (const athleteId of athleteIds) {
    await service.from("profiles").delete().eq("id", athleteId);
    await service.auth.admin.deleteUser(athleteId);
  }

  // Delete the parent profile then auth user.
  await service.from("profiles").delete().eq("id", parentId);
  await service.auth.admin.deleteUser(parentId);

  console.log(
    `[global-setup] Cleaned up test parent ${parentId} + ${athleteIds.length} athlete(s).`,
  );
}

/**
 * Standalone cleanup for the test athlete by email.
 *
 * Handles the edge case where the athlete was created but the parent
 * creation or link step failed, leaving an orphaned athlete row that
 * cleanupExistingTestParent would miss (it finds athletes via parent_athlete_links).
 */
export async function cleanupExistingTestAthlete(
  service: ServiceClient,
): Promise<void> {
  const { data: users } = await service.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === TEST_ATHLETE_EMAIL);
  if (!existing) return;

  const athleteId = existing.id;
  await service.from("profiles").delete().eq("id", athleteId);
  await service.auth.admin.deleteUser(athleteId);

  console.log(`[global-setup] Cleaned up orphaned test athlete ${athleteId}.`);
}

export default globalSetup;
