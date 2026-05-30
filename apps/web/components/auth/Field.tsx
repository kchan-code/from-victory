import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...inputProps
}: Props) {
  const describedBy = [
    hint ? `${id}-hint` : null,
    error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mb-5">
      <label
        htmlFor={id}
        className="block font-display font-semibold uppercase tracking-[0.10em] text-[12px] text-cream/80 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full bg-onyx border border-hairline focus:border-gold rounded-md px-4 py-3 font-body text-[15px] text-cream placeholder:text-cream/30 outline-none transition-colors duration-fast ease-out focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx ${
          className ?? ""
        }`}
        {...inputProps}
      />
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
