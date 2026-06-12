import { Reveal } from "./Reveal";
import { SectionMeta } from "./SectionMeta";

// Single source of truth — the JSON-LD in this same file
// and the test file both import from here.
export interface FaqEntry {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqEntry[] = [
  {
    q: "Can I read what my athlete does inside a session?",
    a: "No — and that’s by design. Your athlete trains privately. Your dashboard shows their rhythm and participation: which days they trained, how consistently they show up. It never shows what they reflected on, selected, or worked through inside a session. An athlete who knows no one is reading is free to be honest with God and with themselves. That honesty is where the real training happens.",
  },
  {
    q: "Is this therapy or counseling?",
    a: "No. From Victory is mental-toughness and mindset training, not therapy, treatment, or clinical care. Think of it like strength work for the inner game — handling pressure, resetting after mistakes, competing from a settled identity. It’s built to sit alongside the people who already support your athlete: you, their coaches, their pastor. If your athlete needs clinical help, that’s a conversation for a licensed professional.",
  },
  {
    q: "What does my athlete actually believe here?",
    a: "From Victory is rooted in historic Christian faith — evangelical, non-denominational Protestant. We read Scripture (NIV) and apply it to real athletic life: fear, failure, pressure, identity. The throughline is simple and central to the gospel — that an athlete’s worth is secure in Christ, not earned on the scoreboard. We stay accessible across Protestant traditions and don’t lean on any one denomination’s distinctives.",
  },
  {
    q: "How old does my athlete need to be?",
    a: "Thirteen and up. We confirm age at account creation — there’s no account for anyone under 13. For every athlete aged 13 to 17, we apply minor protections by default: no ads, no behavioral analytics, and no third-party tracking, ever. Athletes 18 and older are adults, though for now a parent still sets up and manages the subscription.",
  },
  {
    q: "How much screen time is this?",
    a: "Very little — and that’s intentional. The core is one daily training session, about five minutes. On game days, there’s an optional pregame audio session, also around five minutes. Some athletes add a short pre-practice or post-game read. That’s it. From Victory is built to be picked up, used, and put down — not scrolled. We’re after a daily rhythm, not another feed competing for your athlete’s attention.",
  },
  {
    q: "What does it cost, and can I cancel?",
    a: "$5 a month, or $49 a year. First-time subscribers get a 14-day free trial, so you can try the whole thing before you pay anything. You can cancel anytime from the billing portal — no calls, no friction. One subscription covers every athlete you’ve linked to your account, so a hockey household with two players pays once.",
  },
  {
    q: "How does my athlete get the app?",
    a: "There’s nothing to download from an app store. From Victory is a web app your athlete installs straight from their phone’s browser. On iPhone: tap Share, then Add to Home Screen. On Android: tap Install when prompted. Once it’s on the Home Screen, it opens like any other app. One honest note: on iPhone, daily training reminders only work after it’s been added to the Home Screen.",
  },
];

// FAQPage JSON-LD — built from the same array so it can never drift.
export const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export function Faq() {
  return (
    <section
      id="faq"
      className="py-20 sm:py-24 md:py-32 scroll-mt-20"
    >
      {/* FAQPage structured data — single source of truth from FAQ_JSON_LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal>
          <SectionMeta num="07" label="Common questions" />
        </Reveal>

        <Reveal>
          <div className="grid gap-x-20 gap-y-0 grid-cols-1 lg:grid-cols-[0.4fr_0.6fr]">
            <h2 className="fv-h-section mb-12 lg:mb-0 max-w-[16ch]">
              Questions parents ask.
            </h2>

            {/* Native <details>/<summary> — a11y for free, no JS state */}
            <div
              className="flex flex-col divide-y"
              style={{ borderColor: "var(--fv-hairline)" }}
            >
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.q}
                  className="group py-1"
                >
                  <summary
                    className="
                      flex items-center justify-between gap-4
                      py-[14px] cursor-pointer list-none
                      font-heading font-semibold text-[17px] leading-[1.3]
                      text-cream tracking-[-0.005em]
                      focus-visible:outline-none focus-visible:ring-2
                      focus-visible:ring-gold focus-visible:ring-offset-2
                      focus-visible:ring-offset-onyx rounded-sm
                      select-none
                      min-h-[44px]
                    "
                  >
                    <span>{item.q}</span>
                    {/* Chevron — rotates 180° when open; guarded with motion-safe */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                      className="
                        text-gold flex-none
                        motion-safe:transition-transform motion-safe:duration-200
                        group-open:rotate-180
                      "
                    >
                      <path
                        d="M3 6l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <p className="font-body text-[14.5px] leading-[1.6] text-cream/70 m-0 pb-5 pr-8">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
