import "server-only";

import type { SignupRole } from "@/lib/auth/email-signup-schema";
import { getRequestShellCapability } from "@/lib/native-shell";
import { isRestrictedShell } from "@/lib/native-shell-restricted";

/**
 * Post-completion routing shared by completeEmailSignup (FV-671) and
 * completeOnboarding (FV-672). Lives outside the "use server" action files,
 * which may only export async functions.
 */
export function roleHome(role: string | null | undefined): string {
  return role === "athlete" || role === "adult_athlete"
    ? "/athlete"
    : "/dashboard";
}

/** Where a brand-new account goes: same routing as the legacy signUpAdultAthlete. */
export function newAccountHome(role: SignupRole): string {
  if (role === "parent") return "/dashboard";
  // Inside a restricted shell (legacy-native, and android-play until FV-665
  // diverges it — FV-659) /subscribe is a no-purchase dead end
  // (FV-478/FV-482), so that adult lands on /athlete; an ios-iap shell
  // (FV-577) and the web go to /subscribe.
  return isRestrictedShell(getRequestShellCapability())
    ? "/athlete"
    : "/subscribe";
}
