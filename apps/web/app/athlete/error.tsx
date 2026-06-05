"use client"; // client: Next.js error boundaries must be Client Components

// Athlete route error boundary — shown if requireAthlete() or an uncaught
// error escapes the page. The no-catalog-row case is caught inline in
// DailySession; this handles anything else (auth failures caught by the guard
// redirect, network errors, etc.).

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AthleteError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to the console in dev; replace with a structured logger if one lands.
    console.error("[athlete] unhandled error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8 flex items-center justify-center">
      <div className="mx-auto max-w-[480px] text-center">
        <h1 className="font-mono font-semibold text-[11px] uppercase tracking-[0.18em] text-gold mb-4">
          Something went wrong
        </h1>
        <p className="font-body text-cream/70 text-[15px] leading-relaxed mb-6">
          We couldn&rsquo;t load your training right now. Try refreshing — your
          progress is saved.
        </p>
        <button
          type="button"
          onClick={reset}
          className="font-heading font-semibold text-[14px] text-onyx bg-gold rounded-pill px-6 py-3 transition-colors duration-fast ease-out hover:bg-gold-bright active:scale-[0.97]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
