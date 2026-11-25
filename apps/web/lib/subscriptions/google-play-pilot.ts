/**
 * google-play-pilot.ts — the payer-scoped Play gate (FV-669, account-only pilot).
 *
 * `isGooglePlayActiveForPayer` answers "may Play billing be reachable for THIS
 * payer?":
 *   - global flag (`GOOGLE_PLAY_CATALOG_ACTIVE` = "1") on  -> true, no DB call;
 *   - else pilot flag (`GOOGLE_PLAY_PILOT_ACTIVE` = "1") on AND the payer has a
 *     row in `google_license_testers` -> true;
 *   - anything else (both unset, pilot on but not allowlisted, empty payer id,
 *     lookup error, thrown exception) -> false. Fails CLOSED, never throws.
 *
 * The payer id MUST come from the server-side session (or a server-resolved
 * row), never from client input. The table is read with the service-role client
 * (it has no client grant and no policy). Logs carry no identifiers.
 *
 * Pilot mode is narrower than the global flag: purchases are admitted only if
 * Google marks them as test purchases (see `checkPurchaseAdmission`), and
 * entitlement reads count only test rows (see `subscriptions/google.ts`).
 *
 * This module is deliberately light (no Google API / auth imports) so pages
 * and actions can import it without pulling in the purchase pipeline.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import {
  isGooglePlayCatalogActive,
  isGooglePlayPilotActive,
} from "@/lib/subscriptions/google-product-catalog";

type ServiceClient = SupabaseClient<Database>;

export type AllowlistLookup =
  | { ok: true; allowlisted: boolean }
  | { ok: false; code: string | undefined };

/**
 * The ONE `google_license_testers` membership lookup (service role). Returns a
 * database error instead of throwing so each caller picks its failure mode
 * (admission throws, the gate fails closed). Only the Postgres code is surfaced.
 */
export async function lookupPayerAllowlisted(
  service: ServiceClient,
  payerId: string,
): Promise<AllowlistLookup> {
  const { data, error } = await service
    .from("google_license_testers")
    .select("payer_id")
    .eq("payer_id", payerId)
    .maybeSingle();
  if (error) return { ok: false, code: error.code };
  return { ok: true, allowlisted: !!data };
}

export async function isGooglePlayActiveForPayer(
  service: ServiceClient,
  payerId: string | null | undefined,
): Promise<boolean> {
  if (isGooglePlayCatalogActive()) return true;
  if (!isGooglePlayPilotActive()) return false;
  if (typeof payerId !== "string" || payerId.length === 0) return false;
  try {
    const result = await lookupPayerAllowlisted(service, payerId);
    if (!result.ok) {
      console.warn(`[google-play-pilot] allowlist lookup failed (${result.code ?? "unknown"}).`);
      return false;
    }
    return result.allowlisted;
  } catch {
    console.warn("[google-play-pilot] allowlist lookup failed; treating Play as unavailable.");
    return false;
  }
}

/**
 * Allowlisted payer ids, for the pilot-mode cron/health passes. Returns null on
 * a lookup error (callers treat null as "do nothing").
 */
export async function listAllowlistedPayerIds(service: ServiceClient): Promise<string[] | null> {
  try {
    const { data, error } = await service.from("google_license_testers").select("payer_id");
    if (error) {
      console.warn(`[google-play-pilot] allowlist list failed (${error.code ?? "unknown"}).`);
      return null;
    }
    return (data ?? []).map((r) => r.payer_id);
  } catch {
    console.warn("[google-play-pilot] allowlist list failed.");
    return null;
  }
}
