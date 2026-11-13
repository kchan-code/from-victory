/**
 * Client-readable shape of `google_subscriptions` (FV-661, record 7.1).
 *
 * The migration grants the `authenticated` role column-level SELECT on exactly
 * these five columns. `select('*')` (or an unlisted column) fails at runtime
 * with Postgres 42501, so any client-facing read MUST pass
 * `GOOGLE_SUBSCRIPTION_CLIENT_COLUMNS` (or name the same columns) and type the
 * result as `GoogleSubscriptionClientRow`. A test scans the source tree for
 * `select('*')` against this table.
 *
 * No secrets here, so this file is safe to import from client code. It is NOT
 * `server-only` on purpose.
 */

import type { Database } from "@/lib/supabase/types";

export const GOOGLE_SUBSCRIPTION_CLIENT_COLUMNS =
  "product_id, base_plan_id, status, expires_at, auto_renewing" as const;

export type GoogleSubscriptionClientRow = Pick<
  Database["public"]["Tables"]["google_subscriptions"]["Row"],
  "product_id" | "base_plan_id" | "status" | "expires_at" | "auto_renewing"
>;
