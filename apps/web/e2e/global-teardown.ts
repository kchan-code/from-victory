/**
 * Playwright global-teardown.
 *
 * Runs once after the entire test suite. Deletes the test parent and any
 * athletes created during the run. Individual specs also clean up their own
 * athletes in afterEach, but this is a final safety sweep.
 */

// reason: unparameterised client matches ServiceClient in global-setup;
// the Database generic requires "server-only" types unavailable here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient } from "@supabase/supabase-js";

import { cleanupExistingTestParent } from "./global-setup";

async function globalTeardown(): Promise<void> {
  const supabaseUrl = process.env.E2E_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    // Env vars not present in teardown (e.g., CI step cleaned env).
    // Log and exit rather than throw — teardown failures shouldn't mask
    // the actual test results.
    console.warn(
      "[global-teardown] E2E_SUPABASE_URL or E2E_SUPABASE_SERVICE_ROLE_KEY " +
        "missing — skipping cleanup. Remove orphaned e2e-* rows manually if needed.",
    );
    return;
  }

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await cleanupExistingTestParent(service);
  console.log("[global-teardown] Cleanup complete.");
}

export default globalTeardown;
