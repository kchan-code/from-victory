"use client";
// client: usePathname (active-tab detection) + scroll listener (reveal behaviour)

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui";

const TABS = [
  {
    href: "/athlete/daily",
    icon: "book" as const,
    label: "Daily",
  },
  {
    href: "/athlete/pregame",
    icon: "flame" as const,
    label: "Pregame",
  },
  {
    href: "/athlete/practice",
    icon: "whistle" as const,
    label: "Practice",
  },
];

/** Threshold (px) above which the nav hides. Reveals once the athlete has
 *  scrolled past the initial hero ring/cards and needs the nav to navigate. */
const HIDE_THRESHOLD = 64;

export function AthleteBottomNav({ activeHref }: { activeHref?: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Respect prefers-reduced-motion — skip transition, snap visibility.
  // Read inside an effect (not at render) so SSR and the first client render
  // agree (false), avoiding a hydration-class mismatch for reduced-motion users.
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    setPrefersReduced(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setVisible(window.scrollY > HIDE_THRESHOLD);
      });
    };

    // Run once on mount so the nav is correct if the page loads mid-scroll
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const activeRoute = activeHref ?? pathname;

  return (
    <nav
      aria-label="Athlete sections"
      data-coachmark="hub-bottom-nav"
      className={[
        // Base — fixed bottom bar, full width, charcoal surface
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-charcoal border-t border-hairline",
        // Safe-area padding for notched devices
        "pb-[env(safe-area-inset-bottom,0px)]",
        // Slide + fade reveal (off = translated 100% down + opacity 0)
        prefersReduced
          ? visible
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
          : [
              "transition-[transform,opacity]",
              "duration-base",
              "ease-out",
              visible
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0 pointer-events-none",
            ].join(" "),
      ]
        .flat()
        .join(" ")}
    >
      <div className="flex items-stretch justify-around max-w-[640px] mx-auto">
        {TABS.map(({ href, icon, label }) => {
          const isActive = activeRoute === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={[
                // Minimum 56px tap target height (exceeds 44px minimum; thumb-first)
                "flex flex-col items-center justify-center gap-1 py-3 flex-1",
                "min-h-[56px]",
                // Active: gold. Inactive: cream/60 (WCAG AA on charcoal)
                isActive ? "text-gold" : "text-cream/60",
                // Micro press feedback
                "active:scale-95 transition-transform duration-fast ease-out",
                // Keyboard focus ring (inset — tabs are flush, no room to offset)
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60",
                // No tap-highlight on mobile
                "[-webkit-tap-highlight-color:transparent]",
              ].join(" ")}
            >
              <Icon name={icon} size={22} color="currentColor" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
