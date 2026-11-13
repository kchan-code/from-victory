import "server-only";

import { redirect } from "next/navigation";

import { setDeviceAthleteId } from "@/lib/auth/device";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Shared claim core for athlete invites + recovery (FV-630).
 *
 * NOT a server action (no "use server") — only callable from the server
 * actions in lib/actions/invites.ts, which have already rate-limited the
 * request and validated input. Never logs the code or its hash.
 *
 * Order of operations (each step's failure mode is explicit):
 *   1. claim_athlete_invite RPC — ONE transaction: lock, validate live +
 *      unexpired, set the username (first setup only; a collision rolls back
 *      WITHOUT burning the code), mark consumed. Recovery never touches the
 *      username.
 *   2. Resolve the athlete's synthetic auth email.
 *   3. Set the password (Auth admin API — can't join the DB transaction).
 *      If 2 or 3 fail, release_athlete_invite undoes exactly this claim
 *      (clears the username it set, revives the code) so the athlete can
 *      retry with the same code.
 *   4. Bind the device cookie and sign in, then go straight to /athlete —
 *      no second sign-in.
 */

export type ClaimFailure = { ok: false; error: string; field?: string };

export const INVITE_UNUSABLE_MESSAGE =
  "This code can't be used. It may have expired, been replaced, or already been used. Ask your parent to create a new one.";

const GENERIC_FAILURE = "Something went wrong. Please try again.";

export async function completeInviteClaim(input: {
  codeHash: string;
  /** Normalized username, or null when the athlete didn't send one. */
  username: string | null;
  password: string;
}): Promise<ClaimFailure> {
  const service = createServiceClient();

  const { data: rows, error: claimError } = await service.rpc(
    "claim_athlete_invite",
    { p_code_sha256: input.codeHash, p_username: input.username },
  );

  if (claimError) {
    if (claimError.code === "23505") {
      return {
        ok: false,
        error: "That username is already taken. Choose a different one.",
        field: "username",
      };
    }
    if (claimError.code === "22023") {
      return {
        ok: false,
        error: "Choose a username to finish setting up.",
        field: "username",
      };
    }
    console.error(
      `[invites.claim] claim rpc failed: ${claimError.message} (code=${claimError.code ?? "n/a"})`,
    );
    return { ok: false, error: GENERIC_FAILURE };
  }

  const claimed = rows?.[0];
  if (!claimed) {
    return { ok: false, error: INVITE_UNUSABLE_MESSAGE };
  }

  const athleteId = claimed.athlete_id;

  const release = async (reason: string) => {
    // consumed_at is passed back as the exact string Postgres returned — never
    // round-tripped through Date (that would drop microseconds and miss).
    const { data: released, error: releaseError } = await service.rpc(
      "release_athlete_invite",
      {
        p_code_sha256: input.codeHash,
        p_consumed_at: claimed.consumed_at,
        // purpose 'invite' means THIS claim set the username: undo it too,
        // so a retry can choose freely and the parent never sees "account
        // ready" for an account that has no password.
        p_clear_username: claimed.purpose === "invite",
      },
    );
    console.error(
      `[invites.claim] ${reason} after claim (athleteId=${athleteId}); released=${released === true} ${releaseError ? `releaseError=${releaseError.message}` : ""}`,
    );
  };

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(athleteId);
  if (userError || !userData.user?.email) {
    await release(
      `getUserById failed: ${userError?.message ?? "no email"} (status=${userError?.status ?? "n/a"})`,
    );
    return { ok: false, error: GENERIC_FAILURE };
  }
  const syntheticEmail = userData.user.email;

  const { error: pwError } = await service.auth.admin.updateUserById(
    athleteId,
    { password: input.password },
  );
  if (pwError) {
    await release(
      `updateUserById failed: ${pwError.message} (status=${pwError.status ?? "n/a"} code=${pwError.code ?? "n/a"})`,
    );
    return {
      ok: false,
      error: "Couldn't save that password. Try a different one.",
      field: "password",
    };
  }

  setDeviceAthleteId(athleteId);

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: input.password,
  });
  if (signInError) {
    // Account is set up (password saved, cookie bound); only the session
    // write failed. /signin shows the password-only form for this device.
    console.error(
      `[invites.claim] signInWithPassword failed after setup (athleteId=${athleteId}): ${signInError.message} (status=${signInError.status ?? "n/a"})`,
    );
    redirect("/signin");
  }

  redirect("/athlete");
}
