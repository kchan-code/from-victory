import Link from "next/link";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";

// FV-514 homepage IA restructure — pricing summary strip. Heading is
// KC-approved verbatim (audit doc §7 decision 1). Price line is the same
// sentence used verbatim on the pricing-page hero (app/pricing/page.tsx).

export function PricingSummary() {
  return (
    <section className="py-16 sm:py-20 md:py-28 bg-charcoal border-y border-hairline">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="04" label="Simple, honest pricing" />
        </Reveal>
        <Reveal>
          <div className="max-w-[620px]">
            <h2 className="fv-h-section mb-6">14 days free. Cancel anytime.</h2>
            {/* Verbatim: app/pricing/page.tsx hero sub-copy. */}
            <p className="fv-lede mb-8">
              $49/yr or $5/mo for your first athlete &mdash; $29/yr or $3/mo
              for each additional. No ads, no data sold, cancel anytime.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2.5 bg-transparent text-cream border border-hairline-strong font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-onyx active:scale-[0.97]"
            >
              {/* Verbatim: app/parents/page.tsx link label. */}
              See full pricing details
              <SvgIcon name="arrow" size={16} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
