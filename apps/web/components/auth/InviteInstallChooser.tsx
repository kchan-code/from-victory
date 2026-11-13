"use client";

import { StoreDownloadBadges } from "@/components/landing/StoreDownloadBadges";
import type { StorePlatform } from "@/lib/marketing/store-platform";

type Props = {
  displayCode: string;
  platform: StorePlatform;
  copied: boolean;
  onCopy: () => void;
  onContinueInBrowser: () => void;
};

/**
 * Browser install chooser for an invite link (FV-687).
 *
 * iPhone, when the app is installed: tapping the link routes the fragment
 * into the app (NativeInviteLinkHandler) and InviteFlow auto-checks the
 * code. That opens setup. It does not claim the invite. The athlete still
 * chooses a username and password, or a new password on a reset. So this
 * page must not say they will not need to type anything.
 *
 * Android has no App Links yet (FV-632). Typing the code is the main path.
 *
 * "I have an invite" is the sign-in label in SignInChooser, which is the
 * same screen inside the app.
 *
 * "Continue in browser" checks the code and finishes setup on this page,
 * then signs the athlete in.
 */
export function InviteInstallChooser({
  displayCode,
  platform,
  copied,
  onCopy,
  onContinueInBrowser,
}: Props) {
  const reopen =
    platform === "ios"
      ? "After it installs, come back to your text and tap the link again. The app opens your setup. You do not type this code."
      : platform === "unknown"
        ? "On iPhone, after it installs, come back to your text and tap the link again. The app opens your setup. You do not type this code."
        : null;

  const typeCode =
    platform === "ios"
      ? "Or open From Victory, tap I have an invite, and enter this code."
      : platform === "android"
        ? "Open From Victory, tap I have an invite, and enter this code."
        : "On Android, open From Victory, tap I have an invite, and enter this code. On iPhone, you can do the same if you would rather type the code.";

  let step = 1;

  return (
    <div data-testid="invite-install-chooser" data-platform={platform}>
      <p className="font-body text-cream text-[16px] leading-relaxed mb-6">
        Train in the From Victory app.
      </p>

      <ol
        aria-label="How to use your invite"
        data-testid="invite-steps"
        className="m-0 flex list-none flex-col gap-6 p-0"
      >
        <li data-testid="invite-step-get-app" className="flex gap-3">
          <StepNumber n={step++} />
          <div className="min-w-0 flex-1">
            <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
              Get the app.
            </p>
            <div className="mt-3">
              <StoreDownloadBadges platform={platform} />
            </div>
          </div>
        </li>

        {reopen ? (
          <li data-testid="invite-step-reopen" className="flex gap-3">
            <StepNumber n={step++} />
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold text-cream text-[16px] leading-snug m-0">
                {reopen}
              </p>
            </div>
          </li>
        ) : null}

        <li data-testid="invite-step-code" className="flex gap-3">
          <StepNumber n={step++} />
          <div className="min-w-0 flex-1">
            <p
              className={
                platform === "ios"
                  ? "font-body text-cream/80 text-[15px] leading-relaxed m-0"
                  : "font-heading font-semibold text-cream text-[16px] leading-snug m-0"
              }
            >
              {typeCode}
            </p>
            <CodeCard
              displayCode={displayCode}
              copied={copied}
              onCopy={onCopy}
            />
          </div>
        </li>
      </ol>

      <div className="mt-8 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={onContinueInBrowser}
          data-testid="invite-continue-browser"
          className="inline-flex items-center min-h-[44px] bg-transparent border-0 p-0 font-body text-[15px] text-cream/70 underline decoration-cream/30 hover:text-cream hover:decoration-cream cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        >
          Continue in browser
        </button>
        <p className="font-body text-[14px] text-cream/70 leading-relaxed mt-1 mb-0">
          Finish setup on this page instead of in the app.
        </p>
      </div>
    </div>
  );
}

function CodeCard({
  displayCode,
  copied,
  onCopy,
}: {
  displayCode: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="bg-onyx border border-hairline rounded-xl p-4 mt-3">
      <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-cream/55 mb-2">
        Your invite code
      </p>
      <p
        data-testid="invite-chooser-code"
        className="font-mono text-[18px] sm:text-[22px] tracking-[0.04em] text-cream mb-3 select-all whitespace-nowrap"
      >
        {displayCode}
      </p>
      <button
        type="button"
        onClick={onCopy}
        className="font-heading font-semibold text-[13px] text-cream/80 hover:text-cream bg-charcoal border border-hairline hover:border-cream/30 rounded-pill px-4 min-h-[44px]"
      >
        {copied ? "Code copied" : "Copy code"}
      </button>
    </div>
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
