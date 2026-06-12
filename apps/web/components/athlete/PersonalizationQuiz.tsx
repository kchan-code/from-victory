"use client";
// client: multi-step local state (step index, selections) + useFormState for
// the final server-action submit + useFormStatus for pending button state.
// React 18 / Next 14 — uses react-dom's useFormState / useFormStatus,
// NOT React 19's useActionState (undefined at runtime here).

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import type { QuizActionState } from "@/lib/actions/athlete-quiz";
import { FOCUS_AREA_KEYS, focusAreaLabel } from "@/lib/quiz-config";
import type { FocusAreaKey } from "@/lib/quiz-config";
import type { Sport } from "@/lib/sports";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PersonalizationQuizProps {
  /** Sport of the athlete — drives position options. */
  sport: Sport;
  /** Roles for the sport from SPORT_REGISTRY.roles — undefined means no picker. */
  roles?: readonly string[];
  /** Pre-existing position value (for settings edit mode). */
  initialPosition?: string | null;
  /** Pre-existing focus_area value (for settings edit mode). */
  initialFocusArea?: string | null;
  /**
   * Server action to call on final submit.
   * onboarding → savePersonalizationQuiz
   * settings   → updatePersonalizationQuiz
   */
  action: (
    prev: QuizActionState,
    formData: FormData,
  ) => Promise<QuizActionState>;
  /** Label for the submit CTA button (default: "DONE"). */
  submitLabel?: string;
  /**
   * href for the back navigation affordance rendered on the first step.
   * Server pages pass a string (e.g. "/athlete/settings"); onboarding omits it.
   * Renders a Next.js Link when present; renders nothing when absent.
   * (Replaces the defunct onBack function prop — server components cannot pass
   * callbacks; use href-based navigation instead.)
   */
  backHref?: string;
  /**
   * When true, the "skip" secondary CTA is labelled destructively
   * ("Clear my answers" / "Clear position") rather than the onboarding
   * "Skip for now" — so the athlete understands the action will null
   * previously saved answers.
   * Settings page passes isEditMode={true}; onboarding omits/passes false.
   */
  isEditMode?: boolean;
}

// ---------------------------------------------------------------------------
// Shared SVG icons
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Option card — reused for both steps
// ---------------------------------------------------------------------------

function OptionCard({
  value,
  label,
  active,
  testId,
  onClick,
}: {
  value: string;
  label: string;
  active: boolean;
  testId?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={testId}
      onClick={onClick}
      className={[
        "flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border px-4 py-3.5 text-left transition-colors duration-fast",
        "motion-safe:active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
        active
          ? "border-gold/55 bg-gold/[0.06]"
          : "border-hairline bg-charcoal",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <span className="block font-heading text-[17px] font-semibold leading-tight text-cream">
          {label}
        </span>
      </div>
      <span
        className={[
          "flex h-[20px] w-[20px] flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-fast",
          active
            ? "border-gold bg-gold text-onyx"
            : "border-cream/20 bg-transparent",
        ].join(" ")}
      >
        {active && <CheckIcon />}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// BackButton — renders as a Link (href) or button (onClick)
// ---------------------------------------------------------------------------

const BACK_BUTTON_CLASS =
  "flex h-[44px] w-[44px] -m-[5px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx hover:text-cream";

function BackButtonLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} aria-label={label} className={BACK_BUTTON_CLASS}>
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
        <ArrowLeftIcon />
      </span>
    </Link>
  );
}

function BackButtonPress({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={BACK_BUTTON_CLASS}
    >
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
        <ArrowLeftIcon />
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// SubmitButton — server submit; useFormStatus drives pending.
// ---------------------------------------------------------------------------

function SubmitButton({ label = "DONE" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      data-testid="quiz-submit-btn"
      disabled={pending}
      className={[
        "inline-flex w-full items-center justify-center gap-2",
        "bg-onyx text-cream border border-gold rounded-[10px]",
        "font-display font-extrabold uppercase tracking-[0.14em] text-[14px]",
        "px-[26px] py-4",
        "transition-transform duration-fast ease-out",
        "motion-safe:active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
        "disabled:opacity-70 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {pending ? "SAVING…" : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ContinueButton — local navigation only (no server submit).
// ---------------------------------------------------------------------------

function ContinueButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid="quiz-continue-btn"
      onClick={onClick}
      className={[
        "inline-flex w-full items-center justify-center gap-2",
        "bg-onyx text-cream border border-gold rounded-[10px]",
        "font-display font-extrabold uppercase tracking-[0.14em] text-[14px]",
        "px-[26px] py-4",
        "transition-transform duration-fast ease-out",
        "motion-safe:active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx",
      ].join(" ")}
    >
      CONTINUE
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * PersonalizationQuiz — two-step onboarding/settings quiz.
 *
 * Step 1 (conditional): Position picker — shown only when `roles` is provided.
 *   The athlete picks their sport position. Always skippable.
 * Step 2: Focus area picker — "What's hard for you right now?"
 *   The athlete picks their primary mental training focus. Always skippable.
 *
 * Skip path: a quiet "Skip for now" secondary CTA — never blocks.
 * Skipping any step submits a null value for that field (columns are nullable).
 *
 * On sports with no roles (or roles is undefined), Step 1 is omitted.
 */
export default function PersonalizationQuiz({
  sport,
  roles,
  initialPosition = null,
  initialFocusArea = null,
  action,
  submitLabel = "DONE",
  backHref,
  isEditMode = false,
}: PersonalizationQuizProps) {
  const hasPositionStep = roles !== undefined && roles.length > 0;

  // Initialise to stored values so settings-edit mode pre-selects them.
  const [position, setPosition] = useState<string | null>(initialPosition ?? null);
  const [focusArea, setFocusArea] = useState<FocusAreaKey | null>(
    initialFocusArea && FOCUS_AREA_KEYS.includes(initialFocusArea as FocusAreaKey)
      ? (initialFocusArea as FocusAreaKey)
      : null,
  );

  const [step, setStep] = useState<"position" | "focus">(
    hasPositionStep ? "position" : "focus",
  );

  const [formState, formAction] = useFormState<QuizActionState, FormData>(
    action,
    null,
  );

  // ── Position step ─────────────────────────────────────────────────────────

  if (step === "position") {
    return (
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-onyx text-cream">
        <div className="flex items-center px-5 pb-3 pt-[58px]">
          {backHref && <BackButtonLink label="Back" href={backHref} />}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-[180px] pt-6">
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            Your Position
          </p>

          <h1 className="mb-2 font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-cream">
            What position do you play?
          </h1>

          <p className="mb-8 font-body text-[15px] leading-[1.55] text-cream/70">
            Your training visualizes your specific role.
          </p>

          <div
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Select your position"
          >
            {(roles ?? []).map((role) => (
              <OptionCard
                key={role}
                value={role}
                label={role}
                active={position === role}
                testId={`quiz-position-${role.toLowerCase()}`}
                onClick={() => setPosition(role)}
              />
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-onyx from-60% to-transparent px-5 pb-8 pt-3.5">
          <ContinueButton onClick={() => setStep("focus")} />
          <button
            type="button"
            data-testid="quiz-skip-position-btn"
            onClick={() => {
              setPosition(null);
              setStep("focus");
            }}
            className="mt-3 inline-flex w-full items-center justify-center rounded-[10px] border border-hairline bg-transparent px-[26px] py-3.5 font-heading text-[14px] font-semibold text-cream/40 transition-colors duration-fast ease-out hover:text-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            {isEditMode ? "Clear position" : "Skip for now"}
          </button>
        </div>
      </div>
    );
  }

  // ── Focus area step ────────────────────────────────────────────────────────

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col bg-onyx text-cream">
      <div className="flex items-center px-5 pb-3 pt-[58px]">
        {hasPositionStep ? (
          <BackButtonPress
            label="Back to position"
            onClick={() => setStep("position")}
          />
        ) : (
          backHref && <BackButtonLink label="Back" href={backHref} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-[180px] pt-6">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Your Focus
        </p>

        <h1 className="mb-2 font-heading text-[28px] font-semibold leading-[1.1] tracking-[-0.01em] text-cream">
          What&apos;s hard for you right now?
        </h1>

        <p className="mb-8 font-body text-[15px] leading-[1.55] text-cream/70">
          Your training will be built around it.
        </p>

        <div
          className="flex flex-col gap-2"
          role="radiogroup"
          aria-label="Select what's hard for you right now"
        >
          {FOCUS_AREA_KEYS.map((key) => (
            <OptionCard
              key={key}
              value={key}
              label={focusAreaLabel(key)}
              active={focusArea === key}
              testId={`quiz-focus-${key}`}
              onClick={() => setFocusArea(key)}
            />
          ))}
        </div>

        {formState?.ok === false && (
          <div
            role="alert"
            className="mt-5 rounded-[10px] border border-gold/40 px-4 py-3 font-body text-[13px] leading-snug text-cream/80"
          >
            {formState.error}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-onyx from-60% to-transparent px-5 pb-8 pt-3.5">
        {/* Primary submit form — carries position + current focusArea selection. */}
        <form action={formAction}>
          <input type="hidden" name="position" value={position ?? ""} />
          <input type="hidden" name="focus_area" value={focusArea ?? ""} />
          <SubmitButton label={submitLabel} />
        </form>

        {/*
         * Secondary CTA: in onboarding this is "Skip for now" (the fields are
         * blank anyway). In edit/settings mode it is labelled "Clear my answers"
         * to make the destructive intent explicit — the athlete understands this
         * will null previously saved answers, not just skip a blank step.
         * A separate <form> keeps this path independent of the primary form's
         * state and avoids JS timing issues with setFocusArea.
         * Both forms target the same formAction — the server action receives
         * focus_area="" which it normalises to null.
         */}
        <form action={formAction}>
          <input type="hidden" name="position" value={position ?? ""} />
          <input type="hidden" name="focus_area" value="" />
          <button
            type="submit"
            data-testid="quiz-skip-focus-btn"
            className="mt-3 inline-flex w-full items-center justify-center rounded-[10px] border border-hairline bg-transparent px-[26px] py-3.5 font-heading text-[14px] font-semibold text-cream/40 transition-colors duration-fast ease-out hover:text-cream/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            {isEditMode ? "Clear my answers" : "Skip for now"}
          </button>
        </form>
      </div>
    </div>
  );
}
