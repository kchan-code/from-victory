import {
  redactClientErrorMessage,
  sanitizeRoute,
} from "@/lib/monitoring/client-error-report";

/**
 * Browser → POST /api/client-error (FV-729).
 *
 * Fire-and-forget. Never throws: the error screen still has to render.
 * The server re-validates the body. This sender only pre-shapes it so a
 * stack, query string, or email never leaves the device in the request body.
 *
 * No user id. No cookies are read here. `keepalive` so a reload still delivers.
 */

const BUILD_RE = /^[a-f0-9]{7,40}$/i;
const DIGEST_RE = /^[A-Za-z0-9_-]{1,80}$/;

export function reportClientError(input: {
  route: string;
  digest?: string;
  message?: string;
}): void {
  const route = sanitizeRoute(input.route);
  if (!route) return;

  const payload: Record<string, string> = { route };
  if (input.digest && DIGEST_RE.test(input.digest)) {
    payload.digest = input.digest;
  }
  const message = redactClientErrorMessage(input.message);
  if (message) payload.message = message;

  const build = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "";
  if (BUILD_RE.test(build)) payload.build = build.toLowerCase();

  try {
    void fetch("/api/client-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Reporting must not replace the error the athlete is already looking at.
  }
}
