// client: sticky nav with scroll-triggered blur background
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SvgIcon } from "./SvgIcon";

export function ScrollNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            className="flex items-center gap-3 md:gap-4 text-cream no-underline shrink-0"
          >
            <Image
              src="/logo-icon.svg"
              alt=""
              width={64}
              height={36}
              className="block h-9 md:h-14 w-auto"
              priority
            />
            <Image
              src="/logo-wordmark.svg"
              alt="From Victory"
              width={100}
              height={32}
              className="block h-8 md:h-12 w-auto translate-y-[3px] md:translate-y-[5px]"
              priority
            />
          </a>
          <div className="flex-1 min-w-2 sm:min-w-12 md:min-w-16" aria-hidden />
          <div className="flex items-center gap-1.5 font-heading text-[14px]">
            <a
              href="/#how"
              className="hidden md:inline-flex text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
            >
              For the Athlete
            </a>
            <Link
              href="/parents"
              className="hidden md:inline-flex text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
            >
              For Parents
            </Link>
            <Link
              href="/teams"
              className="hidden lg:inline-flex text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
            >
              For Teams &amp; Churches
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex text-cream/70 hover:text-cream hover:bg-charcoal no-underline px-3.5 py-2 rounded-pill font-medium transition-colors duration-fast ease-out"
            >
              Pricing
            </Link>
            <Link
              href="/signin"
              className="inline-flex items-center whitespace-nowrap bg-transparent text-cream border border-hairline-strong hover:border-cream/50 font-heading font-semibold text-[13px] rounded-pill px-[14px] sm:px-[18px] py-[11px] no-underline transition-colors duration-base ease-out"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="ml-1.5 sm:ml-2 hidden sm:inline-flex items-center gap-1.5 sm:gap-2 whitespace-nowrap bg-gold text-onyx border border-gold font-heading font-semibold text-[13px] rounded-pill px-[12px] sm:px-[18px] py-[11px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright"
            >
              Start free trial
              <SvgIcon name="arrow" size={14} className="hidden sm:block" />
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
