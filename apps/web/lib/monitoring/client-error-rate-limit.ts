/**
 * In-memory cap for client-error alerts (FV-729).
 *
 * One isolate, one minute, five alerts. Duplicate route+digest+shell keys
 * in the window do not send a second email. Nothing is written to the
 * database and no IP or user id is used as a key — a persistent rate-limit
 * row would be long-term identifier-derived data, which this app does not keep.
 */

const WINDOW_MS = 60_000;
const MAX_ALERTS_PER_WINDOW = 5;
const MAX_KEYS = 100;

let windowStarted = 0;
let alerts = 0;
const seen = new Set<string>();

export function resetClientErrorAlertWindow(): void {
  windowStarted = 0;
  alerts = 0;
  seen.clear();
}

export function clientErrorAlertKey(
  report: { route: string; digest?: string; message?: string },
  shell: string,
): string {
  return [
    report.route,
    report.digest ?? "",
    shell,
    (report.message ?? "").slice(0, 40),
  ].join("|");
}

/** True when this report may send one notifyError alert. */
export function claimClientErrorAlert(key: string): boolean {
  const now = Date.now();
  if (windowStarted === 0 || now - windowStarted > WINDOW_MS) {
    windowStarted = now;
    alerts = 0;
    seen.clear();
  }
  if (seen.has(key) || alerts >= MAX_ALERTS_PER_WINDOW || seen.size >= MAX_KEYS) {
    return false;
  }
  seen.add(key);
  alerts += 1;
  return true;
}
