import "server-only";

import { createHmac } from "crypto";
import { headers } from "next/headers";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isRateLimited,
  RATE_LIMIT_CONFIG,
  type RateLimitAction,
} from "@/lib/actions/rate-limit";

/**
 * Server-only I/O helper for auth/pairing rate limiting (FV-13).
 *
 * Privacy contract:
 *   - NEVER stores raw identifiers (IP, email, UUID) in the DB.
 *   - The `bucket` column in auth_rate_limit_events holds only the hex
 *     HMAC-SHA256 digest of "<action>:<identifier>", non-reversible without
 *     the RATE_LIMIT_HASH_SECRET.
 *   - If the identifier is null/empty (e.g. IP unavailable), we FAIL OPEN
 *     (allow the request) rather than lumping all unknown callers into a
 *     single bucket — that would mass-lock-out legitimate users.
 *
 * Operational contract:
 *   - Any DB error → FAIL OPEN (log + return not-limited). Rate limiting
 *     must never break auth for real users due to an infra hiccup.
 *   - RATE_LIMIT_HASH_SECRET unset in production → loud error log + fail open.
 *     In non-production, falls back to a documented dev constant so tests
 *     and local dev work without env config.
 *
 * Table self-pruning (inline TTL):
 *   After a successful NOT-limited insert, we opportunistically delete
 *   expired rows for this bucket. This bounds table size to
 *   approximately (limit × active-identifiers) rows — no cron required.
 */

// ---------------------------------------------------------------------------
// Dev fallback secret — documented, not secret, non-production only.
// ---------------------------------------------------------------------------

const DEV_FALLBACK_SECRET = "fv-rate-limit-dev-insecure-secret";

// ---------------------------------------------------------------------------
// rateLimitGate
// ---------------------------------------------------------------------------

/**
 * Check whether the given action+identifier is rate-limited, and insert
 * an event row if not.
 *
 * @param action      One of the five protected action keys.
 * @param identifier  The raw identifier to key on (email, IP, UUID). Will be
 *                    HMAC-digested before storage — never stored as-is.
 *                    If null or empty string, fails open (allows the request).
 * @returns           `{ limited: true }` if blocked; `{ limited: false }` otherwise.
 */
export async function rateLimitGate(
  action: RateLimitAction,
  identifier: string | null,
): Promise<{ limited: boolean }> {
  // Fail open on missing/empty identifier — lumping all unknown callers
  // into one bucket would cause mass lockouts on shared NATs or proxy IPs.
  if (!identifier) {
    console.warn(
      `[rate-limit-store.rateLimitGate] identifier is null/empty for action=${action} — failing open`,
    );
    return { limited: false };
  }

  // ---------------------------------------------------------------------------
  // Resolve HMAC secret
  // ---------------------------------------------------------------------------
  const secret = process.env.RATE_LIMIT_HASH_SECRET;
  let effectiveSecret: string;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // Loud error in prod — misconfiguration, not a user error.
      console.error(
        "[rate-limit-store.rateLimitGate] RATE_LIMIT_HASH_SECRET is not set in production — rate limiting is DISABLED (failing open). Set this env var immediately.",
      );
      deliverInBackground(notifyError(
        "[rate-limit] RATE_LIMIT_HASH_SECRET not set in production",
        "Rate limiting is disabled. All auth actions are failing open. Set RATE_LIMIT_HASH_SECRET in Vercel env vars.",
        { action },
      ));
      return { limited: false };
    }
    // Non-production (local dev, test): use documented fallback — not secret.
    effectiveSecret = DEV_FALLBACK_SECRET;
  } else {
    effectiveSecret = secret;
  }

  // ---------------------------------------------------------------------------
  // Derive bucket (domain-separated per action so the same identifier has
  // distinct digests for sign_in vs sign_up etc.)
  // ---------------------------------------------------------------------------
  const bucket = createHmac("sha256", effectiveSecret)
    .update(`${action}:${identifier}`)
    .digest("hex");

  const config = RATE_LIMIT_CONFIG[action];
  const windowMs = config.windowMinutes * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // ---------------------------------------------------------------------------
  // Count events in rolling window
  // ---------------------------------------------------------------------------
  let service: ReturnType<typeof createServiceClient>;
  try {
    service = createServiceClient();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[rate-limit-store.rateLimitGate] createServiceClient threw for action=${action}: ${message} — failing open`,
    );
    return { limited: false };
  }

  const { count, error: countError } = await service
    .from("auth_rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .eq("action", action)
    .gt("created_at", windowStart);

  if (countError) {
    console.error(
      `[rate-limit-store.rateLimitGate] count query failed for action=${action}: ${countError.message} — failing open`,
    );
    return { limited: false };
  }

  const limited = isRateLimited(count ?? 0, config.limit);

  if (limited) {
    // Do NOT insert a new row when already limited — the window is already
    // saturated and we don't want to extend it on every blocked attempt.
    return { limited: true };
  }

  // ---------------------------------------------------------------------------
  // Not limited: insert a new event row (best-effort).
  // ---------------------------------------------------------------------------
  const { error: insertError } = await service
    .from("auth_rate_limit_events")
    .insert({ bucket, action });

  if (insertError) {
    // Best-effort: log but don't block the request. The insert failing means
    // we undercount events, which is the safe-fail direction (under-limit =
    // allow).
    console.error(
      `[rate-limit-store.rateLimitGate] event insert failed for action=${action}: ${insertError.message} — proceeding`,
    );
  }

  // ---------------------------------------------------------------------------
  // Opportunistic prune: delete expired rows for this bucket so the table
  // self-bounds (inline TTL — no cron required). Best-effort; ignore errors.
  // ---------------------------------------------------------------------------
  const { error: pruneError } = await service
    .from("auth_rate_limit_events")
    .delete()
    .eq("bucket", bucket)
    .lte("created_at", windowStart);

  if (pruneError) {
    // Non-critical: expired rows simply accumulate a bit longer. Log at debug
    // level so it doesn't drown out real errors.
    console.warn(
      `[rate-limit-store.rateLimitGate] prune failed for action=${action}: ${pruneError.message} — rows will expire naturally on next prune`,
    );
  }

  return { limited: false };
}

// ---------------------------------------------------------------------------
// getRequestIp
// ---------------------------------------------------------------------------

/**
 * Extracts the best-available client IP from Next.js request headers.
 *
 * Vercel trust model:
 *   Vercel injects `x-real-ip` with the client's IP. `x-forwarded-for` is
 *   populated by Vercel's edge network and lists `client, proxy1, proxy2...`.
 *   Both can be spoofed when the app is accessed directly (bypassing Vercel's
 *   edge), so this is best-effort DoS blunting, NOT a sole security control.
 *   For auth hardening, Supabase Auth's own rate limiting is the backstop.
 *
 * @returns  The client IP string, or null if neither header is present.
 *           Callers must handle null by failing open (see rateLimitGate).
 */
export async function getRequestIp(): Promise<string | null> {
  const headerStore = headers();

  // Vercel sets x-real-ip as the canonical single-value client IP.
  const realIp = headerStore.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fall back to the first (leftmost) entry in x-forwarded-for, which is
  // the original client IP in the Vercel edge network model.
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }

  return null;
}
