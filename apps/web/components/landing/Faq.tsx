import { APP_STORE_URL } from "@/lib/marketing/app-store";
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
    a: "No, and that’s by design. Your athlete trains privately. Your dashboard shows their rhythm and participation: which days they trained, how consistently they show up. It never shows what they selected or worked through inside a session. An athlete who knows no one is reading is free to be honest with God and with themselves. That honesty is where the real training happens.",
  },
  {
    q: "Is this therapy or counseling?",
    a: "No. From Victory is mental-toughness and mindset training, not therapy, treatment, or clinical care. Think of it like strength work for the inner game: handling pressure, resetting after mistakes, competing from a settled identity. It’s built to sit alongside the people who already support your athlete: you, their coaches, their pastor. If your athlete needs clinical help, that’s a conversation for a licensed professional.",
  },
  {
    q: "Does visualization actually work?",
    a: "Often, as a supplement. Research reviews find encouraging average results, with real limits: findings vary by sport, task, and study quality, and the stronger evidence comes from imagery practiced repeatedly over weeks, not one session. It supports training. It never replaces physical reps, coaching, or film. From Victory’s guided audio is how we deliver a structured rehearsal: your athlete picks the plays and the hard moment, hears the reset that follows it, and the session closes with spoken prayer. No promises about tonight’s result.",
  },
  {
    q: "What does my athlete actually believe here?",
    a: "From Victory is rooted in historic Christian faith: evangelical, non-denominational Protestant. We read Scripture (NIV) and apply it to real athletic life: fear, failure, pressure, identity. The throughline is simple and central to the gospel: an athlete’s worth is secure in Christ, not earned on the scoreboard. We stay accessible across Protestant traditions and don’t lean on any one denomination’s distinctives.",
  },
  {
    q: "How old does my athlete need to be?",
    a: "Thirteen and up. We confirm age at account creation: there’s no account for anyone under 13. For every athlete aged 13 to 17, we apply minor protections by default: no ads, no behavioral analytics, and no third-party tracking, ever. Athletes 18 and older are adults and can create and pay for their own account, or train under a family subscription a parent manages.",
  },
  {
    q: "How much screen time is this?",
    a: "Very little, and that’s intentional. The core is one daily training session, about five minutes. On game days, there’s an optional pregame audio session, also around five minutes. Some athletes add a short pre-practice read on practice days. That’s it. From Victory is built to be picked up, used, and put down, not scrolled. We’re after a daily rhythm, not another feed competing for your athlete’s attention.",
  },
  {
    q: "What does it cost, and can I cancel?",
    a: "$5 a month, or $49 a year for your first athlete, and $3 a month, or $29 a year, for each additional athlete in your household. First-time subscribers get a 14-day free trial, so you can try the whole thing before you pay anything. You can cancel anytime from the billing portal: no calls, no friction. A household with more athletes pays less per athlete: that’s by design, because the same training serves your whole family.",
  },
  {
    q: "How does my athlete get the app?",
    a: `On iPhone, download From Victory from the US App Store: ${APP_STORE_URL}. On Android, search for From Victory on Google Play. You can also use it in a web browser at fromvictoryapp.com. Your athlete signs in with the same account on any of them.`,
  },
  {
    q: "Where do I subscribe, and does it work in the apps?",
    a: "Subscribe on our website, fromvictoryapp.com, or in the iPhone app through the App Store. Either way, the subscription belongs to your From Victory account, so it works on the website and in both the iPhone and Android apps when you sign in with that same account. The Android app doesn’t sell subscriptions: subscribe on the website, then sign in to the Android app. Subscribed on the website? You don’t need Restore Purchases, and you don’t need to subscribe again. Restore Purchases only finds a subscription bought through the App Store on iPhone. A subscription bought in the iPhone app is managed through Apple on your iPhone.",
  },
  {
    q: "How do we sign in to the app?",
    a: "The sign-in screen says “Welcome back” and has two tabs, “Parent” and “Athlete”. If it greets someone by name and that isn’t you, tap “Not [name]? Sign in as someone else” first. Parents tap “Parent” and enter the email and password for their From Victory account to reach the parent dashboard. An athlete 18 or older who pays for their own account can use their email and password on either tab and goes straight to training. For a forgotten password, they tap “Forgot password?” on the Parent tab or “Reset it here” on the Athlete tab. An athlete on your subscription, including every athlete under 18, taps “Athlete” and enters the username from your invite and their password. There’s nothing for them to buy. If they forget their password, create a reset code from your dashboard.",
  },
  {
    q: "I already subscribe. Why is the app asking me to subscribe?",
    a: "Don’t subscribe again. The most common cause is being signed in to a different account. If the screen says “We couldn’t check your access”, nothing has changed: wait a minute and tap “Try again”. Otherwise, tap “Sign out” and sign in with the account you subscribed with. On the website and in the iPhone app, that can look like a dashboard banner that says “Start training today.” with “Choose a plan”, or a subscription page that says “Subscribed with a different account? Sign out, then sign in with that one.” In the Android app, the parent dashboard shows “Subscribe to From Victory from a web browser at fromvictoryapp.com.” and no subscribe button, because the Android app doesn’t sell subscriptions. If you already subscribe, tap “Sign out” at the top and sign in with the account you subscribed with. Still stuck? Sign in at fromvictoryapp.com in a browser, check your subscription in Settings, then reach us through the Contact page.",
  },
  {
    q: "What does “Training paused” mean on my athlete’s screen?",
    a: "Your athlete’s training is on hold because of something on your account. Their data is safe and nothing has been removed. Usually it means the family subscription isn’t active, so sign in at fromvictoryapp.com in a browser and check your subscription in Settings. If the screen says your family’s plan has fewer spots, your subscription is fine: choose who stays active from your dashboard. If the screen instead says “Access check” and “We couldn’t check your access”, nothing has changed with your subscription. Your athlete can wait a minute and tap “Try again”.",
  },
  {
    q: "Where do I find From Victory online?",
    a: "The product lives at fromvictoryapp.com. If you’re looking for From Victory on the web, that’s the URL to use.",
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

function AnswerText({ text }: { text: string }) {
  if (!text.includes(APP_STORE_URL)) return <>{text}</>;
  const [before, after] = text.split(APP_STORE_URL);
  return (
    <>
      {before}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gold underline underline-offset-2 hover:text-gold-bright break-all"
      >
        {APP_STORE_URL}
      </a>
      {after}
    </>
  );
}

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
          <SectionMeta num="06" label="Common questions" />
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
                      [&::-webkit-details-marker]:hidden
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
                    <AnswerText text={item.a} />
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
