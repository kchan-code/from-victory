import { AthleteSignInForm } from "@/components/auth/AthleteSignInForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { getDeviceAthleteId } from "@/lib/auth/device";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata = {
  title: "Sign in · From Victory",
};

export default async function SignInPage() {
  await redirectIfAuthed();

  const deviceAthleteId = getDeviceAthleteId();

  if (deviceAthleteId) {
    const service = createServiceClient();
    const { data: athlete } = await service
      .from("profiles")
      .select("first_name, role")
      .eq("id", deviceAthleteId)
      .maybeSingle();

    if (athlete && athlete.role === "athlete") {
      return (
        <AuthShell title={`Welcome back, ${athlete.first_name}.`}>
          <AthleteSignInForm firstName={athlete.first_name} />
        </AuthShell>
      );
    }
    // Cookie points to a non-athlete or deleted profile; fall through to
    // the parent form. The forgetDevice action lets the user clear the
    // stale cookie via the athlete-form link, but if the athlete record
    // is gone entirely, the parent form is the safer default here.
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your parent account.">
      <SignInForm />
    </AuthShell>
  );
}
