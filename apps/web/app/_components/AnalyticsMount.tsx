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
 * onAuthStateChange re-runs that check. Each event bumps a generation
 * counter (also bumped on mount). setViewer runs only when that lookup is
 * still the latest one, so a slower TOKEN_REFRESHED cannot land after a
 * newer minor session and turn the script back on. The script is cleared
 * synchronously on every auth event except TOKEN_REFRESHED, before the next
 * getUser(). A token refresh keeps the current viewer until its own lookup
 * finishes, and skips setState when the class did not change, so the
 * script is not remounted and the pageview is not counted twice.
 *
 * Pageviews only. No custom events, no PII, no user identifiers attached.
 */

import { useEffect, useRef, useState } from "react";
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

function sameViewer(a: AnalyticsViewer, b: AnalyticsViewer): boolean {
  return a.nativeShell === b.nativeShell && a.session === b.session;
}

export function AnalyticsMount() {
  const pathname = usePathname() ?? "";
  // Fail closed through hydration. The effect is the first moment we know
  // whether this browser is signed out, a confirmed adult, or anything else.
  const [viewer, setViewer] = useState<AnalyticsViewer>(CLOSED);
  // Latest auth generation. A lookup may setViewer only while it still owns
  // this value. Bumped on mount and on every auth event.
  const generation = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const userAgent = navigator.userAgent;
    generation.current += 1;
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

    const publish = (sessionPresent: boolean, gen: number) => {
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
          if (cancelled || generation.current !== gen) return;
          setViewer((current) => (sameViewer(current, next) ? current : next));
        })
        .catch(() => {
          if (cancelled || generation.current !== gen) return;
          setViewer((current) => (sameViewer(current, CLOSED) ? current : CLOSED));
        });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const gen = ++generation.current;
      // Unmount before getUser() returns. A signed-out mount must not survive
      // the event that starts a minor's session. TOKEN_REFRESHED keeps the
      // current viewer so an unchanged class does not remount the script.
      if (event !== "TOKEN_REFRESHED") {
        setViewer(CLOSED);
      }
      const sessionPresent = session !== null;
      queueMicrotask(() => {
        if (!cancelled && generation.current === gen) publish(sessionPresent, gen);
      });
    });

    return () => {
      cancelled = true;
      generation.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  if (!shouldMountAnalytics(pathname, viewer)) {
    return null;
  }

  return <Analytics beforeSend={filterAnalyticsEvent} />;
}
