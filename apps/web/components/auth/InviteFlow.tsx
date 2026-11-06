"use client";
// client: reads the code from the URL fragment (never sent to the server),
// drives the check → setup steps, and the install/continue chooser.

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";

import { AppStoreBadge } from "@/components/landing/AppStoreBadge";
import { checkInvite, type CheckInviteState } from "@/lib/actions/invites";
import { formatInviteCode } from "@/lib/invites/code";
import { INVITE_PATH, readCodeFromHash } from "@/lib/invites/universal-link";

import { Field } from "./Field";
import { InviteSetupForm } from "./InviteSetupForm";
import { SubmitButton } from "./SubmitButton";

const initialState: CheckInviteState = null;

type Props = {
  /** Rendering inside the native app shell (UA hint; presentation only). */
  nativeShell: boolean;
};

/**
 * FV-630 athlete invite flow.
 *
 *   In the app:     code (from the link, or typed) → setup → /athlete.
 *   In a browser
 *   with a code:    choose: get the app (code shown to type in after install;
 *                   the App Store does not carry the invite through), or
 *                   continue in the browser.
 *   In a browser
 *   without code:   type the code.
 */
export function InviteFlow({ nativeShell }: Props) {
  const [state, formAction] = useFormState(checkInvite, initialState);
  const [checking, startTransition] = useTransition();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [hashRead, setHashRead] = useState(false);
  const [continueHere, setContinueHere] = useState(nativeShell);
  const [copied, setCopied] = useState(false);
  const autoChecked = useRef(false);

  // Read the code once from the fragment, then drop it from the address bar
  // and history so it isn't left behind on a shared device.
  useEffect(() => {
    const code = readCodeFromHash(window.location.hash);
    if (window.location.hash) {
      window.history.replaceState(null, "", INVITE_PATH);
    }
    setLinkCode(code);
    setHashRead(true);

    // Opening another invite link while already on /invite is a same-document
    // fragment change (no page load). Reload so the new code is read fresh.
    const onHashChange = () => {
      if (readCodeFromHash(window.location.hash)) window.location.reload();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Auto-check a code that arrived by link once the athlete is continuing
  // here (immediately in the app; after "Continue in browser" on the web).
  useEffect(() => {
    if (!hashRead || !linkCode || !continueHere || autoChecked.current) return;
    autoChecked.current = true;
    const fd = new FormData();
    fd.set("code", linkCode);
    startTransition(() => formAction(fd));
  }, [hashRead, linkCode, continueHere, formAction]);

  if (state && state.ok) {
    return (
      <InviteSetupForm
        code={state.code}
        firstName={state.firstName}
        mode={state.mode}
        username={state.username}
      />
    );
  }

  // A linked code is being checked: show that, not a prefilled form that
  // flashes and disappears.
  if (!hashRead || (checking && linkCode && continueHere && !state)) {
    return (
      <p className="font-body text-cream/60 text-[15px]" role="status">
        {hashRead ? "Checking your invite…" : "Loading…"}
      </p>
    );
  }

  // Browser, arrived by link: install or continue.
  if (linkCode && !continueHere) {
    const display = formatInviteCode(linkCode);
    return (
      <div data-testid="invite-install-chooser">
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-5">
          Train in the From Victory app on iPhone, or keep going here in your
          browser.
        </p>

        <div className="bg-onyx border border-hairline rounded-xl p-5 mb-5">
          <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold mb-2">
            Your invite code
          </p>
          <p
            data-testid="invite-chooser-code"
            className="font-mono text-[18px] sm:text-[22px] tracking-[0.04em] text-cream mb-3 select-all whitespace-nowrap"
          >
            {display}
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(display);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              } catch {
                // Clipboard unavailable; the code is selectable.
              }
            }}
            className="font-heading font-semibold text-[13px] text-cream/80 hover:text-cream bg-charcoal border border-hairline hover:border-cream/30 rounded-pill px-4 min-h-[44px]"
          >
            {copied ? "Code copied" : "Copy code"}
          </button>
          <p className="font-body text-cream/55 text-[13px] leading-relaxed mt-3">
            After you install the app, open it, tap{" "}
            <span className="text-cream">I have an invite</span>, and enter
            this code. Or tap the link again once the app is installed.
          </p>
        </div>

        <div className="mb-6">
          <AppStoreBadge />
        </div>

        <button
          type="button"
          onClick={() => setContinueHere(true)}
          data-testid="invite-continue-browser"
          className="w-full bg-charcoal text-cream border border-hairline hover:border-cream/30 font-heading font-semibold text-[15px] rounded-pill px-6 py-3 transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          Continue in browser
        </button>
      </div>
    );
  }

  // Code entry (typed, or the auto-check result for a linked code).
  const error = state && !state.ok ? state.error : undefined;
  return (
    <div>
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-5">
        Enter the code your parent sent you. It&rsquo;s 16 letters and
        numbers.
      </p>
      <form action={formAction} noValidate data-testid="invite-code-form">
        <Field
          id="code"
          name="code"
          label="Invite code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          placeholder="XXXX-XXXX-XXXX-XXXX"
          defaultValue={linkCode ? formatInviteCode(linkCode) : undefined}
          error={error}
        />
        <SubmitButton pendingLabel="Checking…">Continue</SubmitButton>
      </form>
      {!nativeShell ? (
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mt-6">
          On iPhone? Get the app, then tap{" "}
          <span className="text-cream">I have an invite</span>.
        </p>
      ) : null}
    </div>
  );
}
