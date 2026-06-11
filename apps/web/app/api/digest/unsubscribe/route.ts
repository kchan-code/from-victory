/**
 * Unsubscribe route: GET /api/digest/unsubscribe?token=<uuid>
 *
 * One-click unsubscribe link embedded in every weekly digest email. The
 * token is a UUID stored in profiles.digest_unsubscribe_token — it is
 * opaque, not derivable from public data, and treated as a secret.
 *
 * On success: redirects to /dashboard/settings?unsubscribed=1 if the
 * parent is signed in; otherwise renders a minimal HTML confirmation page
 * (the parent clicked an email link and may not be signed in).
 *
 * On failure: redirects / renders an error message — never leaks the
 * reason beyond "link is invalid or expired."
 *
 * This route does NOT require authentication (the email link is the auth
 * mechanism — token ownership proves consent). The token lookup is
 * service-role because there is no session.
 *
 * Middleware note: /api/digest/unsubscribe is NOT in the webhook exclusion
 * list. Session-refresh middleware will run (harmless — finds no cookie).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { processUnsubscribeToken } from "@/lib/actions/digest-preferences";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return htmlResponse(
      "Missing unsubscribe token. The link may be invalid or expired.",
      400,
    );
  }

  const result = await processUnsubscribeToken(token);

  if (!result.ok) {
    const msg =
      result.reason === "invalid_token"
        ? "This unsubscribe link is invalid or has already been used."
        : "Something went wrong. Please try again or update your preferences in Settings.";
    return htmlResponse(msg, 400);
  }

  return htmlResponse(
    `You've been unsubscribed from weekly emails, ${escHtml(result.firstName)}. You can re-enable them any time in your account settings.`,
    200,
    true,
  );
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlResponse(message: string, status: number, success = false): NextResponse {
  const color = success ? "#c9a84c" : "#e74c3c";
  const title = success ? "Unsubscribed" : "Unsubscribe failed";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} · From Victory</title>
  <style>
    body { margin: 0; padding: 40px 16px; background: #111; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f5e9c8; }
    .wrap { max-width: 480px; margin: 0 auto; }
    h1 { margin: 0 0 12px; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; color: ${color}; }
    p { margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #ccc; }
    a { color: #c9a84c; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${title}</h1>
    <p>${escHtml(message)}</p>
    <p><a href="/dashboard/settings">Go to account settings</a></p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
