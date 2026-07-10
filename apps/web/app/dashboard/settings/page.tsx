/**
 * Parent account & settings page.
 *
 * Displays:
 *   - Account email (read-only; email change deferred — see AC-7).
 *   - Subscription status: plan label, status, renews/ends date.
 *   - Manage subscription: Stripe Billing Portal (via BillingPortalButton).
 *   - Change password: sends a reset link to the signed-in parent's own email
 *     (reuses the existing requestPasswordReset server action).
 *   - Sign out (reuses SignOutButton component / signOut action).
 *   - Legal links: Terms of Use, Privacy Policy.
 *
 * Privacy:
 *   - Only the calling parent's own data (account email + subscription row).
 *   - No athlete PII on this page.
 *   - Stripe customer ID is read server-side inside the billing-portal action
 *     and never rendered here.
 *
 * Server Component — no client state; BillingPortalButton and
 * SendResetLinkButton are the only interactive islands.
 */

import Image from "next/image";
import Link from "next/link";

import { BillingPortalButton } from "@/components/dashboard/BillingPortalButton";
import { DigestToggle } from "@/components/dashboard/DigestToggle";
import { SendResetLinkButton } from "@/components/dashboard/SendResetLinkButton";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireParent } from "@/lib/auth/guards";
import { getDigestOptOut } from "@/lib/actions/digest-preferences";
import { createClient } from "@/lib/supabase/server";
import { priceIdToLabel } from "@/lib/subscriptions/plans";

export const metadata = {
  title: "Account settings",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Past due";
    case "canceled":
      return "Canceled";
    case "incomplete":
    case "incomplete_expired":
      return "Incomplete";
    case "unpaid":
      return "Unpaid";
    case "paused":
      return "Paused";
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardSettingsPage() {
  const { userId } = await requireParent();

  // Read the parent's own email from the authenticated session. This is the
  // parent's real account email — not an athlete synthetic address. We read it
  // from auth.getUser() so it's always current (not stale from the profiles row).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // requireParent() already validated the session; user is guaranteed non-null here.
  const accountEmail = user?.email ?? "—";

  // Read the parent's subscription row. RLS policy `subscriptions_select_own_parent`
  // scopes this to the calling parent's own row only.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select(
      "status, price_id, current_period_end, cancel_at_period_end",
    )
    .eq("parent_id", userId)
    .maybeSingle();

  // Resolve the plan label server-side so price IDs never reach the client.
  const planLabel = priceIdToLabel(
    sub?.price_id,
    process.env.STRIPE_PRICE_ID_MONTHLY,
    process.env.STRIPE_PRICE_ID_ANNUAL,
  );

  const hasSubscription = !!sub;
  const isCanceling = sub?.cancel_at_period_end === true;
  const periodEndDate = formatDate(sub?.current_period_end);

  // Digest opt-out preference (FV-226).
  const digestOptOut = await getDigestOptOut();

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/dashboard" aria-label="Back to dashboard">
            <Image
              src="/logo-stacked.svg"
              alt="From Victory"
              width={105}
              height={60}
              className="h-14 w-auto"
              priority
            />
          </Link>
          <SignOutButton className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out" />
        </header>

        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 font-heading font-semibold text-[13px] text-cream/60 hover:text-cream transition-colors duration-fast ease-out no-underline"
          >
            <span aria-hidden="true">&#8592;</span>
            Back to dashboard
          </Link>
        </div>

        {/* Page title */}
        <section className="mb-10">
          <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-gold mb-3">
            Account
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[32px] sm:text-[40px] leading-[1.05]">
            Settings
          </h1>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Account section                                                     */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-labelledby="account-heading"
          className="mb-8 bg-charcoal border border-hairline rounded-2xl px-5 py-6"
        >
          <h2
            id="account-heading"
            className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-5"
          >
            Account
          </h2>

          {/* Email (read-only; change deferred — see build notes) */}
          <div className="flex items-start justify-between gap-4 py-3 border-b border-hairline">
            <div>
              <p className="font-heading font-semibold text-[13px] text-cream/50 uppercase tracking-[0.12em] mb-1">
                Email
              </p>
              <p
                className="font-body text-cream text-[15px]"
                data-testid="account-email"
              >
                {accountEmail}
              </p>
            </div>
            {/* Email change is deferred (FV-192 AC-7). Show a muted note. */}
            <span className="flex-shrink-0 font-heading text-[12px] text-cream/30 mt-1">
              Read only
            </span>
          </div>

          {/* Change password */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-heading font-semibold text-[13px] text-cream uppercase tracking-[0.04em]">
                Password
              </p>
              <p className="font-body text-cream/50 text-[13px] leading-relaxed mt-0.5">
                Send a reset link to your account email.
              </p>
            </div>
            <SendResetLinkButton />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Subscription section                                                */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-labelledby="subscription-heading"
          className="mb-8 bg-charcoal border border-hairline rounded-2xl px-5 py-6"
        >
          <h2
            id="subscription-heading"
            className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-5"
          >
            Subscription
          </h2>

          {hasSubscription ? (
            <>
              {/* Plan + status row */}
              <div className="flex items-start justify-between gap-4 py-3 border-b border-hairline">
                <div>
                  <p className="font-heading font-semibold text-[13px] text-cream/50 uppercase tracking-[0.12em] mb-1">
                    Plan
                  </p>
                  <p className="font-body text-cream text-[15px]">
                    {planLabel}
                  </p>
                </div>
                <span
                  className="flex-shrink-0 font-heading font-semibold text-[12px] text-gold bg-gold/10 rounded-full px-3 py-1 mt-0.5"
                  data-testid="subscription-status"
                >
                  {statusLabel(sub.status)}
                </span>
              </div>

              {/* Renews / ends date row */}
              <div className="py-3 border-b border-hairline">
                <p className="font-heading font-semibold text-[13px] text-cream/50 uppercase tracking-[0.12em] mb-1">
                  {isCanceling ? "Access ends" : "Renews"}
                </p>
                <p
                  className="font-body text-cream text-[15px]"
                  data-testid="subscription-period-end"
                >
                  {periodEndDate}
                </p>
                {isCanceling ? (
                  <p className="font-body text-cream/50 text-[13px] leading-relaxed mt-1">
                    Your access continues until this date.
                  </p>
                ) : null}
              </div>

              {/* Manage subscription CTA */}
              <div className="pt-4">
                <p className="font-body text-cream/50 text-[13px] leading-relaxed mb-4">
                  Update your payment method, change your plan, or cancel —
                  all in the secure Stripe portal.
                </p>
                <BillingPortalButton />
              </div>
            </>
          ) : (
            /* No subscription row */
            <div className="py-2">
              <p
                className="font-body text-cream/70 text-[15px] leading-relaxed mb-4"
                data-testid="no-subscription"
              >
                No active subscription.
              </p>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
              >
                Choose a plan
              </Link>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Notifications section (FV-226)                                     */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-labelledby="notifications-heading"
          className="mb-8 bg-charcoal border border-hairline rounded-2xl px-5 py-6"
        >
          <h2
            id="notifications-heading"
            className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-5"
          >
            Emails
          </h2>

          <DigestToggle initialOptOut={digestOptOut} />
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Legal section                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section
          aria-labelledby="legal-heading"
          className="mb-8 bg-charcoal border border-hairline rounded-2xl px-5 py-6"
        >
          <h2
            id="legal-heading"
            className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-5"
          >
            Legal
          </h2>
          <ul className="space-y-0">
            <li>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 border-b border-hairline font-heading font-semibold text-[15px] text-cream/80 hover:text-cream transition-colors duration-fast ease-out no-underline group"
              >
                <span>Terms of Use</span>
                <span
                  className="text-cream/30 group-hover:text-cream/60 transition-colors duration-fast ease-out"
                  aria-hidden="true"
                >
                  &#8599;
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-3 font-heading font-semibold text-[15px] text-cream/80 hover:text-cream transition-colors duration-fast ease-out no-underline group"
              >
                <span>Privacy Policy</span>
                <span
                  className="text-cream/30 group-hover:text-cream/60 transition-colors duration-fast ease-out"
                  aria-hidden="true"
                >
                  &#8599;
                </span>
              </Link>
            </li>
          </ul>
        </section>

        {/* Sign out */}
        <div className="flex justify-center pb-10">
          <SignOutButton className="font-heading font-semibold text-[14px] text-cream/50 hover:text-cream transition-colors duration-fast ease-out bg-transparent border-none cursor-pointer" />
        </div>
      </div>
    </main>
  );
}
