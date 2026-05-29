"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireParent } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// =============================================================================
// Account deletion — parent-initiated, IMMEDIATE hard delete.
//
// Mechanism: deleting the auth.users row (service.auth.admin.deleteUser)
// cascades through every FK in the schema — profiles → parent_athlete_links,
// subscriptions, device_pairings, athlete_sessions → journal_entries,
// safety_events. There is no soft-delete / grace window: a confirmed deletion
// removes the data now. This trivially satisfies the "within 30 days of
// request" requirement and minimises how long a minor's data is retained.
//
// Two flows:
//   - deleteAthlete: removes ONE athlete this parent manages.
//   - deleteAccount: removes the parent and every athlete they SOLELY manage
//     (athletes also linked to a co-parent are left intact — see below).
//
// Both require a typed confirmation. Deletion events are logged (event only,
// never content) for an audit trail.
// =============================================================================

export type DeleteAthleteState = { ok: false; error: string } | null;

export async function deleteAthlete(
  _prev: DeleteAthleteState,
  formData: FormData,
): Promise<DeleteAthleteState> {
  const athleteId = String(formData.get("athlete_id") ?? "").trim();
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (!athleteId) return { ok: false, error: "Missing athlete." };

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // Authorization — the athlete MUST be linked to the requesting parent.
  // Without this check a parent could delete any athlete by guessing an id.
  const { data: link } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId)
    .eq("athlete_id", athleteId)
    .maybeSingle();
  if (!link) {
    return { ok: false, error: "That athlete isn't on your account." };
  }

  // Confirmation — the typed value must match the athlete's first name.
  const { data: athlete } = await service
    .from("profiles")
    .select("first_name, role")
    .eq("id", athleteId)
    .maybeSingle();
  if (!athlete) return { ok: false, error: "Athlete not found." };
  // Defense-in-depth: only athlete rows are deletable here. The link
  // role-check trigger already guarantees athlete_id points at an athlete,
  // so this is belt-and-suspenders against ever deleting a parent row.
  if (athlete.role !== "athlete") {
    return { ok: false, error: "That account can't be deleted here." };
  }
  if (confirm.toLowerCase() !== athlete.first_name.trim().toLowerCase()) {
    return {
      ok: false,
      error: `Type "${athlete.first_name}" to confirm deletion.`,
    };
  }

  const { error } = await service.auth.admin.deleteUser(athleteId);
  if (error) {
    console.error(
      `[account.deleteAthlete] auth.admin.deleteUser failed (parent=${parentId} athlete=${athleteId}): ${error.message}`,
    );
    return {
      ok: false,
      error: "Could not delete the athlete. Please try again.",
    };
  }

  console.log(
    `[account.deleteAthlete] parent=${parentId} deleted athlete=${athleteId}`,
  );
  revalidatePath("/dashboard");
  return null;
}

export type DeleteAccountState = { ok: false; error: string } | null;

export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "DELETE") {
    return { ok: false, error: 'Type "DELETE" to confirm.' };
  }

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  const { data: links } = await service
    .from("parent_athlete_links")
    .select("athlete_id")
    .eq("parent_id", parentId);
  const athleteIds = (links ?? []).map((l) => l.athlete_id);

  // Delete only athletes this parent SOLELY manages. An athlete also linked
  // to a co-parent is left intact — deleting this parent's auth.users row
  // cascade-removes just this parent's link, not the shared child's data.
  //
  // If any sole-managed athlete fails to delete, abort BEFORE deleting the
  // parent — otherwise we'd orphan that athlete's data with no manager left.
  let deletedAthletes = 0;
  for (const athleteId of athleteIds) {
    const { count } = await service
      .from("parent_athlete_links")
      .select("parent_id", { count: "exact", head: true })
      .eq("athlete_id", athleteId);
    if ((count ?? 0) > 1) continue; // shared with a co-parent — keep

    const { error } = await service.auth.admin.deleteUser(athleteId);
    if (error) {
      console.error(
        `[account.deleteAccount] athlete delete failed (parent=${parentId} athlete=${athleteId}); aborting before parent delete: ${error.message}`,
      );
      return {
        ok: false,
        error:
          "Could not delete one of your athletes, so your account was left intact. Please try again.",
      };
    }
    deletedAthletes++;
  }

  // Stripe: an active subscription must be cancelled in Stripe so the parent
  // stops being billed. Stripe checkout/webhooks are not wired yet; when they
  // land, cancel the subscription HERE before deleting the parent. Until then,
  // surface loudly so a real (post-Stripe) subscription can't slip through.
  const { data: sub } = await service
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("parent_id", parentId)
    .maybeSingle();
  if (sub?.stripe_subscription_id) {
    console.warn(
      `[account.deleteAccount] parent=${parentId} has stripe_subscription_id=${sub.stripe_subscription_id} but Stripe cancellation is not wired yet — manual cancellation required.`,
    );
  }

  // Delete the parent — cascades the parent profile, subscription row, and any
  // remaining link rows (co-parented athletes lose just this parent's link).
  const { error } = await service.auth.admin.deleteUser(parentId);
  if (error) {
    console.error(
      `[account.deleteAccount] parent delete failed (parent=${parentId}): ${error.message}`,
    );
    return { ok: false, error: "Could not delete your account. Please try again." };
  }

  console.log(
    `[account.deleteAccount] deleted parent=${parentId} (athletes_considered=${athleteIds.length} athletes_deleted=${deletedAthletes})`,
  );

  // Clear the now-orphaned session cookies, then send them home.
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
