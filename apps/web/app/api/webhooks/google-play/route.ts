/**
 * Google Play Real-time Developer Notifications webhook (FV-662, Play Billing
 * C4).
 *
 * POST /api/webhooks/google-play   (Cloud Pub/Sub PUSH delivery)
 *
 * The middleware matcher already excludes `api/webhooks` generically (pattern
 * `api/webhooks(?:/|$)`), so session middleware never touches this request and
 * no matcher change is needed. A test pins that.
 *
 * Security contract:
 *   - EVERY push is authenticated BEFORE the body is read: a Google-signed JWT
 *     in `Authorization: Bearer`, verified for signature, audience, issuer,
 *     `email` == the configured push service account, and `email_verified`.
 *     Missing config rejects (fail closed). See ./lib/subscriptions/google-play-auth.
 *   - The notification only names a purchase token. State always comes from a
 *     fresh read of Google (see lib/subscriptions/google-play-rtdn.ts).
 *   - No token, obfuscated id, payer id, JWT or message body is ever logged,
 *     alerted or echoed. Response bodies are static.
 *
 * Status codes (2xx = Pub/Sub is done; non-2xx = Pub/Sub redelivers):
 *   401  missing/invalid credential          403  wrong service account, unverified
 *                                                 email, or auth not configured
 *   200  dormant (flag off), applied, or an irrelevant/unparseable/unknown message
 *   503  the push verifier cannot work (library / signing certs unavailable; alerted),
 *        or Google / the acknowledge was transiently unavailable (retry)
 *   500  database or unexpected failure (retry)
 *
 * DORMANT: unless GOOGLE_PLAY_CATALOG_ACTIVE is exactly "1", the push is still
 * authenticated and answered 2xx, but nothing is read, no Google call and no
 * database call is made.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { isGooglePlayCatalogActive } from "@/lib/subscriptions/google-product-catalog";
import { verifyPubSubPush } from "@/lib/subscriptions/google-play-auth";
import { parseDeveloperNotification, processGoogleNotification } from "@/lib/subscriptions/google-play-rtdn";
import { GoogleDbError } from "@/lib/subscriptions/google-play-sync";

const MAX_BODY_CHARS = 100_000;

const EnvelopeSchema = z.looseObject({
  message: z.looseObject({ data: z.string().min(1) }),
});

const ok = () => NextResponse.json({ ok: true });
const fail = (status: number) => NextResponse.json({ ok: false }, { status });

export async function POST(req: NextRequest) {
  // 1. Authenticate FIRST. Nothing below runs, and the body is not read, for an
  //    unauthenticated request.
  const auth = await verifyPubSubPush(req.headers.get("authorization"));
  if (!auth.ok) {
    if (auth.reason === "verifier_unavailable") {
      // Not the sender's fault: every real push would fail until this is fixed.
      console.error("[google-play/webhook] push verifier unavailable.");
      deliverInBackground(
        notifyError(
          "[google-play-webhook] push verifier unavailable",
          "Cannot verify Google Play pushes (library or signing certificates unavailable); pushes are being refused with 503",
        ),
      );
    } else {
      console.warn(`[google-play/webhook] push rejected (${auth.reason}).`);
    }
    return fail(auth.status);
  }

  // 2. Dormant lock: authenticated, answered, otherwise inert.
  if (!isGooglePlayCatalogActive()) return ok();

  try {
    // 3. Parse. Anything unreadable from an authenticated push is permanent:
    //    2xx so Pub/Sub does not redeliver garbage forever.
    const text = await req.text();
    if (text.length === 0 || text.length > MAX_BODY_CHARS) return ok();
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      return ok();
    }
    const envelope = EnvelopeSchema.safeParse(raw);
    if (!envelope.success) return ok();

    const notification = parseDeveloperNotification(envelope.data.message.data);
    if (notification.kind === "ignored") {
      console.warn(`[google-play/webhook] message ignored (${notification.reason}).`);
      return ok();
    }

    // 4. Re-read from Google and write what it says.
    const outcome = await processGoogleNotification(notification);
    return outcome === "retry" ? fail(503) : ok();
  } catch (err) {
    // Static label + Postgres code only: a driver message can quote the token.
    const code = err instanceof GoogleDbError ? err.message : "unexpected";
    console.error(`[google-play/webhook] handler error (${code}).`);
    deliverInBackground(
      notifyError("[google-play-webhook] handler error", "A Google Play notification could not be processed; will retry", {
        error: code,
      }),
    );
    return fail(500);
  }
}
