// Weekly parent digest email sender (FV-226).
//
// Server-only. Uses the service-role client (cron runs outside any parent
// session). Fetches parent emails from Supabase Auth admin API.
//
// Privacy invariants:
//   - Sources rhythm data ONLY from athlete_session_metadata view + profiles
//     first_name. NEVER reads journal content, pregame selections, or any
//     athlete-only field.
//   - Parent emails come from auth.users (service-role only) — never stored
//     in profiles.
//   - Unsubscribe token is embedded but never logged.
//   - Stops sending when parent has no active/trialing subscription row.
//
// Caller: apps/web/app/api/cron/weekly-digest/route.ts
// Uses deliverInBackground() wrapping at the call site (cron route).

import "server-only";

import { getResendClient } from "@/lib/email/resend";
import { createServiceClient } from "@/lib/supabase/service";
import {
  loadEligibleParents,
  loadAthleteDataForParents,
  buildParentDigestPayload,
  rhythmSummaryLine,
  type ParentDigestPayload,
} from "@/lib/email/weekly-digest-core";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Email rendering
// ---------------------------------------------------------------------------

function renderDigestHtml(
  payload: ParentDigestPayload,
  siteUrl: string,
): string {
  const unsubscribeUrl = `${siteUrl}/api/digest/unsubscribe?token=${encodeURIComponent(payload.unsubscribeToken)}`;

  const athleteBlocks = payload.athletes.length === 0
    ? `<p style="margin:0 0 12px 0;color:#aaa">No athletes linked yet. Add your athlete from the dashboard to see their rhythm here.</p>`
    : payload.athletes
        .map((a) => {
          const summary = rhythmSummaryLine(a);
          return `
      <div style="margin:0 0 20px 0;padding:16px;background:#1a1a1a;border-radius:8px;border:1px solid #2a2a2a">
        <p style="margin:0 0 6px 0;font-weight:700;font-size:16px;color:#f5e9c8">${escHtml(a.firstName)}</p>
        <p style="margin:0;font-size:14px;color:#aaa;line-height:1.5">${escHtml(summary)}</p>
        <p style="margin:6px 0 0 0;font-size:12px;color:#888">Day ${a.dayPosition}/30 &middot; ${a.sessionsCompleted} total session${a.sessionsCompleted !== 1 ? "s" : ""} complete</p>
      </div>`;
        })
        .join("\n");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f5e9c8">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111">
    <tr><td align="center" style="padding:40px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="padding:0 0 32px 0">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c">From Victory</p>
          <h1 style="margin:8px 0 0 0;font-size:28px;font-weight:900;letter-spacing:0.04em;text-transform:uppercase;color:#f5e9c8;line-height:1.05">Weekly Rhythm Update</h1>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:0 0 24px 0;border-bottom:1px solid #2a2a2a">
          <p style="margin:0;font-size:15px;color:#ccc;line-height:1.6">Hey ${escHtml(payload.firstName)}, here's your weekly snapshot of your athlete's training rhythm.</p>
        </td></tr>

        <!-- Athletes -->
        <tr><td style="padding:24px 0 0 0">
          <p style="margin:0 0 16px 0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#c9a84c">Your Athletes</p>
          ${athleteBlocks}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 0 32px 0">
          <a href="${escHtml(siteUrl)}/dashboard" style="display:inline-block;padding:12px 24px;background:#c9a84c;color:#111;font-weight:700;font-size:14px;text-decoration:none;border-radius:100px;letter-spacing:0.04em">View Dashboard</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0 0;border-top:1px solid #2a2a2a">
          <p style="margin:0 0 8px 0;font-size:12px;color:#666;line-height:1.5">
            You're receiving this because you have an active From Victory subscription.
          </p>
          <p style="margin:0;font-size:12px;color:#666">
            <a href="${escHtml(unsubscribeUrl)}" style="color:#888;text-decoration:underline">Unsubscribe from weekly emails</a>
            &nbsp;&middot;&nbsp;
            <a href="${escHtml(siteUrl)}/dashboard/settings" style="color:#888;text-decoration:underline">Manage in Settings</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderDigestText(
  payload: ParentDigestPayload,
  siteUrl: string,
): string {
  const unsubscribeUrl = `${siteUrl}/api/digest/unsubscribe?token=${payload.unsubscribeToken}`;

  const athleteLines =
    payload.athletes.length === 0
      ? "No athletes linked yet."
      : payload.athletes
          .map((a) => {
            const summary = rhythmSummaryLine(a);
            return `${a.firstName}\n  ${summary}\n  Day ${a.dayPosition}/30 · ${a.sessionsCompleted} total session${a.sessionsCompleted !== 1 ? "s" : ""} complete`;
          })
          .join("\n\n");

  return [
    `From Victory — Weekly Rhythm Update`,
    ``,
    `Hey ${payload.firstName},`,
    ``,
    `Here's your weekly snapshot of your athlete's training rhythm.`,
    ``,
    `YOUR ATHLETES`,
    ``,
    athleteLines,
    ``,
    `View Dashboard: ${siteUrl}/dashboard`,
    ``,
    `---`,
    `You're receiving this because you have an active From Victory subscription.`,
    `Unsubscribe: ${unsubscribeUrl}`,
    `Manage in Settings: ${siteUrl}/dashboard/settings`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Run the full digest send for all eligible parents
// ---------------------------------------------------------------------------

export type DigestRunResult = {
  eligible: number;
  sent: number;
  skipped: number;
  errors: number;
};

/**
 * Run the weekly digest for all eligible parents.
 *
 * Eligible = role=parent, digest_opt_out=false, token exists, active/trialing
 * subscription.
 *
 * Returns a summary for the cron route to log. Never throws — errors are
 * counted and logged per-parent.
 *
 * The cron route MUST wrap this call in deliverInBackground() so it survives
 * the Vercel function freeze after the HTTP response is sent.
 */
export async function runWeeklyDigest(): Promise<DigestRunResult> {
  const result: DigestRunResult = {
    eligible: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  const resend = getResendClient();
  const from = process.env.DIGEST_EMAIL_FROM;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.fromvictoryapp.com";

  if (!resend) {
    console.warn("[weekly-digest] RESEND_API_KEY not configured — skipping digest run.");
    return result;
  }

  if (!from) {
    console.warn("[weekly-digest] DIGEST_EMAIL_FROM not configured — skipping digest run.");
    return result;
  }

  const service = createServiceClient();

  // 1. Load eligible parents (opt-in, has token).
  const parents = await loadEligibleParents(service);

  // 2. Filter by active/trialing subscription.
  const parentIds = parents.map((p) => p.id);

  // Fetch subscriptions in one query.
  const { data: subRows, error: subError } = await service
    .from("subscriptions")
    .select("parent_id, status")
    .in("parent_id", parentIds)
    .in("status", ["active", "trialing"]);

  if (subError) {
    console.error("[weekly-digest] subscription fetch failed:", subError.message);
    return result;
  }

  const activeParentIds = new Set((subRows ?? []).map((r) => r.parent_id));
  const eligibleParents = parents.filter((p) => activeParentIds.has(p.id));
  result.eligible = eligibleParents.length;

  if (eligibleParents.length === 0) {
    console.info("[weekly-digest] No eligible parents — done.");
    return result;
  }

  // 3. Window: Monday 00:00:00 UTC of current week.
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysToMonday,
  ));

  // 4. Fetch all athlete data for all eligible parents in one batch.
  const eligibleIds = eligibleParents.map((p) => p.id);
  const { athleteMeta, weeklyRows, athleteNames, parentLinks } =
    await loadAthleteDataForParents(service, eligibleIds, weekStart);

  // 5. Fetch parent emails from Supabase Auth admin.
  // The admin.listUsers API paginates — for MVP we handle up to 1000 parents
  // (more than sufficient). This is service-role only; parent emails never
  // reach athlete-accessible code paths.
  const emailMap = new Map<string, string>();

  // Fetch emails for each eligible parent (admin.getUserById is per-user;
  // for larger scales we'd batch via listUsers — fine for MVP).
  for (const p of eligibleParents) {
    try {
      const { data: adminUser, error: adminError } =
        await service.auth.admin.getUserById(p.id);
      if (adminError || !adminUser?.user?.email) {
        console.warn(`[weekly-digest] could not fetch email for parent=${p.id}: ${adminError?.message ?? "no email"}`);
        result.skipped++;
        continue;
      }
      emailMap.set(p.id, adminUser.user.email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[weekly-digest] admin.getUserById failed parent=${p.id}: ${msg}`);
      result.skipped++;
    }
  }

  // 6. Send one email per parent.
  for (const parent of eligibleParents) {
    const email = emailMap.get(parent.id);
    if (!email) continue; // already counted as skipped above

    const payload = buildParentDigestPayload({
      parent,
      email,
      parentLinks,
      athleteMeta,
      weeklyRows,
      athleteNames,
      weekStart,
    });

    const html = renderDigestHtml(payload, siteUrl);
    const text = renderDigestText(payload, siteUrl);

    try {
      const { error } = await resend.emails.send({
        from,
        to: email,
        subject: "Your athlete's weekly rhythm — From Victory",
        html,
        text,
      });
      if (error) {
        console.error(
          `[weekly-digest] Resend error parent=${parent.id}: ${error.message}`,
        );
        result.errors++;
      } else {
        result.sent++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[weekly-digest] send exception parent=${parent.id}: ${msg}`);
      result.errors++;
    }
  }

  console.info(
    `[weekly-digest] run complete: eligible=${result.eligible} sent=${result.sent} skipped=${result.skipped} errors=${result.errors}`,
  );

  return result;
}
