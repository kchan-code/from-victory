import "server-only";

import { getResendClient } from "@/lib/email/resend";

/**
 * Fire-and-forget error alert via Resend.
 *
 * Sends an email to ALERT_EMAIL_TO when an infrastructure failure occurs
 * (webhook DB write, Stripe API error, safety event log failure, etc.).
 *
 * PII RULE (NON-NEGOTIABLE): context values must contain ONLY opaque identifiers
 * (cus_*, sub_*, event_*, UUIDs). Never pass names, emails, birthdates,
 * journal content, or any user-provided strings.
 *
 * No-ops silently when:
 *   - RESEND_API_KEY is not set
 *   - ALERT_EMAIL_FROM or ALERT_EMAIL_TO are not set
 *
 * Never throws — catching its own errors so callers can safely `void` it.
 */
export async function notifyError(
  label: string,
  message: string,
  context?: Record<string, string>,
): Promise<void> {
  const client = getResendClient();
  if (!client) return;

  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;
  if (!to || !from) return;

  const env =
    process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  const contextLines = context
    ? Object.entries(context)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n")
    : "";

  const text = [
    `[From Victory Alert]`,
    ``,
    `Label:   ${label}`,
    `Error:   ${message}`,
    `Env:     ${env}`,
    contextLines ? `\nContext:\n${contextLines}` : "",
  ]
    .join("\n")
    .trim();

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.5;color:#111;max-width:600px">
  <h2 style="margin:0 0 16px 0;color:#c0392b">⚠ From Victory Alert</h2>
  <table style="border-collapse:collapse;width:100%">
    <tr><td style="padding:4px 12px 4px 0;width:80px"><strong>Label</strong></td><td>${escHtml(label)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Error</strong></td><td style="font-family:monospace">${escHtml(message)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Env</strong></td><td>${escHtml(env)}</td></tr>
    ${
      context
        ? Object.entries(context)
            .map(
              ([k, v]) =>
                `<tr><td style="padding:4px 12px 4px 0">${escHtml(k)}</td><td style="font-family:monospace">${escHtml(v)}</td></tr>`,
            )
            .join("\n    ")
        : ""
    }
  </table>
</body></html>`;

  try {
    await client.emails.send({
      from,
      to,
      subject: `[FV Alert] ${label}`,
      text,
      html,
    });
  } catch {
    // Intentionally silent. notifyError must never throw or block callers.
  }
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
