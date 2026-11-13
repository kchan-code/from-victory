"use client";
// client: reads the code from the URL fragment (never sent to the server),
// drives the check → setup steps, and the install/continue chooser.

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";

import { StoreDownloadBadges } from "@/components/landing/StoreDownloadBadges";
import { checkInvite, type CheckInviteState } from "@/lib/actions/invites";
import { formatInviteCode } from "@/lib/invites/code";
import { INVITE_PATH, readCodeFromHash } from "@/lib/invites/universal-link";
import {
  detectStorePlatform,
  type StorePlatform,
} from "@/lib/marketing/store-platform";

import { Field } from "./Field";
import {
  InviteInstallChooser,
  InviteSignedInNote,
} from "./InviteInstallChooser";
import { InviteSetupForm } from "./InviteSetupForm";
import { SubmitButton } from "./SubmitButton";

const initialState: CheckInviteState = null;

type Props = {
  /** Rendering inside the native app shell (UA hint; presentation only). */
  nativeShell: boolean;
  /**
   * Platform from the request User-Agent. iPhone and Android are trusted on
   * first paint. Desktop stays unresolved until the client confirms it is
   * not an iPad reporting a Macintosh UA, so both badges never flash.
   */
  initialPlatform?: StorePlatform;
  /** Someone is already signed in on this device. Presentation only. */
  signedIn?: boolean;
};

/**
 * FV-630 athlete invite flow.
 *
 *   In the app:     code (from the link, or typed) → setup → /athlete.
 *   In a browser
 *   with a code:    get the app for this device. On iPhone, the next step
 *                   is to tap the link again (opens setup; they still set
 *                   a password). Typing the code is the fallback. On
 *                   Android, typing the code is the main step. Or finish
 *                   setup on this page.
 *   In a browser
 *   without code:   type the code. Store badges match the device.
 */
export function InviteFlow({
  nativeShell,
  initialPlatform,
  signedIn = false,
}: Props) {
  const [state, formAction] = useFormState(checkInvite, initialState);
  const [checking, startTransition] = useTransition();
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [hashRead, setHashRead] = useState(false);
  const [platform, setPlatform] = useState<StorePlatform | null>(
    initialPlatform ?? null,
  );
  // iPhone and Android UAs are decisive on the server. A desktop UA is not:
  // iPadOS can report Macintosh until the client sees touch points.
  const [platformResolved, setPlatformResolved] = useState(
    initialPlatform === "ios" || initialPlatform === "android",
  );
  const [continueHere, setContinueHere] = useState(nativeShell);
  const [copied, setCopied] = useState(false);
  const autoChecked = useRef(false);

  // Read the code once from the fragment, then drop it from the address bar
  // and history so it isn't left behind on a shared device.
  useEffect(() => {
    setPlatform(
      detectStorePlatform(navigator.userAgent, navigator.maxTouchPoints),
    );
    setPlatformResolved(true);
    // Read before clearing. Next.js dev remounts once (Strict Mode); if the
    // fragment is wiped in the first effect, the second mount sees no code.
    // The clear is deferred and cancelled on cleanup so both passes read it.
    const code = readCodeFromHash(window.location.hash);
    let cancelClear = false;
    queueMicrotask(() => {
      if (cancelClear) return;
      if (window.location.hash) {
        window.history.replaceState(null, "", INVITE_PATH);
      }
    });
    setLinkCode(code);
    setHashRead(true);

    // Opening another invite link while already on /invite is a same-document
    // fragment change (no page load). Reload so the new code is read fresh.
    const onHashChange = () => {
      if (readCodeFromHash(window.location.hash)) window.location.reload();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      cancelClear = true;
      window.removeEventListener("hashchange", onHashChange);
    };
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

  const badgePlatform: StorePlatform | null = platformResolved ? platform : null;

  if (state && state.ok) {
    return (
      <>
        <InviteSetupForm
          code={state.code}
          firstName={state.firstName}
          mode={state.mode}
          username={state.username}
        />
        {signedIn ? <InviteSignedInNote /> : null}
      </>
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

  // Browser, arrived by link: install first, code second, browser last.
  if (linkCode && !continueHere) {
    const display = formatInviteCode(linkCode);
    return (
      <InviteInstallChooser
        displayCode={display}
        platform={badgePlatform}
        copied={copied}
        signedIn={signedIn}
        onCopy={async () => {
          try {
            await navigator.clipboard.writeText(display);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard unavailable; the code is selectable.
          }
        }}
        onContinueInBrowser={() => setContinueHere(true)}
      />
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
        <div className="mt-8 border-t border-hairline pt-5">
          <p className="font-body font-normal text-cream/80 text-[15px] leading-relaxed mb-3">
            You can also get the From Victory app. Open it, tap I have an
            invite on the welcome screen, and enter your invite code.
          </p>
          <StoreDownloadBadges platform={badgePlatform} />
        </div>
      ) : null}
      {signedIn ? <InviteSignedInNote /> : null}
    </div>
  );
}
