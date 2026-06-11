// Namespace import so property access is live — vitest's vi.mock getter is
// consulted each call (not frozen at import time like a named binding).
import * as _vercel from "@vercel/functions";

/**
 * Register a fire-and-forget promise with the Vercel platform so it
 * survives the function freeze after the HTTP response is sent.
 *
 * Uses waitUntil (from @vercel/functions) when available; falls back to
 * void when the export is absent.
 *
 * Use this instead of `void notifyError(...)` or other fire-and-forget
 * sends so alert and notification emails reliably leave the building.
 */
export function deliverInBackground(promise: Promise<unknown>): void {
  const fn = (_vercel as { waitUntil?: (p: Promise<unknown>) => void }).waitUntil;
  if (typeof fn === "function") {
    fn(promise);
  } else {
    void promise.catch(() => {});
  }
}
