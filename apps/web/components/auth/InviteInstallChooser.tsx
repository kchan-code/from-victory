"use client";

import { useState } from "react";

import { StoreDownloadBadges } from "@/components/landing/StoreDownloadBadges";
import type { StorePlatform } from "@/lib/marketing/store-platform";

type Props = {
  displayCode: string;
  /** null until detection finishes. Never means "show both stores". */
  platform: StorePlatform | null;
  copied: boolean;
  onCopy: () => void;
  onContinueInBrowser: () => void;
  signedIn?: boolean;
};

type PhoneKind = "ios" | "android";

/**
 * Browser install chooser for an invite link (FV-687, redesigned FV-686).
 *
 * iPhone, when the app is installed: tapping the link again opens setup.
 * The athlete still chooses a username and password. Android has no App
 * Links yet (FV-632), so typing the code is the path.
 *
 * "I have an invite" is a door on the welcome screen (SignInChooser), in
 * the app and in the browser. It is not buried on the credential form.
 */
export function InviteInstallChooser({
  displayCode,
  platform,
  copied,
  onCopy,
  onContinueInBrowser,
  signedIn = false,
}: Props) {
  const [typedCodeOpen, setTypedCodeOpen] = useState(false);
  const [desktopPhone, setDesktopPhone] = useState<PhoneKind>("ios");

  return (
    <div
      data-testid="invite-install-chooser"
      data-platform={platform ?? "pending"}
    >
      <p className="font-body font-normal text-cream/80 text-[16px] leading-relaxed mb-6 m-0">
        Train in the From Victory app.
      </p>

      {platform === null ? (
        <ol
          aria-label="How to use your invite"
          data-testid="invite-steps"
          className="m-0 flex list-none flex-col gap-6 p-0"
        >
          <GetAppStep n={1} title="Get the app." platform={null} />
        </ol>
      ) : platform === "ios" ? (
        <IphoneSteps
          displayCode={displayCode}
          copied={copied}
          onCopy={onCopy}
          typedCodeOpen={typedCodeOpen}
          onToggleTypedCode={() => setTypedCodeOpen((open) => !open)}
        />
      ) : platform === "android" ? (
        <AndroidSteps
          displayCode={displayCode}
          copied={copied}
          onCopy={onCopy}
          enterLabel="Enter this code."
          prominentCopy
        />
      ) : (
        <DesktopSteps
          phone={desktopPhone}
          onPhone={setDesktopPhone}
          displayCode={displayCode}
          copied={copied}
          onCopy={onCopy}
        />
      )}

      <Footer
        signedIn={signedIn}
        onContinueInBrowser={onContinueInBrowser}
      />
    </div>
  );
}

export function InviteSignedInNote() {
  return (
    <p
      data-testid="invite-signed-in-note"
      className="font-body font-normal text-[13px] leading-relaxed text-cream/45 mt-3 mb-0"
    >
      Someone is signed in on this device. Finishing this invite signs them
      out here and signs in the invited athlete.
    </p>
  );
}

function IphoneSteps({
  displayCode,
  copied,
  onCopy,
  typedCodeOpen,
  onToggleTypedCode,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
  typedCodeOpen: boolean;
  onToggleTypedCode: () => void;
}) {
  return (
    <>
      <ol
        aria-label="How to use your invite"
        data-testid="invite-steps"
        className="m-0 flex list-none flex-col gap-6 p-0"
      >
        <GetAppStep n={1} title="Get the app." platform="ios" />
        <li data-testid="invite-step-reopen" className="flex gap-3">
          <StepNumber n={2} />
          <div className="min-w-0 flex-1">
            <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
              Tap your invite link again.
            </p>
            <p className="font-body font-normal text-cream/60 text-[14px] leading-relaxed mt-1 mb-0">
              The app opens your setup. No code needed.
            </p>
          </div>
        </li>
      </ol>

      <div className="mt-6 border-t border-hairline pt-4">
        <button
          type="button"
          aria-expanded={typedCodeOpen}
          aria-controls="invite-type-code-panel"
          data-testid="invite-type-code"
          onClick={onToggleTypedCode}
          className="flex w-full items-center justify-between gap-3 min-h-[44px] bg-transparent border-0 p-0 font-heading font-semibold text-[15px] text-cream cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-sm"
        >
          Rather type a code?
          <Chevron open={typedCodeOpen} />
        </button>
        {typedCodeOpen ? (
          <div id="invite-type-code-panel" className="mt-3">
            <p className="font-body font-normal text-cream/80 text-[15px] leading-relaxed m-0">
              Open From Victory, tap{" "}
              <span className="text-gold">I have an invite</span>, and enter
              this code.
            </p>
            <CodeRow
              displayCode={displayCode}
              copied={copied}
              onCopy={onCopy}
              copyLabel="Copy"
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

function AndroidSteps({
  displayCode,
  copied,
  onCopy,
  enterLabel,
  prominentCopy,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
  enterLabel: string;
  prominentCopy: boolean;
}) {
  return (
    <ol
      aria-label="How to use your invite"
      data-testid="invite-steps"
      className="m-0 flex list-none flex-col gap-6 p-0"
    >
      <GetAppStep n={1} title="Get the app." platform="android" />
      <li data-testid="invite-step-open" className="flex gap-3">
        <StepNumber n={2} />
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
            Open From Victory and tap I have an invite.
          </p>
          <p className="font-body font-normal text-cream/60 text-[14px] leading-relaxed mt-1 mb-0">
            It&rsquo;s on the welcome screen.
          </p>
        </div>
      </li>
      <li data-testid="invite-step-code" className="list-none">
        <div className="flex gap-3">
          <StepNumber n={3} />
          <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0 min-w-0 flex-1">
            {enterLabel}
          </p>
        </div>
        {prominentCopy ? (
          <div className="mt-3">
            <ProminentCodeCard
              displayCode={displayCode}
              copied={copied}
              onCopy={onCopy}
            />
          </div>
        ) : null}
      </li>
    </ol>
  );
}

function DesktopSteps({
  phone,
  onPhone,
  displayCode,
  copied,
  onCopy,
}: {
  phone: PhoneKind;
  onPhone: (phone: PhoneKind) => void;
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <>
      <ol
        aria-label="How to use your invite"
        data-testid="invite-steps"
        className="m-0 flex list-none flex-col gap-6 p-0"
      >
        <GetAppStep
          n={1}
          title="Get the app on your phone."
          platform="unknown"
        />
      </ol>

      <div className="mt-6 border-t border-hairline pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body font-normal text-[14px] text-cream/70 m-0">
            Then, on your phone:
          </p>
          <div
            role="group"
            aria-label="Phone type"
            data-testid="invite-device-toggle"
            className="inline-flex items-center rounded-pill border border-hairline bg-onyx p-1"
          >
            <ToggleButton
              pressed={phone === "ios"}
              testId="invite-device-ios"
              onClick={() => onPhone("ios")}
            >
              iPhone
            </ToggleButton>
            <ToggleButton
              pressed={phone === "android"}
              testId="invite-device-android"
              onClick={() => onPhone("android")}
            >
              Android
            </ToggleButton>
          </div>
        </div>

        <ol
          aria-label="On your phone"
          className="m-0 mt-5 flex list-none flex-col gap-6 p-0"
        >
          {phone === "ios" ? (
            <li data-testid="invite-step-reopen" className="flex gap-3">
              <StepNumber n={2} />
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
                  Tap your invite link again.
                </p>
                <p className="font-body font-normal text-cream/60 text-[14px] leading-relaxed mt-1 mb-0">
                  The app opens your setup. No code needed.
                </p>
              </div>
            </li>
          ) : (
            <>
              <li data-testid="invite-step-open" className="flex gap-3">
                <StepNumber n={2} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
                    Open From Victory and tap I have an invite.
                  </p>
                  <p className="font-body font-normal text-cream/60 text-[14px] leading-relaxed mt-1 mb-0">
                    It&rsquo;s on the welcome screen.
                  </p>
                </div>
              </li>
              <li data-testid="invite-step-enter" className="flex gap-3">
                <StepNumber n={3} />
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
                    Enter the code below.
                  </p>
                </div>
              </li>
            </>
          )}
        </ol>

        <DesktopCodeCard
          displayCode={displayCode}
          copied={copied}
          onCopy={onCopy}
        />
      </div>
    </>
  );
}

function GetAppStep({
  n,
  title,
  platform,
}: {
  n: number;
  title: string;
  platform: StorePlatform | null;
}) {
  const both = platform === "unknown";
  return (
    <li data-testid="invite-step-get-app" className="list-none">
      <div className="flex gap-3">
        <StepNumber n={n} />
        <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0 min-w-0 flex-1">
          {title}
        </p>
      </div>
      <div className={both ? "mt-3 sm:pl-10" : "mt-3 pl-10"}>
        <StoreDownloadBadges
          platform={platform}
          className={both ? "gap-1 sm:gap-3" : "gap-3"}
        />
      </div>
    </li>
  );
}

function Footer({
  signedIn,
  onContinueInBrowser,
}: {
  signedIn: boolean;
  onContinueInBrowser: () => void;
}) {
  return (
    <div className="mt-8 border-t border-hairline pt-5">
      <button
        type="button"
        onClick={onContinueInBrowser}
        data-testid="invite-continue-browser"
        className="inline-flex items-center min-h-[44px] bg-transparent border-0 p-0 font-body font-normal text-[14px] text-cream/60 underline decoration-cream/25 hover:text-cream hover:decoration-cream cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
      >
        Continue in browser
      </button>
      {signedIn ? <InviteSignedInNote /> : null}
    </div>
  );
}

function CodeRow({
  displayCode,
  copied,
  onCopy,
  copyLabel,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-hairline bg-onyx px-3 py-2">
      <p
        data-testid="invite-chooser-code"
        className="font-mono text-[15px] tracking-[0.03em] text-cream m-0 min-w-0 select-all"
      >
        {displayCode}
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="ml-auto inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill border border-hairline bg-charcoal px-4 min-h-[44px] font-heading font-semibold text-[13px] text-cream hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {copied ? "Copied" : copyLabel}
      </button>
    </div>
  );
}

function ProminentCodeCard({
  displayCode,
  copied,
  onCopy,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-hairline bg-onyx p-4">
      <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-cream/55 mb-2 m-0">
        Your invite code
      </p>
      <p
        data-testid="invite-chooser-code"
        className="font-mono text-[18px] sm:text-[22px] tracking-[0.03em] text-cream mb-4 whitespace-nowrap select-all"
      >
        {displayCode}
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex w-full items-center justify-center font-heading font-semibold text-[15px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[48px] hover:bg-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
      >
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}

function DesktopCodeCard({
  displayCode,
  copied,
  onCopy,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mt-5 rounded-xl border border-hairline bg-onyx p-4">
      <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-cream/55 mb-2 m-0">
        Your invite code
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          data-testid="invite-chooser-code"
          className="font-mono text-[18px] tracking-[0.04em] text-cream m-0 select-all"
        >
          {displayCode}
        </p>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill border border-hairline bg-charcoal px-4 min-h-[44px] font-heading font-semibold text-[13px] text-cream/80 hover:text-cream hover:border-cream/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <p className="font-body font-normal text-[13px] text-cream/60 leading-relaxed mt-2 mb-0">
        Typing it instead? Use this in the app.
      </p>
    </div>
  );
}

function ToggleButton({
  pressed,
  testId,
  onClick,
  children,
}: {
  pressed: boolean;
  testId: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      data-testid={testId}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-pill px-3 min-h-[44px] min-w-[76px] font-heading font-semibold text-[13px] border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 ${
        pressed
          ? "bg-gold text-onyx"
          : "bg-transparent text-cream/70 hover:text-cream"
      }`}
    >
      {children}
    </button>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/50 font-mono text-[12px] font-semibold text-gold"
    >
      {n}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`shrink-0 text-cream/50 transition-transform duration-fast ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
