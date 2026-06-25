import { redirect } from "next/navigation";

import { PracticeFlow } from "@/components/pregame/PracticeFlow";
import { requireAthlete } from "@/lib/auth/guards";
import { requireActiveAccess } from "@/lib/subscriptions/enforce";

export const metadata = {
  title: "Pre-Practice · From Victory",
};

export default async function PracticePage() {
  const { profile } = await requireAthlete();

  // Subscription enforcement gate (FV-62). No-op when flag is off.
  await requireActiveAccess({ role: profile.role });

  // First-run gate: an athlete must choose their sport before reaching
  // sport-keyed pre-practice content. Mirrors the /athlete dashboard gate
  // (FV-33); closes the deep-link bypass of /athlete/practice.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  return <PracticeFlow sport={profile.sport} />;
}
