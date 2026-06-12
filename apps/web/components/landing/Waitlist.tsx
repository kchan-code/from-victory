import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";
import { SvgIcon } from "./SvgIcon";
import { WaitlistForm } from "./WaitlistForm";

const bullets = [
  {
    icon: "flame" as const,
    title: "Hockey and basketball — available now",
    body: "The full app — daily training, pregame audio, pre-practice lock in — is live for hockey and basketball athletes.",
  },
  {
    icon: "book" as const,
    title: "Other sports — join the waitlist",
    body: "Soccer, football, baseball, and more are coming sport-by-sport. Select your sport and we'll notify you when it's ready.",
  },
  {
    icon: "shield" as const,
    title: "No spam, no shame, no streak emails",
    body: "Launch updates only. We email when there's something real to share.",
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
          <SectionMeta num="06" label="Join the early access list" />
        </Reveal>

        <div className="grid gap-12 lg:gap-16 items-center grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <h2 className="fv-final-headline">
              Start training from <em>secure identity.</em>
            </h2>
            <p className="fv-lede mb-8">
              Hockey and basketball are live now. If your sport isn&apos;t on
              the list yet, join the waitlist and we&rsquo;ll reach out when it
              launches. One app — built around daily rhythm, Scripture, and
              game-day resilience.
            </p>
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
