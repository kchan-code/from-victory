import Image from "next/image";

import { signOut } from "@/lib/actions/auth";
import { requireParent } from "@/lib/auth/guards";

export const metadata = {
  title: "Dashboard · From Victory",
};

export default async function DashboardPage() {
  const { profile } = await requireParent();

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

        <section>
          <p className="font-display font-semibold uppercase tracking-[0.18em] text-[12px] text-gold mb-3">
            Parent dashboard
          </p>
          <h1 className="font-display font-extrabold uppercase tracking-[0.04em] text-cream text-[40px] sm:text-[48px] leading-[1.05] mb-6">
            Welcome back, {profile.first_name}.
          </h1>
          <p className="font-body text-cream/70 text-[17px] leading-relaxed max-w-[640px] mb-10">
            Your account is ready. Athlete accounts, your subscription, and
            your athlete&rsquo;s rhythm dashboard land in the coming releases.
          </p>

          <div className="bg-charcoal border border-hairline rounded-2xl p-7 max-w-[640px]">
            <p className="font-display font-semibold uppercase tracking-[0.16em] text-[11px] text-cream/50 mb-3">
              Next up
            </p>
            <p className="font-body text-cream/80 text-[15px] leading-relaxed">
              Athlete account creation is shipping next. Once it&rsquo;s live,
              you&rsquo;ll be able to add your athlete from this dashboard with
              just their first name and birthdate.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
