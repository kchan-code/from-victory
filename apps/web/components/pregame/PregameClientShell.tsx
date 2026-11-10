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
 *   4. Applies the first-run gate: no sport_selected_at → redirect to onboarding.
 *   5. TRAINING ENTITLEMENT GATE (FV-625): GET /api/athlete/access — the same
 *      decision requireActiveAccess() applies server-side to hub/daily/
 *      practice/postgame/journey (resolveTrainingAccess in
 *      lib/subscriptions/enforce.ts). Blocked → clear fv_athlete_cache and
 *      router.replace() to the allowlisted redirect (/athlete/paused,
 *      /athlete/paused?reason=seats, /subscribe). PregameFlow never renders
 *      for a blocked athlete online.
 *   6. Entitled → writes { sport, firstName, entitlementVerified: true } to
 *      localStorage under fv_athlete_cache (minimal athlete PII: a sport
 *      string and a first name, plus a boolean — no billing data).
 *   7. Renders PregameFlow.
 *
 * OFFLINE path — any of: getUser() RETURNS an AuthRetryableFetchError
 * (supabase-js returns, does not throw, when the auth server is unreachable),
 * the profile read returns a fetch-failure error, or a fetch throws a network
 * error (matched by message):
 *   1. Reads fv_athlete_cache from localStorage.
 *   2. If the entry carries entitlementVerified: true (written only after an
 *      online entitlement check passed) → renders PregameFlow with the
 *      cached sport.
 *   3. Otherwise (no entry, or a pre-FV-625 entry with no marker) → shows the
 *      "Connect first" notice.
 *
 * OFFLINE REVOCATION IS BOUNDED, NOT INSTANT (FV-625, KC 2026-11-09): a device
 * that last verified entitlement while online keeps offline pregame until it
 * next reaches the server. No new grace period is added and a valid
 * subscriber is never denied offline. Revocation lands on the first online
 * contact that sees the block: opening pregame (step 5 clears the cache), or
 * any gated training page (they redirect to /athlete/paused, which clears the
 * cache on mount). Sign-out / re-pair clear it too (FV-154).
 *
 * NO CROSS-ATHLETE CACHE: the entry is not keyed by user, so every way a
 * different athlete can become signed in on this device clears it first:
 * /signin + sign-out + forget-device (FV-154) and /invite + /pair
 * (ClearOfflinePregameOnMount, FV-625). A new athlete therefore has no
 * offline pregame until their own online check passes.
 *
 * AUTH BYPASS PROTECTION:
 *   The offline (cache) path is taken only for "can't reach the server"
 *   signals: a returned AuthRetryableFetchError from getUser(), a profile-read
 *   error carrying a fetch failure, or a thrown network error (matched by
 *   message — see isNetworkError; NOT a bare TypeError). A real auth answer —
 *   AuthApiError, missing session, null user, a 401/403 — redirects to
 *   /signin, never the cache. The offline path also requires an entry with
 *   entitlementVerified: true, which only a successfully-authenticated,
 *   entitled session on THIS device can have written (FV-625). So a
 *   cookie-stuffing attacker, or anyone who forces a network failure, gets at
 *   most what going offline already gives: the bounded window described below.
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
import { isAuthRetryableFetchError } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import {
  clearAthleteCache,
  readAthleteCache,
  writeAthleteCache,
} from "@/lib/pregame/athlete-cache";
import { isTrainingBlockedRedirect } from "@/lib/subscriptions/training-redirects";
import { PregameFlow } from "./PregameFlow";
import { SUPPORTED_SPORTS, type Sport } from "@/lib/sports";

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

    // Offline / unreachable-backend path: open ONLY from an entry a previous
    // passed online entitlement check wrote (FV-625), else "Connect first".
    function openFromVerifiedCacheOrConnectFirst() {
      const cached = readAthleteCache();
      if (cached?.entitlementVerified) {
        setState({ kind: "ready", sport: cached.sport, firstName: cached.firstName });
      } else {
        // No verified cache: athlete hasn't opened pregame online (with an
        // entitlement check) on this device. We cannot authenticate them
        // offline → show a prompt to reconnect first.
        setState({ kind: "offline-no-cache" });
      }
    }

    async function init() {
      try {
        // ───────────────────────────────────────────────────────────────
        // INTENTIONALLY CLIENT-SIDE — do not "fix" by moving to a server
        // loader (e.g. lib/auth/guards.ts requireAthlete()).
        //
        // This auth (getUser()) + profile (`profiles` table) read stays in
        // the client on purpose (FV-107, reaffirmed FV-370). It is the
        // load-bearing half of the offline-at-the-rink pregame flow:
        //   - app/athlete/pregame/page.tsx is a PII-free static server
        //     shell by contract (no requireAthlete(), no server-side user
        //     data) so it can be cached and served offline.
        //   - public/sw.js's `pregame-shell-network-first` strategy caches
        //     that PII-free HTML (only when there's no Set-Cookie header)
        //     so an athlete opening /athlete/pregame with no signal still
        //     gets a shell that boots, runs this client-side auth/profile
        //     check, and falls back to the localStorage athlete cache
        //     below (isNetworkError / readAthleteCache).
        //
        // Moving this read server-side would break the SW's PII-free-shell
        // contract and remove offline pregame entirely — a product trade,
        // not a routine client/server-boundary cleanup, and it would
        // require updating public/sw.js in lockstep. See FV-370.
        // ───────────────────────────────────────────────────────────────
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        // FV-625 (fixes a latent FV-107 defect, proven on an Android device):
        // supabase-js does NOT throw when the auth server is unreachable — it
        // RETURNS an AuthRetryableFetchError (network failure, or a 5xx from
        // the auth server). Before this check that result fell into the
        // branch below and redirected an offline athlete to /signin, which is
        // not cached → the browser's own offline error page. Offline pregame
        // never actually opened. Retryable = "can't reach the server", so it
        // takes the offline path. An AuthApiError / missing session (a real
        // auth answer) still goes to /signin.
        if (authError && isAuthRetryableFetchError(authError)) {
          openFromVerifiedCacheOrConnectFirst();
          return;
        }

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

        // postgrest-js also RETURNS (not throws) a fetch failure, as an error
        // whose message carries the fetch error ("TypeError: Failed to
        // fetch"). Connection dropped between the two reads → offline path.
        if (profileError && isNetworkError(new Error(profileError.message))) {
          openFromVerifiedCacheOrConnectFirst();
          return;
        }

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

        // Resolve the sport — validate against SUPPORTED_SPORTS (the selectable
        // set) and fall back to hockey if the DB value is unknown/null. Using
        // the allowlist (not a hardcoded hockey/basketball branch) means every
        // launched sport — golf included (FV-270) — routes to its own content
        // instead of silently collapsing to hockey.
        const sport: Sport = (SUPPORTED_SPORTS as readonly string[]).includes(
          profile.sport ?? "",
        )
          ? (profile.sport as Sport)
          : "hockey";
        const firstName = profile.first_name ?? "";

        // ── Training entitlement gate (FV-625) ──
        // Same decision as requireActiveAccess() on every other training
        // surface. Three outcomes:
        //   - entitled ({ redirect: null })      → render + write verified cache
        //   - blocked (allowlisted redirect)     → revoke cache + redirect
        //   - UNVERIFIABLE (network throw, 5xx, non-JSON 200 such as a
        //     captive portal, malformed body, non-allowlisted redirect) →
        //     treated exactly like offline: open only from a cache entry a
        //     previous passed check wrote, otherwise show an error. Never
        //     follows an unknown redirect. This adds no bypass beyond the
        //     documented offline bound — going offline reaches the same
        //     path — and only an explicit "blocked" answer revokes.
        const unverifiable = (message: string) => {
          const cached = readAthleteCache();
          // Fresh profile values (we are online enough to have read them);
          // the verified entry is what authorizes it.
          if (cached?.entitlementVerified) {
            setState({ kind: "ready", sport, firstName });
          } else {
            setState({ kind: "error", message });
          }
        };

        const accessRes = await fetch("/api/athlete/access", {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });

        if (cancelled) return;

        if (accessRes.status === 401 || accessRes.status === 403) {
          router.replace("/signin");
          return;
        }
        if (!accessRes.ok) {
          unverifiable(`access check ${accessRes.status}`);
          return;
        }

        let access: unknown;
        try {
          access = await accessRes.json();
        } catch (parseErr) {
          // A body that dies mid-stream is a network error (catch below);
          // anything else (HTML from a captive portal, etc.) is unverifiable.
          if (isNetworkError(parseErr)) throw parseErr;
          if (cancelled) return;
          unverifiable("Unreadable access response");
          return;
        }
        if (cancelled) return;

        const redirectTo =
          typeof access === "object" && access !== null && "redirect" in access
            ? (access as { redirect: unknown }).redirect
            : undefined;

        if (redirectTo !== null) {
          if (isTrainingBlockedRedirect(redirectTo)) {
            // Revoke offline pregame on this device, then go where every
            // other training surface sends a blocked athlete.
            clearAthleteCache();
            router.replace(redirectTo);
            return;
          }
          // Malformed / unexpected answer — never follow it.
          unverifiable("Unexpected access response");
          return;
        }

        // Entitled. Cache for future offline use (device-local, non-network).
        writeAthleteCache({ sport, firstName, entitlementVerified: true });

        setState({ kind: "ready", sport, firstName });
      } catch (err) {
        if (cancelled) return;

        // Thrown network error (e.g. the access-check fetch) → offline path.
        // FV-625: only an entry written after a passed online entitlement
        // check unlocks offline pregame; a pre-FV-625 entry (no marker) is
        // treated like no cache.
        if (isNetworkError(err)) {
          openFromVerifiedCacheOrConnectFirst();
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
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/55">
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
        {/* FV-486: was "ready at the rink". This shell renders BEFORE the
            athlete's sport is resolved (that's why we're here — no cache, no
            network), so there is no SportConfig to thread. Sport-neutral is
            the only correct answer. */}
        <p className="font-body text-[14px] leading-[1.55] text-cream/60">
          Open the pregame session once while connected so it&rsquo;s ready
          when you have no signal.
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
