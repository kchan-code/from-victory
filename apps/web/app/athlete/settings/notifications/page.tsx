import Link from "next/link";

import ReminderSettings from "@/components/athlete/ReminderSettings";
import { Icon } from "@/components/ui";
import { requireAthlete } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Daily reminder",
};

export default async function NotificationsSettingsPage() {
  const { userId } = await requireAthlete();
  const supabase = createClient();

  // Load the athlete's current push subscription row to hydrate the client
  // component with real initial state. We only need reminder_hour — we do NOT
  // pass keys/endpoint to the client (privacy).
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("reminder_hour")
    .eq("athlete_id", userId)
    .maybeSingle();

  const initialEnabled = sub !== null;
  const initialHour = sub?.reminder_hour ?? 19; // 7:00 PM default

  return (
    <main className="min-h-screen bg-onyx pb-[calc(48px+env(safe-area-inset-bottom,0px))]">
      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-5 pt-[58px] pb-6 sm:px-8 max-w-[640px] mx-auto">
        <Link
          href="/athlete/settings"
          aria-label="Back to settings"
          className="flex h-[44px] w-[44px] -ml-[5px] items-center justify-center rounded-pill text-cream/70 transition-colors duration-fast ease-out hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-onyx"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-pill border border-hairline">
            <Icon name="arrowLeft" size={16} />
          </span>
        </Link>
      </header>

      <ReminderSettings
        initialEnabled={initialEnabled}
        initialHour={initialHour}
      />
    </main>
  );
}
