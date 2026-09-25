/**
 * Playwright global-setup.
 *
 * Runs once before the entire test suite. Responsibilities:
 *   1. REFUSE to run against the production Supabase project.
 *   2. Create confirmed test parent accounts (service-role, bypasses email
 *      verification) — ONE PER parent-mutating project (see PARENT_FIXTURES,
 *      FV-583) — and persist each one's storageState so specs start already
 *      signed in without sharing a mutable athlete list across projects.
 *   3. Create a test athlete account linked to the PRIMARY parent
 *      (chromium-mobile-parent), claim it through the /pair browser flow,
 *      and persist athlete.storageState.json.
 *   4. Register a teardown that deletes every seeded parent + all child
 *      athletes created during the run so the run is idempotent.
 *
 * All data created here is prefixed with "e2e-" so stray rows are
 * identifiable if cleanup ever fails mid-run.
 */

import { createHash, randomBytes } from "crypto";
import fs from "fs";
import path from "path";

import {
  chromium,
  type Browser,
  type FullConfig,
  type Page,
} from "@playwright/test";
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
//
// FV-583: chromium-mobile-parent AND pixel7 both run multi-athlete.e2e.ts,
// which MUTATES the signed-in parent's athlete list. Historically both
// projects shared ONE seeded parent + storageState, so running them under
// parallel workers (the local default) raced: both added "E2E Alpha" to the
// SAME parent concurrently, producing a duplicate row and a Playwright
// strict-mode violation. Each parent-mutating project now gets its OWN
// seeded parent + storageState so their athlete lists never overlap, and
// both can safely run in parallel.
// ---------------------------------------------------------------------------

export interface ParentFixture {
  /** Playwright project name this fixture's storageState is wired to. */
  projectName: string;
  email: string;
  password: string;
  firstName: string;
  storageStatePath: string;
}

// Named individually (rather than accessed via array index) so TypeScript's
// noUncheckedIndexedAccess doesn't force `| undefined` on the back-compat
// aliases below.
const CHROMIUM_MOBILE_PARENT_FIXTURE: ParentFixture = {
  projectName: "chromium-mobile-parent",
  email: "e2e-parent@fromvictory.test",
  password: "e2e-TestParent-2024!",
  firstName: "E2E-Parent",
  storageStatePath: path.join(__dirname, ".auth", "parent.storageState.json"),
};

const PIXEL7_PARENT_FIXTURE: ParentFixture = {
  projectName: "pixel7",
  email: "e2e-parent+pixel7@fromvictory.test",
  password: "e2e-TestParent-2024!",
  firstName: "E2E-Parent-Pixel7",
  storageStatePath: path.join(
    __dirname,
    ".auth",
    "parent-pixel7.storageState.json",
  ),
};

export const PARENT_FIXTURES: ParentFixture[] = [
  CHROMIUM_MOBILE_PARENT_FIXTURE,
  PIXEL7_PARENT_FIXTURE,
];

// Back-compat aliases — the PRIMARY fixture (chromium-mobile-parent) is also
// the parent the seeded test athlete (chromium-mobile-athlete's
// storageState) is linked to, so other code that only needs "the" test
// parent can keep referring to these.
export const TEST_PARENT_EMAIL = CHROMIUM_MOBILE_PARENT_FIXTURE.email;
export const TEST_PARENT_PASSWORD = CHROMIUM_MOBILE_PARENT_FIXTURE.password;
export const TEST_PARENT_FIRST_NAME = CHROMIUM_MOBILE_PARENT_FIXTURE.firstName;
export const STORAGE_STATE_PATH =
  CHROMIUM_MOBILE_PARENT_FIXTURE.storageStatePath;

// ---------------------------------------------------------------------------
// Test-athlete credentials  (linked to the test parent)
// ---------------------------------------------------------------------------

// Synthetic email domain matches what lib/auth/athlete-email.ts defines so
// cleanup helpers that filter by domain work correctly.
export const TEST_ATHLETE_EMAIL =
  "e2e-athlete@athletes.fromvictory.app";
export const TEST_ATHLETE_PASSWORD = "e2e-TestAthlete-2024!";
// FV-320: the /pair claim form requires a username (3-20 chars, [a-z0-9_],
// not in RESERVED_USERNAMES). Deterministic so a re-claim after an
// interrupted run resolves to the same athlete instead of a "taken" error.
export const TEST_ATHLETE_USERNAME = "e2e_athlete";
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
  for (const fixture of PARENT_FIXTURES) {
    await cleanupExistingTestParent(service, fixture.email);
  }

  // ------------------------------------------------------------------
  // 2. Create + sign in EACH seeded parent (one per parent-mutating
  //    project — see PARENT_FIXTURES above for why).
  // ------------------------------------------------------------------
  fs.mkdirSync(path.join(__dirname, ".auth"), { recursive: true });

  const browser = await chromium.launch();
  let primaryParentId: string | null = null;

  try {
    for (const fixture of PARENT_FIXTURES) {
      const parentId = await createAndSignInParent(
        service,
        browser,
        baseUrl,
        fixture,
      );
      if (fixture.email === TEST_PARENT_EMAIL) {
        primaryParentId = parentId;
      }
    }

    if (!primaryParentId) {
      throw new Error(
        "[global-setup] Primary parent fixture (chromium-mobile-parent) was not seeded.",
      );
    }

    // ------------------------------------------------------------------
    // 3. Provision test athlete (linked to the PRIMARY parent only) and
    //    save athlete storageState.
    // ------------------------------------------------------------------
    await provisionTestAthlete(service, primaryParentId, browser, baseUrl);
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// Parent provisioner
//
// Creates one seeded parent (auth user + profile), signs in through the real
// /signin UI flow, and persists that fixture's storageState. Returns the new
// parent's id.
// ---------------------------------------------------------------------------

async function createAndSignInParent(
  service: ServiceClient,
  browser: Browser,
  baseUrl: string,
  fixture: ParentFixture,
): Promise<string> {
  // Create the test parent via auth.admin.createUser so the email is
  // pre-confirmed — no inbox required.
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: fixture.email,
      password: fixture.password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    throw new Error(
      `[global-setup] Failed to create test parent (${fixture.projectName}): ${createError?.message ?? "unknown error"}`,
    );
  }

  const parentId = created.user.id;

  // Insert the profile row (mirrors what the app's signup action does).
  const { error: profileError } = await service.from("profiles").insert({
    id: parentId,
    role: "parent",
    first_name: fixture.firstName,
  });

  if (profileError) {
    // Roll back the auth user so the DB stays clean.
    await service.auth.admin.deleteUser(parentId);
    throw new Error(
      `[global-setup] Failed to insert parent profile (${fixture.projectName}): ${profileError.message}`,
    );
  }

  // Sign in through the app UI and save this fixture's storageState.
  // Using the UI (not a direct Supabase token call) so the SSR cookie
  // session is wired exactly as the app expects it.
  const parentPage = await browser.newPage();

  try {
    await parentPage.goto(`${baseUrl}/signin`);
    await parentPage.waitForSelector('input[name="email"]');

    await parentPage.fill('input[name="email"]', fixture.email);
    await parentPage.fill('input[name="password"]', fixture.password);
    await parentPage.click('button[type="submit"]');

    // After sign-in the app redirects parents to /dashboard.
    await parentPage.waitForURL("**/dashboard", { timeout: 15_000 });

    await parentPage
      .context()
      .storageState({ path: fixture.storageStatePath });
  } finally {
    await parentPage.close();
  }

  console.log(
    `[global-setup] Test parent created and session saved (${fixture.projectName}).`,
  );

  return parentId;
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

  // 4. Insert a one-time pairing code. 24h here is just a comfortably-unexpired
  //    fixture window — production TTL is 7 days (PAIRING_TTL_HOURS) and this
  //    does not need to match it.
  const code = randomBytes(24).toString("base64url");
  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString();

  // FV-177: device_pairings stores sha256(code), not the plaintext code. Mirror
  // the app's hashPairingCode (createHash sha256 hex). The raw code still goes in
  // the /pair URL below; the page hashes it and looks up by code_sha256.
  const codeSha256 = createHash("sha256").update(code).digest("hex");
  const { error: pairingError } = await service
    .from("device_pairings")
    .insert({
      code_sha256: codeSha256,
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

    await page.fill('input[name="username"]', TEST_ATHLETE_USERNAME);
    await page.fill('input[name="password"]', TEST_ATHLETE_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_ATHLETE_PASSWORD);
    await page.click('button[type="submit"]');

    // claimPairing redirects to /athlete on success (may further redirect to
    // /athlete/today or similar — the regex matches any /athlete* URL).
    //
    // FV-508: race the redirect against the form's own error rendering. When
    // the claim action rejects the submission (a new required field, a
    // validation-message change, a burned code), the page stays on /pair and
    // a bare waitForURL only ever reports "Timeout 15000ms exceeded" — which
    // is exactly how the FV-320 username regression hid for months. Surfacing
    // the alert text turns that into a one-line diagnosis.
    await waitForClaimRedirect(page);

    await context.storageState({ path: ATHLETE_STORAGE_STATE_PATH });

    console.log("[global-setup] Test athlete created and session saved.");
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Claim-redirect waiter
// ---------------------------------------------------------------------------

/**
 * Waits for the /pair claim to redirect to /athlete…, but fails FAST with the
 * form's own error text if the claim action rejects the submission instead.
 *
 * Both field errors (components/auth/Field.tsx) and the form-level error
 * (AthleteClaimForm.tsx) render with role="alert"; #__next-route-announcer__
 * is Next.js's always-present live region and is excluded.
 */
async function waitForClaimRedirect(page: Page): Promise<void> {
  const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');

  const redirected = page
    .waitForURL(/\/athlete/, { timeout: 15_000 })
    .then(() => "redirected" as const);
  const rejected = alert
    .first()
    .waitFor({ state: "visible", timeout: 15_000 })
    .then(() => "rejected" as const);

  // Whichever settles first wins; the loser's rejection is swallowed so it
  // can't surface as an unhandled rejection after we've already thrown.
  const outcome = await Promise.race([redirected, rejected]).catch(
    (err: unknown) => {
      throw new Error(
        `[global-setup] /pair claim neither redirected to /athlete nor ` +
          `rendered an error within 15s (still on ${page.url()}). ` +
          `Original: ${err instanceof Error ? err.message : String(err)}`,
      );
    },
  );
  void redirected.catch(() => {});
  void rejected.catch(() => {});

  if (outcome === "rejected") {
    const messages = (await alert.allInnerTexts()).map((t) => t.trim());
    throw new Error(
      `[global-setup] /pair claim was rejected by the app (still on ` +
        `${page.url()}): ${messages.join(" | ")}. ` +
        `If the claim form gained a field, update provisionTestAthlete.`,
    );
  }
}

// ---------------------------------------------------------------------------
// Cleanup helpers (also exported for use in global-teardown)
// ---------------------------------------------------------------------------

export async function cleanupExistingTestParent(
  service: ServiceClient,
  email: string,
): Promise<void> {
  // Find the parent by email.
  const { data: users } = await service.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === email);
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
