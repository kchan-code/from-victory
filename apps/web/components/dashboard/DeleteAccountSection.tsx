"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  deleteAccount,
  type DeleteAccountState,
} from "@/lib/actions/account";

const initialState: DeleteAccountState = null;

function ConfirmButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="font-heading font-semibold text-[14px] text-white bg-red-600/90 border border-red-500/60 rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Deleting your account…" : "Delete my account"}
    </button>
  );
}

/**
 * Danger zone — whole-account deletion. Removes the parent and every athlete
 * they solely manage (or, for an adult_athlete self-payer, just their own
 * account). Requires typing DELETE.
 *
 * `description` is copy-neutral pass-through so the athlete settings page
 * (adult_athlete only, FV-441) can supply account-only copy without forking
 * this component. The parent dashboard usage omits the prop, so its rendered
 * copy is unchanged.
 *
 * `appleSubscriptionNotice` (FV-652, decision record §4.7): deleting the
 * account cannot cancel an App Store subscription — Apple has no server-side
 * cancel — so a payer with an active Apple subscription must be told, before
 * the typed confirmation, to cancel it with Apple. The calling page decides
 * (server-side) whether to show it, and fails toward showing it when the
 * Apple status read errors.
 */
export const APPLE_SUBSCRIPTION_DELETE_NOTICE =
  "Your App Store subscription is managed by Apple. To cancel it, open Settings on your iPhone, tap your name, then Subscriptions. Deleting your From Victory account does not cancel it, and it cannot be automatically re-attached to a new account.";

export function DeleteAccountSection({
  description,
  appleSubscriptionNotice = false,
}: {
  description?: ReactNode;
  appleSubscriptionNotice?: boolean;
} = {}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction] = useFormState(deleteAccount, initialState);

  const matches = typed.trim() === "DELETE";

  return (
    <section className="mt-16 border-t border-hairline pt-8">
      <h2 className="font-display font-bold uppercase tracking-[0.08em] text-red-400 text-[15px] mb-3">
        Delete account
      </h2>
      <div className="bg-charcoal border border-red-500/25 rounded-2xl p-6">
        <p className="font-body text-cream/70 text-[14px] leading-relaxed max-w-[560px]">
          {description ?? (
            <>
              Permanently delete your account and every athlete you manage —
              including all journals, training history, and your subscription
              record. This is immediate and cannot be undone. Athletes also
              linked to a co-parent are kept on that parent&rsquo;s account.
            </>
          )}
        </p>

        {appleSubscriptionNotice ? (
          <p
            role="note"
            data-testid="delete-account-apple-notice"
            className="mt-4 max-w-[560px] rounded-lg border border-gold/40 bg-onyx px-4 py-3 font-body text-[14px] leading-relaxed text-cream"
          >
            {APPLE_SUBSCRIPTION_DELETE_NOTICE}
          </p>
        ) : null}

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-5 font-heading font-semibold text-[14px] text-red-400 hover:text-red-300 bg-transparent border border-red-500/40 hover:border-red-500/70 rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out"
          >
            Delete my account
          </button>
        ) : (
          <form action={formAction} className="mt-5 flex flex-col gap-3 max-w-[360px]">
            <label
              htmlFor="confirm-delete-account"
              className="font-body text-[13px] text-cream/70"
            >
              Type <span className="font-mono text-cream">DELETE</span> to confirm.
            </label>
            <input
              id="confirm-delete-account"
              type="text"
              name="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="bg-onyx border border-hairline focus:border-red-500/60 rounded-lg px-3 py-2 font-body text-[14px] text-cream placeholder:text-cream/35 outline-none transition-colors duration-fast focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            />
            {state && !state.ok ? (
              <p className="font-body text-[13px] text-red-400" role="alert">
                {state.error}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setTyped("");
                }}
                className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-onyx border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out"
              >
                Cancel
              </button>
              <ConfirmButton disabled={!matches} />
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
