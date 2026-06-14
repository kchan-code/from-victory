#!/usr/bin/env node
// FV-188 — CI alert helper for the scheduled infra-drift detector.
//
// Sends an infrastructure alert to KC through the SAME Resend channel that the
// in-app monitor uses (lib/monitoring/notify.ts → notifyError): same recipient
// (ALERT_EMAIL_TO), same sender (ALERT_EMAIL_FROM), same API key
// (RESEND_API_KEY), same "[FV Alert]" subject + body shape.
//
// WHY a separate sender instead of importing notifyError directly:
//   notifyError (and lib/email/resend.ts) are `import "server-only"` modules —
//   importing them outside the Next.js server runtime throws. This file is run
//   by a plain Node process inside GitHub Actions, so it re-implements the same
//   small send against the Resend HTTP API. It is intentionally a thin mirror,
//   NOT a second alerting system: it targets the identical env vars and format
//   so a drift page looks like every other From Victory alert.
//
// PII RULE (NON-NEGOTIABLE — mirrors notifyError):
//   `label`, `message`, and every value in `context` must be STATIC strings or
//   opaque infra identifiers (migration filenames, env-var NAMES, counts,
//   boolean flags). NEVER pass secret VALUES, user data, names, emails,
//   birthdates, journal content, or safety-detection categories. The drift and
//   env-presence callers pass names/filenames only — never values.
//
// No-ops silently (returns false) when RESEND_API_KEY / ALERT_EMAIL_TO /
// ALERT_EMAIL_FROM are unset, so a misconfigured alerter never masks the
// underlying check failure (the check still exits non-zero and reds the job).
// Never throws.

import { Resend } from "resend";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Send a CI infra alert via Resend. Returns true if an email was dispatched,
 * false if alerting is not configured (or the send failed). Never throws.
 */
export async function ciAlert(
  label: string,
  message: string,
  context?: Record<string, string>,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL_TO;
  const from = process.env.ALERT_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    // Names-only diagnostic so CI logs show WHY no alert was sent, without
    // ever printing a value.
    const missing = [
      !apiKey ? "RESEND_API_KEY" : null,
      !to ? "ALERT_EMAIL_TO" : null,
      !from ? "ALERT_EMAIL_FROM" : null,
    ]
      .filter(Boolean)
      .join(", ");
    console.warn(
      `[ci-alert] Alert NOT sent — alerting not configured (missing: ${missing}). ` +
        `The check failure still fails the job; set these repo/environment vars to receive email.`,
    );
    return false;
  }

  const env = process.env.GITHUB_WORKFLOW
    ? `github-actions:${process.env.GITHUB_WORKFLOW}`
    : (process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown");

  const contextLines = context
    ? Object.entries(context)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join("\n")
    : "";

  const runUrl =
    process.env.GITHUB_SERVER_URL &&
    process.env.GITHUB_REPOSITORY &&
    process.env.GITHUB_RUN_ID
      ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "";

  const text = [
    `[From Victory Alert]`,
    ``,
    `Label:   ${label}`,
    `Error:   ${message}`,
    `Env:     ${env}`,
    contextLines ? `\nContext:\n${contextLines}` : "",
    runUrl ? `\nRun:\n  ${runUrl}` : "",
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
    ${runUrl ? `<tr><td style="padding:4px 12px 4px 0"><strong>Run</strong></td><td><a href="${escHtml(runUrl)}">${escHtml(runUrl)}</a></td></tr>` : ""}
  </table>
</body></html>`;

  try {
    const client = new Resend(apiKey);
    await client.emails.send({
      from,
      to,
      subject: `[FV Alert] ${label}`,
      text,
      html,
    });
    console.log(`[ci-alert] Alert email dispatched: ${label}`);
    return true;
  } catch (err) {
    // Mirror notifyError: alerting must never throw or mask the real failure.
    // Print the failure NAME only (no values) so CI shows the alerter broke.
    const name = err instanceof Error ? err.name : "UnknownError";
    console.warn(`[ci-alert] Alert send failed (${name}); the underlying check still fails the job.`);
    return false;
  }
}
