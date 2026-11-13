"use client";
// client: useFormState for the create action + share/copy (navigator APIs).

import { useState } from "react";
import { useFormState } from "react-dom";

import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  createAthleteInvite,
  type CreateInviteState,
} from "@/lib/actions/invites";
import { formatInviteCode } from "@/lib/invites/code";
import { buildInviteShareText } from "@/lib/invites/share-text";
import type { AthleteInviteStatus } from "@/lib/invites/status";
import { buildInviteUrl } from "@/lib/invites/universal-link";

/**
 * Parent → athlete invite + recovery panel (FV-630, redesigned FV-686).
 *
 * The code is shown ONLY in the response to the create action and lives only
 * in this component's state. It is hashed at rest and cannot be shown again,
 * so after a reload a pending invite offers a confirmed replacement instead
 * of the old code.
 */

const initialState: CreateInviteState = null;

type Props = {
  athleteId: string;
  athleteFirstName: string;
  /** null = status read failed; render the neutral create-or-replace path. */
  status: AthleteInviteStatus | null;
};

type Issued = {
  code: string;
  purpose: "invite" | "recovery";
  expiresAt: string;
};

function formatExpiry(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    const day = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const time = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    return `${day} at ${time}`;
  } catch {
    return iso;
  }
}

const chipClass =
  "inline-flex items-center rounded-pill border border-gold/40 px-3 min-h-[28px] font-heading font-semibold text-[12px] text-gold mb-4";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal";

export function InvitePanel({ athleteId, athleteFirstName, status }: Props) {
  const [state, formAction] = useFormState(createAthleteInvite, initialState);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [shareError, setShareError] = useState(false);
  const [sent, setSent] = useState(false);
  const [linkConfirmed, setLinkConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const issued: Issued | null = state && state.ok ? state : null;
  const errorMsg = state && !state.ok ? state.error : null;
  const name = athleteFirstName;

  const errorLine = errorMsg ? (
    <p className="mb-5 font-body text-[14px] text-red-400" role="alert">
      {errorMsg}
    </p>
  ) : null;

  // ---- Just created: share the current code ------------------------------
  if (issued) {
    const recovery = issued.purpose === "recovery";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = buildInviteUrl(origin, issued.code);
    const display = formatInviteCode(issued.code);
    const shareText = buildInviteShareText({
      purpose: issued.purpose,
      url,
      displayCode: display,
    });

    async function copy(kind: "link" | "code") {
      try {
        await navigator.clipboard.writeText(kind === "link" ? url : display);
        setCopied(kind);
        if (kind === "link") {
          setSent(true);
          setLinkConfirmed(true);
        }
        window.setTimeout(() => setCopied(null), 2000);
      } catch {
        // Clipboard can be unavailable; the code and link stay selectable.
      }
    }

    async function share() {
      setShareError(false);
      if (typeof navigator.share !== "function") {
        await copy("link");
        return;
      }
      try {
        await navigator.share({ title: "From Victory", text: shareText, url });
        setSent(true);
      } catch (err) {
        // AbortError = parent closed the share sheet. Not an error.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setShareError(true);
        }
      }
    }

    const steps = recovery
      ? [
          `${name} taps the link on their phone.`,
          `${name} picks a new password. Their username stays the same.`,
        ]
      : [
          `${name} taps the link on their own phone.`,
          `If the From Victory app is on their iPhone, the link opens it. Otherwise, a page opens where ${name} can get the app or keep going in the browser.`,
          `${name} picks a username and password and starts training.`,
        ];

    return (
      <div data-testid="invite-issued">
        <p className="sr-only" role="status" aria-live="polite">
          {copied === "link"
            ? "Link copied."
            : copied === "code"
              ? "Code copied."
              : `${recovery ? "Reset code" : "Invite"} created. Backup code ${display}.`}
        </p>
        <p className="font-body font-normal text-cream/80 text-[15px] leading-relaxed mb-5">
          {recovery
            ? `Send this reset to ${name}'s phone. ${name} opens it there and picks a new password. Their username stays the same.`
            : `Send this invite to ${name}'s phone. ${name} opens it there and sets up their own account.`}
        </p>

        <button
          type="button"
          onClick={share}
          data-testid="invite-share"
          className={
            sent
              ? `inline-flex w-full items-center justify-center gap-2 font-heading font-semibold text-[15px] text-cream bg-transparent border border-cream/30 rounded-pill px-5 min-h-[48px] hover:border-cream/50 ${focusRing}`
              : `inline-flex w-full items-center justify-center gap-2 font-heading font-semibold text-[15px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[48px] hover:bg-gold-bright ${focusRing}`
          }
        >
          {sent ? null : <ShareIcon />}
          {sent
            ? "Send it again"
            : recovery
              ? `Send reset link to ${name}`
              : `Send invite to ${name}`}
        </button>
        <button
          type="button"
          onClick={() => copy("link")}
          className={`mt-1 inline-flex w-full items-center justify-center min-h-[44px] bg-transparent border-0 font-heading font-semibold text-[14px] text-gold hover:text-gold-bright cursor-pointer ${focusRing}`}
        >
          Copy invite link
        </button>
        {linkConfirmed ? (
          <p className="font-body font-normal text-[14px] text-gold-soft text-center leading-relaxed mt-1 mb-0">
            Link copied. Paste it in a text to {name}.
          </p>
        ) : null}
        {shareError ? (
          <p className="mt-2 mb-0 font-body text-[13px] text-cream/60 text-center" role="status">
            Sharing didn&rsquo;t open. Copy the link instead.
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-hairline bg-onyx p-4">
          <h2 className="font-heading font-semibold text-[15px] text-cream m-0 mb-4">
            What {name} does next
          </h2>
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 font-mono text-[11px] font-semibold text-gold"
                >
                  {index + 1}
                </span>
                <p className="font-body font-normal text-[14px] leading-relaxed text-cream m-0">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6" data-testid="invite-backup">
          <p className="font-heading font-semibold text-[13px] text-gold m-0">
            Backup code
          </p>
          <div className="mt-2 flex flex-nowrap items-center gap-2">
            <p
              data-testid="invite-code"
              className="font-mono text-[15px] sm:text-[20px] tracking-[0.03em] text-cream m-0 min-w-0 select-all"
            >
              {display}
            </p>
            <button
              type="button"
              onClick={() => copy("code")}
              className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-pill border border-hairline bg-charcoal px-4 min-h-[44px] font-heading font-semibold text-[13px] text-cream hover:border-cream/30 ${focusRing}`}
            >
              {copied === "code" ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="font-body font-normal text-[14px] text-cream/70 leading-relaxed mt-2 mb-0">
            {recovery
              ? `If the link doesn't open the app, ${name} can open From Victory, tap I have an invite, and type this code.`
              : `If the link doesn't open the app, ${name} can open From Victory, tap I have an invite, and type this code. Use this on Android.`}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          <ClockIcon />
          <div className="min-w-0 font-body font-normal text-[14px] text-cream/70 leading-relaxed">
            <p className="m-0" data-testid="invite-expiry">
              {recovery
                ? `This reset code works one time and expires ${formatExpiry(issued.expiresAt)}.`
                : `This invite works one time and expires ${formatExpiry(issued.expiresAt)}.`}
            </p>
            <p className="mt-2 mb-0">
              Send it before you leave this page. For your security, we
              can&rsquo;t show this code again.
            </p>
            {recovery ? null : (
              <p className="mt-2 mb-0">
                Come back to this page to see when {name} has finished setting
                up.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-hairline pt-5">
          <button
            type="button"
            data-testid="invite-replace"
            onClick={() => setConfirming(true)}
            className={`inline-flex items-center min-h-[44px] bg-transparent border-0 p-0 font-heading font-semibold text-[15px] text-cream/60 hover:text-cream cursor-pointer ${focusRing}`}
          >
            {recovery ? "Replace this reset code" : "Replace this invite"}
          </button>
          <p className="font-body font-normal text-[13px] text-cream/50 leading-relaxed mt-1 mb-0">
            {recovery
              ? "Only do this if the reset was lost or sent to the wrong person."
              : "Only do this if the invite was lost or sent to the wrong person."}
          </p>
          {errorLine}
          {confirming ? (
            <ReplaceConfirm
              name={name}
              recovery={recovery}
              athleteId={athleteId}
              formAction={formAction}
              onKeep={() => setConfirming(false)}
            />
          ) : null}
        </div>
      </div>
    );
  }

  // ---- Ready: account set up; offer separate recovery --------------------
  if (status?.state === "ready") {
    return (
      <div data-testid="invite-state-ready">
        <p data-testid="invite-status-chip" className={chipClass}>
          Set up
        </p>
        <p className="font-body font-normal text-cream/80 text-[15px] leading-relaxed mb-3">
          {name}&rsquo;s account is ready. They sign in with their username and
          password on any phone.
        </p>
        <p className="font-body font-normal text-cream/55 text-[13px] leading-relaxed mb-5">
          Forgot their password? Create a reset code. It sets a new password
          and keeps their username. It works once and expires in 24 hours.
          {status.pendingRecovery && status.expiresAt
            ? ` A reset code is already out until ${formatExpiry(status.expiresAt)}; a new one replaces it.`
            : ""}
        </p>
        {errorLine}
        <CreateForm
          athleteId={athleteId}
          formAction={formAction}
          label="Create reset code"
          pendingLabel="Creating…"
        />
      </div>
    );
  }

  // ---- Pending: an invite is out; it can't be shown again ----------------
  if (status?.state === "pending") {
    return (
      <div data-testid="invite-state-pending">
        <p data-testid="invite-status-chip" className={chipClass}>
          Waiting for {name}
        </p>
        <p className="font-body font-normal text-cream/80 text-[15px] leading-relaxed mb-3">
          {name} hasn&rsquo;t finished setting up yet.
          {status.expiresAt
            ? ` The invite you sent works until ${formatExpiry(status.expiresAt)}.`
            : ""}
        </p>
        <p className="font-body font-normal text-cream/55 text-[13px] leading-relaxed mb-5">
          For your security, we only show an invite code once. If {name}{" "}
          can&rsquo;t find it, make a new one. The old one will stop working.
        </p>
        {errorLine}
        <button
          type="button"
          data-testid="invite-replace"
          onClick={() => setConfirming(true)}
          className={`inline-flex w-full items-center justify-center font-heading font-semibold text-[14px] text-cream bg-transparent border border-cream/25 hover:border-cream/40 rounded-pill px-5 min-h-[44px] ${focusRing}`}
        >
          Make a new invite
        </button>
        {confirming ? (
          <ReplaceConfirm
            name={name}
            recovery={false}
            athleteId={athleteId}
            formAction={formAction}
            onKeep={() => setConfirming(false)}
          />
        ) : null}
      </div>
    );
  }

  // ---- Signed in before, no username (pre-FV-320 pairing) ---------------
  if (status?.state === "needs_username") {
    return (
      <div data-testid="invite-state-needs-username">
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
          {name} already trains on one device. Add a username so they can sign
          in on any phone, including a new one.
        </p>
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
          Create an invite and send it to {name}. They pick a username and a
          new password. Their training history stays. The invite works once and
          expires in 7 days.
        </p>
        {errorLine}
        <CreateForm
          athleteId={athleteId}
          formAction={formAction}
          label="Create invite"
          pendingLabel="Creating…"
        />
      </div>
    );
  }

  // ---- Not invited (or status unknown) -----------------------------------
  return (
    <div data-testid="invite-state-not-invited">
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
        Invite {name} to the app. They open the link on their phone, pick a
        username and password, and start training right away.
      </p>
      <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
        No email needed. The invite works once and expires in 7 days.
        {status === null ? " If you already sent one, a new invite replaces it." : ""}
      </p>
      {errorLine}
      <CreateForm
        athleteId={athleteId}
        formAction={formAction}
        label="Create invite"
        pendingLabel="Creating…"
      />
    </div>
  );
}

function CreateForm({
  athleteId,
  formAction,
  label,
  pendingLabel,
}: {
  athleteId: string;
  formAction: (payload: FormData) => void;
  label: string;
  pendingLabel: string;
}) {
  return (
    <form action={formAction}>
      <input type="hidden" name="athlete_id" value={athleteId} />
      <SubmitButton pendingLabel={pendingLabel}>{label}</SubmitButton>
    </form>
  );
}

function ReplaceConfirm({
  name,
  recovery,
  athleteId,
  formAction,
  onKeep,
}: {
  name: string;
  recovery: boolean;
  athleteId: string;
  formAction: (payload: FormData) => void;
  onKeep: () => void;
}) {
  const title = recovery
    ? `Replace ${name}'s reset code?`
    : `Replace ${name}'s invite?`;
  const body = recovery
    ? "The reset code you made stops working right away, both the link and the backup code. You'll get a new one to send."
    : "The invite you made stops working right away, both the link and the backup code. You'll get a new one to send.";

  return (
    <div
      className="mt-4 rounded-xl border border-danger/40 bg-[rgba(229,62,76,0.08)] p-4"
      role="group"
      aria-label={title}
    >
      <p className="font-heading font-semibold text-[15px] text-danger m-0">
        {title}
      </p>
      <p className="font-body font-normal text-[14px] text-cream/75 leading-relaxed mt-2 mb-4">
        {body}
      </p>
      <form action={formAction}>
        <input type="hidden" name="athlete_id" value={athleteId} />
        <button
          type="submit"
          data-testid="invite-replace-confirm"
          className={`inline-flex w-full items-center justify-center font-heading font-semibold text-[14px] text-cream bg-danger border border-danger rounded-pill px-5 min-h-[44px] hover:brightness-110 ${focusRing}`}
        >
          {recovery ? "Replace reset code" : "Replace invite"}
        </button>
      </form>
      <button
        type="button"
        onClick={onKeep}
        className={`mt-2 inline-flex w-full items-center justify-center min-h-[44px] bg-transparent border-0 font-heading font-semibold text-[14px] text-cream/80 hover:text-cream cursor-pointer ${focusRing}`}
      >
        {recovery ? "Keep this reset code" : "Keep this invite"}
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 16V4 M8 8l4-4 4 4 M6 14v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-cream/55"
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 8v4.5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
