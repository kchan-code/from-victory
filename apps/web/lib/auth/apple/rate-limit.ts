import "server-only";

import { getRequestIp, rateLimitGate } from "@/lib/actions/rate-limit-store";

/**
 * IP-keyed gate for the Apple endpoints, on the `apple_signin` and
 * `apple_handoff` buckets added by FV-671. An infrastructure failure fails
 * OPEN (logged, no identifiers), matching rateLimitGate's own rule.
 */
export async function appleRateLimited(
  bucket: "apple_signin" | "apple_handoff",
): Promise<boolean> {
  try {
    const ip = await getRequestIp();
    const { limited } = await rateLimitGate(bucket, ip);
    return limited;
  } catch {
    console.warn(`[apple-signin] rate-limit gate unavailable (bucket=${bucket}) - failing open`);
    return false;
  }
}
