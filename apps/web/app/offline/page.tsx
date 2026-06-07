/**
 * Offline fallback page (FV-105)
 *
 * The service worker (public/sw.js) pre-caches this route during install
 * and serves it when a navigation request fails due to no connectivity.
 *
 * Design intent:
 *   - Pregame context: athlete at the rink, no cell. They need calm reassurance,
 *     not a red error screen. One focal element, low stimulation, brand-consistent.
 *   - No external fetches. Zero network dependencies. Works fully offline.
 *   - No third-party scripts, no analytics. Conforms to kids-privacy-officer rules.
 */

// Server Component — static, no client state needed.
export default function OfflinePage() {
  return (
    <main
      className="min-h-[100dvh] bg-onyx flex flex-col items-center justify-center px-6 py-16 text-center"
      aria-label="Offline"
    >
      <div className="max-w-[320px] w-full flex flex-col items-center gap-6">
        {/* Brand eyebrow */}
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          From Victory
        </p>

        {/* Wifi-off icon — inline SVG, zero external dependency */}
        <svg
          aria-hidden="true"
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-40"
        >
          <path
            d="M6 8L42 40"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M20.1 14.6A22 22 0 0 1 24 14c5.9 0 11.3 2.3 15.3 6"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.7 20A22 22 0 0 1 14 16.3"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.6 20.8A13 13 0 0 1 37 26"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 26a13 13 0 0 1 8.1-4.9"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M31 32a8 8 0 0 0-10.8-.6"
            stroke="#DFAF37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="40" r="2.5" fill="#DFAF37" />
        </svg>

        {/* Heading */}
        <h1 className="font-display text-[28px] font-extrabold uppercase tracking-[0.02em] text-cream leading-[1.1]">
          You&rsquo;re offline.
        </h1>

        {/* Body */}
        <p className="font-body text-[15px] leading-[1.6] text-cream/60 max-w-[280px]">
          No connection right now. You can still open the app once you&rsquo;re
          back online — your training picks up where you left off.
        </p>

        {/* Divider */}
        <div className="w-10 h-px bg-hairline" aria-hidden="true" />

        {/* Retry instruction — low-stimulation, no button that will fail */}
        <p className="font-body text-[13px] text-cream/40 leading-[1.5]">
          When you have a connection, reopen From Victory.
        </p>
      </div>
    </main>
  );
}
