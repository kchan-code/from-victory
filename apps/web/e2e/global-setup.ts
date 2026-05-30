/**
 * Playwright global-setup.
 *
 * Runs once before the entire test suite. Responsibilities:
 *   1. REFUSE to run against the production Supabase project.
 *   2. Create a confirmed test parent account (service-role, bypasses email
 *      verification) and persist its storageState so specs start already
 *      signed in.
 *   3. Register a teardown that deletes the parent + all child athletes
 *      created during the run so the run is idempotent.
 *
 * All data created here is prefixed with "e2e-" so stray rows are
 * identifiable if cleanup ever fails mid-run.
 */

import fs from "fs";
import path from "path";

import { chromium, type FullConfig } from "@playwright/test";
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
  // 1. Clean up any leftover e2e parent from a previous interrupted run.
  // ------------------------------------------------------------------
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
  // 3. Sign in through the app UI and save storageState.
  //    Using the UI (not a direct Supabase token call) so the SSR cookie
  //    session is wired exactly as the app expects it.
  // ------------------------------------------------------------------
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/signin`);

  // Wait for the sign-in form.
  await page.waitForSelector('input[name="email"]');

  await page.fill('input[name="email"]', TEST_PARENT_EMAIL);
  await page.fill('input[name="password"]', TEST_PARENT_PASSWORD);
  await page.click('button[type="submit"]');

  // After sign-in the app redirects parents to /dashboard.
  await page.waitForURL("**/dashboard", { timeout: 15_000 });

  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();

  console.log("[global-setup] Test parent created and session saved.");
}

// ---------------------------------------------------------------------------
// Cleanup helper (also exported for use in global-teardown)
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

  // Delete each athlete's profile + auth user (cascade deletes the link).
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

export default globalSetup;
