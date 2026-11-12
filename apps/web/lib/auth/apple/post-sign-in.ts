import "server-only";

import type { SupabaseLike } from "./flow";

/**
 * Minimal post-sign-in destination.
 * TODO(FV-672): replace with the real /welcome / pending-account resolver
 * (getSessionState). Until then: no profile -> /welcome, else the role home.
 */
export async function resolvePostSignInPath(
  supabase: SupabaseLike,
  userId: string,
): Promise<string> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  // A failed read is never "no profile" (spec §13a invariant 5).
  if (error) return "/";
  if (!profile) return "/welcome";
  return profile.role === "parent" ? "/dashboard" : "/athlete";
}
