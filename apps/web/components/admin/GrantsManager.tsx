"use client";
// client: controlled inputs + useTransition for action calls (plain object
// signatures, not FormData/useActionState); router.refresh() on success.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  grantCompAccess,
  revokeCompAccess,
  type CompGrantRow,
} from "@/lib/actions/grants";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Grant form ───────────────────────────────────────────────────────────────

function GrantForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [parentEmail, setParentEmail] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await grantCompAccess({
        parentEmail: parentEmail.trim() || undefined,
        reason: reason.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });

      if (!result) {
        setFormError("Unexpected error — please try again.");
        return;
      }
      if (!result.ok) {
        if (result.field) {
          setFieldErrors({ [result.field]: result.error });
        } else {
          setFormError(result.error);
        }
        return;
      }

      // Success
      setSuccessMsg(`Grant created (ID: ${result.grantId}).`);
      setParentEmail("");
      setReason("");
      setExpiresAt("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-charcoal p-6 sm:p-8 mb-8">
      <h2 className="font-display font-bold uppercase tracking-[0.05em] text-cream text-[18px] leading-tight mb-6">
        Grant free access
      </h2>

      {successMsg && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 rounded-[10px] border border-[rgba(223,175,55,0.4)] bg-[rgba(223,175,55,0.06)] px-4 py-3 font-body text-[14px] text-cream/85"
        >
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Parent email */}
        <div className="mb-5">
          <label
            htmlFor="grant-parent-email"
            className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
          >
            Parent email <span aria-hidden="true" className="text-cream/40">(required)</span>
          </label>
          <input
            id="grant-parent-email"
            type="email"
            autoComplete="email"
            required
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            aria-invalid={!!fieldErrors["parentEmail"]}
            aria-describedby={fieldErrors["parentEmail"] ? "grant-email-error" : undefined}
            className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream placeholder:text-cream/30 outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            placeholder="parent@example.com"
            data-testid="grant-email-input"
          />
          {fieldErrors["parentEmail"] && (
            <p id="grant-email-error" role="alert" className="mt-2 font-body text-[13px] text-red-400">
              {fieldErrors["parentEmail"]}
            </p>
          )}
        </div>

        {/* Reason */}
        <div className="mb-5">
          <label
            htmlFor="grant-reason"
            className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
          >
            Reason <span aria-hidden="true" className="text-cream/40">(required)</span>
          </label>
          <input
            id="grant-reason"
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-invalid={!!fieldErrors["reason"]}
            aria-describedby={fieldErrors["reason"] ? "grant-reason-error" : undefined}
            className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream placeholder:text-cream/30 outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            placeholder="beta tester, coach, friends & family…"
            data-testid="grant-reason-input"
          />
          {fieldErrors["reason"] && (
            <p id="grant-reason-error" role="alert" className="mt-2 font-body text-[13px] text-red-400">
              {fieldErrors["reason"]}
            </p>
          )}
        </div>

        {/* Expiry */}
        <div className="mb-7">
          <label
            htmlFor="grant-expires-at"
            className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
          >
            Expiry date
          </label>
          <input
            id="grant-expires-at"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream placeholder:text-cream/30 outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            data-testid="grant-expires-input"
          />
          <p className="mt-2 font-body text-[13px] text-cream/50">
            Leave blank for permanent free access.
          </p>
        </div>

        {formError && (
          <p role="alert" className="mb-5 font-body text-[14px] text-red-400">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gold text-onyx border border-gold font-heading font-semibold text-[15px] rounded-pill px-6 py-3 transition-colors duration-base ease-out hover:bg-gold-bright disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          data-testid="grant-submit-btn"
        >
          {isPending ? "Granting…" : "Grant free access"}
        </button>
      </form>
    </div>
  );
}

// ── Revoke button (per-row) ───────────────────────────────────────────────────

function RevokeButton({ parentId }: { parentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRevoke() {
    if (!confirm("Revoke this free access grant? The parent will need a paid subscription to continue.")) {
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await revokeCompAccess({ parentId });
      if (!result) {
        setError("Unexpected error.");
        return;
      }
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={handleRevoke}
        className="inline-flex items-center font-heading font-semibold text-[13px] text-cream/60 bg-onyx border border-hairline rounded-pill px-3.5 py-1.5 transition-colors duration-fast ease-out hover:text-cream hover:border-cream/30 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
        data-testid={`revoke-btn-${parentId}`}
      >
        {isPending ? "Revoking…" : "Revoke"}
      </button>
      {error && (
        <span role="alert" className="font-body text-[12px] text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}

// ── Grants list ───────────────────────────────────────────────────────────────

interface GrantsListProps {
  grants: CompGrantRow[];
}

function GrantsList({ grants }: GrantsListProps) {
  if (grants.length === 0) {
    return (
      <p className="font-body text-cream/50 text-[14px] py-4">
        No free accounts granted yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Active comp grants">
      {grants.map((grant) => (
        <li
          key={grant.id}
          className="flex items-start justify-between gap-4 rounded-[12px] border border-hairline bg-onyx px-4 py-4"
        >
          <div className="flex-1 min-w-0">
            {/* Parent name + email */}
            <p className="font-heading font-semibold text-[15px] text-cream leading-tight truncate">
              {grant.parent_first_name}
            </p>
            {grant.parent_email && (
              <p className="font-body text-[13px] text-cream/55 leading-snug mt-0.5 truncate">
                {grant.parent_email}
              </p>
            )}

            {/* Reason */}
            {grant.reason && (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold/70 mt-2">
                {grant.reason}
              </p>
            )}

            {/* Dates row */}
            <p className="font-body text-[12px] text-cream/40 mt-1.5">
              Granted {formatDate(grant.created_at)}
              {" · "}
              {grant.expires_at
                ? `Expires ${formatDate(grant.expires_at)}`
                : "Permanent"}
            </p>
          </div>

          <RevokeButton parentId={grant.parent_id} />
        </li>
      ))}
    </ul>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface GrantsManagerProps {
  initialGrants: CompGrantRow[];
}

export function GrantsManager({ initialGrants }: GrantsManagerProps) {
  return (
    <>
      <GrantForm />

      <section aria-labelledby="grants-list-heading">
        <h2
          id="grants-list-heading"
          className="font-display font-bold uppercase tracking-[0.05em] text-cream text-[18px] leading-tight mb-4"
        >
          Active grants
        </h2>
        <GrantsList grants={initialGrants} />
      </section>
    </>
  );
}
