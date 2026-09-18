"use server";

/**
 * FV-586 (KC decision D3, 2026-09-17) — trial-to-family explicit
 * confirmation: adding a second (or later) athlete while the parent's Stripe
 * subscription is `trialing` (FV-574's 7-day one-athlete trial) requires the
 * frontend confirming control to resubmit this form with
 * `trialConversionConfirmed: "true"` — see the guard inline below, and
 * `lib/subscriptions/trial-conversion.ts` for the read-side state/quote this
 * decision is based on. PARTIAL-FAILURE WINDOW (accepted, not mitigated): if
 * the Stripe conversion (trial_end + quantity bump) succeeds but
 * `auth.admin.createUser` fails immediately after, the subscription is left
 * active at the bumped quantity with one fewer athlete than that quantity
 * implies. We deliberately do NOT attempt to refund or roll back the Stripe
 * charge — the parent's retry creates the missing athlete on the normal
 * (non-trial) path, and the next `syncAthleteQuantity` call reconciles
 * quantity to the real athlete count. This mirrors the codebase's existing
 * non-blocking-Stripe-sync philosophy (see sync-athlete-quantity.ts).
 */

import { randomBytes, randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ageFromBirthdate } from "@/lib/age";
import { ATHLETE_SYNTHETIC_EMAIL_DOMAIN } from "@/lib/auth/athlete-email";
import { requireParent } from "@/lib/auth/guards";
import { SUPPORTED_SPORTS } from "@/lib/sports";
import { syncAthleteQuantity } from "@/lib/stripe/sync-athlete-quantity";
import { getStripe } from "@/lib/stripe/server";
import { deliverInBackground } from "@/lib/monitoring/deliver";
import { notifyError } from "@/lib/monitoring/notify";
import { createServiceClient } from "@/lib/supabase/service";
import { assertAthleteCapacity } from "@/lib/subscriptions/apple-capacity";
import { getTrialConversionState } from "@/lib/subscriptions/trial-conversion";

const MIN_ATHLETE_AGE = 13;

const CreateAthleteSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(50, "First name is too long."),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD."),
    // FV-27: captured-if-provided, defaulted otherwise. The onboarding sport
    // selector is FV-33; until it ships the create forms omit `sport`, so an
    // athlete defaults to hockey (the launch sport). FV-33 adds the field so a
    // parent can choose basketball; sport is editable later regardless.
    sport: z.enum(SUPPORTED_SPORTS).optional().default("hockey"),
  })
  .refine(
    (data) => {
      const age = ageFromBirthdate(data.birthdate);
      return age !== null && age >= MIN_ATHLETE_AGE;
    },
    {
      message: `Athletes must be ${MIN_ATHLETE_AGE} or older.`,
      path: ["birthdate"],
    },
  );

export type CreateAthleteState =
  | { ok: true }
  | {
      ok: false;
      error: string;
      field?: string;
      // FV-570: set only on the Apple-tier capacity gate. UI copy for this
      // case is FV-572's; the server keeps `error` a plain, code-shaped
      // string rather than user-facing prose.
      //
      // FV-586 (KC decision D3): `trial_conversion_required` — this add
      // would silently convert the parent's Stripe trial and needs the
      // confirming control's explicit confirmation (resubmit with
      // `trialConversionConfirmed: "true"`). `trial_conversion_payment_failed`
      // — the parent confirmed, but Stripe's `error_if_incomplete` charge
      // failed (e.g. a card requiring 3DS, or a decline); no athlete was
      // created and the trial is untouched.
      code?:
        | "capacity_reached"
        | "trial_conversion_required"
        | "trial_conversion_payment_failed";
    }
  | null;

export async function createAthlete(
  _prev: CreateAthleteState,
  formData: FormData,
): Promise<CreateAthleteState> {
  const parsed = CreateAthleteSchema.safeParse({
    first_name: formData.get("first_name"),
    birthdate: formData.get("birthdate"),
    sport: formData.get("sport") ?? undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input.",
      field: issue?.path[0]?.toString(),
    };
  }

  const { userId: parentId } = await requireParent();
  const service = createServiceClient();

  // FV-570 (record §4.6): Apple-tier athlete-capacity gate, BEFORE the
  // auth-user creation so a blocked add never creates an orphaned auth user.
  // Stripe/comp payers are never capped (see apple-capacity.ts's invariant);
  // this is a non-goal-preserving no-op for them. With APPLE_PRODUCT_CAPACITY
  // currently empty (Open Item P2 — product ids not yet assigned) this call
  // always resolves { allowed: true }.
  const athleteCountResult = await service
    .from("parent_athlete_links")
    .select("athlete_id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  if (athleteCountResult.error) {
    console.warn(
      `[athletes.createAthlete] athlete count read failed (parentId=${parentId}): ${athleteCountResult.error.message} — treating as 0 for the capacity gate (fail-open-for-adds).`,
    );
  }

  const capacity = await assertAthleteCapacity(
    service,
    parentId,
    athleteCountResult.count ?? 0,
  );
  if (!capacity.allowed) {
    return {
      ok: false,
      error: "capacity_reached",
      code: capacity.reason,
    };
  }

  // FV-586 (KC decision D3, 2026-09-17): adding an athlete during the 7-day
  // one-athlete Stripe FREE TRIAL (FV-574) requires EXPLICIT parent
  // confirmation that ENDS the trial and STARTS the paid family plan
  // IMMEDIATELY — never a silent conversion or charge. Read the trial state
  // BEFORE any write below.
  const trialConversionState = await getTrialConversionState(service, parentId);

  // Fail CLOSED: a state-read failure must never let a silent mid-trial
  // conversion through undetected. Refuse the same way an un-confirmed
  // trial-crossing add is refused — the parent retries, which re-reads a
  // (hopefully by-then-healthy) state.
  if (trialConversionState.kind === "unknown") {
    return {
      ok: false,
      error: "trial_conversion_required",
      code: "trial_conversion_required",
    };
  }

  // "apple" is informational only here (see trial-conversion.ts's module
  // doc) — Apple trial-to-family conversion is handled entirely by the
  // FV-581/584 duplicate-purchase guard's D3 upgrade allowance
  // (beginApplePurchase), not by this Stripe-specific flow. Only a Stripe
  // trial that this add would cross into family territory (currentAthleteCount
  // >= 1, i.e. this is the SECOND-or-later athlete) needs confirmation — the
  // one-athlete trial itself (currentAthleteCount === 0, the FIRST athlete)
  // is not a conversion.
  if (
    trialConversionState.kind === "stripe_trial" &&
    trialConversionState.currentAthleteCount >= 1
  ) {
    const trialConversionConfirmed =
      formData.get("trialConversionConfirmed") === "true";

    if (!trialConversionConfirmed) {
      return {
        ok: false,
        error: "trial_conversion_required",
        code: "trial_conversion_required",
      };
    }

    // Confirmed — perform the Stripe conversion FIRST, before creating the
    // athlete. `payment_behavior: "error_if_incomplete"` is load-bearing:
    // unlike the default `allow_incomplete`, Stripe applies the update ONLY
    // if the charge succeeds; a failed charge (incl. a card requiring 3DS,
    // which this payment_behavior does not support — see module doc) leaves
    // the subscription untouched and returns an error we catch below. There
    // is deliberately no 3DS handling here: a card that requires it fails
    // this call, and the parent is told to update their card in the billing
    // portal and retry.
    let stripe;
    try {
      stripe = getStripe();
    } catch (err) {
      console.error(
        `[athletes.createAthlete] Stripe not configured for trial conversion (parentId=${parentId}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        ok: false,
        error: "trial_conversion_payment_failed",
        code: "trial_conversion_payment_failed",
      };
    }

    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        trialConversionState.stripeSubscriptionId,
      );
      const item = stripeSub.items.data[0];
      if (!item) {
        throw new Error(
          `subscription ${trialConversionState.stripeSubscriptionId} has no items`,
        );
      }

      await stripe.subscriptions.update(
        trialConversionState.stripeSubscriptionId,
        {
          trial_end: "now",
          items: [
            {
              id: item.id,
              quantity: trialConversionState.currentAthleteCount + 1,
            },
          ],
          payment_behavior: "error_if_incomplete",
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[athletes.createAthlete] trial-conversion Stripe update failed (parentId=${parentId} sub=${trialConversionState.stripeSubscriptionId}): ${message}`,
      );
      deliverInBackground(
        notifyError(
          "[athletes] trial-conversion Stripe update failed",
          message,
          { parent_id: parentId, stripe_subscription_id: trialConversionState.stripeSubscriptionId },
        ),
      );
      // No athlete created; the trial is untouched (Stripe guarantees no
      // partial update on an error_if_incomplete failure).
      return {
        ok: false,
        error: "trial_conversion_payment_failed",
        code: "trial_conversion_payment_failed",
      };
    }

    // Success — the subscription is now active at quantity
    // (currentAthleteCount + 1). Proceed to create the athlete below.
    // syncAthleteQuantity (called at the end of this function, unchanged)
    // becomes a no-op since Stripe's quantity already matches. If
    // auth.admin.createUser fails AFTER this point, the subscription is
    // still active with the bumped quantity but the athlete row was never
    // created — a rare partial-failure window we deliberately do NOT try to
    // refund/undo (see module doc); the parent's retry goes through the
    // normal (non-trial, "not_trialing") path and the next syncAthleteQuantity
    // call reconciles quantity to the real athlete count.
  }

  const email = `athlete-${randomUUID()}@${ATHLETE_SYNTHETIC_EMAIL_DOMAIN}`;
  const tempPassword = randomBytes(32).toString("base64url");

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });
  if (createError || !created.user) {
    console.error(
      "[athletes.createAthlete] auth.admin.createUser failed:",
      createError?.message,
    );
    return {
      ok: false,
      error: "Could not create the athlete account. Please try again.",
    };
  }
  const athleteId = created.user.id;

  // FV-448 (13-25 expansion arc, D5 turn-18 deferral mitigation): the arc
  // removes the upper age bound on parent-created athletes, so a parent may
  // create a profile for someone already 18+. That stays on the minor-schema
  // `role: "athlete"` shape (no UI change, no self-serve billing — see
  // project_13-25-expansion-discovery memory), but the row is marked so a
  // future turn-18 consent/takeover flow (FV-450) has a population to act on.
  const createdAsAdultByParent =
    (ageFromBirthdate(parsed.data.birthdate) ?? 0) >= 18;

  const { error: profileError } = await service.from("profiles").insert({
    id: athleteId,
    role: "athlete",
    first_name: parsed.data.first_name,
    birthdate: parsed.data.birthdate,
    sport: parsed.data.sport,
    created_as_adult_by_parent: createdAsAdultByParent,
  });
  if (profileError) {
    const { error: rollbackError } =
      await service.auth.admin.deleteUser(athleteId);
    console.error(
      `[athletes.createAthlete] profile insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back auth.users (rollback_ok=${!rollbackError}): ${profileError.message}${
        rollbackError ? ` | rollback error: ${rollbackError.message}` : ""
      }`,
    );
    return {
      ok: false,
      error: "Could not create the athlete profile. Please try again.",
    };
  }

  const { error: linkError } = await service
    .from("parent_athlete_links")
    .insert({
      parent_id: parentId,
      athlete_id: athleteId,
    });
  if (linkError) {
    const { error: profileRollback } = await service
      .from("profiles")
      .delete()
      .eq("id", athleteId);
    const { error: userRollback } =
      await service.auth.admin.deleteUser(athleteId);
    console.error(
      `[athletes.createAthlete] link insert failed (parentId=${parentId} athleteId=${athleteId}); rolled back profile+auth.users (profile_rollback_ok=${!profileRollback} user_rollback_ok=${!userRollback}): ${linkError.message}${
        profileRollback ? ` | profile rollback error: ${profileRollback.message}` : ""
      }${userRollback ? ` | user rollback error: ${userRollback.message}` : ""}`,
    );
    return {
      ok: false,
      error: "Could not link the athlete to your account. Please try again.",
    };
  }

  // Sync Stripe subscription quantity to reflect the new athlete count.
  // Non-blocking: a Stripe failure here must never prevent the athlete from
  // being created. syncAthleteQuantity catches all errors internally.
  // deliverInBackground registers the promise with waitUntil so the
  // serverless runtime can't freeze the instance mid-Stripe-write — a
  // dropped sync is silent under-/over-billing, not a caught error.
  deliverInBackground(syncAthleteQuantity(parentId));

  redirect("/dashboard");
}
