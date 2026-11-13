"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Password fields can show a Show/Hide control. */
  canReveal?: boolean;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  canReveal = false,
  type,
  ...inputProps
}: Props) {
  const [revealed, setRevealed] = useState(false);
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");
  const inputType = canReveal && revealed ? "text" : type;

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block font-heading font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[16px] text-cream placeholder:text-cream/30 outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
            canReveal ? "pr-16" : ""
          } ${className ?? ""}`}
          {...inputProps}
        />
        {canReveal ? (
          <button
            type="button"
            aria-pressed={revealed}
            aria-label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] px-2 font-heading font-semibold text-[12px] text-gold bg-transparent border-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-sm"
          >
            {revealed ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
      {hint && !error ? (
        <p
          id={`${id}-hint`}
          className="mt-2 font-body text-[13px] text-cream/50"
        >
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="mt-2 font-body text-[13px] text-red-400"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
