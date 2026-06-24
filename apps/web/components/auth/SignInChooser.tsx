"use client";
// client: useState to toggle between parent and athlete sign-in

import { useState } from "react";

import { AthleteUsernameSignInForm } from "./AthleteUsernameSignInForm";
import { SignInForm } from "./SignInForm";

type Tab = "parent" | "athlete";

/**
 * FV-320: Sign-in chooser shown when there is no device cookie.
 *
 * Most sign-ins (device-cookie athletes) never reach this — they get the
 * single-field AthleteSignInForm directly. This chooser is for:
 *   - Parents signing in from any browser.
 *   - Athletes signing in on a new/un-paired device with username + password.
 *
 * Implemented as a two-button toggle group (aria-pressed) rather than an ARIA
 * tablist: a tablist carries a roving-tabindex + arrow-key contract that adds
 * complexity with no benefit for a two-option switcher. Two independently
 * Tab-focusable toggle buttons in a labelled group are simpler and fully
 * keyboard-operable (Tab + Space/Enter), with state announced via aria-pressed.
 * Defaults to "Parent" — the most common no-cookie visitor.
 */
export function SignInChooser() {
  const [active, setActive] = useState<Tab>("parent");

  const tabClass = (isActive: boolean) =>
    `flex-1 rounded-md py-2 font-heading font-semibold text-[13px] uppercase tracking-[0.08em] transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
      isActive
        ? "bg-charcoal text-cream shadow-sm"
        : "text-cream/70 hover:text-cream"
    }`;

  return (
    <div>
      {/* Toggle group — parent vs athlete sign-in */}
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
        <SignInForm />
      </div>
      <div hidden={active !== "athlete"}>
        <AthleteUsernameSignInForm />
      </div>
    </div>
  );
}
