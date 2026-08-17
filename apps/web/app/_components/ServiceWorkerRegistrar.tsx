"use client";
// client: needs browser API (navigator.serviceWorker) + window event listener.

/**
 * ServiceWorkerRegistrar (FV-105; FV-494 controllerchange reload)
 *
 * Mounts invisibly in the root layout. Registers public/sw.js after the page
 * load event so it never blocks the critical rendering path.
 *
 * Update flow:
 *   When the browser finds a new SW (new deploy), it installs it in the
 *   background. The new SW calls self.skipWaiting() on install and
 *   clients.claim() on activate, so it takes over live pages immediately —
 *   and its activate handler purges the previous CACHE_VERSION cache.
 *
 * FV-494 — the takeover must be completed, not half-applied. Once the new SW
 * claims a page that an OLD deploy rendered, that page's prefetch cache and
 * lazy-load chunk references point at assets that were just purged from Cache
 * Storage and 404 on the new deployment. The next link tap then aborts
 * client-side routing and forces a full document navigation — which on a weak
 * connection stalls with no feedback ("links stop working", beta report).
 * So on `controllerchange` for an ALREADY-CONTROLLED page (a deploy takeover,
 * never the first install's claim) we reload once, at a safe moment, so HTML,
 * JS runtime, prefetch cache, and Cache Storage agree again. "Safe moment"
 * means: never while a guided session is in progress. The clip player marks
 * its <audio> element with data-fv-guided-session="active" for the session's
 * whole lifetime — the marker survives OS-initiated pauses (phone call,
 * Control Center) and screen lock, both of which this architecture treats as
 * interruptions to resume from, NOT as the session being over (`paused` is
 * deliberately not consulted here for that reason). A deferred reload fires
 * once the session is over: on the clip player's "fv:guided-session-end"
 * signal if the app is backgrounded, else on the next visibilitychange to
 * hidden with no active session.
 *
 * Privacy: this component has NO analytics, NO fingerprinting, NO external
 * requests. It only calls navigator.serviceWorker.register(). Complies with
 * kids-privacy-officer requirements for minor-reachable routes.
 */

import { useEffect } from "react";

import { reloadPage } from "@/lib/reload-page";

/**
 * True while a guided pregame/practice session is in progress. The clip
 * player (useClipPlayer) sets data-fv-guided-session="active" on its hidden
 * <audio> element from creation until `ended`/unmount. Deliberately NOT a
 * `paused` check: an OS-initiated pause (phone call, Control Center) or a
 * screen lock leaves the session in progress by design.
 */
function isGuidedSessionActive(): boolean {
  return (
    document.querySelector('audio[data-fv-guided-session="active"]') !== null
  );
}

export function ServiceWorkerRegistrar() {
  // FV-494 — one-shot reload when a NEW service worker takes over a page that
  // was already controlled by a previous one (i.e. a deploy landed mid-session).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // If the page is not yet controlled, the first controllerchange is the
    // initial install claiming this page — same build, nothing stale — so it
    // must NOT reload. Only takeovers of an already-controlled page do.
    let wasControlled = !!navigator.serviceWorker.controller;
    let reloaded = false;
    let reloadPending = false;

    const reloadNow = () => {
      if (reloaded) return;
      reloaded = true;
      reloadPage();
    };

    const onControllerChange = () => {
      if (!wasControlled) {
        wasControlled = true;
        return;
      }
      if (isGuidedSessionActive()) {
        // Mid-session: never interrupt — not for a screen lock, not for a
        // phone call. Defer until the session is over (see handlers below).
        reloadPending = true;
        return;
      }
      reloadNow();
    };

    // Deferred-reload triggers. Both re-check the session marker so a screen
    // lock (hidden + still playing) or an OS pause (athlete will resume)
    // never yanks a live session:
    //   - hidden + no active session → the app is backgrounded and nothing is
    //     in flight; reload invisibly.
    //   - session just ended while the app is hidden (finished in a pocket /
    //     locked screen) → reload invisibly. If it ends in the foreground we
    //     keep waiting for the next hidden so the completion screen isn't
    //     snatched away.
    const onVisibilityChange = () => {
      if (
        reloadPending &&
        document.visibilityState === "hidden" &&
        !isGuidedSessionActive()
      ) {
        reloadNow();
      }
    };

    const onGuidedSessionEnd = () => {
      if (reloadPending && document.visibilityState === "hidden") {
        reloadNow();
      }
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fv:guided-session-end", onGuidedSessionEnd);
    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fv:guided-session-end", onGuidedSessionEnd);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      // Browser doesn't support SW (very rare in 2026, but safe-guard).
      return;
    }

    // Register after the load event so the SW installation never competes
    // with the initial page resources (fonts, CSS, critical JS chunks).
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          // scope defaults to the path of sw.js ("/"), which is what we want.
          scope: "/",
        });

        // Log in dev only — never in production output.
        if (process.env.NODE_ENV === "development") {
          console.log("[FV SW] registered:", registration.scope);
        }

        // Listen for a new SW that has installed and is waiting to activate.
        // We rely on skipWaiting() in sw.js; no UI prompt required.
        registration.addEventListener("updatefound", () => {
          const incoming = registration.installing;
          if (!incoming) return;

          incoming.addEventListener("statechange", () => {
            if (
              incoming.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new version is ready; it activates immediately (skipWaiting)
              // and the controllerchange handler above completes the takeover.
              if (process.env.NODE_ENV === "development") {
                console.log("[FV SW] new version installed — taking over.");
              }
            }
          });
        });
      } catch (err) {
        // Registration failure is non-fatal — app continues to work online.
        if (process.env.NODE_ENV === "development") {
          console.warn("[FV SW] registration failed:", err);
        }
      }
    };

    // Defer until after the window "load" event fires.
    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", () => void register(), { once: true });
    }
  }, []); // runs once per mount (root layout = once per tab lifetime)

  // Renders nothing — purely a side-effect component.
  return null;
}
