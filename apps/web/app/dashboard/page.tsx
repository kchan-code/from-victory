import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/lib/actions/auth";
import { ageFromBirthdate } from "@/lib/age";
import { requireParent } from "@/lib/auth/guards";
import { getParentAccessLevel } from "@/lib/subscriptions/access";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountSection } from "@/components/dashboard/DeleteAccountSection";
import { DeleteAthleteButton } from "@/components/dashboard/DeleteAthleteButton";

export const metadata = {
  title: "Dashboard · From Victory",
};

export default async function DashboardPage() {
  const { userId, profile } = await requireParent();

  const supabase = createClient();
  // RLS scopes this to athletes linked to the calling parent.
  const { data: athletes } = await supabase
    .from("profiles")
    .select("id, first_name, birthdate")
    .eq("role", "athlete")
    .order("first_name", { ascending: true });

  const linkedAthletes = athletes ?? [];

  // Subscription access — used only to gate the subscribe CTA banner.
  // Enforcement (route-locking) is a separate issue; we do NOT block here.
  const accessLevel = await getParentAccessLevel(userId);

  return (
    <main className="min-h-screen bg-onyx px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-[960px]">
        <header className="flex items-center justify-between mb-12">
          <Image
            src="/logo-stacked.svg"
            alt="From Victory"
            width={105}
            height={60}
            className="h-14 w-auto"
            priority
          />
          <form action={signOut}>
            <button
              type="submit"
              className="font-heading font-semibold text-[14px] text-cream/70 hover:text-cream bg-charcoal border border-hairline rounded-pill px-5 py-2.5 transition-colors duration-fast ease-out"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="mb-12">
          <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-gold mb-3">
            Parent dashboard
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[40px] sm:text-[48px] leading-[1.05] mb-6">
            Welcome back, {profile.first_name}.
          </h1>
        </section>

        {/* Subscribe CTA — shown only when not on an active subscription.
            Non-blocking: current users without a subscription row must not
            be locked out. Enforcement is a separate issue. */}
        {accessLevel !== "full" ? (
          <section
            aria-label="Subscription"
            className="mb-10 bg-charcoal border border-hairline rounded-2xl px-5 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
          >
            <div className="flex-1 min-w-0">
              <p className="font-mono font-semibold uppercase tracking-[0.18em] text-[10px] text-gold mb-2">
                Subscription
              </p>
              <p className="font-display font-bold uppercase tracking-[0.04em] text-cream text-[18px] leading-tight mb-1">
                Start training today.
              </p>
              <p className="font-body text-cream/60 text-[13px] leading-relaxed">
                Daily mental-toughness training with faith built in. One
                subscription covers all your athletes.
              </p>
            </div>
            <Link
              href="/subscribe"
              data-testid="dashboard-subscribe-cta"
              className="flex-shrink-0 inline-flex items-center justify-center font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 min-h-[44px] no-underline hover:bg-gold-bright transition-colors duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
            >
              Choose a plan
            </Link>
          </section>
        ) : null}

        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display font-bold uppercase tracking-[0.08em] text-cream text-[18px]">
              Your athletes
            </h2>
            <Link
              href="/dashboard/athletes/new"
              className="font-heading font-semibold text-[14px] text-onyx bg-gold border border-gold rounded-pill px-5 py-2.5 no-underline hover:bg-gold-bright transition-colors duration-base ease-out"
            >
              Add athlete
            </Link>
          </div>

          {linkedAthletes.length === 0 ? (
            <div className="bg-charcoal border border-hairline rounded-2xl p-7">
              <p className="font-body text-cream/70 text-[15px] leading-relaxed">
                No athletes yet. Add your first athlete with their first name
                and birthdate — we don&rsquo;t collect anything else.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3">
              {linkedAthletes.map((a) => {
                if (!a.birthdate) return null;
                const age = ageFromBirthdate(a.birthdate);
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between bg-charcoal border border-hairline rounded-xl px-5 py-4"
                  >
                    <div>
                      <p className="font-display font-bold text-cream text-[18px] leading-tight">
                        {a.first_name}
                      </p>
                      {age !== null ? (
                        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-cream/50 mt-1">
                          Age {age}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/athletes/${a.id}/pair`}
                        className="font-heading font-semibold text-[13px] text-cream/80 hover:text-cream bg-onyx border border-hairline hover:border-cream/30 rounded-pill px-4 py-2 no-underline transition-colors duration-fast ease-out"
                      >
                        Pair device
                      </Link>
                      <DeleteAthleteButton
                        athleteId={a.id}
                        firstName={a.first_name}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <DeleteAccountSection />
      </div>
    </main>
  );
}
