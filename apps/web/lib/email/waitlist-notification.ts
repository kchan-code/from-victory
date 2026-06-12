import "server-only";
import { getResendClient } from "./resend";

type WaitlistNotificationPayload = {
  email: string;
  name: string;
  role: string;
  sport: string;
  note: string | null;
  source?: string | null;
  intent?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendWaitlistNotification(
  payload: WaitlistNotificationPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, reason: "RESEND_API_KEY not configured" };
  }

  const to = process.env.WAITLIST_NOTIFICATION_TO;
  const from = process.env.WAITLIST_NOTIFICATION_FROM;
  if (!to || !from) {
    return { ok: false, reason: "Notification TO/FROM env vars not configured" };
  }

  const isGroupPricing = payload.source === "teams" || payload.intent === "group-pricing";
  const subject = isGroupPricing
    ? `⭐ GROUP PRICING REQUEST · From Victory waitlist · ${payload.name}`
    : `From Victory waitlist · ${payload.name} (${payload.role})`;

  const noteBlock = payload.note
    ? `<p style="margin:0 0 8px 0"><strong>Note</strong></p><p style="margin:0 0 16px 0; white-space:pre-wrap">${escapeHtml(payload.note)}</p>`
    : "";

  const metaRows = [
    payload.source ? `<tr><td style="padding:4px 12px 4px 0"><strong>Source</strong></td><td>${escapeHtml(payload.source)}</td></tr>` : "",
    payload.intent ? `<tr><td style="padding:4px 12px 4px 0"><strong>Intent</strong></td><td>${escapeHtml(payload.intent)}</td></tr>` : "",
  ].join("");

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.5; color:#111">
  ${isGroupPricing ? '<div style="background:#fffbe6;border:1px solid #ffe066;border-radius:6px;padding:8px 14px;margin-bottom:16px;font-weight:600;color:#7a5c00">⭐ Group pricing request from /teams page</div>' : ""}
  <h2 style="margin:0 0 16px 0">New From Victory waitlist signup</h2>
  <table style="border-collapse:collapse">
    <tr><td style="padding:4px 12px 4px 0"><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Role</strong></td><td>${escapeHtml(payload.role)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Sport</strong></td><td>${escapeHtml(payload.sport)}</td></tr>
    ${metaRows}
  </table>
  ${noteBlock ? `<div style="margin-top:16px">${noteBlock}</div>` : ""}
</body></html>`;

  const text = [
    isGroupPricing ? "⭐ GROUP PRICING REQUEST" : null,
    `New From Victory waitlist signup`,
    ``,
    `Name:  ${payload.name}`,
    `Email: ${payload.email}`,
    `Role:  ${payload.role}`,
    `Sport: ${payload.sport}`,
    payload.source ? `Source: ${payload.source}` : null,
    payload.intent ? `Intent: ${payload.intent}` : null,
    payload.note ? `\nNote:\n${payload.note}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { error } = await client.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      return { ok: false, reason: `Resend error: ${error.message}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `Resend exception: ${message}` };
  }
}
