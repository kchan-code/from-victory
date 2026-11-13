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
import type { AthleteInviteStatus } from "@/lib/invites/status";
import { buildInviteUrl } from "@/lib/invites/universal-link";

/**
 * Parent → athlete invite + recovery panel (FV-630).
 *
 * The code is shown ONLY in the response to the create action and lives only
 * in this component's state. It is hashed at rest and cannot be shown again,
 * so after a reload a pending invite offers "Create a new invite" (which
 * replaces the old one) instead of the old code.
 */

const initialState: CreateInviteState = null;

type Props = {
  athleteId: string;
  athleteFirstName: string;
  /** null = status read failed; render the neutral create-or-replace path. */
  status: AthleteInviteStatus | null;
};

function formatExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const secondaryButton =
  "inline-flex items-center justify-center font-heading font-semibold text-[14px] text-cream bg-onyx border border-hairline hover:border-cream/30 rounded-pill px-5 min-h-[44px] transition-colors duration-fast ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal";
const primaryButton =
  "inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal";

export function InvitePanel({ athleteId, athleteFirstName, status }: Props) {
  const [state, formAction] = useFormState(createAthleteInvite, initialState);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [shareError, setShareError] = useState(false);

  const issued = state && state.ok ? state : null;
  const errorMsg = state && !state.ok ? state.error : null;

  const createForm = (label: string, pendingLabel: string, primary: boolean) => (
    <form action={formAction}>
      <input type="hidden" name="athlete_id" value={athleteId} />
      {primary ? (
        <SubmitButton pendingLabel={pendingLabel}>{label}</SubmitButton>
      ) : (
        <button
          type="submit"
          data-testid="invite-replace"
          className="font-body text-[14px] text-cream/70 hover:text-cream underline decoration-cream/30 hover:decoration-cream bg-transparent border-0 p-0 cursor-pointer min-h-[44px]"
        >
          {label}
        </button>
      )}
    </form>
  );

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
    const shareText = recovery
      ? `Your From Victory password reset. Open this link on your phone, or enter code ${display} in the app. Your username stays the same.`
      : `You're invited to From Victory. Open this link on your phone, or enter code ${display} in the app.`;

    async function copy(kind: "link" | "code") {
      try {
        await navigator.clipboard.writeText(kind === "link" ? url : display);
        setCopied(kind);
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
      } catch (err) {
        // AbortError = parent closed the share sheet. Not an error.
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setShareError(true);
        }
      }
    }

    return (
      <div data-testid="invite-issued">
        {/* Announces creation and copy feedback to screen readers. */}
        <p className="sr-only" role="status" aria-live="polite">
          {copied === "link"
            ? "Link copied."
            : copied === "code"
              ? "Code copied."
              : `${recovery ? "Reset code" : "Invite code"} created: ${display}.`}
        </p>
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-5">
          {recovery
            ? `Send this to ${athleteFirstName}. It sets a new password. Their username stays the same.`
            : `Send this to ${athleteFirstName}. Opening the link on their phone opens the app and sets up their account.`}
        </p>

        <p className="font-mono font-semibold uppercase tracking-[0.16em] text-[10px] text-gold mb-2">
          {recovery ? "Reset code" : "Invite code"}
        </p>
        <p
          data-testid="invite-code"
          className="font-mono text-[20px] sm:text-[28px] tracking-[0.04em] text-cream mb-5 select-all whitespace-nowrap"
        >
          {display}
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button
            type="button"
            onClick={share}
            data-testid="invite-share"
            className={primaryButton}
          >
            {recovery ? "Share reset link" : "Share invite"}
          </button>
          <button
            type="button"
            onClick={() => copy("link")}
            className={secondaryButton}
          >
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={() => copy("code")}
            className={secondaryButton}
          >
            {copied === "code" ? "Code copied" : "Copy code"}
          </button>
        </div>
        {shareError ? (
          <p className="mb-3 font-body text-[13px] text-cream/60" role="status">
            Sharing didn&rsquo;t open. Copy the link instead.
          </p>
        ) : null}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50 mb-6">
          Works once. Expires {formatExpiry(issued.expiresAt)}
        </p>
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-2">
          Making a new {recovery ? "code" : "invite"} turns this one off.
        </p>
        {errorLine}
        {createForm(
          recovery ? "Create a new reset code" : "Create a new invite",
          "Creating…",
          false,
        )}
      </div>
    );
  }

  // ---- Ready: account set up; offer separate recovery --------------------
  if (status?.state === "ready") {
    return (
      <div data-testid="invite-state-ready">
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
          {athleteFirstName}&rsquo;s account is ready. They sign in with their
          username and password on any phone, including a new one.
        </p>
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
          Forgot their password? Create a reset code. It sets a new password
          and keeps their username. It works once and expires in 24 hours.
          {status.pendingRecovery && status.expiresAt
            ? ` A reset code is already out until ${formatExpiry(status.expiresAt)}; a new one replaces it.`
            : ""}
        </p>
        {errorLine}
        {createForm("Create reset code", "Creating…", true)}
      </div>
    );
  }

  // ---- Pending: an invite is out; it can't be shown again ----------------
  if (status?.state === "pending") {
    return (
      <div data-testid="invite-state-pending">
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
          An invite for {athleteFirstName} is waiting
          {status.expiresAt ? ` until ${formatExpiry(status.expiresAt)}` : ""}.
        </p>
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
          For security, a code is only shown when it&rsquo;s created. Create a
          new invite to share it again. The old one stops working.
        </p>
        {errorLine}
        {createForm("Create a new invite", "Creating…", true)}
      </div>
    );
  }

  // ---- Signed in before, no username (pre-FV-320 pairing) ---------------
  if (status?.state === "needs_username") {
    return (
      <div data-testid="invite-state-needs-username">
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
          {athleteFirstName} already trains on one device. Add a username so
          they can sign in on any phone, including a new one.
        </p>
        <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
          Create an invite and send it to {athleteFirstName}. They pick a
          username and a new password. Their training history stays. The
          invite works once and expires in 7 days.
        </p>
        {errorLine}
        {createForm("Create invite", "Creating…", true)}
      </div>
    );
  }

  // ---- Not invited (or status unknown) -----------------------------------
  return (
    <div data-testid="invite-state-not-invited">
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-3">
        Invite {athleteFirstName} to the app. They open the link on their
        phone, pick a username and password, and start training right away.
      </p>
      <p className="font-body text-cream/55 text-[13px] leading-relaxed mb-5">
        No email needed. The invite works once and expires in 7 days.
        {status === null
          ? " If you already sent one, a new invite replaces it."
          : ""}
      </p>
      {errorLine}
      {createForm("Create invite", "Creating…", true)}
    </div>
  );
}
