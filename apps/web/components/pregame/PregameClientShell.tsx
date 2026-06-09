"use client";

/**
 * PregameClientShell (FV-107)
 *
 * Client-side auth + sport-resolution wrapper for the pregame page.
 *
 * ONLINE path:
 *   1. Calls supabase.auth.getUser() (browser client, anon key, RLS still on).
 *   2. If no session → router.replace("/signin").
 *   3. If session → loads the athlete's profile row (RLS-gated) to get sport.
 *   4. Writes { sport, firstName } to localStorage under fv_athlete_cache
 *      (minimal athlete PII: sport is "hockey"/"basketball"; firstName is a
 *      first name).
 *   5. Applies the first-run gate: no sport_selected_at → redirect to onboarding.
 *   6. Renders PregameFlow.
 *
 * OFFLINE path (fetch throws a network / TypeError — not a 4xx):
 *   1. Reads fv_athlete_cache from localStorage.
 *   2. If cache hit → renders PregameFlow with the cached sport.
 *   3. If cache miss → shows a "Connect first" notice (athlete has never
 *      visited the pregame page while online on this device).
 *
 * AUTH BYPASS PROTECTION:
 *   The single try/catch wraps BOTH getUser() and the subsequent profile fetch.
 *   The offline (cache) path is only taken when one of them throws a genuine
 *   network error (matched by message — see isNetworkError; NOT a bare
 *   TypeError, and NOT a 401/403 or a Supabase AuthError). A network throw from
 *   either call is safe to serve from cache: the cache was written earlier by a
 *   successfully-authenticated user on this device. The online failure modes —
 *   an AuthError result or a null user — instead redirect to /signin. A
 *   cookie-stuffing attacker online with fake session cookies gets an AuthError
 *   / null user → redirect to /signin, never the cache.
 *
 * PII POLICY:
 *   fv_athlete_cache is written to localStorage, not Cache Storage. It is
 *   device-local, never traverses the network, never lands in any SW cache, and
 *   is cleared on sign-out + device re-pair by SignOutButton / ClearCacheOnMount
 *   (FV-154; clearAthleteCache lives in lib/pregame/athlete-cache.ts — calling it
 *   from a server action would be a no-op since window is undefined there).
 *   sport + first_name are minimal athlete PII. No email, no birthdate, no
 *   parent link, no location, no journal content.
 *
 * RLS INVARIANT:
 *   Every real data read/write (journal, sessions, safety events) still goes
 *   through Supabase with the anon key + RLS. Offline, the athlete can only
 *   interact with the pregame UI state (fully client-side, no DB persistence —
 *   see PregameFlow: "No persistence"). No DB write happens offline.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  readAthleteCache,
  writeAthleteCache,
} from "@/lib/pregame/athlete-cache";
import { PregameFlow } from "./PregameFlow";
import type { Sport } from "./sport-registry";

// clearAthleteCache is re-exported from lib/pregame/athlete-cache.
// It is no longer defined here — import it from there for sign-out / re-pair
// use. The re-export keeps any existing callers of the old path working.
export { clearAthleteCache } from "@/lib/pregame/athlete-cache";

// ---------------------------------------------------------------------------
// Type guard: is this a network-level failure (offline) vs an auth failure?
// ---------------------------------------------------------------------------

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  // Canonical offline fetch error messages:
  //   Chrome/Firefox: "Failed to fetch"
  //   Firefox: "NetworkError when attempting to fetch resource"
  //   Safari: "Load failed"
  //   React Native / Node fetch: "Network request failed"
  // We do NOT use `err.name === "TypeError"` alone — TypeError is too broad
  // (it covers non-network programming errors). We require a known message.
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("network request failed")
  );
}

// ---------------------------------------------------------------------------
// Component states
// ---------------------------------------------------------------------------

type ShellState =
  | { kind: "loading" }
  | { kind: "ready"; sport: Sport; firstName: string }
  | { kind: "offline-no-cache" }
  | { kind: "error"; message: string };

// ---------------------------------------------------------------------------
// PregameClientShell
// ---------------------------------------------------------------------------

export function PregameClientShell() {
  const router = useRouter();
  const [state, setState] = useState<ShellState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        // Hard auth failure (AuthError, invalid token) → redirect to sign-in.
        // This is NOT the offline path — it is a genuine auth failure online.
        if (authError) {
          router.replace("/signin");
          return;
        }

        // getUser() succeeded but no user object → not authenticated.
        if (!user) {
          router.replace("/signin");
          return;
        }

        // Auth confirmed. Fetch the athlete profile (RLS-gated, anon key).
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, first_name, sport, sport_selected_at")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (profileError || !profile) {
          router.replace("/signin");
          return;
        }

        if (profile.role !== "athlete") {
          // Parent somehow navigated here — redirect to their home.
          router.replace("/dashboard");
          return;
        }

        // First-run gate: athlete hasn't picked a sport yet.
        // Mirrors the server-side gate that was in the previous page.tsx
        // (FV-33); closes the deep-link bypass of /athlete/pregame.
        if (!profile.sport_selected_at) {
          router.replace("/athlete/onboarding/sport");
          return;
        }

        // Resolve the sport — fall back to hockey if the DB value is unknown.
        // profile.sport is string | null in the generated types; we narrow to
        // the Sport union before passing to PregameFlow + writing the cache.
        const sport: Sport =
          profile.sport === "basketball" ? "basketball" : "hockey";
        const firstName = profile.first_name ?? "";

        // Cache for future offline use (device-local, non-network).
        writeAthleteCache({ sport, firstName });

        setState({ kind: "ready", sport, firstName });
      } catch (err) {
        if (cancelled) return;

        // Network error → try the localStorage cache.
        if (isNetworkError(err)) {
          const cached = readAthleteCache();
          if (cached) {
            setState({
              kind: "ready",
              sport: cached.sport,
              firstName: cached.firstName,
            });
          } else {
            // No cache: athlete has never loaded this page online on this
            // device. We cannot authenticate them offline → show a prompt
            // to reconnect first.
            setState({ kind: "offline-no-cache" });
          }
          return;
        }

        // Unexpected error → fail visibly rather than silently.
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "Unexpected error",
        });
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Loading skeleton ──
  if (state.kind === "loading") {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-onyx"
        role="status"
        aria-live="polite"
      >
        <h1 className="sr-only">Loading pregame</h1>
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border border-gold/30 animate-pulse" />
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/40">
            Loading&hellip;
          </p>
        </div>
      </div>
    );
  }

  // ── Offline, no cache ──
  if (state.kind === "offline-no-cache") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-onyx px-8 text-center">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.20em] text-gold">
          From Victory
        </p>
        <h1 className="mb-3 font-display text-[28px] font-extrabold uppercase leading-[1.05] tracking-[0.03em] text-cream">
          Connect first
        </h1>
        <p className="font-body text-[14px] leading-[1.55] text-cream/60">
          Open the pregame session once while connected so it&rsquo;s ready at
          the rink.
        </p>
      </div>
    );
  }

  // ── Error ──
  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-onyx px-8 text-center">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.20em] text-gold">
          From Victory
        </p>
        <h1 className="mb-3 font-display text-[28px] font-extrabold uppercase leading-[1.05] tracking-[0.03em] text-cream">
          Something went wrong
        </h1>
        <p className="font-body text-[14px] leading-[1.55] text-cream/60">
          Please reload the page to try again.
        </p>
      </div>
    );
  }

  // ── Ready ──
  return (
    <PregameFlow
      athleteFirstName={state.firstName}
      sport={state.sport}
    />
  );
}
