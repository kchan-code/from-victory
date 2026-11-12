import "server-only";

import { homeForState, resolveSessionState } from "@/lib/auth/session-state-core";

import type { SupabaseLike } from "./flow";

/**
 * Post-sign-in destination for the Apple flows (web callback, iOS native,
 * Android handoff completion), resolved from the shared session state
 * (FV-672; spec §5.1):
 *   pending -> /welcome            (verified, no profile yet)
 *   parent / athlete / adult_athlete -> role home
 *   error / orphan / none -> "/"   (NEVER /welcome or /subscribe: a failed
 *                                   profile read is not "no profile", spec
 *                                   §13a invariant 5; "/" re-routes by the
 *                                   real gates)
 */
export async function resolvePostSignInPath(
  supabase: SupabaseLike,
  userId: string,
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user || user.id !== userId) return "/";

  const { state } = await resolveSessionState(supabase, user);
  if (state === "pending") return "/welcome";
  return homeForState(state) ?? "/";
}
