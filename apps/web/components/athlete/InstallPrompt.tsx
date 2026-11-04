"use client";
// client: browser APIs (navigator.userAgent, window.matchMedia,
// window.addEventListener for beforeinstallprompt, localStorage),
// interactive dismiss state.

/**
 * InstallPrompt (FV-258)
 *
 * A dismissible nudge card rendered on the athlete hub. Links iPhone users to
 * the US App Store and offers Android Home Screen installation.
 *
 * Detection rules:
 *   - Already installed (standalone display mode or iOS navigator.standalone):
 *     render nothing.
 *   - iOS (iPhone/iPad UA), not installed: show the US App Store link.
 *   - Android/Chromium, not installed: listen for `beforeinstallprompt`,
 *     render an "Install" button that calls the native prompt. If the event
 *     never fires (already installed / unsupported), render nothing.
 *   - Desktop or any other context: render nothing.
 *
 * Dismiss: "Not now" writes `fv_install_prompt_dismissed=1` to localStorage.
 * Once dismissed the card never renders again on that device. No re-nag.
 * All localStorage access is guarded in try/catch (private-mode Safari throws).
 *
 * Privacy: no PII is read or written. The dismissed flag is local-only.
 */

import { useEffect, useState } from "react";
import { APP_STORE_URL } from "@/lib/marketing/app-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// reason: BeforeInstallPromptEvent is not in the TypeScript DOM lib
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Variant = "ios" | "android" | "none";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DISMISSED_KEY = "fv_install_prompt_dismissed";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true when running in standalone/installed PWA mode. */
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneMediaQuery = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  // reason: navigator.standalone is a non-standard iOS-only property absent
  // from TypeScript's Navigator type
  const standaloneNav =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMediaQuery || standaloneNav;
}

/** Returns true when the device is iOS (iPhone, iPad, iPod). */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Returns true when the device is Android. Desktop Chrome/Edge also fires
 *  beforeinstallprompt but we only want to show the card on actual Android
 *  handsets — desktop users have no "Home Screen" concept. */
function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Returns true when the dismiss flag is set in localStorage. */
function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persists the dismiss flag to localStorage. */
function setDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Private-mode Safari may throw; dismiss is still honoured for the session
    // via local state — just won't persist across page loads in that context.
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InstallPrompt() {
  const [variant, setVariant] = useState<Variant>("none");
  const [dismissed, setDismissedState] = useState(false);
  // Stashed beforeinstallprompt event for Android/Chromium native install.
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Guard: server-side render or already dismissed.
    if (isDismissed()) return;

    // The Capacitor bridge is injected before app JavaScript in native shells.
    // Never ask someone already using the native app to download it.
    if (Object.prototype.hasOwnProperty.call(window, "Capacitor")) return;

    // Guard: already installed — nothing to prompt.
    if (isInstalled()) return;

    if (isIos()) {
      // iOS Safari in browser (not installed): show the App Store link.
      setVariant("ios");
      return;
    }

    // Android / Chromium: wait for the browser's beforeinstallprompt event.
    // Gate on Android UA — desktop Chrome/Edge also fires this event but those
    // users have no Home Screen. If the event never fires (already installed /
    // not eligible / non-Android), variant stays "none".
    if (!isAndroid()) return;

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVariant("android");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  // ---- Handlers -------------------------------------------------------------

  function handleDismiss() {
    setDismissed(); // persist flag to localStorage
    setDismissedState(true); // hide card immediately
  }

  async function handleAndroidInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    // Whether accepted or dismissed, hide the card — the user has acted.
    handleDismiss();
  }

  // ---- Short-circuit: nothing to show ---------------------------------------

  if (dismissed || variant === "none") return null;

  // ---- Render ---------------------------------------------------------------

  return (
    // mb-4 lives here (not in the page wrapper) so the gap only exists when
    // the card is actually rendered — zero CLS/gap for installed/dismissed users.
    <div
      data-testid="install-prompt-card"
      role="region"
      aria-label={variant === "ios" ? "Get the iPhone app" : "Add to Home Screen setup"}
      className="mb-4 rounded-[14px] border border-hairline bg-charcoal px-4 py-4"
    >
      {/* Eyebrow */}
      <p
        aria-live="polite"
        className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/70"
      >
        Quick setup
      </p>

      {/* Heading */}
      <p className="mb-2 font-heading font-semibold text-[15px] text-cream">
        {variant === "ios" ? "Get the iPhone app" : "Train from your Home Screen"}
      </p>

      {variant === "ios" && (
        <>
          <p className="mb-3 font-body text-[14px] leading-[1.6] text-cream/75">
            From Victory is available on the US App Store.
          </p>
          <a
            href={APP_STORE_URL}
            className={[
              "inline-flex min-h-[48px] items-center rounded-pill bg-gold px-5",
              "font-heading font-semibold text-[14px] text-onyx",
              "transition-colors duration-fast ease-out hover:bg-gold-bright active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-gold/50 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-charcoal motion-safe:transition-transform",
            ].join(" ")}
          >
            Download on the App Store
          </a>
        </>
      )}

      {variant === "android" && (
        <>
          <p className="mb-3 font-body text-[14px] leading-[1.6] text-cream/75">
            Add From Victory to your Home Screen for the best experience —
            including training reminders.
          </p>
          <button
            type="button"
            onClick={handleAndroidInstall}
            className={[
              "min-h-[48px] rounded-pill bg-gold px-5 font-heading font-semibold",
              "text-[14px] text-onyx transition-colors duration-fast ease-out",
              "hover:bg-gold-bright active:scale-[0.97]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-gold/50 focus-visible:ring-offset-2",
              "focus-visible:ring-offset-charcoal",
              "motion-safe:transition-transform",
            ].join(" ")}
          >
            Add to Home Screen
          </button>
        </>
      )}

      {/* Dismiss */}
      <div className="mt-3">
        <button
          type="button"
          onClick={handleDismiss}
          className={[
            "min-h-[44px] font-body text-[13px] text-cream/55",
            "hover:text-cream/70 transition-colors duration-fast ease-out",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-gold/40 focus-visible:ring-offset-2",
            "focus-visible:ring-offset-charcoal",
            "bg-transparent border-0 p-0 cursor-pointer",
          ].join(" ")}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
