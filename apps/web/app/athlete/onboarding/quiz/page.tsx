import { redirect } from "next/navigation";

import PersonalizationQuiz from "@/components/athlete/PersonalizationQuiz";
import { requireAthlete } from "@/lib/auth/guards";
import { savePersonalizationQuiz } from "@/lib/actions/athlete-quiz";
import { getSportConfig } from "@/components/pregame/sport-registry";
import type { Sport as RegistrySport } from "@/components/pregame/sport-registry";
import type { Sport } from "@/lib/sports";

export const metadata = {
  title: "Your training focus · From Victory",
};

/**
 * FV-228 — Onboarding personalization quiz.
 *
 * Reached after the sport picker (sport_selected_at is set). The athlete
 * answers two optional questions: position and "what's hard for you right now."
 *
 * Gate: if sport has not been selected yet, redirect to the sport picker.
 * Skip path: both steps are skippable — the action accepts null for both.
 *
 * This route IS the final step of onboarding. The action redirects to /athlete
 * on any submit path (including skip), completing first-run.
 */
export default async function OnboardingQuizPage() {
  const { profile } = await requireAthlete();

  // Gate: must have picked a sport first.
  if (!profile.sport_selected_at) {
    redirect("/athlete/onboarding/sport");
  }

  // sport is typed as string | null in DB types; narrow it for the registry.
  const sport = profile.sport as Sport;
  const sportConfig = getSportConfig(sport as RegistrySport);

  return (
    <PersonalizationQuiz
      sport={sport}
      roles={sportConfig.roles}
      roleLabel={sportConfig.roleLabel}
      action={savePersonalizationQuiz}
      submitLabel="GET STARTED"
    />
  );
}
