import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

/**
 * Service-role Supabase client. BYPASSES RLS — server-side use only.
 *
 * Never import this file from a Client Component. The SUPABASE_SERVICE_ROLE_KEY
 * env var has no NEXT_PUBLIC_ prefix so it won't be bundled to the browser, but
 * a runtime guard below double-checks at invocation time.
 *
 * Allowed callers: server actions, route handlers, server-only utilities.
 */
export function createServiceClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createServiceClient must only be called server-side. The service-role key must never reach the browser.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for service-role operations.",
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
