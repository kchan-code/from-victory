"use client";
// client: browser APIs (navigator.serviceWorker, Notification, PushManager,
// window.matchMedia), async subscription management, and local interaction
// state (toggle, hour picker, pending, feedback).

/**
 * ReminderSettings (FV-164)
 *
 * Athlete-facing opt-in daily training reminder settings. Manages:
 *   - Feature detection (SW + PushManager + Notification support)
 *   - iOS install gate (Web Push only works in installed PWA on iOS)
 *   - Permission request on toggle ON (never auto-prompts)
 *   - Subscribe / unsubscribe via savePushReminder / disablePushReminder
 *   - Time update via updateReminderTime (while already enabled)
 *
 * All copy is content-curator-approved (Mentor voice). See FV-164 spec.
 *
 * Privacy: no push subscription keys, endpoints, or notification payload
 * content are logged or sent anywhere by this component. Keys go only to
 * the savePushReminder server action.
 */

import { useState, useTransition } from "react";

import {
  savePushReminder,
  updateReminderTime,
  disablePushReminder,
} from "@/lib/actions/push-reminder";
import { urlBase64ToUint8Array } from "@/lib/push/vapid";
import { formatHour } from "@/lib/push/format";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All 24 hours as option values. */
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

/** Default reminder hour when first enabling — 7:00 PM. */
const DEFAULT_HOUR = 19;

// ---------------------------------------------------------------------------
// Feature / environment detection (all synchronous, safe for SSR guards)
// ---------------------------------------------------------------------------

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Returns true when running in an iOS Safari context that has NOT been added
 * to the Home Screen. Web Push on iOS only works in the installed PWA.
 */
function isIosNotInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  if (!isIos) return false;
  const isStandaloneMediaQuery = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  // Safari on iOS exposes navigator.standalone (non-standard).
  // reason: navigator.standalone is a non-standard iOS-only property absent from TypeScript's Navigator type
  const isStandaloneNav =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !isStandaloneMediaQuery && !isStandaloneNav;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled: boolean;
  label: string;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 select-none"
    >
      {/* Visually hidden native checkbox — keyboard + screen-reader accessible */}
      <input
        id={id}
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {/* Visual track */}
      <span
        aria-hidden="true"
        className={[
          "relative inline-flex h-[30px] w-[52px] flex-shrink-0 rounded-full border transition-colors duration-fast",
          "focus-within:ring-2 focus-within:ring-gold/50 focus-within:ring-offset-2 focus-within:ring-offset-onyx",
          checked
            ? "border-gold/60 bg-gold/20"
            : "border-hairline bg-charcoal",
          disabled ? "opacity-40 cursor-not-allowed" : "",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[3px] h-[22px] w-[22px] rounded-full shadow-sm transition-all duration-fast",
            checked ? "left-[26px] bg-gold" : "left-[3px] bg-cream/40",
          ].join(" ")}
        />
      </span>
      <span className="font-heading text-[15px] font-semibold text-cream">
        {label}
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ReminderSettingsProps {
  initialEnabled: boolean;
  initialHour: number;
}

export default function ReminderSettings({
  initialEnabled,
  initialHour,
}: ReminderSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [hour, setHour] = useState(
    initialEnabled ? initialHour : DEFAULT_HOUR,
  );
  const [feedback, setFeedback] = useState<
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [isPending, startTransition] = useTransition();
  // Tracks which action is in flight, so the aria-live hint announces the
  // correct verb (enabling vs disabling vs changing time).
  const [pendingLabel, setPendingLabel] = useState("Saving…");

  const pushSupported = isPushSupported();
  const iosGate = isIosNotInstalled();
  const toggleDisabled = isPending || !pushSupported || iosGate;

  // ---- Handle toggle -------------------------------------------------------

  async function handleToggle(next: boolean) {
    setFeedback(null);
    setPendingLabel(next ? "Turning on reminders…" : "Turning off reminders…");

    if (next) {
      // --- Enable: request permission → subscribe → save ---
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setFeedback({ type: "error", message: "B7_BLOCKED" });
        return;
      }

      const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!VAPID_KEY) {
        setFeedback({
          type: "error",
          message: "Reminders aren't available yet — try again later.",
        });
        return;
      }

      startTransition(async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
          });

          const json = sub.toJSON();
          if (
            !json.endpoint ||
            !json.keys?.p256dh ||
            !json.keys?.auth
          ) {
            setFeedback({
              type: "error",
              message:
                "Something went wrong with your subscription — try again.",
            });
            return;
          }

          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const result = await savePushReminder({
            subscription: {
              endpoint: json.endpoint,
              keys: {
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
              },
            },
            hour,
            timezone,
          });

          if (result.ok) {
            setEnabled(true);
            setFeedback({
              type: "success",
              message: formatHour(hour),
            });
          } else {
            // Roll back the browser subscription on server failure
            await sub.unsubscribe();
            setFeedback({ type: "error", message: result.error });
          }
        } catch {
          setFeedback({
            type: "error",
            message: "Something went wrong — check your connection and try again.",
          });
        }
      });
    } else {
      // --- Disable: unsubscribe browser + delete row ---
      startTransition(async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
          }
          const result = await disablePushReminder();
          if (result.ok) {
            setEnabled(false);
            setFeedback(null);
          } else {
            setFeedback({ type: "error", message: result.error });
          }
        } catch {
          setFeedback({
            type: "error",
            message: "Something went wrong — try again.",
          });
        }
      });
    }
  }

  // ---- Handle time change --------------------------------------------------

  async function handleHourChange(newHour: number) {
    setHour(newHour);
    setFeedback(null);
    setPendingLabel("Updating time…");
    if (!enabled) return; // only persist if already subscribed

    startTransition(async () => {
      const result = await updateReminderTime(newHour);
      if (result.ok) {
        setFeedback({
          type: "success",
          message: formatHour(newHour),
        });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  // ---- Render --------------------------------------------------------------

  return (
    <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
      {/* Heading + explainer */}
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
        Daily reminder
      </p>
      <h1 className="mb-3 font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[30px] leading-[1.05]">
        Daily reminder
      </h1>
      <p className="mb-8 font-body text-[15px] leading-[1.6] text-cream/70">
        A gentle nudge to step into your training and keep your rhythm. No
        pressure — just a steady reminder.
      </p>

      {/* B8 — rhythm reassurance (always visible) */}
      <div className="mb-8 rounded-[12px] border border-gold/25 bg-gold/[0.05] px-4 py-4">
        <p className="font-body text-[14px] leading-[1.6] text-cream/75">
          Miss a day? Nothing breaks. Your rhythm is yours to pick back up —
          and your standing never depended on a streak.
        </p>
      </div>

      {/* iOS not-installed gate */}
      {iosGate && (
        <div
          role="status"
          className="mb-6 rounded-[12px] border border-hairline bg-charcoal px-4 py-4"
        >
          <p className="font-body text-[14px] leading-[1.6] text-cream/75">
            On iPhone or iPad, reminders work once you add From Victory to your
            Home Screen. Tap Share, then &ldquo;Add to Home Screen,&rdquo; and
            open it from there to turn reminders on.
          </p>
        </div>
      )}

      {/* Push not supported (very old browser) */}
      {!pushSupported && !iosGate && (
        <div
          role="status"
          className="mb-6 rounded-[12px] border border-hairline bg-charcoal px-4 py-4"
        >
          <p className="font-body text-[14px] leading-[1.6] text-cream/70">
            Your browser doesn&apos;t support push notifications. Try opening
            From Victory from your device&apos;s Home Screen.
          </p>
        </div>
      )}

      {/* Toggle card */}
      <div className="mb-4 rounded-[14px] border border-hairline bg-charcoal px-4 py-4">
        <Toggle
          id="reminder-toggle"
          checked={enabled}
          onChange={handleToggle}
          disabled={toggleDisabled}
          label="Daily training reminder"
        />

        {/* Helper text below toggle */}
        {!iosGate && !(!pushSupported && !iosGate) && (
          <p className="mt-3 font-body text-[13px] leading-snug text-cream/45">
            {enabled
              ? "On — we'll nudge you once a day at the time you pick."
              : "Off — no reminders. You can turn this on anytime."}
          </p>
        )}
      </div>

      {/* Time picker — only shown when enabled */}
      {enabled && (
        <div className="mb-6 rounded-[14px] border border-hairline bg-charcoal px-4 py-4">
          <label
            htmlFor="reminder-hour"
            className="mb-3 block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40"
          >
            Remind me at
          </label>
          <select
            id="reminder-hour"
            value={hour}
            disabled={isPending}
            onChange={(e) => handleHourChange(Number(e.target.value))}
            className={[
              "w-full appearance-none rounded-[10px] border px-4",
              "min-h-[52px] font-heading text-[16px] font-semibold text-cream",
              "bg-onyx border-gold/40",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal",
              "transition-colors duration-fast",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          >
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Feedback: success or error */}
      {feedback?.type === "success" && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 rounded-[12px] border border-gold/35 bg-gold/[0.07] px-4 py-3.5"
        >
          <p className="font-body text-[14px] leading-snug text-cream/85">
            You&apos;re set — we&apos;ll nudge you around {feedback.message}.
          </p>
        </div>
      )}

      {feedback?.type === "error" && feedback.message === "B7_BLOCKED" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-[12px] border border-hairline bg-charcoal px-4 py-3.5"
        >
          <p className="font-body text-[14px] leading-[1.6] text-cream/75">
            Notifications are currently turned off in your browser, so we
            can&apos;t send reminders yet. To turn them back on, open your
            browser&apos;s site settings for From Victory and allow
            notifications — then flip this switch on. No rush.
          </p>
        </div>
      )}

      {feedback?.type === "error" && feedback.message !== "B7_BLOCKED" && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-[12px] border border-hairline bg-charcoal px-4 py-3.5"
        >
          <p className="font-body text-[14px] leading-snug text-cream/75">
            {feedback.message}
          </p>
        </div>
      )}

      {/* Loading state hint */}
      {isPending && (
        <p
          aria-live="polite"
          className="mb-4 font-body text-[13px] text-cream/40"
        >
          {pendingLabel}
        </p>
      )}
    </div>
  );
}
