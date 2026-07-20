import Link from "next/link";
import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";
import { WaitlistForm } from "./WaitlistForm";

const bullets = [
  {
    icon: "flame" as const,
    title: "Hockey, basketball, golf, and football — available now",
    body: "The full app — daily training, pregame audio, pre-practice lock in — is live. Start your free trial today.",
  },
  {
    icon: "book" as const,
    title: "Other sports — join the waitlist",
    body: "Soccer, baseball, and more are coming sport-by-sport. Select your sport and we'll notify you when it's ready.",
  },
  {
    icon: "shield" as const,
    title: "No spam, no shame, no streak emails",
    body: "Sport launch updates only. We email when there's something real to share.",
  },
];

export function Waitlist() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden py-20 sm:py-24 md:py-32"
    >
      <div className="fv-final-bg absolute inset-0 pointer-events-none" />
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="07" label="Get started" />
        </Reveal>

        <div className="grid gap-12 lg:gap-16 items-center grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <h2 className="fv-final-headline">
              Start training from <em>secure identity.</em>
            </h2>
            <p className="fv-lede mb-8">
              Hockey, basketball, golf, and football are live now — start your athlete&apos;s
              14-day free trial today. Playing something else? Select your sport
              below and we&rsquo;ll reach out when it launches.
            </p>

            {/* Primary CTA for hockey/basketball families */}
            <div className="mb-10">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 bg-gold text-onyx border border-gold font-heading font-semibold rounded-pill px-7 py-[18px] text-[16px] no-underline transition-colors duration-base ease-out hover:bg-gold-bright active:scale-[0.97]"
              >
                Start your athlete&apos;s 14-day free trial
                <SvgIcon name="arrow" size={16} />
              </Link>
              <p className="mt-3 font-mono text-[11px] tracking-[0.16em] uppercase text-cream/40 font-semibold">
                14 days free for first-time subscribers &mdash; then $5/mo or $49/yr &mdash; cancel anytime
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              {bullets.map((b) => (
                <div key={b.title} className="flex items-start gap-3.5">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center text-gold flex-none"
                    style={{
                      background: "var(--fv-gold-soft)",
                      border: "1px solid rgba(223,175,55,0.28)",
                    }}
                  >
                    <SvgIcon name={b.icon} size={16} />
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-[15px] text-cream">
                      {b.title}
                    </div>
                    <div className="font-body text-[13.5px] text-cream/50 leading-[1.5]">
                      {b.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <WaitlistForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
