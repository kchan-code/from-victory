import { AthleteSignInForm } from "@/components/auth/AthleteSignInForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { ClearCacheOnMount } from "@/components/auth/ClearCacheOnMount";
import { SignInChooser } from "@/components/auth/SignInChooser";
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
    // deviceAthleteId is HMAC-verified by getDeviceAthleteId() (FV-13) — this
    // service-role lookup only runs for a cryptographically-signed cookie value.
    // A forged or unsigned legacy cookie is rejected upstream and returns null.
    const { data: athlete } = await service
      .from("profiles")
      .select("first_name, role")
      .eq("id", deviceAthleteId)
      .maybeSingle();

    if (athlete && athlete.role === "athlete") {
      // Resolve the synthetic email so the sign-in form can wire
      // autocomplete="username" for password managers. Graceful degrade: if
      // getUserById fails we still render the form — just without the hint.
      const { data: authUser } = await service.auth.admin.getUserById(
        deviceAthleteId,
      );
      const accountEmail = authUser?.user?.email ?? undefined;

      return (
        <AuthShell title={`Welcome back, ${athlete.first_name}.`}>
          {/* FV-154: clear offline cache on mount — covers the case where
              the athlete lands here while the device is still paired but
              not yet signed in (e.g. session expired). forgetDevice's own
              onSubmit handler also clears it, so this is belt-and-suspenders. */}
          <ClearCacheOnMount />
          <AthleteSignInForm
            firstName={athlete.first_name}
            accountEmail={accountEmail}
          />
        </AuthShell>
      );
    }
    // Cookie points to a non-athlete or deleted profile; fall through to
    // the parent form. The forgetDevice action lets the user clear the
    // stale cookie via the athlete-form link, but if the athlete record
    // is gone entirely, the parent form is the safer default here.
  }

  return (
    <AuthShell title="Welcome back">
      {/* FV-154: clear offline athlete cache on mount — covers forgetDevice
          and /auth/signout escape hatch, both of which redirect here after
          signing out server-side. An authenticated athlete is never on this
          path (redirectIfAuthed() guards the page). */}
      <ClearCacheOnMount />
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
      {/* FV-320: two-tab chooser — parent (email+password) or athlete
          (username+password on any device). The device-cookie path above
          short-circuits before we get here, so this is only shown for
          no-cookie visitors. Default tab is "Parent" — the more common
          no-cookie scenario. */}
      <SignInChooser />
    </AuthShell>
  );
}
