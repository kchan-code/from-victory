// client: focus containment + return, Escape-to-close, outside-pointerdown
// close, and body scroll lock for the mobile nav drawer (FV-512).
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SUPPORTED_SPORTS, sportLabel } from "@/lib/sports";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const menuLinkClass =
  "flex min-h-[44px] items-center rounded-[10px] px-4 font-heading text-[16px] font-medium text-cream/85 no-underline transition-colors duration-fast ease-out hover:bg-charcoal hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-onyx";

export function MobileMenu({ open, onClose, triggerRef }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Tracks whether the drawer has ever been opened so the focus-return
  // effect below never steals focus onto the hamburger trigger on the
  // page's initial render (only on an actual close).
  const hasOpenedRef = useRef(false);

  // Body scroll lock while the drawer is open. `overscroll-contain` on the
  // scrollable panel (below) keeps residual bounce from reaching the page
  // behind it on iOS Safari. Restores on close and on unmount so a fast
  // re-render or navigation never strands the page locked.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus moves into the drawer (the close button, the first tappable
  // target) on open, and back to the hamburger trigger on every close path
  // (Escape, backdrop tap, close button, or a menu link navigating away).
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      closeButtonRef.current?.focus();
    } else if (hasOpenedRef.current) {
      triggerRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- triggerRef is a stable ref object
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    // A pointerdown anywhere outside the panel (including the backdrop,
    // which sits outside panelRef) closes the drawer — one listener covers
    // both cases, mirroring the Sports disclosure pattern in ScrollNav.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div aria-hidden className="absolute inset-0 bg-onyx/80 backdrop-blur-sm" />
      <div
        ref={panelRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain border-b border-hairline-strong bg-onyx pb-8 pt-20 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
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
        </button>

        <nav aria-label="Mobile" className="flex flex-col gap-1 px-5 pt-2">
          <p className="px-4 pb-1 pt-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cream/45">
            Sports
          </p>
          {SUPPORTED_SPORTS.map((sport) => (
            <Link
              key={sport}
              href={`/${sport}`}
              onClick={onClose}
              className={menuLinkClass}
            >
              {sportLabel(sport)}
            </Link>
          ))}

          <div className="my-2 border-t border-hairline" aria-hidden />

          <a href="/#how" onClick={onClose} className={menuLinkClass}>
            For the Athlete
          </a>
          <Link href="/parents" onClick={onClose} className={menuLinkClass}>
            For Parents
          </Link>
          <Link href="/teams" onClick={onClose} className={menuLinkClass}>
            For Teams &amp; Churches
          </Link>
          <Link href="/pricing" onClick={onClose} className={menuLinkClass}>
            Pricing
          </Link>
          <Link href="/resources" onClick={onClose} className={menuLinkClass}>
            Resources
          </Link>
          <Link href="/signin" onClick={onClose} className={menuLinkClass}>
            Sign in
          </Link>

          <Link
            href="/signup"
            onClick={onClose}
            className="mt-3 flex min-h-[52px] items-center justify-center rounded-pill border border-gold bg-gold px-6 font-heading text-[15px] font-semibold text-onyx no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Start free trial
          </Link>
        </nav>
      </div>
    </div>
  );
}
