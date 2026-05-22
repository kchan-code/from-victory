import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms · From Victory",
  description: "From Victory's terms of use.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 22, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream">
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Terms</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Terms of Use
        </h1>
        <p className="text-cream/60 text-[14px]">
          Last updated {LAST_UPDATED}. Final terms are in preparation.
        </p>
      </header>

      <section className="rounded-[18px] border border-hairline bg-charcoal/70 p-6 mb-10">
        <h2 className="font-heading font-semibold text-[18px] m-0 mb-3">
          Coming before launch
        </h2>
        <p className="m-0 text-cream/80 leading-relaxed">
          From Victory is in pre-launch. We&apos;re finalizing the terms of use and will publish
          them on this page before the product opens to subscriptions. In the meantime, the
          following short notes describe how the waitlist works.
        </p>
      </section>

      <Section title="Waitlist signups">
        <p>
          Joining the waitlist means we can email you product updates and let you know when From
          Victory opens for accounts. You can ask to be removed from the list at any time by
          emailing{" "}
          <a
            href="mailto:privacy@fromvictoryapp.com"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            privacy@fromvictoryapp.com
          </a>
          .
        </p>
      </Section>

      <Section title="Not a mental health service">
        <p>
          From Victory is a mental-toughness and faith-training app for athletes. It is not a
          mental health service and is not a substitute for therapy, counseling, or clinical care.
          If you or an athlete you care about is in crisis, please contact the 988 Suicide &amp;
          Crisis Lifeline (call or text 988) or text HOME to 741741 to reach the Crisis Text Line.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms:{" "}
          <a
            href="mailto:privacy@fromvictoryapp.com"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            privacy@fromvictoryapp.com
          </a>
          .
        </p>
      </Section>

      <div className="mt-12 flex items-center justify-between border-t border-hairline pt-6 text-cream/60 text-[13px]">
        <Link href="/" className="text-cream/80 hover:text-gold no-underline">
          ← Back to home
        </Link>
        <Link href="/privacy" className="text-cream/80 hover:text-gold no-underline">
          Privacy →
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-heading font-semibold text-[22px] tracking-[-0.01em] m-0 mb-3 text-cream">
        {title}
      </h2>
      <div className="text-cream/80 leading-relaxed">{children}</div>
    </section>
  );
}
