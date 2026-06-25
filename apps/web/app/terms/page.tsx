import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use · From Victory",
  description:
    "Terms of Use governing your access to and use of the From Victory website, application, content, waitlist, communications, and related services.",
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = "May 22, 2026";
const PRIVACY_EMAIL = "privacy@fromvictoryapp.com";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream">
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Terms</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          From Victory Terms of Use
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
          Welcome to From Victory. These Terms of Use govern your access to and use of the From
          Victory website, mobile application, web application, digital products, content,
          waitlist, communications, features, and related services, whether made available through
          FromVictoryApp.com, an app store, a mobile device, or any other From Victory-controlled
          platform.
        </p>
        <p>
          For purposes of these Terms, &ldquo;From Victory,&rdquo; &ldquo;we,&rdquo;
          &ldquo;us,&rdquo; and &ldquo;our&rdquo; refer to From Victory LLC, a New Jersey
          limited liability company. &ldquo;Services&rdquo;
          means the From Victory website, application, content, waitlist, communications, and
          related features or services.
        </p>
        <p>
          By accessing or using the Services, submitting the Join the Waitlist form, creating an
          account, checking a consent box, downloading or using the application, or otherwise
          interacting with From Victory, you agree to these Terms of Use. If you do not agree to
          these Terms, do not use the Services.
        </p>
      </section>

      <Section title="1. About From Victory">
        <p>
          From Victory is a Christian athlete mindset platform designed to encourage athletes,
          parents, and coaches through Scripture-based content, mindset training, reflection tools,
          and practical encouragement.
        </p>
        <p className="mt-3">
          The Services may include faith-based mindset content, Scripture reflections, daily
          prompts, identity statements, training rhythms, reminders,
          parent-facing resources, athlete-facing resources, coach-facing resources, and other
          related content or features.
        </p>
        <p className="mt-3">
          At the current stage, the website may be used to share information about From Victory and
          collect waitlist submissions. As the product develops, the Services may also include
          access to the From Victory application and related digital features.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>The Services are intended for users in the United States.</p>
        <p className="mt-3">
          The Services are not available to anyone under 13. We do not knowingly collect
          information from anyone under 13. If you are under 13, do not create an account or
          submit information through the Services.
        </p>
        <p className="mt-3">
          If you are under the age of majority in your state, province, or country, you may use the
          Services only with the involvement and permission of a parent or legal guardian.
        </p>
        <p className="mt-3">
          By using the Services, you represent that you meet the eligibility requirements described
          in these Terms.
        </p>
      </Section>

      <Section title="3. Parent and Guardian Responsibility">
        <p>
          From Victory may be used by or for youth athletes. Parents and legal guardians are
          responsible for determining whether the Services are appropriate for their child.
        </p>
        <p className="mt-3">
          If you are a parent or legal guardian and you allow your child to use the Services, you
          are responsible for your child&rsquo;s use of the Services, including any information
          submitted, account activity, content viewed, and actions taken through the Services.
        </p>
        <p className="mt-3">
          Parents or guardians may contact us at <PrivacyEmailLink /> with questions or requests
          related to a child&rsquo;s use of the Services.
        </p>
      </Section>

      <Section title="4. Accounts and App Access">
        <p>
          Certain features of the Services may require you to create an account, provide
          registration information, or access the application through a login, invite, early access
          link, app store download, or similar process.
        </p>
        <p className="mt-3">
          You agree to provide accurate information and to keep your account information current.
        </p>
        <p className="mt-3">
          You are responsible for maintaining the confidentiality of your login credentials and for
          all activity that occurs under your account. You agree to notify us promptly if you
          believe your account has been accessed without authorization.
        </p>
        <p className="mt-3">
          We may suspend, restrict, or terminate access to an account or the Services if we believe
          there has been a violation of these Terms, misuse of the Services, security risk, legal
          risk, or other conduct that may harm From Victory, users, or third parties.
        </p>
      </Section>

      <Section title="5. Waitlist Submissions">
        <p>
          When you join the From Victory waitlist, you may be asked to provide information such as
          your first name, email address, role, primary sport, and an optional note.
        </p>
        <p className="mt-3">
          You agree that the information you submit will be accurate, that you have the right to
          provide it, and that your submission will not violate any law or third-party right.
        </p>
        <p className="mt-3">
          Submitting the waitlist form does not guarantee access to the From Victory application,
          early access, any particular launch date, any specific product feature, or any future
          service.
        </p>
        <p className="mt-3">
          We may accept, reject, prioritize, delay, suspend, or discontinue waitlist participation
          at our discretion.
        </p>
      </Section>

      <Section title="6. Email and App Communications">
        <p>
          By joining the waitlist, creating an account, or using the Services, you agree that From
          Victory may contact you about early access, product updates, launch announcements,
          account-related notices, service updates, security notices, and related communications.
        </p>
        <p className="mt-3">
          If you use the application, you may also receive in-app messages, push notifications,
          reminders, or other app-based communications, depending on your device settings and
          preferences.
        </p>
        <p className="mt-3">
          You may unsubscribe from marketing emails or request removal from the waitlist by using
          any unsubscribe instructions provided in our emails or by contacting us at{" "}
          <PrivacyEmailLink />. Certain transactional, security, account, or service-related
          communications may still be sent where necessary to provide the Services.
        </p>
      </Section>

      <Section title="7. Privacy">
        <p>
          Your use of the Services is also governed by our{" "}
          <Link
            href="/privacy"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3">
          Please review our Privacy Policy to understand how we collect, use, store, and protect
          information submitted through the website, application, waitlist, account registration,
          communications, and related Services.
        </p>
      </Section>

      <Section title="8. Faith-Based and Mindset Content">
        <p>
          From Victory may include Christian, Scripture-based, devotional, mindset, athletic,
          motivational, reflection, or personal development content.
        </p>
        <p className="mt-3">
          This content is provided for general informational, educational, and encouragement
          purposes only. It is not intended to replace professional advice, pastoral counseling,
          mental health counseling, medical care, athletic training advice, emergency support, or
          the judgment of a parent, guardian, coach, pastor, physician, counselor, or other
          qualified professional.
        </p>
        <p className="mt-3">
          From Victory content may encourage reflection, discipline, resilience, prayer, Scripture
          engagement, and personal growth. It should not be understood as a promise of athletic
          success, spiritual outcome, emotional result, team selection, improved performance, or
          any particular life result.
        </p>
        <p className="mt-3">
          If you or someone you know is experiencing a medical emergency, mental health crisis,
          self-harm concern, abuse, neglect, or safety concern, seek help from a qualified
          professional, trusted adult, or emergency services immediately. In the United States,
          you can call or text the 988 Suicide &amp; Crisis Lifeline at 988, or text HOME to
          741741 to reach the Crisis Text Line.
        </p>
      </Section>

      <Section title="9. No Professional Advice">
        <p>
          The Services and any From Victory content are not professional medical, psychological,
          psychiatric, legal, financial, coaching, athletic training, counseling, or pastoral
          advice.
        </p>
        <p className="mt-3">
          You should not rely on From Victory content as a substitute for advice from qualified
          professionals, including doctors, mental health professionals, licensed counselors,
          pastors, athletic trainers, coaches, teachers, or other appropriate advisors.
        </p>
        <p className="mt-3">
          Parents, guardians, coaches, and athletes are responsible for deciding whether any
          content, activity, reflection, recommendation, prompt, challenge, reminder, or
          communication is appropriate for a particular athlete.
        </p>
      </Section>

      <Section title="10. User Submissions and Feedback">
        <p>
          Some parts of the Services let you send us information — for example, the optional note
          on the waitlist form, a message you send through our contact form, or feedback and
          suggestions about From Victory. The in-app training experience does not include a
          free-text journal, notes, or comment field for athletes; an athlete personalizes
          sessions by choosing from options we provide, not by typing their own content.
        </p>
        <p className="mt-3">
          You are responsible for anything you submit through the Services. You represent that you
          have the right to submit it and that your submission does not violate any law,
          third-party right, or these Terms.
        </p>
        <p className="mt-3">
          You should not submit sensitive personal information, medical information, financial
          information, passwords, or highly personal details through the Services unless a feature
          specifically requests it and you are comfortable providing it.
        </p>
        <p className="mt-3">
          If you submit suggestions, ideas, comments, or feedback about From Victory, you grant us
          the right to use that feedback without restriction or compensation to you.
        </p>
        <p className="mt-3">
          We are not required to review, monitor, preserve, return, or use any submission, except
          as required by applicable law.
        </p>
      </Section>

      <Section title="11. Acceptable Use">
        <p>You agree not to use the Services to:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc space-y-1.5">
          <li>Violate any law, regulation, or third-party right</li>
          <li>Submit false, misleading, harmful, abusive, inappropriate, or unlawful information</li>
          <li>Harass, threaten, abuse, exploit, or harm another person</li>
          <li>
            Submit or transmit content that is obscene, hateful, discriminatory, sexually explicit,
            violent, exploitative, or otherwise inappropriate
          </li>
          <li>
            Submit sensitive personal information, medical information, financial information,
            passwords, or confidential information where not requested
          </li>
          <li>
            Attempt to access, interfere with, damage, reverse engineer, overload, or disrupt the
            Services or related systems
          </li>
          <li>Upload or transmit malware, harmful code, spam, bots, scraping tools, or abusive content</li>
          <li>Scrape, copy, harvest, or collect information from the Services without permission</li>
          <li>
            Impersonate another person or misrepresent your affiliation with any person or
            organization
          </li>
          <li>
            Use the Services to develop, train, or improve a competing product without our written
            permission
          </li>
          <li>Use the Services for any commercial, unlawful, abusive, or unauthorized purpose</li>
        </ul>
        <p>
          We may suspend, block, restrict, or terminate access to the Services if we believe these
          Terms have been violated or if continued access may create legal, security, operational,
          reputational, or user-safety risk.
        </p>
      </Section>

      <Section title="12. Application License">
        <p>
          Subject to your compliance with these Terms, From Victory grants you a limited, personal,
          non-exclusive, non-transferable, non-sublicensable, revocable license to download,
          access, and use the From Victory application solely for your personal, non-commercial
          use.
        </p>
        <p className="mt-3">You may not:</p>
        <ul className="mt-2 mb-3 pl-5 list-disc space-y-1.5">
          <li>Copy, modify, distribute, sell, lease, sublicense, or exploit the application</li>
          <li>
            Reverse engineer, decompile, disassemble, or attempt to derive source code from the
            application, except to the extent such restriction is prohibited by law
          </li>
          <li>Circumvent security, access controls, usage limits, or technical restrictions</li>
          <li>Use the application in a way that violates these Terms or applicable law</li>
        </ul>
        <p>We reserve all rights not expressly granted to you.</p>
      </Section>

      <Section title="13. Intellectual Property">
        <p>
          The Services, name, logos, designs, text, graphics, images, videos, audio, layout,
          content, concepts, features, software, application, interface, prompts, frameworks, and
          other materials made available through From Victory are owned by From Victory or its
          licensors and are protected by intellectual property and other laws.
        </p>
        <p className="mt-3">You may use the Services for your personal, non-commercial use only.</p>
        <p className="mt-3">
          You may not copy, modify, distribute, reproduce, publish, display, create derivative
          works from, sell, license, or exploit any part of the Services or From Victory content
          without our prior written permission.
        </p>
        <p className="mt-3">No rights are granted to you except as expressly stated in these Terms.</p>
      </Section>

      <Section title="14. Third-Party Services, App Stores, and Links">
        <p>
          The Services may use third-party service providers to operate the website, application,
          waitlist, database, hosting, analytics, communications, app distribution, payment
          processing, customer support, security, or related business operations.
        </p>
        <p className="mt-3">
          The Services may also contain links to third-party websites, app stores, platforms,
          resources, or services. We are not responsible for the content, policies, security,
          availability, accuracy, or practices of third-party websites or services.
        </p>
        <p className="mt-3">
          If you download the application through an app store or platform, such as the Apple App
          Store or Google Play, your use of that platform may also be governed by that
          platform&rsquo;s own terms, conditions, and policies.
        </p>
      </Section>

      <Section title="15. Paid Features, Subscriptions, and Purchases">
        <p>
          From Victory may in the future offer paid features, subscriptions, premium content,
          in-app purchases, or other paid services.
        </p>
        <p className="mt-3">
          If paid features are offered, additional payment terms may apply and will be provided at
          or before the time of purchase. Those terms may include pricing, billing frequency,
          renewal, cancellation, refund, and app store payment rules.
        </p>
        <p className="mt-3">
          Unless otherwise stated at the time of purchase or required by law, fees may be
          non-refundable.
        </p>
        <p className="mt-3">
          We may add, modify, or discontinue paid features or pricing at any time, subject to
          applicable law and any additional terms presented at purchase.
        </p>
      </Section>

      <Section title="16. Beta, Trial, or Early Access Features">
        <p>From Victory may offer beta, trial, pilot, preview, or early access features.</p>
        <p className="mt-3">
          These features may be incomplete, experimental, unavailable, changed, discontinued, or
          contain errors. Access to beta or early access features does not guarantee continued
          access, public release, or inclusion in the final product.
        </p>
        <p className="mt-3">
          We may modify or discontinue beta, trial, or early access features at any time.
        </p>
      </Section>

      <Section title="17. Changes to the Services or Product Plans">
        <p>
          From Victory is still in development. We may update, modify, suspend, discontinue, or
          remove any part of the Services, including the website, waitlist, application, content,
          features, planned product experience, launch timing, or early access process, at any time
          without notice.
        </p>
        <p className="mt-3">
          We are not responsible if any part of the Services, waitlist, application, or planned
          product is unavailable, delayed, changed, or discontinued.
        </p>
      </Section>

      <Section title="18. Availability and Security">
        <p>
          We work to provide reliable and secure Services, but we do not guarantee that the
          Services will always be available, uninterrupted, secure, error-free, or free from
          harmful components.
        </p>
        <p className="mt-3">
          You are responsible for maintaining your own device security, internet connection,
          software updates, and account credentials.
        </p>
        <p className="mt-3">
          We may take steps to protect the Services, users, and our systems, including monitoring
          for abuse, limiting access, removing content, disabling features, or suspending accounts
          where appropriate.
        </p>
      </Section>

      <Section title="19. Disclaimer of Warranties">
        <p>
          The Services and all content are provided on an &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; basis.
        </p>
        <p className="mt-3">
          To the fullest extent permitted by law, From Victory disclaims all warranties of any
          kind, whether express, implied, statutory, or otherwise, including implied warranties of
          merchantability, fitness for a particular purpose, title, non-infringement, availability,
          accuracy, and reliability.
        </p>
        <p className="mt-3">
          We do not warrant that the Services will be uninterrupted, secure, error-free, accurate,
          complete, current, reliable, effective, or free of harmful components.
        </p>
      </Section>

      <Section title="20. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, From Victory and its owners, officers, directors,
          employees, contractors, agents, affiliates, licensors, and service providers will not be
          liable for any indirect, incidental, consequential, special, exemplary, punitive, or
          enhanced damages, or for any loss of profits, revenue, data, goodwill, use, or other
          intangible losses, arising out of or related to your use of, or inability to use, the
          Services.
        </p>
        <p className="mt-3">
          To the fullest extent permitted by law, From Victory&rsquo;s total liability for any
          claim arising out of or related to the Services or these Terms will not exceed $100 or
          the amount you paid to From Victory for the Services in the three months before the claim
          arose, whichever is greater.
        </p>
        <p className="mt-3">
          Some jurisdictions do not allow certain disclaimers or limitations of liability, so some
          of the above limitations may not apply to you.
        </p>
      </Section>

      <Section title="21. Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless From Victory and its owners, officers,
          directors, employees, contractors, agents, affiliates, licensors, and service providers
          from and against any claims, damages, liabilities, losses, costs, and expenses, including
          reasonable attorneys&rsquo; fees, arising out of or related to:
        </p>
        <ul className="mt-2 mb-3 pl-5 list-disc space-y-1.5">
          <li>Your use of the Services</li>
          <li>Your account activity</li>
          <li>Your submission of information, notes, feedback, or other content</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any law or third-party right</li>
          <li>Your misuse of From Victory content or intellectual property</li>
        </ul>
        <p>
          If you are a minor, indemnification obligations under these Terms apply to your parent
          or legal guardian to the extent permitted by applicable law.
        </p>
      </Section>

      <Section title="22. Termination">
        <p>
          We may suspend or terminate your access to the Services at any time if we believe you
          have violated these Terms, created risk, misused the Services, or acted in a way that may
          harm From Victory, users, or third parties.
        </p>
        <p className="mt-3">
          You may stop using the Services at any time. If account deletion functionality is
          available, you may use it to request deletion of your account. You may also contact us at{" "}
          <PrivacyEmailLink />.
        </p>
        <p className="mt-3">
          Sections that by their nature should survive termination will survive, including
          intellectual property, user submissions and feedback, disclaimers, limitation of
          liability, indemnification, governing law, dispute resolution, and any payment
          obligations incurred before termination.
        </p>
      </Section>

      <Section title="23. Governing Law">
        <p>
          These Terms are governed by the laws of the State of New Jersey, without regard to its
          conflict of laws principles.
        </p>
      </Section>

      <Section title="24. Dispute Resolution">
        <p>
          Before filing any claim, you agree to first contact us at <PrivacyEmailLink /> and
          attempt to resolve the dispute informally.
        </p>
        <p className="mt-3">
          If we cannot resolve the dispute informally, any legal action arising out of or relating
          to these Terms, the Services, or From Victory will be brought in the state or federal
          courts located in New Jersey, unless applicable law requires otherwise.
        </p>
        <p className="mt-3">You consent to the personal jurisdiction and venue of those courts.</p>
      </Section>

      <Section title="25. Changes to These Terms">
        <p>
          We may update these Terms from time to time. If we make changes, we will update the
          effective date above.
        </p>
        <p className="mt-3">
          Your continued use of the Services after updated Terms are posted means you accept the
          updated Terms.
        </p>
      </Section>

      <Section title="26. Contact Us">
        <p>If you have questions about these Terms, contact us at:</p>
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
        <Link href="/privacy" className="text-cream/80 hover:text-gold no-underline">
          Privacy →
        </Link>
      </div>

      {/* NIV attribution — required by Biblica gratis-use terms as a gating
          condition for the cue-word verse registry (FV-229). /55 keeps the
          legally required notice above WCAG AA contrast at this size. */}
      <p className="mt-6 pb-4 font-body text-[11px] leading-relaxed text-cream/55">
        Scripture quotations taken from the Holy Bible, New International
        Version®, NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica,
        Inc.® Used by permission. All rights reserved worldwide.
      </p>
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
