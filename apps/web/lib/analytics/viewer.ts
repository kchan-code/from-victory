import "server-only";

import { cookies } from "next/headers";

import { isNativeShell } from "@/lib/native-shell";
import { createClient } from "@/lib/supabase/server";

import {
  hasSupabaseAuthSessionCookie,
  resolveAnalyticsViewer,
  type AnalyticsSession,
} from "./mount";

export type AnalyticsMountContext = {
  nativeShell: boolean;
  session: AnalyticsSession;
};

/**
 * FV-727 — per-request audience for AnalyticsMount.
 *
 * Native-shell detection is a header read. The profile role is loaded only
 * when a Supabase auth cookie is present, so a signed-out marketing request
 * does not make an extra auth round-trip. A cookie whose getUser() errors,
 * returns no user, or whose role cannot be read is `unresolved` and the
 * script stays off.
 *
 * The shell check is a presentation hint (a User-Agent is spoofable). The
 * failure direction is safe: a spoofed shell suppresses analytics, it never
 * turns them on.
 *
 * The root layout does not call this. Marketing pages stay static; the
 * client gate in AnalyticsMount is what mounts the script and re-checks
 * auth on soft navigations. This helper keeps the same fail-closed rule
 * for any server caller.
 */
export async function getAnalyticsMountContext(): Promise<AnalyticsMountContext> {
  if (isNativeShell()) {
    return { nativeShell: true, session: "signed-out" };
  }

  const names = cookies().getAll().map((cookie) => cookie.name);
  if (!hasSupabaseAuthSessionCookie(names)) {
    return { nativeShell: false, session: "signed-out" };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { nativeShell: false, session: "unresolved" };
  }

  return resolveAnalyticsViewer({
    userAgent: null,
    cookieNames: names,
    sessionPresent: true,
    lookup: async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      // Cookie is present. An error or a null user is not a confirmed
      // sign-out — a minor's request can look like this when auth is down.
      if (userError || !user) {
        return { userId: null, error: true, role: null, roleError: false };
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("[analytics] profile role read failed:", error.message);
        return { userId: user.id, error: false, role: null, roleError: true };
      }
      return {
        userId: user.id,
        error: false,
        role: profile?.role ?? null,
        roleError: false,
      };
    },
  });
}
