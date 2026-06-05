import { AthleteSignInForm } from "@/components/auth/AthleteSignInForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/SignInForm";
import { getDeviceAthleteId } from "@/lib/auth/device";
import { redirectIfAuthed } from "@/lib/auth/guards";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata = {
  title: "Sign in · From Victory",
};

type Props = {
  searchParams: { reset?: string; error?: string };
};

export default async function SignInPage({ searchParams }: Props) {
  await redirectIfAuthed();

  const resetInvalid = searchParams.reset === "invalid";
  const sessionInvalid = searchParams.error === "session_invalid";

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
      {resetInvalid ? (
        <div
          role="alert"
          className="mb-6 rounded-[10px] border border-[rgba(229,62,76,0.4)] bg-[rgba(229,62,76,0.08)] px-3.5 py-3 text-[13px] text-[#ffb3b9]"
        >
          That reset link can&rsquo;t be used. Request a fresh one from{" "}
          <a
            href="/forgot-password"
            className="underline underline-offset-2 hover:text-cream"
          >
            forgot password
          </a>
          .
        </div>
      ) : null}
      {sessionInvalid ? (
        <div
          role="alert"
          className="mb-6 rounded-[10px] border border-[rgba(229,62,76,0.4)] bg-[rgba(229,62,76,0.08)] px-3.5 py-3 text-[13px] text-[#ffb3b9]"
        >
          Your session was invalid — please sign in again.
        </div>
      ) : null}
      <SignInForm />
    </AuthShell>
  );
}
