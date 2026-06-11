import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_SPORTS, sportLabel, type Sport } from "@/lib/sports";

export const metadata = {
  title: "Settings · From Victory",
};

function isSport(value: string | undefined): value is Sport {
  return (
    typeof value === "string" && (SUPPORTED_SPORTS as readonly string[]).includes(value)
  );
}

export default async function AthleteSettingsPage({
  searchParams,
}: {
  searchParams?: { switched?: string };
}) {
  const { profile, userId } = await requireAthlete();
  const supabase = createClient();

  // Load push subscription summary for the "Daily reminder" settings row.
  // Only fetch reminder_hour — never expose keys/endpoint to the page.
  const { data: pushSub } = await supabase
    .from("push_subscriptions")
    .select("reminder_hour")
    .eq("athlete_id", userId)
    .maybeSingle();

  // Mirror the home first-run gate: an athlete who hasn't affirmatively chosen
  // a sport belongs on the onboarding picker, not in Settings.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // Calm confirmation after a switch (FV-56 §2.3). Only trust a valid sport
  // value so the toast can never echo arbitrary query text.
  const switched = isSport(searchParams?.switched) ? searchParams.switched : null;

  return (
    <main className="min-h-screen bg-onyx pb-[calc(48px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-[58px] pb-6 sm:px-8 max-w-[640px] mx-auto">
        <Link
          href="/athlete"
          aria-label="Back to home"
          className="flex h-[44px] w-[44px] -ml-[5px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
            <Icon name="arrowLeft" size={16} />
          </span>
        </Link>
      </header>

      <div className="px-5 sm:px-8 max-w-[640px] mx-auto">
        <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
          Settings
        </p>
        <h1 className="mb-8 font-display font-extrabold uppercase tracking-[0.03em] text-cream text-[30px] leading-[1.05]">
          Your account
        </h1>

        {switched && (
          <div
            role="status"
            className="mb-6 rounded-[10px] border border-gold/35 bg-gold/[0.06] px-4 py-3 font-body text-[13px] leading-snug text-cream/80"
          >
            Switched to {switched}.
          </div>
        )}

        {/* ── SPORT ── */}
        <section aria-labelledby="settings-sport-heading" className="mb-9">
          <h2
            id="settings-sport-heading"
            className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40"
          >
            Sport
          </h2>
          <Link
            href="/athlete/settings/sport"
            data-testid="settings-sport-change-btn"
            className="flex min-h-[60px] w-full items-center gap-4 rounded-[12px] border border-hairline bg-charcoal px-4 py-3.5 no-underline transition-colors duration-fast ease-out hover:border-gold/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span className="flex-1 min-w-0">
              <span className="block font-heading text-[16px] font-semibold leading-tight text-cream">
                Sport
              </span>
              <span className="mt-0.5 block font-body text-[13px] leading-snug text-cream/50">
                The game your training is built around.
              </span>
            </span>
            <span className="flex-none font-heading text-[14px] font-semibold text-cream/70">
              {sportLabel(profile.sport)}
            </span>
            <span className="flex flex-none items-center gap-1 font-heading text-[13px] font-semibold text-gold">
              Change
              <Icon name="arrowRight" size={16} color="var(--fv-gold)" />
            </span>
          </Link>
        </section>

        {/* ── DAILY REMINDER ── */}
        <section aria-labelledby="settings-reminder-heading" className="mb-9">
          <h2
            id="settings-reminder-heading"
            className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40"
          >
            Notifications
          </h2>
          <Link
            href="/athlete/settings/notifications"
            data-testid="settings-reminder-btn"
            className="flex min-h-[60px] w-full items-center gap-4 rounded-[12px] border border-hairline bg-charcoal px-4 py-3.5 no-underline transition-colors duration-fast ease-out hover:border-gold/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
          >
            <span className="flex-none text-cream/50">
              <Icon name="bell" size={18} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-heading text-[16px] font-semibold leading-tight text-cream">
                Daily reminder
              </span>
              <span className="mt-0.5 block font-body text-[13px] leading-snug text-cream/50">
                A steady nudge to keep your rhythm.
              </span>
            </span>
            <span className="flex-none font-heading text-[14px] font-semibold text-cream/70">
              {pushSub !== null
                ? `On · ${
                    (() => {
                      const h = pushSub.reminder_hour;
                      const period = h < 12 ? "AM" : "PM";
                      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      return `${h12}:00 ${period}`;
                    })()
                  }`
                : "Off"}
            </span>
            <span className="flex flex-none items-center gap-1 font-heading text-[13px] font-semibold text-gold">
              Edit
              <Icon name="arrowRight" size={16} color="var(--fv-gold)" />
            </span>
          </Link>
        </section>

        {/* ── ACCOUNT ── */}
        <section aria-labelledby="settings-account-heading">
          <h2
            id="settings-account-heading"
            className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40"
          >
            Account
          </h2>
          <SignOutButton className="inline-flex w-full items-center justify-center rounded-[12px] border border-hairline bg-charcoal px-5 py-4 font-heading text-[14px] font-semibold text-cream/70 transition-colors duration-fast ease-out hover:text-cream hover:border-cream/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx" />
        </section>
      </div>
    </main>
  );
}
