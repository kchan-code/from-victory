"use client";

import { useFormState } from "react-dom";
import { useState } from "react";

import { SubmitButton } from "@/components/auth/SubmitButton";
import {
  generatePairingCode,
  type GenerateState,
} from "@/lib/actions/pairings";

const initialState: GenerateState = null;

type Props = {
  athleteId: string;
  athleteFirstName: string;
};

function formatExpiry(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
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

export function PairingPanel({ athleteId, athleteFirstName }: Props) {
  const [state, formAction] = useFormState(generatePairingCode, initialState);
  const [copied, setCopied] = useState(false);

  const url =
    state && state.ok
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/pair?code=${state.code}`
      : null;

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable on older browsers; user can long-press
      // the link instead.
    }
  }

  if (url && state && state.ok) {
    return (
      <div>
        <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-5">
          Send this link to {athleteFirstName}. Opening it on their phone
          will set up their account and pair the device.
        </p>
        <div className="bg-onyx border border-hairline rounded-md p-4 mb-4 break-all font-mono text-[13px] text-cream">
          {url}
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <button
            type="button"
            onClick={copy}
            className="font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 py-2.5 hover:bg-gold-bright transition-colors duration-base ease-out"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-cream/50">
            Expires {formatExpiry(state.expiresAt)}
          </p>
        </div>
        <form action={formAction}>
          <input type="hidden" name="athlete_id" value={athleteId} />
          <button
            type="submit"
            className="font-body text-[14px] text-cream/60 hover:text-cream underline decoration-cream/30 hover:decoration-cream bg-transparent border-0 p-0 cursor-pointer"
          >
            Generate a new link
          </button>
        </form>
      </div>
    );
  }

  const errorMsg =
    state && !state.ok ? state.error : null;

  return (
    <form action={formAction}>
      <input type="hidden" name="athlete_id" value={athleteId} />
      <p className="font-body text-cream/80 text-[15px] leading-relaxed mb-5">
        Generate a one-time link for {athleteFirstName}. Open it on their
        phone to set their password and pair the device. Links expire in
        24 hours.
      </p>
      {errorMsg ? (
        <p
          className="mb-5 font-body text-[14px] text-red-400"
          role="alert"
        >
          {errorMsg}
        </p>
      ) : null}
      <SubmitButton pendingLabel="Generating…">
        Generate pairing link
      </SubmitButton>
    </form>
  );
}
