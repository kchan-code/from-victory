import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-onyx text-cream flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="max-w-[360px] w-full">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold mb-4">
          From Victory
        </div>
        <h1 className="font-display text-[32px] font-extrabold uppercase tracking-[0.02em] text-cream leading-[1.1] mb-4">
          Page not found.
        </h1>
        <p className="font-body text-[15px] leading-[1.55] text-cream/70 mb-8">
          This page doesn&rsquo;t exist. Head back to the dashboard and keep
          going.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-gold text-onyx border border-gold font-heading font-semibold text-[15px] rounded-pill px-7 py-[14px] no-underline transition-colors duration-200 ease-out hover:bg-[#F4C24F] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFAF37]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
