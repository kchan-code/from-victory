import type { Metadata } from "next";
import Link from "next/link";

// Public, no-login account-deletion page (Google Play + Apple App Store
// "account deletion" discoverability requirement — Play's Data safety form
// requires a publicly reachable URL that names the app/developer, gives
// step-by-step deletion instructions, and states what is deleted vs. kept
// and for how long).
//
// This page documents EXISTING behavior only — it does not add or change any
// deletion logic. Every step and result described here is grounded in:
//   - lib/actions/account.ts (deleteAthlete, deleteAccount)
//   - components/dashboard/DeleteAccountSection.tsx + DeleteAthleteButton.tsx
//   - app/dashboard/page.tsx (parent's real UI path)
//   - app/athlete/settings/page.tsx (adult-athlete self-delete path; a minor
//     athlete never sees billing or delete UI — see FV-441)
//   - app/privacy/page.tsx Section 8 (retention wording — kept consistent)
//
// IMPORTANT: this route must never call requireParent() / requireAthlete()
// or any other auth guard — it has to render for a signed-out visitor.

export const metadata: Metadata = {
  alternates: { canonical: "/delete-account" },
  title: "Delete Your Account",
  description:
    "How to permanently delete your From Victory account and data — step-by-step instructions for parents, adult athletes, and minor athletes ages 13-17.",
  robots: { index: true, follow: true },
};

const PRIVACY_EMAIL = "privacy@fromvictoryapp.com";

export default function DeleteAccountPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream">
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Account Deletion</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Delete Your From Victory Account
        </h1>
        <p className="text-cream/60 text-[14px]">
          App: From Victory
          <br />
          Developer: From Victory LLC
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
          This page explains how to permanently delete your account and data
          from <strong>From Victory</strong>, the daily mental-toughness
          training app built by From Victory LLC. You do not need to sign in
          to read this page. If you can sign in, follow the in-app steps
          below. If you can&rsquo;t sign in, contact us directly and
          we&rsquo;ll handle the deletion for you.
        </p>
        <p>Find the path that applies to you:</p>
        <ul className="mt-2 pl-5 list-disc">
          <li>
            A parent or guardian who created an account for an athlete under
            18 &mdash; see{" "}
            <a href="#option-a" className="text-cream underline underline-offset-2 hover:text-gold">
              Option A
            </a>{" "}
            or{" "}
            <a href="#option-b" className="text-cream underline underline-offset-2 hover:text-gold">
              Option B
            </a>
            .
          </li>
          <li>
            An adult athlete (18 or older) who created and manages their own
            account &mdash; see{" "}
            <a href="#option-b" className="text-cream underline underline-offset-2 hover:text-gold">
              Option B
            </a>
            .
          </li>
          <li>
            A minor athlete (ages 13&ndash;17) &mdash; see{" "}
            <a href="#minor-athlete" className="text-cream underline underline-offset-2 hover:text-gold">
              If You&rsquo;re a Minor Athlete
            </a>
            .
          </li>
          <li>
            Anyone who can&rsquo;t sign in &mdash; see{" "}
            <a href="#cant-sign-in" className="text-cream underline underline-offset-2 hover:text-gold">
              Can&rsquo;t Sign In? Contact Us Directly
            </a>
            .
          </li>
        </ul>
      </section>

      <Section id="option-a" title="Option A — Delete One Athlete, Keep Your Parent Account">
        <p>
          Use this if you manage more than one athlete and only want to
          remove one of them. Your own parent account stays active.
        </p>
        <ol className="mt-3 mb-3 pl-5 list-decimal space-y-1.5">
          <li>Sign in to your parent account in the app, or at FromVictoryApp.com/signin.</li>
          <li>Open your Dashboard.</li>
          <li>Find the athlete you want to remove under &ldquo;Your athletes.&rdquo;</li>
          <li>Select &ldquo;Remove&rdquo; next to that athlete&rsquo;s name.</li>
          <li>
            Type the athlete&rsquo;s first name to confirm, then select
            &ldquo;Delete permanently.&rdquo;
          </li>
        </ol>
        <p>
          <strong>What happens:</strong> the athlete&rsquo;s account, sign-in
          credentials, and training history are deleted immediately. Your
          parent account and any other athletes you manage are not affected.
          If the athlete is also linked to a co-parent, their data stays on
          that parent&rsquo;s account.
        </p>
      </Section>

      <Section id="option-b" title="Option B — Delete Your Entire Account">
        <SubHeading>For a parent or guardian</SubHeading>
        <ol className="mt-2 mb-3 pl-5 list-decimal space-y-1.5">
          <li>Sign in to your parent account and open your Dashboard.</li>
          <li>Scroll to the &ldquo;Delete account&rdquo; section at the bottom of the page.</li>
          <li>Select &ldquo;Delete my account.&rdquo;</li>
          <li>Type DELETE to confirm, then select &ldquo;Delete my account&rdquo; again.</li>
        </ol>
        <p className="mb-4">
          <strong>What happens:</strong> your subscription is canceled, every
          athlete you solely manage is deleted, and your parent account is
          deleted &mdash; all immediately. An athlete also linked to a
          co-parent is kept on that parent&rsquo;s account, not deleted.
        </p>

        <SubHeading>For an adult athlete (18 or older, self-managed account)</SubHeading>
        <ol className="mt-2 mb-3 pl-5 list-decimal space-y-1.5">
          <li>Sign in to your account.</li>
          <li>Open Settings &mdash; tap the gear icon at the top of your home screen.</li>
          <li>Scroll to the &ldquo;Delete account&rdquo; section.</li>
          <li>Select &ldquo;Delete my account.&rdquo;</li>
          <li>Type DELETE to confirm, then select &ldquo;Delete my account&rdquo; again.</li>
        </ol>
        <p>
          <strong>What happens:</strong> your subscription is canceled and
          your account and training history are deleted immediately. There is
          no parent or guardian on an adult-athlete account, so this deletes
          everything tied to you.
        </p>
      </Section>

      <Section id="minor-athlete" title="If You're a Minor Athlete (Ages 13–17)">
        <p>
          A minor athlete&rsquo;s account is created and managed by a parent
          or guardian by design &mdash; that&rsquo;s a privacy protection,
          not an oversight. A minor athlete never sees billing or
          account-deletion controls inside the app.
        </p>
        <ul className="mt-3 mb-3 pl-5 list-disc space-y-1.5">
          <li>
            If your parent or guardian is reachable, ask them to complete{" "}
            <a href="#option-a" className="text-cream underline underline-offset-2 hover:text-gold">
              Option A
            </a>{" "}
            or{" "}
            <a href="#option-b" className="text-cream underline underline-offset-2 hover:text-gold">
              Option B
            </a>{" "}
            above on your behalf.
          </li>
          <li>
            If you can&rsquo;t reach your parent or guardian, email us at{" "}
            <PrivacyEmailLink /> and we will help.
          </li>
        </ul>
      </Section>

      <Section id="cant-sign-in" title="Can't Sign In? Contact Us Directly">
        <p>
          If you&rsquo;ve lost access to your account &mdash; a forgotten
          password, a lost or replaced device, a parent or guardian who can
          no longer be reached, or any other reason &mdash; email us at{" "}
          <PrivacyEmailLink />. Tell us the account holder&rsquo;s first name
          and, if known, the email address on the parent&rsquo;s or adult
          athlete&rsquo;s account, so we can locate and verify the account
          before deleting it.
        </p>
      </Section>

      <Section title="What Gets Deleted, and What We Keep">
        <SubHeading>Deleted immediately</SubHeading>
        <ul className="mt-2 mb-4 pl-5 list-disc space-y-1.5">
          <li>Profile information: first name, birthdate, and sign-in credentials</li>
          <li>Sport, position, and training-focus selections</li>
          <li>Training and session history, including pregame and pre-practice activity</li>
          <li>Push-notification subscription details, if reminders were turned on</li>
          <li>Any journal data associated with the account</li>
          <li>
            The billing link with our payment processor (subscription and
            customer identifiers) &mdash; the subscription itself is canceled
            first, then the link is deleted
          </li>
        </ul>

        <SubHeading>What we keep, and for how long</SubHeading>
        <p className="mb-3">
          We keep a minimal, content-free record that a deletion occurred and
          when &mdash; for example, that an account was deleted on a given
          date. This record does not contain names, email addresses,
          birthdates, or any session content. We keep it for security and
          recordkeeping purposes.
        </p>
        <p>
          Deletion completes immediately when you finish the steps above
          &mdash; well within the 30 days described in our{" "}
          <Link href="/privacy" className="text-cream underline underline-offset-2 hover:text-gold">
            Privacy Policy
          </Link>
          , Section 8 (Data Retention and Deletion).
        </p>
      </Section>

      <Section title="Questions">
        <p>
          For more detail on how we collect, use, and protect information,
          see our{" "}
          <Link href="/privacy" className="text-cream underline underline-offset-2 hover:text-gold">
            Privacy Policy
          </Link>
          . Questions about this page or a deletion request:{" "}
          <PrivacyEmailLink />.
        </p>
      </Section>

      <div className="mt-12 flex items-center justify-between border-t border-hairline pt-6 text-cream/60 text-[13px]">
        <Link href="/" className="text-cream/80 hover:text-gold no-underline">
          ← Back to home
        </Link>
        <Link href="/privacy" className="text-cream/80 hover:text-gold no-underline">
          Privacy Policy →
        </Link>
      </div>
    </main>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-24">
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
