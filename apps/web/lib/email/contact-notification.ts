import "server-only";
import { getResendClient } from "./resend";

type ContactNotificationPayload = {
  name: string;
  email: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactNotification(
  payload: ContactNotificationPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, reason: "RESEND_API_KEY not configured" };
  }

  // Contact notifications go directly to KC. An env override is allowed
  // (e.g. to route to a shared inbox post-launch) but the default is his
  // personal address per his instruction.
  const to = process.env.CONTACT_NOTIFICATION_TO ?? "kchan@adeptiv.us";

  // Reuse the waitlist's already-verified Resend sender domain so this
  // works without any additional DNS/domain setup.
  const from =
    process.env.CONTACT_NOTIFICATION_FROM ??
    process.env.WAITLIST_NOTIFICATION_FROM;
  if (!from) {
    return {
      ok: false,
      reason: "No FROM configured (set CONTACT_NOTIFICATION_FROM or WAITLIST_NOTIFICATION_FROM)",
    };
  }

  const subject = `From Victory contact · ${payload.name}`;

  const html = `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.5; color:#111">
  <h2 style="margin:0 0 16px 0">New From Victory contact message</h2>
  <table style="border-collapse:collapse">
    <tr><td style="padding:4px 12px 4px 0"><strong>Name</strong></td><td>${escapeHtml(payload.name)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Email</strong></td><td>${escapeHtml(payload.email)}</td></tr>
  </table>
  <div style="margin-top:16px">
    <p style="margin:0 0 8px 0"><strong>Message</strong></p>
    <p style="margin:0; white-space:pre-wrap">${escapeHtml(payload.message)}</p>
  </div>
</body></html>`;

  const text = [
    `New From Victory contact message`,
    ``,
    `Name:    ${payload.name}`,
    `Email:   ${payload.email}`,
    ``,
    `Message:`,
    payload.message,
  ].join("\n");

  try {
    const { error } = await client.emails.send({
      from,
      to,
      replyTo: payload.email,
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
