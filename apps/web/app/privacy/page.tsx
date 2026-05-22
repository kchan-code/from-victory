import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy · From Victory",
  description:
    "How From Victory collects, uses, stores, and protects information submitted through our website, including the Join the Waitlist form.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "May 22, 2026";
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
          From Victory respects your privacy. This Privacy Policy explains how we collect, use,
          store, and protect information submitted through our website, including the Join the
          Waitlist form.
        </p>
        <p>
          By submitting information through the Join the Waitlist form, you acknowledge the
          practices described in this Privacy Policy.
        </p>
      </section>

      <Section title="1. Information We Collect">
        <p>When you join the From Victory waitlist, we may collect the following information:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Name</li>
          <li>Email address</li>
          <li>Role, such as athlete, parent, coach, or other</li>
          <li>Primary sport</li>
          <li>Optional note, if you choose to provide one</li>
        </ul>
        <p>
          We do not ask you to provide sensitive personal information through the waitlist form.
          Please do not include sensitive personal information, medical information, financial
          information, passwords, or highly personal details in the optional note field.
        </p>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>We use the information you provide to:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Add you to the From Victory waitlist</li>
          <li>
            Communicate with you about early access, product updates, launch announcements, and
            related information
          </li>
          <li>
            Understand the types of users interested in From Victory, including athletes, parents,
            coaches, and sports communities
          </li>
          <li>Improve our messaging, product experience, and future app features</li>
          <li>Respond to questions or comments submitted through the optional note field</li>
          <li>Maintain security, prevent abuse, and operate our website</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </Section>

      <Section title="3. Email Communications">
        <p>
          By joining the waitlist, you agree that From Victory may contact you by email about early
          access, product updates, launch information, and related communications.
        </p>
        <p className="mt-3">
          You may unsubscribe or request removal from the waitlist at any time by following the
          unsubscribe instructions in our emails, if available, or by contacting us at{" "}
          <PrivacyEmailLink />.
        </p>
      </Section>

      <Section title="4. How We Store Your Information">
        <p>
          Information submitted through the waitlist form is stored using secure third-party
          service providers that help us operate our website, manage waitlist submissions, and
          maintain our database.
        </p>
        <p className="mt-3">
          We use reasonable administrative, technical, and organizational safeguards designed to
          protect the information submitted through the waitlist form. However, no method of
          internet transmission or electronic storage is completely secure.
        </p>
        <p className="mt-3">
          We may change or add service providers over time as our website and business needs
          evolve.
        </p>
      </Section>

      <Section title="5. How We Share Information">
        <p>
          We may share your information with trusted service providers who help us operate the
          website, manage the waitlist, store data, send communications, or support our business
          operations.
        </p>
        <p className="mt-3">
          These service providers may only use your information to provide services to us and not
          for their own independent marketing purposes.
        </p>
        <p className="mt-3">
          We may also disclose information if required to do so by law, legal process, government
          request, or to protect the rights, safety, or security of From Victory, our users, or
          others.
        </p>
        <p className="mt-3">We do not sell your personal information.</p>
      </Section>

      <Section title="6. Children's Privacy">
        <p>
          From Victory is designed to support athletes, parents, and coaches, including families
          and youth sports communities. However, the waitlist form is not intended to collect
          personal information directly from children under the age of 13.
        </p>
        <p className="mt-3">
          If you are under 13, please do not submit the waitlist form yourself. A parent or legal
          guardian should submit the form on your behalf.
        </p>
        <p className="mt-3">
          If we learn that we have collected personal information directly from a child under 13
          without appropriate parental consent, we will take reasonable steps to delete that
          information.
        </p>
        <p className="mt-3">
          Parents or guardians may contact us at <PrivacyEmailLink /> to request deletion of
          information submitted by or about a child.
        </p>
      </Section>

      <Section title="7. Data Security">
        <p>
          We take reasonable administrative, technical, and organizational measures to protect the
          information submitted through the waitlist form.
        </p>
        <p className="mt-3">
          However, no method of transmission over the internet or electronic storage is completely
          secure. We cannot guarantee absolute security, but we work to protect your information
          using reasonable safeguards appropriate for the type of information collected.
        </p>
      </Section>

      <Section title="8. Data Retention">
        <p>We retain waitlist information for as long as reasonably necessary to:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Manage the waitlist</li>
          <li>Communicate about From Victory</li>
          <li>Support early access or launch activities</li>
          <li>Comply with legal obligations</li>
          <li>Resolve disputes</li>
          <li>Maintain business records</li>
        </ul>
        <p>
          You may request deletion of your waitlist information by contacting us at{" "}
          <PrivacyEmailLink />.
        </p>
      </Section>

      <Section title="9. Your Choices">
        <p>
          You may contact us at <PrivacyEmailLink /> to:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc">
          <li>Request access to the information you submitted</li>
          <li>Correct inaccurate information</li>
          <li>Ask us to delete your waitlist submission</li>
          <li>Opt out of future emails</li>
          <li>Ask questions about this Privacy Policy</li>
        </ul>
        <p>
          Depending on where you live, you may have additional privacy rights under applicable
          state, national, or regional privacy laws.
        </p>
      </Section>

      <Section title="10. No Sale or Sharing for Targeted Advertising">
        <p>We do not sell personal information collected through the waitlist form.</p>
        <p className="mt-3">
          We also do not use waitlist information for cross-context behavioral advertising or
          targeted advertising.
        </p>
        <p className="mt-3">
          If our practices change, we will update this Privacy Policy and provide any required
          notices or choices.
        </p>
      </Section>

      <Section title="11. International Users">
        <p>
          From Victory is currently intended for users in the United States. If you access the
          website from outside the United States, you understand that your information may be
          processed and stored in the United States or other locations where our service providers
          operate.
        </p>
      </Section>

      <Section title="12. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          update the effective date above and may provide additional notice where appropriate.
        </p>
        <p className="mt-3">
          Your continued use of the website or continued participation in the waitlist after an
          update means you acknowledge the updated Privacy Policy.
        </p>
      </Section>

      <Section title="13. Contact Us">
        <p>
          If you have questions about this Privacy Policy or want to exercise your privacy choices,
          contact us at:
        </p>
        <p className="mt-3">
          From Victory
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
