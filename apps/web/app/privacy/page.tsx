import type { Metadata } from "next";
import Link from "next/link";

// FV-324 — Privacy policy expanded from waitlist-only to cover IN-APP data
// handling (parent + athlete accounts, payments, push, email, subprocessors,
// minor protections). DRAFT for KC + attorney review before launch.
// FV-340 — Reconciled to describe BOTH account flows: parent-managed minor
// (13–17, synthetic email, username/device login) accounts AND adult (18+)
// self-managed accounts (own email + password, self-pay, no parent link).
// Adult self-serve is built but gated behind ENABLE_ADULT_SIGNUP — coordinate
// publication with the flag flip and attorney sign-off (FV-329).
// Every factual claim here is grounded in the verified data inventory
// (schema + code). Launch notes:
//   1. EFFECTIVE_DATE below is set to June 24, 2026 (KC, 2026-06-25); the
//      policy still needs attorney sign-off before publication (FV-329).
//   2. The private-journal infrastructure is built but DORMANT (FV-135, zero
//      production callers) and is intentionally NOT described as an active
//      feature here. Revisit if/when it is wired.

export const metadata: Metadata = {
  title: "Privacy Policy · From Victory",
  description:
    "How From Victory collects, uses, stores, and protects information — across our website, the sport waitlist, and the From Victory app for parents and athletes (ages 13 and above).",
  robots: { index: true, follow: true },
};

// Effective date set to June 24, 2026 by KC (2026-06-25). Attorney sign-off
// (FV-329) still required before the policy is published.
const EFFECTIVE_DATE = "June 24, 2026";
const PRIVACY_EMAIL = "privacy@fromvictoryapp.com";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream">
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Privacy</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          From Victory Privacy Policy
        </h1>
        <p className="text-cream/60 text-[14px]">
          Effective Date: {EFFECTIVE_DATE}
          <br />
          Website: FromVictoryApp.com
          <br />
          Contact:{" "}
          <a
            href={`mailto:${PRIVACY_EMAIL}`}
            className="text-cream/80 underline underline-offset-2 hover:text-gold"
          >
            {PRIVACY_EMAIL}
          </a>
        </p>
      </header>

      <section className="mb-10 text-cream/85 leading-relaxed space-y-4">
        <p>
          From Victory LLC, a New Jersey limited liability company (&ldquo;From
          Victory,&rdquo; &ldquo;we,&rdquo; or &ldquo;us&rdquo;), respects your privacy. This
          Privacy Policy explains how we collect,
          use, store, and protect information across three places: our website, the sport
          waitlist form, and the From Victory app used by parents and athletes.
        </p>
        <p>
          From Victory is a daily mental-toughness training app, with faith as its
          foundation, for athletes ages 13 and above. Accounts work in one of two ways: a parent
          or guardian creates and manages an account for a younger athlete and is the
          purchaser, or an adult athlete (18 or older) creates and manages their own account
          and is the purchaser. We collect as little information as we can while still running
          the app, and we apply additional protections to every account belonging to a minor —
          an athlete ages 13 to 17.
        </p>
        <p>
          By using our website, submitting the waitlist form, or creating an account, you
          acknowledge the practices described in this Privacy Policy.
        </p>
      </section>

      <Section title="1. Information We Collect">
        <SubHeading>a. Sport waitlist</SubHeading>
        <p>When you join the From Victory waitlist, we may collect:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Name</li>
          <li>Email address</li>
          <li>Role, such as athlete, parent, coach, or other</li>
          <li>Primary sport</li>
          <li>Optional note, if you choose to provide one</li>
        </ul>
        <p>
          Please do not include sensitive personal information, medical information, financial
          information, passwords, or highly personal details in the optional note field.
        </p>

        <SubHeading>b. Parent / guardian accounts</SubHeading>
        <p>When a parent or guardian creates an account, we collect:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Email address (used to sign in and for account communications)</li>
          <li>Password (stored only in hashed form by our authentication provider)</li>
          <li>First name</li>
          <li>
            Subscription and billing details needed to manage your plan — see &ldquo;Payment
            information&rdquo; below
          </li>
          <li>Your email preferences, such as whether you have opted out of the weekly digest</li>
        </ul>
        <p>We do not collect a parent&apos;s birthdate, phone number, home address, or photos.</p>

        <SubHeading>c. Athlete accounts created by a parent (ages 13–21)</SubHeading>
        <p>
          A parent or guardian sets up the athlete&apos;s account. For a parent-managed athlete
          we collect only:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>First name</li>
          <li>Birthdate (used to confirm the athlete is at least 13 and to apply minor protections)</li>
          <li>Sport</li>
          <li>A username the athlete uses to sign in</li>
          <li>
            Optional training details the athlete selects from the options we provide to
            personalize sessions — such as their position and the area they want to work on
          </li>
          <li>An optional upcoming game date, used only to time a reminder, then cleared</li>
        </ul>
        <p>
          We do <strong>not</strong> collect an athlete&apos;s real email address, phone
          number, home address, photos, or precise location. The app creates a non-public,
          system-generated sign-in identifier for each athlete so the account can function;
          it is not a working email address and is never used to contact the athlete.
        </p>
        <p>
          We also record the athlete&apos;s training activity — for example, which sessions
          were started or completed and when. How that activity is shared (and not shared) is
          described in &ldquo;The athlete&apos;s private space&rdquo; below.
        </p>

        <SubHeading>d. Adult athlete accounts (18 and older)</SubHeading>
        <p>
          An adult athlete (18 or older) can create and manage their own account, without a
          parent or guardian. For an adult athlete we collect:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Email address (used to sign in and for account and billing communications)</li>
          <li>Password (stored only in hashed form by our authentication provider)</li>
          <li>First name</li>
          <li>
            Birthdate, plus an explicit 18-or-older confirmation, used to verify the athlete is
            at least 18
          </li>
          <li>Sport</li>
          <li>
            Optional training details the athlete selects from the options we provide to
            personalize sessions — such as their position and the area they want to work on
          </li>
          <li>An optional upcoming game date, used only to time a reminder, then cleared</li>
          <li>
            Subscription and billing details needed to manage their plan — see &ldquo;Payment
            information&rdquo; below
          </li>
        </ul>
        <p>
          An adult athlete is both the account holder and the purchaser for their own account;
          there is no parent or guardian on the account, and no one else can see their
          training. Unlike a parent-managed athlete, an adult athlete signs in with their own
          email address. We do <strong>not</strong> collect an adult athlete&apos;s last name,
          phone number, home address, photos, or precise location.
        </p>
        <p>
          As with any athlete, we record training activity — for example, which sessions were
          started or completed and when. How that activity is kept private is described in
          &ldquo;The athlete&apos;s private space&rdquo; below.
        </p>

        <SubHeading>e. Payment information</SubHeading>
        <p>
          Subscriptions are processed by Stripe, our payment processor. Stripe collects and
          stores your payment details (such as card information) directly; we do{" "}
          <strong>not</strong> receive or store your full card number. In our own systems we
          store only the information needed to manage your subscription, such as a Stripe
          customer and subscription identifier, your plan, your subscription status, and the
          current billing-period end date.
        </p>

        <SubHeading>f. Push notifications (only if enabled)</SubHeading>
        <p>
          If an athlete chooses to turn on training reminders, we store the technical
          information needed to deliver web-push notifications to that device — a push
          endpoint provided by the browser, the encryption keys associated with it, a
          preferred reminder hour, and the device time zone. You can turn reminders off at any
          time, which removes this information. We do not track whether notifications are
          opened or clicked.
        </p>

        <SubHeading>g. Sign-in and security data</SubHeading>
        <p>
          To keep accounts secure we use authentication session cookies, and, on an
          athlete&apos;s device, an optional sign-in helper cookie that remembers which
          sign-in screen to show. To prevent abuse we keep short-lived, non-identifying
          security records (for example, one-way, irreversible counters used for rate
          limiting) that do not contain raw email addresses, usernames, or IP addresses.
        </p>

        <SubHeading>h. Contact form</SubHeading>
        <p>
          If you use our contact form, we collect the name, email address, and message you
          submit so we can respond. Contact messages are delivered to our team by email
          through our email provider; we do not store contact submissions in a separate
          database. Please do not include sensitive personal, medical, or financial
          information in your message.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Create and operate parent, athlete, and adult-athlete accounts</li>
          <li>Deliver the daily training, pregame, and pre-practice experiences</li>
          <li>Personalize training using the details an athlete chooses to provide</li>
          <li>
            Show a parent their athlete&apos;s participation rhythm, on a parent-managed
            account (not the content of sessions)
          </li>
          <li>Process subscriptions, trials, and billing through our payment processor</li>
          <li>Send account, sport-availability, and product communications you have agreed to receive</li>
          <li>Send optional training reminders, if an athlete enables them</li>
          <li>Maintain security, prevent abuse, debug problems, and operate our services</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal information, and we do not use it for
          cross-context behavioral advertising or targeted advertising.
        </p>
      </Section>

      <Section title="3. Children and Minors">
        <p>
          From Victory is built for athletes ages 13 and above. Athletes ages 13 to 17 are
          minors. A parent or guardian creates and manages every account for an athlete under
          18; an adult athlete (18 or older) may instead create and manage their own account.
          We apply the additional protections described below to every minor (ages 13 to 17)
          account.
        </p>
        <SubHeading>Age floor of 13</SubHeading>
        <p>
          The app does not support accounts for anyone under the age of 13. We confirm age at
          account creation using the athlete&apos;s birthdate, and this minimum age is enforced
          both in the app and at the database level. We do not knowingly create accounts for,
          or collect personal information from, children under 13.
        </p>
        <SubHeading>A parent is in control of a minor&apos;s account</SubHeading>
        <p>
          For an athlete under 18, a parent or guardian creates the account, manages the
          subscription, and can request changes or deletion at any time. A parent-managed
          athlete does not provide a real email address, and we do not send marketing email to
          athletes. (An adult athlete who creates their own account provides their own email
          address; see &ldquo;Adult athlete accounts&rdquo; above.)
        </p>
        <SubHeading>Extra protections for athlete accounts (13–17)</SubHeading>
        <p>
          For every account belonging to a minor (ages 13 to 17), the following protections
          are on by default:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>No advertising</li>
          <li>No behavioral or advertising analytics</li>
          <li>No third-party tracking</li>
          <li>No sale of personal information</li>
        </ul>
        <p>
          If you are under 13, please do not submit the waitlist form or attempt to create an
          account. If we learn that we have collected personal information from a child under
          13, we will take reasonable steps to delete it. A parent or guardian may contact us
          at <PrivacyEmailLink /> about any information relating to a child.
        </p>
      </Section>

      <Section title="4. The Athlete's Private Space">
        <p>
          An athlete&apos;s training is meant to be their own. Inside a session, an athlete
          personalizes their experience by choosing from preset options we provide — for example
          a focus area or pregame selections — rather than by typing their own words. The app does
          not give an athlete a free-text journal, notes, or comment field. The choices an athlete
          makes are kept private to that athlete and are not shown on the parent dashboard.
        </p>
        <p>
          A parent&apos;s dashboard shows participation information only — such as how often the
          athlete is training and how many sessions they have completed — so a parent can see
          the habit forming without reading the contents of a session. We designed this
          boundary on purpose: athletes engage more honestly when their space is genuinely
          theirs. For an adult athlete who manages their own account, there is no parent or
          guardian dashboard at all — their training activity is visible only to them, and no
          one else can access it through the app.
        </p>
      </Section>

      <Section title="5. Email Communications">
        <p>From Victory may send the following emails:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>
            <strong>Waitlist and product updates</strong>, if you submitted the waitlist form,
            about sport availability and related news.
          </li>
          <li>
            <strong>Account and billing emails</strong> to the account holder — a parent, or an
            adult athlete who manages their own account — such as messages related to the
            subscription.
          </li>
          <li>
            <strong>An optional weekly digest</strong> to a parent, summarizing their
            athlete&apos;s participation rhythm. It never includes the contents of a session.
            A parent can opt out at any time using the unsubscribe link in the email or by
            contacting us. Adult athletes who manage their own account do not receive this
            digest.
          </li>
        </ul>
        <p>
          We send these emails using a third-party email provider. We do not send marketing
          email to athletes: a parent-managed athlete receives no email from us at all, and an
          adult athlete receives only the account and billing messages needed to operate their
          account. Waitlist updates go only to people who submitted the waitlist form, and
          anyone can unsubscribe at any time.
        </p>
      </Section>

      <Section title="6. How We Store and Protect Your Information">
        <p>
          Information is stored using trusted third-party service providers that help us run
          our website and app, manage accounts, process payments, and send communications. We
          use reasonable administrative, technical, and organizational safeguards designed to
          protect personal information.
        </p>
        <p className="mt-3">
          No method of transmission over the internet or method of electronic storage is
          completely secure. We cannot guarantee absolute security, but we work to protect
          your information using safeguards appropriate to the type of information involved.
        </p>
        <p className="mt-3">
          We do not use advertising or behavioral-analytics tracking technologies in the app,
          and we do not embed third-party advertising or tracking SDKs on any signed-in
          surface. On our public marketing pages only (for example, the home page and pricing
          page), we use a cookieless, privacy-focused web-analytics service provided by our
          web-hosting provider to count anonymous, aggregate page visits. It sets no cookies,
          collects no names or other identifiers, does not follow visitors across other
          websites, and never runs on athlete, parent-dashboard, or other signed-in surfaces.
        </p>
      </Section>

      <Section title="7. How We Share Information">
        <p>
          We do not sell your personal information. We share information only with service
          providers that help us operate From Victory, and only so they can provide their
          service to us. These providers include:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>A cloud database, authentication, and storage provider</li>
          <li>A payment processor (for subscriptions and billing)</li>
          <li>A web-hosting and serverless-infrastructure provider</li>
          <li>An email delivery provider</li>
          <li>
            Your browser&apos;s push-notification service, only if an athlete enables reminders
          </li>
        </ul>
        <p className="mb-3">
          If you arrive at our marketing site from a link that identifies a marketing channel
          (for example, a social post or a newsletter), we may remember that channel using a
          small first-party cookie that stores only the channel labels and a timestamp, and
          record it on the purchasing parent&apos;s or adult athlete&apos;s checkout record
          with our payment processor so we can learn which of our outreach efforts work. This
          applies only to the adult buyer&apos;s purchase record — never to an athlete&apos;s
          training activity or any minor&apos;s data.
        </p>
        <p>
          These service providers may use your information only to provide services to us, not
          for their own independent marketing. We may also disclose information if required by
          law, legal process, or government request, or to protect the rights, safety, or
          security of From Victory, our users, or others. If From Victory is involved in a
          merger, acquisition, or sale of assets, we will provide notice before personal
          information is transferred and becomes subject to a different privacy policy.
        </p>
      </Section>

      <Section title="8. Data Retention and Deletion">
        <p>
          We retain personal information for as long as reasonably necessary to operate the
          accounts and services described here, comply with legal obligations, resolve
          disputes, and maintain business records.
        </p>
        <p className="mt-3">
          A parent or guardian may request deletion of an athlete&apos;s account and data, or
          of their own account, at any time. An adult athlete may request deletion of their own
          account and data at any time by contacting us at <PrivacyEmailLink />. When a
          deletion request is confirmed, we delete the associated account data promptly — well
          within 30 days of the request. We keep a minimal, content-free record of deletion
          (for example, that a deletion occurred and when) for security and recordkeeping; this
          record does not contain names, email addresses, birthdates, or any session content.
        </p>
        <p className="mt-3">
          You may also request deletion of waitlist information at any time by contacting us at{" "}
          <PrivacyEmailLink />.
        </p>
      </Section>

      <Section title="9. Your Rights and Choices">
        <p>Depending on where you live, you may have rights to:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Request access to the personal information we hold</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information or your athlete&apos;s information</li>
          <li>Opt out of non-essential emails</li>
          <li>Ask questions about this Privacy Policy</li>
        </ul>
        <p>
          A parent or guardian may exercise these rights on behalf of their athlete, and an
          adult athlete may exercise them for their own account. To make a request, contact us
          at <PrivacyEmailLink />. Depending on your location, you may have
          additional rights under applicable state, national, or regional privacy laws,
          including laws that provide heightened protections for minors.
        </p>
      </Section>

      <Section title="10. International Users">
        <p>
          From Victory is intended for users in the United States. If you access our website or
          app from outside the United States, you understand that your information may be
          processed and stored in the United States or other locations where our service
          providers operate.
        </p>
      </Section>

      <Section title="11. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we
          will update the effective date above and may provide additional notice where
          appropriate. Your continued use of the website or app after an update means you
          acknowledge the updated Privacy Policy.
        </p>
      </Section>

      <Section title="12. Contact Us">
        <p>
          If you have questions about this Privacy Policy or want to exercise your privacy
          choices, contact us at:
        </p>
        <p className="mt-3">
          From Victory LLC
          <br />
          Email: <PrivacyEmailLink />
          <br />
          Website: FromVictoryApp.com
        </p>
      </Section>

      <div className="mt-12 flex items-center justify-between border-t border-hairline pt-6 text-cream/60 text-[13px]">
        <Link href="/" className="text-cream/80 hover:text-gold no-underline">
          ← Back to home
        </Link>
        <Link href="/terms" className="text-cream/80 hover:text-gold no-underline">
          Terms →
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading font-semibold text-[16px] tracking-[-0.005em] text-cream mt-5 mb-2">
      {children}
    </h3>
  );
}

function PrivacyEmailLink() {
  return (
    <a
      href={`mailto:${PRIVACY_EMAIL}`}
      className="text-cream underline underline-offset-2 hover:text-gold"
    >
      {PRIVACY_EMAIL}
    </a>
  );
}
