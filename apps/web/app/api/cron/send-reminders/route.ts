/**
 * Vercel Cron — /api/cron/send-reminders
 *
 * Fires at the top of every hour (schedule: "0 * * * *" in vercel.json).
 * Fetches push_subscriptions rows whose athlete's current local hour matches
 * their reminder_hour and that have not been notified today, then sends a Web
 * Push notification to each.
 *
 * Security:
 *   - CRON_SECRET Bearer token must match. Vercel injects this header when
 *     invoking the cron. Without it the route returns 401.
 *   - VAPID keys must be configured. Missing keys return 500.
 *   - Service-role client bypasses RLS (intentional — this is a server-only
 *     background job, not a user-initiated action).
 *
 * Privacy contract:
 *   - NEVER log endpoint URLs, p256dh, auth, or any athlete identifier.
 *     Counts (sent, pruned, failed) are the only output.
 *   - Dead endpoints (404/410) are pruned immediately via service-role delete.
 *     No retry queue, no DLQ, no re-engagement logic.
 *   - No open/click tracking. last_sent_on is the only state written back.
 *
 * Vercel Pro note: hourly crons ("0 * * * *") require Vercel Pro or Enterprise.
 * Hobby plan supports at most one invocation per day. KC must confirm plan tier
 * before relying on hourly delivery.
 */

export const runtime = "nodejs"; // web-push requires Node.js crypto
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import webpush from "web-push";

import { createServiceClient } from "@/lib/supabase/service";

// ---------------------------------------------------------------------------
// Notification copy
//
// Content-curator can swap this in ONE place. Keep under 120 chars for body
// to avoid truncation on Android lock screens.
// ---------------------------------------------------------------------------

const REMINDER_COPY = {
  title: "Time to train",
  body: "A few minutes for your mind today. Your training is ready when you are.",
} as const;

// ---------------------------------------------------------------------------
// GET handler (Vercel Cron issues GET requests)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // 1. Auth: Bearer CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error(
      "[cron/send-reminders] CRON_SECRET is not configured. " +
        "Set this env var and redeploy.",
    );
    return NextResponse.json(
      { error: "Cron secret not configured." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 2. VAPID guard
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error(
      "[cron/send-reminders] VAPID keys are not configured. " +
        "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY and redeploy.",
    );
    return NextResponse.json(
      { error: "VAPID keys not configured." },
      { status: 500 },
    );
  }

  // 3. Configure VAPID (idempotent — safe to call on every invocation)
  webpush.setVapidDetails(
    "mailto:privacy@fromvictoryapp.com",
    vapidPublicKey,
    vapidPrivateKey,
  );

  // 4. Fetch due rows via the SECURITY DEFINER RPC
  //    due_push_reminders() returns rows where local hour = reminder_hour AND
  //    last_sent_on ≠ today in their tz. Execute is revoked from client roles.
  const service = createServiceClient();
  const { data: dueRows, error: fetchError } = await service.rpc(
    "due_push_reminders",
  );

  if (fetchError) {
    console.error(
      "[cron/send-reminders] due_push_reminders() RPC failed:",
      fetchError.message,
    );
    return NextResponse.json(
      { error: "Failed to fetch due reminders." },
      { status: 500 },
    );
  }

  if (!dueRows || dueRows.length === 0) {
    return NextResponse.json({ sent: 0, pruned: 0, failed: 0 });
  }

  // 5. Send notifications — fire-and-forget via Promise.allSettled
  const payload = JSON.stringify({
    title: REMINDER_COPY.title,
    body: REMINDER_COPY.body,
    url: "/athlete",
  });

  let sent = 0;
  let pruned = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    dueRows.map((row) =>
      webpush
        .sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          payload,
        )
        .then(async () => {
          // Success: stamp last_sent_on as today in the athlete's tz.
          // Date in their local timezone (date-only, no time component).
          const todayInTz = new Date()
            .toLocaleDateString("en-CA", { timeZone: row.timezone }); // YYYY-MM-DD
          const { error: updateError } = await service
            .from("push_subscriptions")
            .update({ last_sent_on: todayInTz })
            .eq("athlete_id", row.athlete_id);

          if (updateError) {
            // Log the count impact only — no athlete_id or endpoint.
            console.error(
              "[cron/send-reminders] last_sent_on update failed:",
              updateError.message,
            );
            // Still counts as sent (push was delivered); update failure is
            // recoverable — worst case the athlete gets a second notification
            // in the same hour. Log and continue.
          }
          return "sent" as const;
        })
        .catch(async (err: unknown) => {
          // Dead endpoint: 404 or 410. Prune the row.
          const statusCode =
            err instanceof webpush.WebPushError ? err.statusCode : null;

          if (statusCode === 404 || statusCode === 410) {
            const { error: deleteError } = await service
              .from("push_subscriptions")
              .delete()
              .eq("athlete_id", row.athlete_id);

            if (deleteError) {
              console.error(
                "[cron/send-reminders] dead-endpoint prune failed:",
                deleteError.message,
              );
            }
            return "pruned" as const;
          }

          // Other error: log count, no retry.
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            "[cron/send-reminders] sendNotification failed:",
            message,
          );
          return "failed" as const;
        }),
    ),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value === "sent") sent++;
      else if (result.value === "pruned") pruned++;
      else failed++;
    } else {
      // Unexpected rejection from the catch block itself — count as failed.
      failed++;
    }
  }

  console.info(
    `[cron/send-reminders] done — sent=${sent} pruned=${pruned} failed=${failed}`,
  );

  return NextResponse.json({ sent, pruned, failed });
}
