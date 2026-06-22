"use client";
// client: localStorage (flag read/write), createPortal (document.body),
// focus management (document.activeElement, element.focus), scroll lock
// (document.body.style.overflow), querySelector (anchor resolution),
// matchMedia (prefers-reduced-motion), Escape key handler.

/**
 * CoachmarkTour (FV-313)
 *
 * A library-free, accessibility-complete first-run tour. Dims the screen,
 * spotlights one element at a time, and walks the athlete through 6 stops
 * across two surfaces (hub + pregame start).
 *
 * Persistence: two independent localStorage keys so each surface shows once.
 * Keys follow the `fv_install_prompt_dismissed` pattern from InstallPrompt.tsx.
 *
 * A11y contract:
 *   - role="dialog" + aria-modal="true" + aria-label on the tooltip
 *   - Focus moves INTO the tooltip on open; RESTORED to prior element on close
 *   - Tab cycles WITHIN the tooltip (focus trap)
 *   - aria-live="polite" region announces each step ("step N of N")
 *   - Escape dismisses + sets the flag
 *   - prefers-reduced-motion suppresses animation (CSS only)
 *   - scrollIntoView({block:"center"}) for off-screen anchors
 *   - document.body overflow locked while active
 *   - Primary CTA ≥56px tall; Skip ≥44px
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// COPY — final, approved by content-curator (FV-313). Mentor voice; rhythm is
// framed as showing-up/returning (never a streak to protect); no "kid".
// ---------------------------------------------------------------------------
const STOP_COPY: Record<
  string,
  { title?: string; body: string }
> = {
  "hub-rhythm-ring": {
    title: "Your rhythm",
    body: "This tracks showing up and coming back — never a streak to protect.",
  },
  "hub-daily-card": {
    title: "Start here",
    body: "Your daily training: one mental skill, one truth from Scripture. Begin here each day.",
  },
  "hub-pregame-card": {
    title: "Before a game",
    body: "Got a game? This five-minute audio gets your head right before warmups.",
  },
  "hub-bottom-nav": {
    title: "Get around",
    body: "Your way around the app — jump to any part from here.",
  },
  "pregame-begin-btn": {
    title: "Build it",
    body: "Tap to build today's pregame session, shaped to your spot and your game.",
  },
  "pregame-quick-reset-btn": {
    title: "Quick reset",
    body: "No time for the full flow? A fast reset for the locker room.",
  },
};

// Shown on the final step's primary button — ties the tour back to the brand spine.
const TOUR_DONE_LINE = "Compete from victory";

// ---------------------------------------------------------------------------
// Types + constants
// ---------------------------------------------------------------------------

type Surface = "hub" | "pregame";

const STORAGE_KEYS: Record<Surface, string> = {
  hub: "fv_tour_hub_done",
  pregame: "fv_tour_pregame_done",
};

/** data-coachmark slugs, in order, per surface. */
const SURFACE_STOPS: Record<Surface, string[]> = {
  hub: [
    "hub-rhythm-ring",
    "hub-daily-card",
    "hub-pregame-card",
    "hub-bottom-nav",
  ],
  pregame: ["pregame-begin-btn", "pregame-quick-reset-btn"],
};

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowSide: "top" | "bottom" | "left" | "right";
  arrowOffset: number;
}

// ---------------------------------------------------------------------------
// localStorage helpers (guarded for private-mode Safari)
// ---------------------------------------------------------------------------

function isTourDone(surface: Surface): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS[surface]) === "1";
  } catch {
    return false;
  }
}

function setTourDone(surface: Surface): void {
  try {
    localStorage.setItem(STORAGE_KEYS[surface], "1");
  } catch {
    // Private-mode Safari may throw; flag just won't persist across reloads.
  }
}

/** Clear BOTH surface flags on sign-out. Called by SignOutButton. */
export function clearTourFlags(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.hub);
    localStorage.removeItem(STORAGE_KEYS.pregame);
  } catch {
    // Best-effort
  }
}

// ---------------------------------------------------------------------------
// Tooltip position calculator
// ---------------------------------------------------------------------------
// Places the tooltip adjacent to the anchor rect, clamped to the viewport.
// Prefers positioning ABOVE the anchor; falls back to below, then left/right.
// Accounts for env(safe-area-inset-bottom) by using a generous bottom margin
// near the bottom nav zone (80px + safe-area buffer).

const TOOLTIP_WIDTH = 288;
const TOOLTIP_ESTIMATED_HEIGHT = 180;
const ARROW_SIZE = 8;
const VIEWPORT_PADDING = 16;
const BOTTOM_NAV_GUARD = 100; // px from bottom — clears the fixed nav + safe area

function computeTooltipPosition(
  anchor: AnchorRect,
  viewportWidth: number,
  viewportHeight: number,
): TooltipPosition {
  const spaceAbove = anchor.top - VIEWPORT_PADDING;
  const spaceBelow = viewportHeight - (anchor.top + anchor.height) - BOTTOM_NAV_GUARD;
  const spaceLeft = anchor.left - VIEWPORT_PADDING;
  const spaceRight = viewportWidth - (anchor.left + anchor.width) - VIEWPORT_PADDING;

  let arrowSide: TooltipPosition["arrowSide"];
  let top: number;
  let left: number;

  const anchorCenterX = anchor.left + anchor.width / 2;
  const anchorCenterY = anchor.top + anchor.height / 2;

  if (spaceAbove >= TOOLTIP_ESTIMATED_HEIGHT) {
    // Prefer above
    arrowSide = "bottom";
    top = anchor.top - TOOLTIP_ESTIMATED_HEIGHT - ARROW_SIZE - 8;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchorCenterX - TOOLTIP_WIDTH / 2,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    );
  } else if (spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT) {
    // Below
    arrowSide = "top";
    top = anchor.top + anchor.height + ARROW_SIZE + 8;
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchorCenterX - TOOLTIP_WIDTH / 2,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    );
  } else if (spaceRight >= TOOLTIP_WIDTH) {
    // Right
    arrowSide = "left";
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchorCenterY - TOOLTIP_ESTIMATED_HEIGHT / 2,
        viewportHeight - TOOLTIP_ESTIMATED_HEIGHT - BOTTOM_NAV_GUARD,
      ),
    );
    left = anchor.left + anchor.width + ARROW_SIZE + 8;
  } else if (spaceLeft >= TOOLTIP_WIDTH) {
    // Left
    arrowSide = "right";
    top = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchorCenterY - TOOLTIP_ESTIMATED_HEIGHT / 2,
        viewportHeight - TOOLTIP_ESTIMATED_HEIGHT - BOTTOM_NAV_GUARD,
      ),
    );
    left = anchor.left - TOOLTIP_WIDTH - ARROW_SIZE - 8;
  } else {
    // Fallback: centered below with clamping
    arrowSide = "top";
    top = Math.min(
      anchor.top + anchor.height + ARROW_SIZE + 8,
      viewportHeight - TOOLTIP_ESTIMATED_HEIGHT - BOTTOM_NAV_GUARD,
    );
    left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        anchorCenterX - TOOLTIP_WIDTH / 2,
        viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING,
      ),
    );
  }

  // Arrow offset: how far along the tooltip's edge the arrow sits
  let arrowOffset: number;
  if (arrowSide === "top" || arrowSide === "bottom") {
    // Horizontal arrow: percentage offset from tooltip left
    const tooltipLeft = left;
    const targetX = anchorCenterX - tooltipLeft;
    arrowOffset = Math.max(24, Math.min(targetX, TOOLTIP_WIDTH - 24));
  } else {
    // Vertical arrow
    const tooltipTop = top;
    const targetY = anchorCenterY - tooltipTop;
    arrowOffset = Math.max(24, Math.min(targetY, TOOLTIP_ESTIMATED_HEIGHT - 24));
  }

  return { top, left, arrowSide, arrowOffset };
}

// ---------------------------------------------------------------------------
// CoachmarkTour component
// ---------------------------------------------------------------------------

export default function CoachmarkTour({ surface }: { surface: Surface }) {
  const stops = SURFACE_STOPS[surface];

  // ---- State ----------------------------------------------------------------

  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  // Tracks whether we've mounted (used so portal only renders client-side).
  const [mounted, setMounted] = useState(false);

  // ---- Refs -----------------------------------------------------------------

  /** The element that had focus before the tour opened. */
  const priorFocusRef = useRef<Element | null>(null);
  /** Ref to the tooltip container for focus management + trap. */
  const tooltipRef = useRef<HTMLDivElement>(null);
  /** Ref to the primary CTA button inside the tooltip. */
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  // ---- Helpers --------------------------------------------------------------

  const currentStop = stops[stepIndex];
  const isLastStep = stepIndex === stops.length - 1;

  const resolveAnchorEl = useCallback(
    (slug: string): Element | null => {
      if (typeof document === "undefined") return null;
      return document.querySelector(`[data-coachmark="${slug}"]`);
    },
    [],
  );

  const updateAnchorRect = useCallback(
    (slug: string) => {
      const el = resolveAnchorEl(slug);
      if (!el) return false;
      // Guard: scrollIntoView may not be present in all test environments.
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({
          block: "center",
          behavior: prefersReduced ? "instant" : "smooth",
        });
      }
      // Wait for scroll to settle before measuring, then update state
      const measure = () => {
        const rect = el.getBoundingClientRect();
        const newRect: AnchorRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };
        setAnchorRect(newRect);
        const pos = computeTooltipPosition(
          newRect,
          window.innerWidth,
          window.innerHeight,
        );
        setTooltipPos(pos);
      };
      // Short delay to let smooth scroll settle
      setTimeout(measure, prefersReduced ? 0 : 200);
      return true;
    },
    [resolveAnchorEl, prefersReduced],
  );

  const dismiss = useCallback(
    (markDone: boolean) => {
      if (markDone) setTourDone(surface);
      setActive(false);
      // Restore scroll lock
      document.body.style.overflow = "";
      // Restore focus to pre-tour element
      if (priorFocusRef.current && "focus" in priorFocusRef.current) {
        (priorFocusRef.current as HTMLElement).focus();
      }
    },
    [surface],
  );

  const handleNext = useCallback(() => {
    if (isLastStep) {
      dismiss(true);
      return;
    }
    const nextIndex = stepIndex + 1;
    // Skip steps whose anchors don't exist on this render
    let found = false;
    for (let i = nextIndex; i < stops.length; i++) {
      const slug = stops[i];
      if (slug !== undefined && resolveAnchorEl(slug)) {
        setStepIndex(i);
        found = true;
        break;
      }
    }
    if (!found) {
      dismiss(true);
    }
  }, [isLastStep, stepIndex, stops, resolveAnchorEl, dismiss]);

  const handleSkip = useCallback(() => {
    dismiss(true);
  }, [dismiss]);

  // ---- Effects --------------------------------------------------------------

  // Set mounted flag so portal is client-only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect prefers-reduced-motion once on mount (must be in effect for SSR safety).
  // Guard for test environments where matchMedia may not be stubbed.
  useEffect(() => {
    if (typeof window.matchMedia === "function") {
      setPrefersReduced(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    }
  }, []);

  // Activate the tour once, only if not already done
  useEffect(() => {
    if (!mounted) return;
    if (isTourDone(surface)) return;
    // Find the first stop that actually exists in the DOM
    for (let i = 0; i < stops.length; i++) {
      const slug = stops[i];
      if (slug !== undefined && resolveAnchorEl(slug)) {
        setStepIndex(i);
        setActive(true);
        priorFocusRef.current = document.activeElement;
        document.body.style.overflow = "hidden";
        return;
      }
    }
    // No anchors found (e.g. conditional content not rendered) — mark done silently
    setTourDone(surface);
  }, [mounted, surface, stops, resolveAnchorEl]);

  // Update anchor rect whenever the step changes or tour activates
  useEffect(() => {
    if (!active || !currentStop) return;
    updateAnchorRect(currentStop);
  }, [active, currentStop, updateAnchorRect]);

  // Move focus into tooltip when it opens or step changes
  useEffect(() => {
    if (!active) return;
    // Defer to let the DOM settle after portal renders
    const frame = requestAnimationFrame(() => {
      primaryBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [active, stepIndex]);

  // Escape key dismiss
  useEffect(() => {
    if (!active) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        dismiss(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [active, dismiss]);

  // Focus trap within tooltip
  useEffect(() => {
    if (!active || !tooltipRef.current) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !tooltipRef.current) return;
      const focusable = Array.from(
        tooltipRef.current.querySelectorAll<HTMLElement>(
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
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [active, stepIndex]);

  // Restore scroll lock cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ---- Guard: don't render until mounted or not active ----------------------

  if (!mounted || !active || !anchorRect || !tooltipPos || !currentStop) {
    return null;
  }

  const copy = STOP_COPY[currentStop] ?? { body: currentStop };
  const stepLabel = `Step ${stepIndex + 1} of ${stops.length}`;

  // Spotlight: add margin around the anchor for the halo
  const HALO = 8;
  const spotlightRect = {
    top: anchorRect.top - HALO,
    left: anchorRect.left - HALO,
    width: anchorRect.width + HALO * 2,
    height: anchorRect.height + HALO * 2,
  };

  // Arrow style helpers
  function arrowStyle(): React.CSSProperties {
    if (!tooltipPos) return {};
    const { arrowSide, arrowOffset } = tooltipPos;
    const base: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
    };
    switch (arrowSide) {
      case "top":
        return {
          ...base,
          top: -ARROW_SIZE,
          left: arrowOffset,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid #DFAF37`,
        };
      case "bottom":
        return {
          ...base,
          bottom: -ARROW_SIZE,
          left: arrowOffset,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderTop: `${ARROW_SIZE}px solid #DFAF37`,
        };
      case "left":
        return {
          ...base,
          left: -ARROW_SIZE,
          top: arrowOffset,
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid #DFAF37`,
        };
      case "right":
        return {
          ...base,
          right: -ARROW_SIZE,
          top: arrowOffset,
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderLeft: `${ARROW_SIZE}px solid #DFAF37`,
        };
    }
  }

  const portal = (
    // Outer container: covers the full viewport
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      // Prevent pointer events from reaching the page beneath
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Onyx backdrop (~0.7 opacity) ──────────────────────────────────
          We use four rectangular masks around the spotlight rect instead of
          clip-path or backdrop-filter (which have iOS quirks) so the element
          "lit up" by the cutout is always the real DOM element (not a copy).
          box-shadow on the anchor wrapper creates the gold spotlight halo. */}
      {/* Top strip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: spotlightRect.top,
          background: "rgba(5,5,5,0.72)",
        }}
        className="animate-coachmark-fade-in"
      />
      {/* Left strip (between top and bottom of spotlight) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: spotlightRect.top,
          left: 0,
          width: spotlightRect.left,
          height: spotlightRect.height,
          background: "rgba(5,5,5,0.72)",
        }}
        className="animate-coachmark-fade-in"
      />
      {/* Right strip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: spotlightRect.top,
          left: spotlightRect.left + spotlightRect.width,
          right: 0,
          height: spotlightRect.height,
          background: "rgba(5,5,5,0.72)",
        }}
        className="animate-coachmark-fade-in"
      />
      {/* Bottom strip */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: spotlightRect.top + spotlightRect.height,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(5,5,5,0.72)",
        }}
        className="animate-coachmark-fade-in"
      />

      {/* ── Spotlight halo ring on the anchor ────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius: 14,
          boxShadow:
            "0 0 0 2px #DFAF37, 0 0 20px 4px rgba(223,175,55,0.30)",
          pointerEvents: "none",
        }}
        className="animate-coachmark-fade-in"
      />

      {/* ── Tooltip ──────────────────────────────────────────────────────── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tour: ${copy.title ?? stepLabel}`}
        data-testid="coachmark-tooltip"
        style={{
          position: "absolute",
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_WIDTH,
          zIndex: 10000,
        }}
        className="animate-coachmark-fade-in"
      >
        {/* Arrow */}
        <div aria-hidden="true" style={arrowStyle()} />

        {/* Tooltip card */}
        <div
          style={{
            background: "#050505",
            border: "1.5px solid #DFAF37",
            borderRadius: 14,
            padding: "16px 18px 14px",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(223,175,55,0.15)",
          }}
        >
          {/* Step counter + aria-live region */}
          <div
            aria-live="polite"
            aria-atomic="true"
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold/60 mb-2"
          >
            {stepLabel}
          </div>

          {/* Title */}
          {copy.title && (
            <p className="font-heading font-semibold text-[15px] text-cream leading-snug mb-1.5">
              {copy.title}
            </p>
          )}

          {/* Body */}
          <p className="font-body text-[13px] leading-[1.6] text-cream/75 mb-4">
            {copy.body}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3">
            {/* Skip */}
            <button
              type="button"
              onClick={handleSkip}
              data-testid="coachmark-skip-btn"
              className={[
                "min-h-[44px] font-body text-[13px] text-cream/50 px-2",
                "hover:text-cream/70 transition-colors duration-fast ease-out",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-gold/40 focus-visible:ring-offset-2",
                "focus-visible:ring-offset-onyx",
                "bg-transparent border-0 cursor-pointer",
              ].join(" ")}
            >
              Skip tour
            </button>

            {/* Next / Finish */}
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={handleNext}
              data-testid="coachmark-next-btn"
              className={[
                "min-h-[56px] rounded-pill bg-gold px-5 font-heading font-semibold",
                "text-[14px] text-onyx transition-colors duration-fast ease-out",
                "hover:bg-gold-bright active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-gold/50 focus-visible:ring-offset-2",
                "focus-visible:ring-offset-onyx",
                "motion-safe:transition-transform",
              ].join(" ")}
            >
              {isLastStep ? TOUR_DONE_LINE : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
