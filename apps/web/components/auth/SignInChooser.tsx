"use client";
// client: view state for the welcome doors vs the existing sign-in forms

import { useState } from "react";

import { Icon } from "@/components/ui";

import { AthleteUsernameSignInForm } from "./AthleteUsernameSignInForm";
import { SignInForm } from "./SignInForm";

type View = "doors" | "signin";

type Door = {
  href: string;
  title: string;
  detail: string;
  testId: string;
};

/**
 * FV-707: signed-out first screen. Three full-width doors, then the existing
 * parent and athlete sign-in forms behind "Sign in".
 *
 * The 18+ door is the existing adult_athlete flow (/signup/athlete). It is
 * omitted when adult signup is off. Under-18 athletes use the invite door.
 * There is no self-serve path for a minor.
 *
 * FV-621: legacyNative still applies only to the credential form (website
 * guidance, no second signup link). The doors themselves are the same in
 * the iOS shell, the Android shell, and the browser.
 */
export function SignInChooser({
  legacyNative = false,
  adultSignupEnabled = false,
  startOnSignIn = false,
}: {
  /** Forwarded to SignInForm (FV-621). */
  legacyNative?: boolean;
  /** ENABLE_ADULT_SIGNUP. Hides the 18+ door when false. */
  adultSignupEnabled?: boolean;
  /** Open the credential form immediately (invalid reset, invalid session). */
  startOnSignIn?: boolean;
}) {
  const [view, setView] = useState<View>(startOnSignIn ? "signin" : "doors");

  if (view === "signin") {
    return <CredentialForms legacyNative={legacyNative} onBack={() => setView("doors")} />;
  }

  const doors: Door[] = [
    {
      href: "/signup",
      title: "I'm a parent",
      detail: "Set up From Victory for my athlete.",
      testId: "signin-door-parent",
    },
    ...(adultSignupEnabled
      ? [
          {
            href: "/signup/athlete",
            title: "I'm 18+ and training myself",
            detail: "Create my own account.",
            testId: "signin-door-adult",
          },
        ]
      : []),
    {
      href: "/invite",
      title: "I have an invite",
      detail: "For athletes under 18. Your parent sent you a link or code.",
      testId: "signin-have-invite",
    },
  ];

  return (
    <div>
      <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-6">
        How will you use From Victory?
      </p>
      <ul className="flex flex-col gap-3 list-none p-0 m-0">
        {doors.map((door) => (
          <li key={door.testId}>
            <a
              href={door.href}
              data-testid={door.testId}
              className="flex w-full items-center justify-between gap-3 min-h-[72px] rounded-xl border border-hairline bg-onyx px-4 py-3.5 no-underline transition-colors duration-fast ease-out hover:border-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
            >
              <span className="min-w-0">
                <span className="block font-heading font-semibold text-[15px] text-cream leading-snug">
                  {door.title}
                </span>
                <span className="block mt-1 font-body text-[13px] text-cream/60 leading-snug">
                  {door.detail}
                </span>
              </span>
              <Icon name="arrowRight" size={18} className="shrink-0 text-gold" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center font-body text-[14px] text-cream/60">
        Already have an account?{" "}
        <button
          type="button"
          data-testid="signin-show-form"
          onClick={() => setView("signin")}
          className="font-body text-[14px] text-gold hover:text-gold-bright bg-transparent border-0 p-0 cursor-pointer underline-offset-2"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

function CredentialForms({
  legacyNative,
  onBack,
}: {
  legacyNative: boolean;
  onBack: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center min-h-[44px] font-heading font-semibold text-[13px] text-cream/70 hover:text-cream bg-transparent border-0 p-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-sm"
      >
        Back
      </button>
      <TabbedSignIn legacyNative={legacyNative} />
    </div>
  );
}

/**
 * Existing parent email/password and athlete username sign-in, unchanged
 * once the person taps Sign in. Invite stays reachable here too.
 */
function TabbedSignIn({ legacyNative }: { legacyNative: boolean }) {
  const [active, setActive] = useState<"parent" | "athlete">("parent");

  const tabClass = (isActive: boolean) =>
    `flex-1 rounded-md py-2 font-heading font-semibold text-[13px] uppercase tracking-[0.08em] transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
      isActive
        ? "bg-charcoal text-cream shadow-sm"
        : "text-cream/70 hover:text-cream"
    }`;

  return (
    <div>
      <div
        role="group"
        aria-label="Sign in as"
        className="flex rounded-lg bg-onyx border border-hairline mb-7 p-1 gap-1"
      >
        <button
          type="button"
          aria-pressed={active === "parent"}
          onClick={() => setActive("parent")}
          className={tabClass(active === "parent")}
          data-testid="signin-tab-parent"
        >
          Parent
        </button>
        <button
          type="button"
          aria-pressed={active === "athlete"}
          onClick={() => setActive("athlete")}
          className={tabClass(active === "athlete")}
          data-testid="signin-tab-athlete"
        >
          Athlete
        </button>
      </div>

      <div hidden={active !== "parent"}>
        <SignInForm legacyNative={legacyNative} />
      </div>
      <div hidden={active !== "athlete"}>
        <AthleteUsernameSignInForm />
      </div>

      <div className="mt-8 pt-6 border-t border-hairline">
        <a
          href="/invite"
          data-testid="signin-have-invite"
          className="flex w-full items-center justify-center min-h-[44px] bg-charcoal text-cream border border-hairline hover:border-cream/30 font-heading font-semibold text-[15px] rounded-pill px-6 no-underline transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          I have an invite
        </a>
      </div>
    </div>
  );
}
