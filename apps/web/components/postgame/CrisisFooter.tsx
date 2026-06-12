// Crisis-adjacency footer for Track B post-game modules (FV-225).
//
// Passive, calm, always-present — never a popup, never keyword-triggered,
// never implies the athlete is watched. Resources are identical to the
// FV-146 completion-card pattern in screens-b.tsx.
//
// Design intent: low-stimulation surface. Muted colors, small type,
// understated. The intro line from the FV-225 spec is shown above the
// resource list. Nothing is logged when the athlete sees or taps this.
//
// Server Component — no interactivity beyond native <a> links.

export function CrisisFooter() {
  return (
    <div
      id="crisis-footer"
      className="mt-8 border-t border-hairline pt-6 scroll-mt-6"
      role="complementary"
      aria-label="Crisis resources"
      data-testid="crisis-footer"
    >
      <p className="mb-1 font-body text-[13px] leading-snug text-cream/50">
        Carrying something heavier than the game? You don&rsquo;t have to hold
        it alone &mdash;
      </p>

      <ul className="mt-4 flex flex-col gap-3" role="list">
        <li>
          <p className="font-heading text-[13px] font-semibold text-cream/70">
            988 Suicide &amp; Crisis Lifeline
          </p>
          <p className="mt-0.5 font-body text-[12px] text-cream/55">
            Free, confidential support for anyone in crisis. 24/7.
          </p>
          <a
            href="tel:988"
            className="mt-1.5 inline-block font-heading text-[13px] font-medium text-gold/80 underline underline-offset-2 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Call or text 988
          </a>
        </li>

        <li>
          <p className="font-heading text-[13px] font-semibold text-cream/70">
            Crisis Text Line
          </p>
          <p className="mt-0.5 font-body text-[12px] text-cream/55">
            Free, 24/7, text-based crisis support.
          </p>
          <a
            href="sms:741741?body=HOME"
            className="mt-1.5 inline-block font-heading text-[13px] font-medium text-gold/80 underline underline-offset-2 active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            Text HOME to 741741
          </a>
        </li>

        <li>
          <p className="font-heading text-[13px] font-semibold text-cream/70">
            Talk to a trusted adult
          </p>
          <p className="mt-0.5 font-body text-[12px] text-cream/55">
            A parent, coach, teacher, pastor, or counselor. You don&rsquo;t
            have to carry this alone.
          </p>
        </li>
      </ul>

      <p className="mt-5 font-body text-[11px] leading-relaxed text-cream/50">
        Nothing here is shared with your parent. From Victory is not a
        mental-health service. In an immediate emergency, call 911.
      </p>
    </div>
  );
}
