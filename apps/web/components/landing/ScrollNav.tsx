// client: sticky nav with scroll-triggered blur background
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";
import { MobileMenu } from "./MobileMenu";
import { SvgIcon } from "./SvgIcon";

export function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);
  const [sportsOpen, setSportsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sportsRef = useRef<HTMLDivElement>(null);
  const sportsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!sportsOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!sportsRef.current?.contains(e.target as Node)) setSportsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSportsOpen(false);
        sportsButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sportsOpen]);

  return (
    <div className="fv-nav-wrap" data-scrolled={scrolled}>
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <nav
          className="flex items-center h-[72px] md:h-[80px]"
          aria-label="Primary"
        >
          <a
            href="/"
            aria-label="From Victory home"
            className="flex items-center gap-2 sm:gap-3 md:gap-4 text-cream no-underline shrink-0"
          >
            {/* FV-530: the jumbo wordmark (72px) now waits for `xl`. At
                lg widths the ~336px logo block left the link row less
                width than its single-line minimum, pushing the trial pill
                out of view once wrapping was fixed; the compact h-11
                wordmark (~213px block) leaves the lg bar fitting with
                margin. */}
            <Image
              src="/logo-icon.svg"
              alt=""
              width={64}
              height={36}
              className="block h-8 sm:h-9 xl:h-14 w-auto"
              priority
            />
            <Image
              src="/logo-wordmark.svg"
              alt="From Victory"
              width={100}
              height={32}
              className="hidden min-[400px]:block h-9 min-[400px]:h-10 sm:h-11 xl:h-[72px] w-auto translate-y-[3px] xl:translate-y-[2px]"
              priority
            />
          </a>
          <div className="flex-1 min-w-2 sm:min-w-12 md:min-w-16" aria-hidden />
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop nav — the hamburger drawer owns everything below
                `lg` (FV-530; was `md` in FV-512). With link wrapping
                fixed, the md–lg band cannot hold the desktop set on one
                line (min-content ~1092px vs ≤1024 viewports), so tablets
                get the drawer instead of a cut-off bar. The per-item
                hidden sm:/md: classes below are pre-existing and left
                as-is; they're redundant once the wrapper gates at `lg`,
                but harmless. */}
            <div className="hidden lg:flex items-center gap-1.5 font-heading text-[14px]">
              <div ref={sportsRef} className="relative">
                {/* Disclosure of plain links, not an ARIA menu widget — no
                    arrow-key/typeahead contract is implied or implemented. */}
                <button
                  ref={sportsButtonRef}
                  type="button"
                  aria-expanded={sportsOpen}
                  aria-controls="nav-sports-links"
                  onClick={() => setSportsOpen((open) => !open)}
                  className="inline-flex items-center gap-1 sm:gap-1.5 min-h-[44px] bg-transparent border-0 cursor-pointer font-heading text-[13px] sm:text-[14px] text-cream/70 hover:text-cream hover:bg-charcoal px-2 sm:px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
                >
                  Sports
                  <span
                    aria-hidden
                    className={`hidden min-[390px]:inline text-[10px] transition-transform duration-fast ${sportsOpen ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>
                {sportsOpen && (
                  <div
                    id="nav-sports-links"
                    className="absolute right-0 sm:right-auto sm:left-0 top-[calc(100%+8px)] min-w-[180px] bg-onyx border border-hairline-strong rounded-[16px] py-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
                  >
                    {SUPPORTED_SPORTS.map((sport) => (
                      <Link
                        key={sport}
                        href={`/${sport}`}
                        onClick={() => setSportsOpen(false)}
                        className="block text-cream/80 hover:text-cream hover:bg-charcoal no-underline px-5 py-2.5 font-medium transition-colors duration-fast ease-out"
                      >
                        {sportLabel(sport)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {/* FV-530: whitespace-nowrap on each text link — without it
                  the multi-word labels wrap to two/three lines when the bar
                  tightens, which reads as clutter. The labels are short, so
                  nowrap trades a little width for a single clean line. */}
              {/* FV-545: was the /#how homepage anchor; now the dedicated
                  athlete wisdom page. */}
              <Link
                href="/athletes"
                className="hidden md:inline-flex whitespace-nowrap text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
              >
                For the Athlete
              </Link>
              <Link
                href="/parents"
                className="hidden md:inline-flex whitespace-nowrap text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
              >
                For Parents
              </Link>
              {/* FV-530: "For Teams & Churches" and "Resources" are demoted
                  out of the desktop bar. With wrapping fixed (nowrap), the
                  full 9-item set measures ~1275px against the ~1180px the
                  1240px container leaves — the two longest, lowest-intent
                  links are the ones that pushed the trial pill out of view.
                  Both remain one click away in the footer of every page and
                  in the sub-md drawer (MobileMenu), which still lists all 8
                  entries. */}
              {/* Google Play "no in-app purchase" compliance: inside the
                  native shell, /pricing itself redirects through the
                  entry-point router before any marketing content renders (see
                  lib/native-shell-router.ts / middleware.ts) — this ordinary
                  Link needs no shell-specific branching, since Next.js
                  middleware intercepts the navigation (hard load, client
                  soft-nav, and prefetch alike) before the destination page is
                  ever produced. */}
              <Link
                href="/pricing"
                className="hidden sm:inline-flex whitespace-nowrap text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
              >
                Pricing
              </Link>
            </div>

            {/* Persistent "Sign in" link — visible at every width, not just
                `lg:`+ (FV-542). FV-530 gated the whole desktop nav group
                (including this link) behind `lg:`, so on tablet/phone the
                only way back in was the hamburger drawer — KC caught this
                on his own iPad/iPhone the day after that shipped. A plain
                text link (no border, tighter padding than the old `lg:`
                desktop treatment) costs little width, so it sits outside
                the `lg:`-gated group instead of duplicating a second copy
                once that group appears. */}
            <Link
              href="/signin"
              className="inline-flex items-center min-h-[44px] whitespace-nowrap text-cream/70 hover:text-cream font-heading font-semibold text-[13px] rounded-pill px-2 sm:px-3 no-underline transition-colors duration-fast ease-out"
            >
              Sign in
            </Link>

            {/* Persistent trial pill (FV-512, KC decision docs/conversion-
                audit-2026-08-29.md §7.6) — the one gold element in the nav,
                visible at every width, not just `sm:`+. Below `md` it sits
                in the bar next to the hamburger; the same "Start free
                trial" action also lives inside the drawer for parity. */}
            <Link
              href="/signup"
              data-testid="nav-trial-pill"
              className="inline-flex min-h-[44px] items-center gap-1.5 sm:gap-2 whitespace-nowrap bg-gold text-onyx border border-gold font-heading font-semibold text-[13px] rounded-pill px-3 sm:px-[18px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-95"
            >
              Start free trial
              <SvgIcon name="arrow" size={14} className="hidden sm:block" />
            </Link>

            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-pill text-cream/80 transition-colors duration-fast ease-out hover:bg-charcoal hover:text-cream lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              {mobileMenuOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        triggerRef={mobileMenuButtonRef}
      />
    </div>
  );
}
