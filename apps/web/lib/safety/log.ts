import "server-only";

import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Log a safety-detection event. Event-only — NEVER content.
 *
 * Implements the logging side of CLAUDE.md Journal Safety Architecture
 * (Option C): "Every detection event is logged (event only, NOT content)
 * for forensic and product-improvement purposes."
 *
 * Called by the journal save server action (PR-09) after
 * detectSafetyConcern returns matched=true and the resource screen
 * is shown to the athlete.
 *
 * Returns void. Logs server-side on failure but never throws — a failed
 * event log should not block the athlete's journal save, since the
 * athlete-facing safety response (resource screen) is the primary safety
 * mechanism. The log is for our forensics, not the athlete's wellbeing.
 */
export async function logSafetyEvent(
  athleteId: string,
  athleteSessionId: string,
  category: string,
): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.from("safety_events").insert({
    athlete_id: athleteId,
    athlete_session_id: athleteSessionId,
    category,
  });

  if (error) {
    console.error(
      `[safety.logSafetyEvent] insert failed (athleteId=${athleteId} athleteSessionId=${athleteSessionId} category=${category}): ${error.message} (code=${error.code ?? "n/a"})`,
    );
    void notifyError(
      "[safety] logSafetyEvent insert failed",
      `${error.message} (code=${error.code ?? "n/a"})`,
      { category, pg_code: error.code ?? "n/a" },
    );
  }
}
