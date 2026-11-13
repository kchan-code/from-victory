import "server-only";

import { cookies } from "next/headers";

import { isNativeShell } from "@/lib/native-shell";
import { createClient } from "@/lib/supabase/server";

import {
  classifyAnalyticsSession,
  hasSupabaseAuthSessionCookie,
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
 * does not make an extra auth round-trip. A cookie whose role cannot be
 * read (network error, missing env, no profile row) is `unresolved` and the
 * script stays off — a minor must not be tracked because a lookup failed.
 *
 * The shell check is a presentation hint (a User-Agent is spoofable). The
 * failure direction is safe: a spoofed shell suppresses analytics, it never
 * turns them on.
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

  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { nativeShell: false, session: "signed-out" };
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      console.error("[analytics] profile role read failed:", error.message);
      return { nativeShell: false, session: "unresolved" };
    }

    return {
      nativeShell: false,
      session: classifyAnalyticsSession({
        hasSessionUser: true,
        role: profile?.role ?? null,
      }),
    };
  } catch (err) {
    console.error(
      "[analytics] session lookup failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return { nativeShell: false, session: "unresolved" };
  }
}
