import "server-only";

import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";

/**
 * One email per cron failure path (FV-730), through the existing notifyError
 * channel. Counts and short reason codes only.
 *
 * `failed > CRON_FAILURE_ALERT_THRESHOLD` is the "failures exceed a threshold"
 * check. Threshold 0 means any failed send in the run alerts once — a quiet
 * hourly job that starts failing should not wait for a pile of failures.
 */
export const CRON_FAILURE_ALERT_THRESHOLD = 0;

const UUID_ANY =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const SAFE = /^[A-Za-z0-9:+._-]{1,80}$/;

export function redactCronMessage(message: string): string {
  return message
    .replace(EMAIL, "[email]")
    .replace(UUID_ANY, "[id]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * Schedule one alert. Never throws — a broken mailer must not fail the cron
 * response or hide the original error.
 */
export function alertCronFailure(
  label: string,
  message: string,
  context?: Record<string, string>,
): void {
  try {
    const safeContext: Record<string, string> = {};
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (!SAFE.test(key)) continue;
        safeContext[key] = SAFE.test(value) ? value : "[redacted]";
      }
    }
    deliverInBackground(
      notifyError(
        label.slice(0, 120),
        redactCronMessage(message),
        Object.keys(safeContext).length > 0 ? safeContext : undefined,
      ),
    );
  } catch {
    console.error("[cron-alert] failed to schedule alert");
  }
}
