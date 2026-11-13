"use client";
// client: @vercel/analytics/next itself requires the client boundary (script
// injection + route tracking); root layout stays a Server Component and
// mounts this small wrapper instead of importing Analytics directly.

/**
 * AnalyticsMount (FV-395, FV-727)
 *
 * Mounts Vercel Web Analytics only when shouldMountAnalytics allows it.
 * The decision is fail-closed and lives entirely on the client so the root
 * layout does not read cookies or headers (marketing pages stay static).
 *
 * The script stays unmounted until Supabase auth state resolves to a
 * confirmed signed-out browser or a confirmed non-minor (parent or
 * adult_athlete) on an allowlisted path. A native shell, a signed-in minor
 * (role `athlete`), and any unverified cookie or session stay off — including
 * on /privacy and /terms.
 *
 * onAuthStateChange re-runs that check. The script is cleared synchronously
 * on every auth event, before the next getUser(), so a soft navigation after
 * sign-in cannot keep a signed-out mount alive.
 *
 * Pageviews only. No custom events, no PII, no user identifiers attached.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

import { filterAnalyticsEvent } from "@/lib/analytics/allowed-routes";
import {
  hasSupabaseAuthSessionCookie,
  isAnalyticsNativeShell,
  resolveAnalyticsViewer,
  shouldMountAnalytics,
  type AnalyticsViewer,
} from "@/lib/analytics/mount";
import { createClient } from "@/lib/supabase/client";

const CLOSED: AnalyticsViewer = { nativeShell: false, session: "unresolved" };

function cookieNamesFromDocument(): string[] {
  if (typeof document === "undefined") return [];
  return document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0] ?? "")
    .filter((name) => name.length > 0);
}

export function AnalyticsMount() {
  const pathname = usePathname() ?? "";
  // Fail closed through hydration. The effect is the first moment we know
  // whether this browser is signed out, a confirmed adult, or anything else.
  const [viewer, setViewer] = useState<AnalyticsViewer>(CLOSED);

  useEffect(() => {
    let cancelled = false;
    const userAgent = navigator.userAgent;
    if (isAnalyticsNativeShell(userAgent)) {
      setViewer({ nativeShell: true, session: "unresolved" });
      return;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      const names = cookieNamesFromDocument();
      setViewer({
        nativeShell: false,
        session: hasSupabaseAuthSessionCookie(names) ? "unresolved" : "signed-out",
      });
      return;
    }

    const supabase = createClient();

    const publish = (sessionPresent: boolean) => {
      const names = cookieNamesFromDocument();
      void resolveAnalyticsViewer({
        userAgent,
        cookieNames: names,
        sessionPresent,
        lookup: async () => {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();
          if (userError || !user) {
            return { userId: null, error: true, role: null, roleError: false };
          }
          const { data: profile, error: roleError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (roleError) {
            return { userId: user.id, error: false, role: null, roleError: true };
          }
          return {
            userId: user.id,
            error: false,
            role: profile?.role ?? null,
            roleError: false,
          };
        },
      })
        .then((next) => {
          if (!cancelled) setViewer(next);
        })
        .catch(() => {
          if (!cancelled) setViewer(CLOSED);
        });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Unmount before getUser() returns. A signed-out mount must not survive
      // the event that starts a minor's session.
      setViewer(CLOSED);
      const sessionPresent = session !== null;
      queueMicrotask(() => {
        if (!cancelled) publish(sessionPresent);
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (!shouldMountAnalytics(pathname, viewer)) {
    return null;
  }

  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
