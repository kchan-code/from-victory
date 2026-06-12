import { redirect } from "next/navigation";

import PersonalizationQuiz from "@/components/athlete/PersonalizationQuiz";
import { requireAthlete } from "@/lib/auth/guards";
import { updatePersonalizationQuiz } from "@/lib/actions/athlete-quiz";
import { getSportConfig } from "@/components/pregame/sport-registry";
import type { Sport as RegistrySport } from "@/components/pregame/sport-registry";
import type { Sport } from "@/lib/sports";

export const metadata = {
  title: "Training focus · From Victory",
};

/**
 * FV-228 — Settings edit surface for position + focus_area.
 *
 * Reached from /athlete/settings via the "Training focus" row.
 * Reuses the PersonalizationQuiz component with updatePersonalizationQuiz
 * action (which redirects back to settings with a confirmation toast).
 *
 * Pre-fills the quiz with the athlete's stored position and focus_area so
 * the edit screens feel like a re-answering, not a blank slate.
 */
export default async function TrainingFocusSettingsPage() {
  const { profile } = await requireAthlete();

  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  const sport = profile.sport as Sport;
  const sportConfig = getSportConfig(sport as RegistrySport);

  return (
    <PersonalizationQuiz
      sport={sport}
      roles={sportConfig.roles}
      initialPosition={profile.position}
      initialFocusArea={profile.focus_area}
      action={updatePersonalizationQuiz}
      submitLabel="SAVE"
      backHref="/athlete/settings"
      isEditMode
    />
  );
}
