import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// A lightweight, presentation-only expectation preview ("Account → Athlete
// → Trial"). It does not enforce a sequence, gate any CTA, or change any
// redirect — it just tells the athlete/parent what's coming next.
export type AuthStep = {
  label: string;
  current?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  steps?: AuthStep[];
};

export function AuthShell({ title, subtitle, children, footer, steps }: Props) {
  return (
    <main id="main-content" className="min-h-screen bg-onyx flex flex-col items-center justify-center px-5 py-12">
      <Link
        href="/"
        aria-label="From Victory home"
        className="mb-10 flex flex-col items-center gap-3 text-cream no-underline"
      >
        <Image
          src="/logo-stacked.svg"
          alt="From Victory"
          width={140}
          height={80}
          className="h-20 md:h-28 w-auto"
          priority
        />
      </Link>
      <div className="w-full max-w-[420px] bg-charcoal border border-hairline rounded-2xl p-8 sm:p-10">
        {steps && steps.length > 0 ? (
          <ol
            aria-label="Signup progress"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-5 p-0 list-none font-mono text-[10px] tracking-[0.16em] uppercase font-semibold"
          >
            {steps.map((step, i) => (
              <li key={step.label} className="flex items-center gap-2">
                <span
                  aria-current={step.current ? "step" : undefined}
                  className={step.current ? "text-gold" : "text-cream/40"}
                >
                  {step.label}
                </span>
                {i < steps.length - 1 ? (
                  <span aria-hidden="true" className="text-cream/25">
                    &rarr;
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
        <h1 className="font-display font-extrabold uppercase tracking-[0.06em] text-cream text-[26px] leading-tight mb-2">
          {title}
        </h1>
        {subtitle ? (
          <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-7">
            {subtitle}
          </p>
        ) : (
          <div className="mb-7" />
        )}
        {children}
      </div>
      {footer ? (
        <div className="mt-6 font-body text-[14px] text-cream/60">{footer}</div>
      ) : null}
    </main>
  );
}
