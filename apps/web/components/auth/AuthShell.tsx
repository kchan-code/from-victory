import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <main className="min-h-screen bg-onyx flex flex-col items-center justify-center px-5 py-12">
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
          className="h-20 w-auto"
          priority
        />
      </Link>
      <div className="w-full max-w-[420px] bg-charcoal border border-hairline rounded-2xl p-8 sm:p-10">
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
