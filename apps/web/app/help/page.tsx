import type { Metadata } from "next";
import Link from "next/link";

// FV-766: static help page. Public, no auth guard, no data reads, so it
// renders for a signed-out visitor and inside the iOS and Android shells.
// Every answer describes behavior that exists in code today (see the
// build notes on FV-766). No refund promise, no reply-time promise, no
// deletion timeline (the Privacy Policy owns timelines), no support email.
//
// Linked from adult surfaces only (marketing footer, /dashboard/settings,
// /subscribe). Never link it from /athlete/* or the global error pages.

export const metadata: Metadata = {
  alternates: { canonical: "/help" },
  title: "Help",
  description:
    "Short answers about billing, signing in, adding an athlete, deleting an account, and offline Pregame audio.",
  robots: { index: true, follow: true },
};

const linkClass =
  "text-cream underline underline-offset-2 hover:text-gold";

export default function HelpPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-[760px] px-5 sm:px-8 pt-24 pb-20 text-cream"
    >
      <header className="mb-10">
        <p className="fv-eyebrow gold mb-3">Help</p>
        <h1 className="font-heading font-bold text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] m-0 mb-3">
          Help
        </h1>
        <p className="text-cream/70 text-[16px] leading-relaxed m-0">
          Short answers about billing, signing in, and your account.
        </p>
      </header>

      <Section title="I paid, but the app is still locked">
        <ul className={listClass}>
          <li>
            If you paid on our website, it can take a moment to confirm. Wait a
            moment, then reload the app.
          </li>
          <li>
            Make sure you are signed in to the account you subscribed with. If
            you subscribed with a different account, sign out, then sign in
            with that one.
          </li>
          <li>
            If you bought in the iPhone app, open the subscription screen and
            select Restore Purchases.
          </li>
          <li>
            Still locked? <ContactLink />.
          </li>
        </ul>
      </Section>

      <Section title="How do I cancel?">
        <p className="mb-3">
          A subscription is cancelled in the place it was bought.
        </p>
        <ul className={listClass}>
          <li>
            <strong>Our website.</strong> Sign in, open Settings, and select
            Manage subscription. That opens the billing portal. In the iPhone
            or Android app, manage a website subscription from a web browser at
            fromvictoryapp.com.
          </li>
          <li>
            <strong>App Store.</strong> Apple manages it. On your iPhone, open
            Settings, tap your name, then Subscriptions.
          </li>
          <li>
            <strong>Google Play.</strong> Google manages it. Manage or cancel
            it in Google Play on your Android phone.
          </li>
        </ul>
        <p className="mt-3">
          For a question about an App Store or Google Play charge, use Apple or
          Google directly. They run their own billing process.
        </p>
      </Section>

      <Section title="Restore an App Store or Google Play purchase">
        <ul className={listClass}>
          <li>
            <strong>App Store.</strong> In the iPhone app, open the
            subscription screen and select Restore Purchases. If no purchase is
            found for the Apple ID on that iPhone, the app tells you.
          </li>
          <li>
            <strong>Google Play.</strong> Sign in to the account you
            subscribed with. If it is still locked, <ContactLink />.
          </li>
        </ul>
      </Section>

      <Section title="Forgot password, or athlete sign-in">
        <ul className={listClass}>
          <li>
            <strong>Parents and athletes 18 and older.</strong> On the sign-in
            screen, select Forgot password?, enter the email on your account,
            and we send a reset link if we find a match. Athletes 18 and older
            sign in with their email.
          </li>
          <li>
            <strong>Athletes under 18.</strong> Sign in with the username from
            your parent&rsquo;s invite. If you forget your password, ask your
            parent for a reset code.
          </li>
          <li>
            <strong>Parents.</strong> On your dashboard, select Manage next to
            your athlete, then Create reset code. It sets a new password and
            keeps their username. It works once and expires in 24 hours.
          </li>
        </ul>
      </Section>

      <Section title="Add or invite an athlete">
        <ul className={listClass}>
          <li>
            <strong>Add an athlete.</strong> On your dashboard, select Add
            athlete and enter their first name and birthdate. In the Android
            app, add athletes from a web browser at fromvictoryapp.com.
          </li>
          <li>
            <strong>Invite them.</strong> Select Invite athlete next to their
            name. Your athlete opens the link on their phone, picks a username
            and a password, and starts training. No email is needed. The invite
            works once and expires in 7 days.
          </li>
          <li>
            If the link does not open the app, your athlete can open From
            Victory, tap I have an invite, and type the code.
          </li>
          <li>
            Athletes 18 and older create their own account instead of using an
            invite.
          </li>
        </ul>
      </Section>

      <Section title="Delete an account or an athlete">
        <ul className={listClass}>
          <li>
            <strong>Delete one athlete (parent).</strong> On your dashboard,
            under Your athletes, select Remove next to the athlete. Type their
            first name, then select Delete permanently. This cannot be undone.
          </li>
          <li>
            <strong>Delete your whole account (parent).</strong> On your
            dashboard, scroll to Delete account and select Delete my account.
            Type DELETE to confirm. Athletes you manage on your own are
            deleted too. An athlete also linked to a co-parent stays on that
            parent&rsquo;s account.
          </li>
          <li>
            <strong>Delete your account (athlete 18 and older).</strong> Open
            Settings, scroll to Delete account, and select Delete my account.
            Type DELETE to confirm.
          </li>
          <li>
            <strong>Athletes under 18.</strong> There is no delete button in
            the athlete&rsquo;s app. The parent who set up the account deletes
            it from their dashboard.
          </li>
          <li>
            A subscription bought on our website is cancelled when you delete
            your account. An App Store subscription is not. Cancel it with
            Apple.
          </li>
        </ul>
        <p className="mt-3">
          For what we keep and for how long, see the{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Offline Pregame audio">
        <ul className={listClass}>
          <li>
            To play Pregame audio without a connection, select Download for
            offline while you are online. Ready offline shows when it is saved.
          </li>
          <li>
            Opening Pregame offline also needs the app to have checked your
            access online on that device. Offline access lasts until the end
            of the last subscription period the app verified there.
          </li>
          <li>
            After that, or if access has lapsed, connect to the internet and
            open the app to refresh it.
          </li>
        </ul>
      </Section>

      <Section title="How to reach us">
        <p>
          Use the <ContactLink label="contact form" />.
        </p>
      </Section>

      <div className="mt-12 flex items-center justify-between border-t border-hairline pt-6 text-cream/60 text-[13px]">
        <Link href="/" className="text-cream/80 hover:text-gold no-underline">
          &larr; Back to home
        </Link>
        <Link
          href="/privacy"
          className="text-cream/80 hover:text-gold no-underline"
        >
          Privacy Policy &rarr;
        </Link>
      </div>
    </main>
  );
}

const listClass = "pl-5 list-disc space-y-2";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="font-heading font-semibold text-[22px] tracking-[-0.01em] m-0 mb-3 text-cream">
        {title}
      </h2>
      <div className="text-cream/80 leading-relaxed">{children}</div>
    </section>
  );
}

function ContactLink({ label = "Contact us" }: { label?: string }) {
  return (
    <Link href="/contact" className={linkClass}>
      {label}
    </Link>
  );
}
