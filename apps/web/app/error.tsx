"use client"; // client: error boundary requires useEffect + reset callback (React requirement)

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to server-side telemetry if wired up later — no third-party SDK here.
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-[100dvh] bg-onyx text-cream flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-[360px] w-full">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold mb-4">
          From Victory
        </div>
        <h1 className="font-display text-[32px] font-extrabold uppercase tracking-[0.02em] text-cream leading-[1.1] mb-4">
          Something went wrong.
        </h1>
        <p className="font-body text-[15px] leading-[1.55] text-cream/70 mb-8">
          We hit an unexpected error. Your training data is safe — this is a
          temporary issue on our end.
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center bg-gold text-onyx border border-gold font-heading font-semibold text-[15px] rounded-pill px-7 py-[14px] transition-colors duration-200 ease-out hover:bg-[#F4C24F] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFAF37]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
