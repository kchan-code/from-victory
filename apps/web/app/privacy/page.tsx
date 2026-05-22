import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · From Victory",
  description:
    "How From Victory handles the data of athletes, parents, and waitlist signups. Minimal data, no third-party tracking, athlete-private journal entries.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "May 22, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream">
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Privacy</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Privacy at From Victory
        </h1>
        <p className="text-cream/60 text-[14px]">
          Last updated {LAST_UPDATED}. This policy will be updated as the product evolves
          before public launch.
        </p>
      </header>

      <section className="rounded-[18px] border border-hairline bg-charcoal/70 p-6 mb-10">
        <h2 className="font-heading font-semibold text-[18px] m-0 mb-3">Short version</h2>
        <ul className="m-0 pl-5 text-cream/80 leading-relaxed space-y-1.5">
          <li>We collect the minimum data the product needs to work.</li>
          <li>No behavioral analytics, no ads, no third-party tracking on any 13–17 account.</li>
          <li>Athlete journal entries are private to the athlete. Parents cannot read them.</li>
          <li>Parents control deletion of an athlete account; we remove the data within 30 days.</li>
          <li>We are not a mental health service. We point athletes in crisis to professional resources.</li>
        </ul>
      </section>

      <Section title="Who this covers">
        <p>
          From Victory is a daily mental-toughness and faith training app for athletes ages 13–21.
          Parents buy and manage the subscription; athletes use the app. This policy applies to
          everyone who interacts with us — waitlist signups, parents who create an account, and
          athletes whose parents add them.
        </p>
      </Section>

      <Section title="What we collect today">
        <p className="mb-3">
          The product is in pre-launch. Today, the only personal data we collect is from the
          waitlist signup form on our landing page:
        </p>
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-1.5">
          <li>Name (a first name and last initial is plenty)</li>
          <li>Email address</li>
          <li>Role you identified (athlete, parent, coach, or other)</li>
          <li>Primary sport</li>
          <li>Optional note about what you’re hoping the app helps with</li>
        </ul>
        <p className="mt-3">
          We do not collect your IP address for storage, your device identifiers, your location, or
          anything else from the waitlist form. We do not place tracking pixels or analytics scripts
          on this site.
        </p>
      </Section>

      <Section title="What we will collect at launch">
        <p className="mb-3">
          When the product opens to real accounts, we will also collect:
        </p>
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-2">
          <li>
            <strong className="text-cream">From parents:</strong> name, email, billing information
            handled by Stripe (we never see your card number), and the names + birthdates of the
            athletes you add.
          </li>
          <li>
            <strong className="text-cream">From athletes (ages 13–17):</strong> a first name and a
            birthdate (to confirm 13+ and to apply the right protections). We do not collect athlete
            email, phone number, address, or photos. Athletes do not have outside login credentials —
            they sign in via a device pairing flow set up by their parent.
          </li>
          <li>
            <strong className="text-cream">Journal entries from athletes:</strong> protected by
            database-level row-level security so only the athlete who wrote them can read them.
            Storage infrastructure encrypts data at rest.
          </li>
          <li>
            <strong className="text-cream">Participation metadata:</strong> session start and
            completion times, training-rhythm dates. This metadata (not journal content) feeds the
            parent dashboard so parents can see whether their athlete is engaging.
          </li>
        </ul>
      </Section>

      <Section title="What we do not do">
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-1.5">
          <li>We do not show ads to anyone, ever — and especially not to minors.</li>
          <li>We do not run behavioral analytics on any 13–17 account.</li>
          <li>We do not sell, rent, or share your data with marketers.</li>
          <li>We do not allow third-party tracking SDKs on athlete-facing surfaces.</li>
          <li>We do not let parents read their athlete’s journal entries.</li>
          <li>We do not claim to be a mental health service or a substitute for professional care.</li>
        </ul>
      </Section>

      <Section title="How journals are protected">
        <p className="mb-3">
          When an athlete writes a journal entry, the entry is private to that athlete by default.
          No parent, coach, or third party can read it.
        </p>
        <p className="mb-3">
          We do run a server-side safety check when an entry is saved: a fixed vocabulary of
          crisis-related keywords (suicidal ideation, self-harm, abuse) is checked against the
          entry. If the check flags the entry, the athlete is shown an in-line resource screen —
          the 988 Suicide &amp; Crisis Lifeline, the Crisis Text Line, and a prompt to talk to a
          trusted adult. No one else is notified. The check produces a log of the event (date,
          category) but never stores the athlete’s text outside the entry itself.
        </p>
        <p>
          The keyword vocabulary is reviewed quarterly by a clinical advisor and updated as needed.
          We treat this as a safety net, not a diagnosis.
        </p>
      </Section>

      <Section title="How we use the data">
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-1.5">
          <li>To run the product (sign you in, deliver today’s training, save your journal).</li>
          <li>To let parents see participation metadata for their athlete.</li>
          <li>To send transactional emails (account-related, billing, safety responses).</li>
          <li>To keep the system secure and prevent abuse.</li>
          <li>To respond when you contact us.</li>
        </ul>
        <p className="mt-3">
          We do not use personal data for advertising, lookalike targeting, or any kind of profile
          building.
        </p>
      </Section>

      <Section title="Who can see your data">
        <p className="mb-3">
          A very small number of people: the From Victory founder and any future team members with
          a business need to look at the system. Access is logged and limited.
        </p>
        <p className="mb-3">
          We use a small number of trusted infrastructure providers to run the product: Supabase
          (database and authentication), Vercel (hosting), Stripe (payments), and Resend (the
          email service that delivers transactional and admin-notification emails). They process
          data on our behalf and are bound by their own privacy obligations.
        </p>
        <p>
          We do not share data with anyone else.
        </p>
      </Section>

      <Section title="Your rights">
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-2">
          <li>
            <strong className="text-cream">Access:</strong> you can ask what we have on file. Email
            the address below and we’ll send it.
          </li>
          <li>
            <strong className="text-cream">Correction:</strong> tell us what to change.
          </li>
          <li>
            <strong className="text-cream">Deletion:</strong> parents can request deletion of an
            athlete account; we cascade-delete the athlete’s data — profile, sessions, journal
            entries — within 30 days. Waitlist signups can be removed at any time by emailing us.
          </li>
          <li>
            <strong className="text-cream">Withdraw consent:</strong> close your account or remove
            yourself from the waitlist any time. You don’t need to give us a reason.
          </li>
        </ul>
      </Section>

      <Section title="Athletes ages 13–17 (special protections)">
        <p className="mb-3">
          All athletes on From Victory are 13 or older — we do not knowingly create accounts for
          children under 13. Athletes 13–17 still carry extra protections under state and
          international laws, and we apply those protections by default:
        </p>
        <ul className="m-0 pl-5 text-cream/85 leading-relaxed space-y-1.5">
          <li>No behavioral analytics. No ads. No third-party tracking.</li>
          <li>Minimal PII (first name and birthdate only).</li>
          <li>Parent controls deletion.</li>
          <li>Journal content stays athlete-private.</li>
        </ul>
      </Section>

      <Section title="Security">
        <p>
          Data is transmitted over TLS and stored encrypted at rest. We use database-level
          row-level security (RLS) so that even a misbehaving piece of application code cannot read
          data it shouldn’t. We log access to administrative interfaces and limit who can sign in.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We will update this page as the product evolves before public launch. Material changes
          will be communicated to active users by email.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions, deletion requests, or anything else:{" "}
          <a
            href="mailto:hello@fromvictoryapp.com"
            className="text-cream underline underline-offset-2 hover:text-gold"
          >
            hello@fromvictoryapp.com
          </a>
          .
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
