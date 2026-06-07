"use client";
// client: needs browser API (navigator.serviceWorker) + window event listener.

/**
 * ServiceWorkerRegistrar (FV-105)
 *
 * Mounts invisibly in the root layout. Registers public/sw.js after the page
 * load event so it never blocks the critical rendering path.
 *
 * Update flow:
 *   When the browser finds a new SW (new deploy), it installs it in the
 *   background. The new SW calls self.skipWaiting() on install, so it
 *   activates as soon as the page is next opened/refreshed. No in-session
 *   prompt needed — athletes get the update on next launch silently.
 *
 * Privacy: this component has NO analytics, NO fingerprinting, NO external
 * requests. It only calls navigator.serviceWorker.register(). Complies with
 * kids-privacy-officer requirements for minor-reachable routes.
 */

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
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
              // A new version is ready; it will activate on next page open.
              if (process.env.NODE_ENV === "development") {
                console.log("[FV SW] new version ready — activates on next launch.");
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
