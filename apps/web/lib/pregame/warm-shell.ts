/**
 * FV-753: save the Pregame page for offline use.
 *
 * The service worker (public/sw.js, `pregame-shell-network-first`) saves the
 * `/athlete/pregame` page when it handles a request for exactly that
 * address. Inside the app the athlete reaches Pregame by tapping a link, and
 * Next.js answers a link tap with a data request to a different address
 * (`/athlete/pregame?_rsc=...`). No request for the page itself is ever made,
 * so nothing is saved, and a cold start with no signal finds no page to open.
 * Seen on an iPhone on 2026-11-16: the worker was running and showed its
 * "You're offline" page where the Pregame should have been.
 *
 * This makes that one request. The worker sees a same-origin GET for
 * `/athlete/pregame`, fetches it, and stores the response under the address a
 * later page load will ask for. Nothing is stored by this function itself.
 *
 * The page is a static shell with no athlete data in it (see the contract in
 * PregameClientShell.tsx). The worker also refuses to store a response that
 * sets a cookie.
 *
 * Call it only after access has been confirmed online. It does nothing
 * without a controlling service worker, and it never throws.
 */

export const PREGAME_SHELL_PATH = "/athlete/pregame";

export async function warmPregameShell(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    if (!("serviceWorker" in navigator)) return false;
    // No controller means no worker would see the request, so the fetch
    // would be wasted. The next online Pregame open tries again.
    if (!navigator.serviceWorker.controller) return false;
    const response = await fetch(PREGAME_SHELL_PATH, {
      method: "GET",
      credentials: "same-origin",
      // Ask the server, not the HTTP cache: the saved page must name the
      // script files of the build that is live now.
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}
