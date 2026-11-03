// client: waitlist form. Submits to a Supabase-backed server action,
// fires an admin notification email, and renders an idempotent success
// state on duplicate submissions.
//
// Supports URL params for pre-filling from /teams CTA:
//   ?role=coach&source=teams&intent=group-pricing
// Also supports a `sport` param: a visitor who arrives with a live sport
// (e.g. a stray link with ?sport=hockey) never sees that sport as a
// selectable waitlist option (FV-517 removed live sports from the select),
// so the form surfaces a routing notice to the trial instead of preselecting
// anything.
"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { FlameMark } from "@/components/ui";
import { LIVE_SPORTS_PROSE } from "./live-sports-prose";
import { SvgIcon } from "./SvgIcon";
import { submitWaitlist, type WaitlistActionState } from "@/lib/actions/waitlist";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

const ROLES = ["Athlete", "Parent", "Coach", "Other"] as const;

// Display labels shown to the user — value submitted stays lowercase via the action.
const ROLE_LABELS: Record<(typeof ROLES)[number], string> = {
  Athlete: "Athlete",
  Parent: "Parent",
  Coach: "Coach / Ministry Leader",
  Other: "Other",
};

// Candidate sports for the waitlist select. Hockey, basketball, golf,
// football, baseball, lacrosse, and soccer are live (SUPPORTED_SPORTS) — the
// waitlist is for sports that are NOT yet live, so those are filtered out
// below. A future live sport (added to SUPPORTED_SPORTS) is excluded here
// automatically without touching this list.
const WAITLIST_SPORT_CANDIDATES = [
  "Swimming",
  "Wrestling",
  "Volleyball",
  "Track & field",
  "Tennis",
] as const;

const LIVE_SPORT_LABELS = new Set(
  SUPPORTED_SPORTS.map((sport) => sportLabel(sport).toLowerCase()),
);

const SPORTS = [
  ...WAITLIST_SPORT_CANDIDATES.filter(
    (label) => !LIVE_SPORT_LABELS.has(label.toLowerCase()),
  ),
  "Other",
] as const;

function isLiveSportValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return SUPPORTED_SPORTS.some(
    (sport) => sport === normalized || sportLabel(sport).toLowerCase() === normalized,
  );
}

export function WaitlistForm() {
  const [state, formAction] = useFormState<WaitlistActionState, FormData>(
    submitWaitlist,
    null,
  );
  const [role, setRole] = useState<(typeof ROLES)[number]>("Athlete");
  const [isTeamsSource, setIsTeamsSource] = useState(false);
  const [hiddenSource, setHiddenSource] = useState("");
  const [hiddenIntent, setHiddenIntent] = useState("");
  const [isLiveSportArrival, setIsLiveSportArrival] = useState(false);

  // Read URL params after mount — avoids SSR/hydration mismatch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get("role");
    const paramSource = params.get("source");
    const paramIntent = params.get("intent");
    const paramSport = params.get("sport");

    if (paramRole === "coach") setRole("Coach");

    if (paramSource) setHiddenSource(paramSource);
    if (paramIntent) setHiddenIntent(paramIntent);

    if (paramSource === "teams") {
      setIsTeamsSource(true);
    }

    if (paramSport && isLiveSportValue(paramSport)) {
      setIsLiveSportArrival(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state?.ok) {
    return (
      <div
        className="rounded-[18px] p-7 text-center"
        style={{
          background:
            "linear-gradient(180deg,rgba(223,175,55,0.08),rgba(223,175,55,0)),var(--bg-elev-2)",
          border: "1px solid rgba(223,175,55,0.3)",
        }}
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 inline-block">
          <FlameMark size={40} />
        </div>
        <h3 className="font-heading font-semibold text-[22px] tracking-[-0.01em] m-0 mb-2 text-cream">
          {state.alreadyOnList
            ? "You're already on the list."
            : "You're on the list."}
        </h3>
        <p className="text-cream/70 m-0">
          {state.alreadyOnList
            ? "Glad you're with us. We'll reach out when your sport is ready."
            : "We'll reach out when your sport is ready. Glad you're here."}
        </p>
      </div>
    );
  }

  const errorField = state && !state.ok ? state.field : undefined;
  const errorMessage = state && !state.ok ? state.error : undefined;

  return (
    <form
      action={formAction}
      noValidate
      className="bg-charcoal border border-hairline rounded-[24px] p-8"
    >
      {/* Teams-source contextual banner */}
      {isTeamsSource && (
        <div
          className="mb-5 rounded-[12px] px-4 py-3 flex items-start gap-3"
          style={{
            background: "rgba(223,175,55,0.07)",
            border: "1px solid rgba(223,175,55,0.28)",
          }}
        >
          <SvgIcon name="zap" size={14} className="text-gold flex-none mt-0.5" />
          <p className="font-body text-[13px] leading-[1.5] text-cream/80 m-0">
            <span className="text-gold font-semibold">Group pricing request.</span>{" "}
            Submit the form and we&rsquo;ll follow up with options for your
            team, church, or sports community.
          </p>
        </div>
      )}

      {/* Live-sport arrival notice — reuses approved copy verbatim
          (Waitlist.tsx bullet + trial CTA link text). Routes to the trial
          instead of preselecting a live sport that no longer appears in the
          select below. */}
      {isLiveSportArrival && (
        <div
          data-testid="live-sport-arrival-notice"
          className="mb-5 rounded-[12px] px-4 py-3 flex items-start gap-3"
          style={{
            background: "rgba(223,175,55,0.07)",
            border: "1px solid rgba(223,175,55,0.28)",
          }}
        >
          <SvgIcon name="flame" size={14} className="text-gold flex-none mt-0.5" />
          <p className="font-body text-[13px] leading-[1.5] text-cream/80 m-0">
            <span className="text-gold font-semibold">
              {LIVE_SPORTS_PROSE}: available now.
            </span>{" "}
            <Link
              href="/signup"
              className="text-cream underline underline-offset-2 hover:text-gold"
            >
              Start your athlete&rsquo;s 14-day free trial
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex items-center gap-2.5 mb-[22px]">
        <FlameMark size={16} />
        <span className="fv-eyebrow gold">Sport waitlist</span>
      </div>
      <h3 className="font-heading font-semibold text-[22px] leading-[1.15] tracking-[-0.01em] m-0 mb-6 text-cream">
        Notify me when my sport is ready.
      </h3>

      <Field id="w-email" label="Email">
        <input
          id="w-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
          maxLength={320}
          aria-invalid={errorField === "email"}
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
        />
      </Field>

      <fieldset className="mt-3.5">
        <legend className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold mb-2">
          I am a
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {ROLES.map((r) => {
            const checked = role === r;
            return (
              <label
                key={r}
                className={`min-h-[44px] flex items-center justify-center px-2 py-2.5 rounded-[10px] text-center cursor-pointer select-none font-mono font-semibold text-[11px] tracking-[0.10em] transition-all duration-base ease-out ${
                  checked
                    ? "text-gold"
                    : "border-hairline text-cream/70 hover:text-cream hover:border-hairline-strong"
                }`}
                style={
                  checked
                    ? {
                        background: "rgba(223,175,55,0.08)",
                        border: "1px solid rgba(223,175,55,0.5)",
                      }
                    : { background: "var(--fv-surface-1)", border: "1px solid var(--fv-hairline)" }
                }
              >
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={checked}
                  onChange={() => setRole(r)}
                  className="sr-only"
                />
                {ROLE_LABELS[r]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field id="w-sport" label="Primary sport">
        <select
          id="w-sport"
          name="sport"
          required
          defaultValue=""
          aria-invalid={errorField === "sport"}
          className="bg-surface-1 border border-hairline rounded-[12px] px-4 py-3.5 text-cream font-body text-[15px] outline-none transition-colors duration-base ease-out w-full focus:border-cobalt focus:ring-2 focus:ring-cobalt/[0.18]"
        >
          <option value="" disabled>
            Choose your sport
          </option>
          {SPORTS.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </Field>

      {/* Hidden metadata — captured in admin email notification */}
      {hiddenSource && (
        <input type="hidden" name="source" value={hiddenSource} />
      )}
      {hiddenIntent && (
        <input type="hidden" name="intent" value={hiddenIntent} />
      )}

      {/* Honeypot — hidden from sighted users + assistive tech.
          Real users leave it blank; bots fill it. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
      >
        <label htmlFor="w-website">
          Website (leave blank)
          <input
            id="w-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label className="flex items-start gap-2.5 mt-4 text-cream/70 text-[13px] leading-snug">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 accent-cobalt cursor-pointer"
          aria-invalid={errorField === "consent"}
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            Terms of Use
          </Link>{" "}
          and acknowledge the{" "}
          <Link
            href="/privacy"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {errorMessage && (
        <div
          role="alert"
          className="mt-3 rounded-[10px] border border-[rgba(229,62,76,0.4)] bg-[rgba(229,62,76,0.08)] px-3.5 py-3 text-[13px] text-[#ffb3b9]"
        >
          {errorMessage}
        </div>
      )}

      <SubmitButton />

      <p className="mt-4 text-cream/55 text-[12px] leading-relaxed">
        By submitting this form, you agree that From Victory may use your information
        to contact you about sport availability and product updates.
        We do not sell your personal information. If you are under 13, a parent or
        guardian should submit this form. See our{" "}
        <Link
          href="/privacy"
          className="text-cream/85 underline underline-offset-2 hover:text-gold transition-colors duration-fast ease-out"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full mt-4 inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Sending…" : "Notify me"}
      {!pending && <SvgIcon name="arrow" size={16} />}
    </button>
  );
}

function Field({
  id,
  label,
  helper,
  children,
}: {
  id: string;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 mt-3.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/50 font-semibold"
      >
        {label}
      </label>
      {helper && (
        <p className="font-body text-[12px] text-cream/55 leading-snug m-0">
          {helper}
        </p>
      )}
      {children}
    </div>
  );
}
