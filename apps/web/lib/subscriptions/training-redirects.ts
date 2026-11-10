/**
 * Training-gate redirect targets (FV-625).
 *
 * Deliberately NOT `server-only`: the pregame client shell imports this to
 * allowlist the answer from GET /api/athlete/access, so it never follows an
 * arbitrary path out of a response body. Pure data — no I/O.
 *
 * The decision that picks one of these lives in `./enforce`
 * (resolveTrainingAccess), which is server-only.
 */
export const TRAINING_BLOCKED_REDIRECTS = [
  "/athlete/paused",
  "/athlete/paused?reason=seats",
  "/subscribe",
] as const;

export type TrainingBlockedRedirect = (typeof TRAINING_BLOCKED_REDIRECTS)[number];

export function isTrainingBlockedRedirect(
  value: unknown,
): value is TrainingBlockedRedirect {
  return (
    typeof value === "string" &&
    (TRAINING_BLOCKED_REDIRECTS as readonly string[]).includes(value)
  );
}

/**
 * Wire shape of GET /api/athlete/access.
 *   - `redirect: null` = entitled; otherwise one of the paths above.
 *   - `offlineUntil` (FV-625, KC policy "until the last verified subscription
 *     period ends") = the end of the verified entitlement period as an ISO
 *     timestamp, or null = no offline window (blocked, no end date such as a
 *     perpetual comp grant, or gating off). Always null when blocked.
 * Nothing else crosses the wire — never a level, status, plan, provider,
 * price, grant detail or parent identity (see ./access).
 */
export type TrainingAccessResponse = {
  redirect: TrainingBlockedRedirect | null;
  offlineUntil: string | null;
};
